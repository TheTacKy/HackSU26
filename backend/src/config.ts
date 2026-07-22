import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

export const config = {
  githubToken: process.env.GITHUB_TOKEN ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379/0",
  port: Number(process.env.PORT ?? 8000),
};
