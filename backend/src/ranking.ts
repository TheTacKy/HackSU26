import OpenAI from "openai";
import { config } from "./config.js";
import type { GitHubRepo, Persona } from "./types.js";

export function parseRanking(text: string, repoCount: number): number[] {
  const requested = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const valid = [...new Set(requested.filter((index) => index >= 0 && index < repoCount))];
  return [...valid, ...Array.from({ length: repoCount }, (_, index) => index).filter((index) => !valid.includes(index))];
}

export async function rankRepos(repos: GitHubRepo[], persona: Persona): Promise<[GitHubRepo[], string]> {
  if (!repos.length) return [[], "No repositories to rank"];
  if (!config.openAiApiKey) return [repos, "OPENAI_API_KEY not found"];

  const profile = `Tech: ${persona.stack.join(", ")} | Level: ${persona.level || "N/A"} | Interests: ${persona.interests || "Not specified"} | Experience: ${persona.experience || "N/A"}`;
  const repoLines = repos.map((repo, index) => {
    const description = (repo.description ?? "No description").slice(0, 200);
    const topics = repo.topics?.slice(0, 5).join(", ") || "None";
    return `${index}. ${repo.name ?? "Unknown"} | ${repo.language ?? "Unknown"} | ${repo.stargazers_count ?? 0} stars | ${description} | ${topics}`;
  });
  const prompt = `Rank these GitHub repositories for this contributor.\n\nProfile: ${profile}\n\nRepositories:\n${repoLines.join("\n")}\n\nPrioritize interest match, then tech stack match, then skill fit.\nReturn every index exactly once as comma-separated numbers, best first. No other text.`;
  const client = new OpenAI({ apiKey: config.openAiApiKey });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = performance.now();
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only comma-separated repository indices." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });
      const text = response.choices[0]?.message.content?.trim() ?? "";
      console.log(`[OPENAI_API] repo_ranking time=${((performance.now() - started) / 1_000).toFixed(2)}s`);
      return [parseRanking(text, repos.length).map((index) => repos[index]!), text];
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError && attempt < 2) {
        const retryAfter = Number(error.headers?.get("retry-after"));
        if (Number.isFinite(retryAfter)) {
          await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1_000));
          continue;
        }
      }
      if (error instanceof OpenAI.AuthenticationError) return [repos, "OPENAI_API_KEY is invalid"];
      return [repos, `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`];
    }
  }
  return [repos, "Ranking unavailable"];
}
