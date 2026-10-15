import { GitHubSearchError } from "./github-search-error.js";
import { createHash } from "node:crypto";
import { Agent, request } from "undici";
import { getJson, setJson } from "./redis-client.js";
import { config } from "../config/environment.js";
import type { GitHubIssue, GitHubRepo } from "../types/index.js";

const agent = new Agent({ connections: 20, connect: { timeout: 2_000 } });
const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Repo-Scout",
  ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {}),
};

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function githubGet<T>(url: string, timeout: number): Promise<{ status: number; data: T; responseHeaders: Record<string, string | string[] | undefined> }> {
  const response = await request(url, {
    method: "GET",
    headers,
    dispatcher: agent,
    headersTimeout: timeout,
    bodyTimeout: timeout,
    signal: AbortSignal.timeout(timeout),
  });
  const data = await response.body.json() as T;
  return { status: response.statusCode, data, responseHeaders: response.headers };
}

export async function searchRepositories(query: string, perPage = 50): Promise<GitHubRepo[]> {
  console.log(`[GITHUB_API] search query=${query}`);
  const cacheKey = `v2:github-search:${digest(`${query}:${perPage}`)}`;
  const cached = await getJson<GitHubRepo[]>(cacheKey);
  if (cached) return cached;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${perPage}`;
  const started = performance.now();
  try {
    const response = await githubGet<{ items?: GitHubRepo[]; total_count?: number }>(url, 8_000);
    console.log(`[GITHUB_API] search_repositories status=${response.status} time=${secondsSince(started)}s`);
    if (response.status === 401) {
      throw new GitHubSearchError("GitHub authentication failed. Check the backend GITHUB_TOKEN.", "GITHUB_AUTH_FAILED");
    }
    if (response.status === 403 || response.status === 429) {
      throw new GitHubSearchError("GitHub search is unavailable or rate-limited. Please try again shortly.", "GITHUB_SEARCH_UNAVAILABLE", 503);
    }
    if (response.status !== 200 || !Array.isArray(response.data.items)) {
      throw new GitHubSearchError(`GitHub repository search failed (HTTP ${response.status}). Please try again.`, "GITHUB_SEARCH_FAILED");
    }
    const items = response.data.items;
    console.log(`[GITHUB_API] repository_search results=${items.length} total=${response.data.total_count ?? 0}`);
    await setJson(cacheKey, items, 1_200);
    return items;
  } catch (error) {
    if (error instanceof GitHubSearchError) throw error;
    console.log(`[GITHUB_API] repository_search failed after ${secondsSince(started)}s`);
    throw new GitHubSearchError("Could not reach GitHub in time. Please try again.", "GITHUB_CONNECTION_FAILED", 503);
  }
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
