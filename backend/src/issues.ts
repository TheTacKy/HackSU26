import { getOpenIssues } from "./github-client.js";
import type { GitHubIssue, GitHubRepo } from "./types.js";

function hasLabel(issue: GitHubIssue, target: string): boolean {
  return (issue.labels ?? []).some((label) => (label.name ?? "").toLowerCase() === target.toLowerCase());
}

export async function fetchIssues(repo: Pick<GitHubRepo, "owner" | "name">, experience: string): Promise<GitHubIssue[]> {
  const preferred = ["none", "none - first time contributor"].includes(experience?.toLowerCase())
    ? "good first issue"
    : "help wanted";
  const fallback = preferred === "good first issue" ? "help wanted" : "good first issue";
  const issues = await getOpenIssues(repo.owner.login, repo.name);
  return [
    ...issues.filter((issue) => hasLabel(issue, preferred)),
    ...issues.filter((issue) => hasLabel(issue, fallback)),
    ...issues.filter((issue) => !hasLabel(issue, preferred) && !hasLabel(issue, fallback)),
  ].slice(0, 5);
}

export function serializeIssues(issues: GitHubIssue[]) {
  return issues.slice(0, 5).map((issue) => ({
    title: issue.title ?? "No title",
    url: issue.html_url ?? "",
    number: issue.number ?? 0,
    state: issue.state ?? "open",
  }));
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
