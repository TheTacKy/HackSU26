import { searchRepositories } from "../clients/github-client.js";
import type { GitHubRepo, Persona } from "../types/index.js";
import { mapWithConcurrency } from "./issue-service.js";

const MAX_KEYWORDS = 3;
const MAX_REPOS_PER_KEYWORD = 30;

export async function findRepos(persona: Persona): Promise<GitHubRepo[]> {
  const keywords = persona.extracted_keywords.slice(0, MAX_KEYWORDS);
  const languages = new Set(persona.stack.map((language) => language.trim().toLowerCase()).filter(Boolean));
  const pushedAfter = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
  const filters = `is:public archived:false pushed:>${pushedAfter}`;
  const failures: Error[] = [];

  // Search each selected language before GitHub applies its result limit.
  // Separate queries give languages OR semantics without multiplying concurrency.
  const searches = keywords.flatMap(keyword =>
    (languages.size ? [...languages] : [""]).map(language => ({ keyword, language })));
  const resultPairs = await mapWithConcurrency(searches, 3, async ({ keyword, language }) => {
    const quoted = keyword.includes(" ") ? `"${keyword}"` : keyword;
    const languageFilter = language ? ` language:${JSON.stringify(language)}` : "";
    try {
      return [keyword, await searchRepositories(`${quoted} ${filters}${languageFilter}`, 50)] as const;
    } catch (error) {
      console.log(`[GITHUB_API] search failed keyword=${JSON.stringify(keyword)}: ${error instanceof Error ? error.message : String(error)}`);
      failures.push(error instanceof Error ? error : new Error(String(error)));
      return [keyword, [] as GitHubRepo[]] as const;
    }
  });
  const results = new Map<string, Map<number, GitHubRepo>>();
  for (const [keyword, candidates] of resultPairs) {
    const combined = results.get(keyword) ?? new Map<number, GitHubRepo>();
    for (const repo of candidates) combined.set(repo.id, repo);
    results.set(keyword, combined);
  }
  const repos = new Map<number, GitHubRepo>();
  const scores = new Map<number, number>();

  for (const keyword of keywords) {
    let accepted = 0;
    const candidates = [...(results.get(keyword)?.values() ?? [])]
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
    for (const repo of candidates) {
      if (!eligible(repo, languages)) continue;
      repos.set(repo.id, repo);
      let score = (scores.get(repo.id) ?? 0) + MAX_REPOS_PER_KEYWORD - accepted;
      if (`${repo.name} ${repo.description ?? ""}`.toLowerCase().includes(keyword.toLowerCase())) score += 5;
      if (languages.has((repo.language ?? "").toLowerCase())) score += 3;
      scores.set(repo.id, score);
      accepted += 1;
      if (accepted === MAX_REPOS_PER_KEYWORD) break;
    }
  }

  // A failed upstream search must not masquerade as a successful empty search.
  if (!repos.size && failures.length) throw failures[0];
  return [...repos.values()]
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || b.stargazers_count - a.stargazers_count)
    .slice(0, 50);
}

function eligible(repo: GitHubRepo, languages: Set<string>): boolean {
  if (repo.archived || repo.private) return false;
  const language = (repo.language ?? "").toLowerCase();
  return !languages.size || !language || languages.has(language);
}
