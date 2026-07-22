import { createHash } from "node:crypto";
import { Agent, request } from "undici";
import { getJson, setJson } from "./cache.js";
import { config } from "./config.js";
import type { GitHubIssue, GitHubRepo } from "./types.js";

const agent = new Agent({ connections: 20, connect: { timeout: 2_000 } });
const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Repo-Scout",
  ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {}),
};

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function githubGet<T>(url: string, timeout: number): Promise<{ status: number; data: T; responseHeaders: Record<string, string | string[] | undefined> }> {
  const response = await request(url, {
    method: "GET",
    headers,
    dispatcher: agent,
    headersTimeout: timeout,
    bodyTimeout: timeout,
  });
  const data = await response.body.json() as T;
  return { status: response.statusCode, data, responseHeaders: response.headers };
}

export async function searchRepositories(query: string, perPage = 50, maxRetries = 3): Promise<GitHubRepo[]> {
  console.log(`[GITHUB_API] search query=${query}`);
  const cacheKey = `v1:github-search:${digest(`${query}:${perPage}`)}`;
  const cached = await getJson<GitHubRepo[]>(cacheKey);
  if (cached) {
    console.log(`[GITHUB_API] repository_search source=redis status=hit results=${cached.length}`);
    return cached;
  }
  console.log("[GITHUB_API] repository_search source=github status=cache_miss");

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${perPage}`;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const started = performance.now();
    try {
      const response = await githubGet<{ items?: GitHubRepo[]; total_count?: number; message?: string }>(url, 8_000);
      console.log(`[GITHUB_API] search_repositories attempt=${attempt}/${maxRetries} -> status=${response.status} time=${secondsSince(started)}s`);
      if (response.status === 200) {
        const items = response.data.items ?? [];
        console.log(`  -> Found ${items.length} repos (total: ${response.data.total_count ?? 0}, rate limit: ${response.responseHeaders["x-ratelimit-remaining"] ?? "unknown"}/${response.responseHeaders["x-ratelimit-limit"] ?? "unknown"})`);
        await setJson(cacheKey, items, 1_200);
        return items;
      }
      if (response.status !== 403) return [];
      const retryHeader = response.responseHeaders["retry-after"];
      const retryAfter = Number(Array.isArray(retryHeader) ? retryHeader[0] : retryHeader);
      await sleep(Number.isFinite(retryAfter) ? (retryAfter + 1) * 1_000 : attempt * 10_000);
    } catch (error) {
      console.log(`[GITHUB_API] search_repositories attempt=${attempt}/${maxRetries} -> failed after ${secondsSince(started)}s: ${error instanceof Error ? error.message : String(error)}`);
      if (attempt === maxRetries) return [];
    }
  }
  return [];
}

export async function getOpenIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  const cacheKey = `v1:issues:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cached = await getJson<GitHubIssue[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=20&sort=updated&direction=desc`;
    const response = await githubGet<GitHubIssue[]>(url, 5_000);
    if (response.status !== 200 || !Array.isArray(response.data)) return [];
    const issues = response.data.filter((issue) => !("pull_request" in issue));
    await setJson(cacheKey, issues, 600);
    return issues;
  } catch {
    return [];
  }
}

function secondsSince(started: number): string {
  return ((performance.now() - started) / 1_000).toFixed(2);
}
