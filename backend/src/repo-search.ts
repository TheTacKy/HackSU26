import { searchRepositories } from "./github-client.js";
import type { GitHubRepo, Persona } from "./types.js";

const MAX_KEYWORDS = 3;
const MAX_REPOS_PER_KEYWORD = 30;

export async function findRepos(persona: Persona): Promise<GitHubRepo[]> {
  const keywords = persona.extracted_keywords.slice(0, MAX_KEYWORDS);
  const languages = new Set(persona.stack.map((language) => language.toLowerCase()));
  const pushedAfter = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
  const filters = `is:public+archived:false+has:issues+pushed:>${pushedAfter}`;

  const resultPairs = await Promise.all(keywords.map(async (keyword) => {
    const quoted = keyword.includes(" ") ? `"${keyword}"` : keyword;
    try {
      return [keyword, await searchRepositories(`${quoted}+${filters}`, 50)] as const;
    } catch (error) {
      console.log(`[GITHUB_API] search failed keyword=${JSON.stringify(keyword)}: ${error instanceof Error ? error.message : String(error)}`);
      return [keyword, [] as GitHubRepo[]] as const;
    }
  }));
  const results = new Map(resultPairs);
  const repos = new Map<number, GitHubRepo>();
  const scores = new Map<number, number>();

  for (const keyword of keywords) {
    let accepted = 0;
    for (const repo of results.get(keyword) ?? []) {
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

  return [...repos.values()]
    .filter(recentlyUpdated)
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || b.stargazers_count - a.stargazers_count)
    .slice(0, 50);
}

function eligible(repo: GitHubRepo, languages: Set<string>): boolean {
  if (repo.archived || repo.private) return false;
  const language = (repo.language ?? "").toLowerCase();
  return !languages.size || !language || [...languages].some((choice) => choice === language || choice.includes(language) || language.includes(choice));
}

function recentlyUpdated(repo: GitHubRepo): boolean {
  if (!repo.updated_at) return false;
  const updated = Date.parse(repo.updated_at);
  return Number.isNaN(updated) || updated >= Date.now() - 90 * 86_400_000;
}
