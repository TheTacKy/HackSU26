import { extractKeywords } from "./keyword-extraction.js";
import { fetchIssues, mapWithConcurrency } from "./issues.js";
import { rankRepos } from "./ranking.js";
import { generateRecommendations } from "./recommendations.js";
import { findRepos } from "./repo-search.js";
import type { GitHubIssue, Persona, UserProfile } from "./types.js";

const elapsed = (started: number) => ((performance.now() - started) / 1_000).toFixed(4);

export async function runMatcher(profile: UserProfile, includeIssues = true) {
  const totalStarted = performance.now();
  let started = performance.now();
  const keywords = extractKeywords(profile.interests || "open source");
  console.log(`[MATCHER] keyword_extraction total_time=${elapsed(started)}s`);

  const persona: Persona = {
    stack: profile.tech_stack,
    level: profile.skill_level,
    interests: profile.interests,
    experience: profile.open_source_experience,
    extracted_keywords: keywords,
  };

  started = performance.now();
  const repos = await findRepos(persona);
  console.log(`[MATCHER] repository_search total_time=${elapsed(started)}s returned=${repos.length}`);

  started = performance.now();
  const [rankedResult, rankingResponse] = await rankRepos(repos, persona);
  const rankedRepos = (rankedResult.length ? rankedResult : repos).slice(0, 50);
  console.log(`[MATCHER] repository_ranking total_time=${elapsed(started)}s returned=${rankedRepos.length}`);

  const issues = new Map<string, GitHubIssue[]>();
  if (includeIssues && rankedRepos.length) {
    const results = await mapWithConcurrency(rankedRepos, 20, (repo) => fetchIssues(repo, persona.experience));
    rankedRepos.forEach((repo, index) => issues.set(repo.full_name, results[index] ?? []));
  }

  started = performance.now();
  const recommendations = generateRecommendations(rankedRepos, issues);
  console.log(`[MATCHER] serialization total_time=${elapsed(started)}s`);
  console.log(`[MATCHER] complete total_time=${elapsed(totalStarted)}s`);
  return {
    recommendations,
    gemini_response: rankingResponse,
    pagination: {
      current_page: 1,
      total_pages: Math.ceil(rankedRepos.length / 12),
      repos_per_page: 12,
      total_repos: rankedRepos.length,
    },
  };
}
