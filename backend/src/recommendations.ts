import { serializeIssues } from "./issues.js";
import type { GitHubIssue, GitHubRepo } from "./types.js";

export function generateRecommendations(repos: GitHubRepo[], issues: Map<string, GitHubIssue[]>) {
  return repos.map((repo) => {
    const serialized = serializeIssues(issues.get(repo.full_name) ?? []);
    return {
      name: repo.name,
      full_name: repo.full_name ?? "",
      url: repo.html_url,
      stars: repo.stargazers_count,
      description: repo.description ?? "No description available",
      language: repo.language ?? "Unknown",
      topics: repo.topics ?? [],
      issues: serialized,
      issues_count: serialized.length,
    };
  });
}
