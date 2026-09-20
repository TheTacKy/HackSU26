import cors from "@fastify/cors";
import Fastify from "fastify";
import { fetchIssues, mapWithConcurrency, serializeIssues } from "../services/issue-service.js";
import { runMatcher } from "../services/matcher-service.js";
import type { UserProfile } from "../types/index.js";

interface IssuesRequest { repositories: string[]; experience: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isProfile(value: unknown): value is UserProfile {
  return isRecord(value)
    && Array.isArray(value.tech_stack)
    && value.tech_stack.every((item) => typeof item === "string")
    && typeof value.interests === "string"
    && typeof value.skill_level === "string"
    && typeof value.open_source_experience === "string";
}

function isIssuesRequest(value: unknown): value is IssuesRequest {
  return isRecord(value)
    && Array.isArray(value.repositories)
    && value.repositories.every((item) => typeof item === "string")
    && typeof value.experience === "string";
}

export function buildApp() {
  const app = Fastify({ logger: false });
  app.register(cors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["POST"],
    allowedHeaders: ["content-type"],
  });

  app.addHook("onRequest", async (request) => {
    request.routeOptions.config.startedAt = performance.now();
  });
  app.addHook("onResponse", async (request, reply) => {
    const started = request.routeOptions.config.startedAt as number | undefined;
    const total = started === undefined ? 0 : (performance.now() - started) / 1_000;
    console.log(`[HTTP] method=${request.method} path=${request.url.split("?")[0]} status=${reply.statusCode} total_time=${total.toFixed(4)}s`);
    if (request.method === "POST" && request.url.split("?")[0] === "/match") {
      console.log(`[FINAL TIME] repository_finder total_time=${total.toFixed(4)}s`);
    }
  });

  app.post("/match", async (request, reply) => {
    if (!isProfile(request.body)) return reply.code(422).send({ detail: "Invalid user profile" });
    const query = request.query as { include_issues?: string };
    return runMatcher(request.body, query.include_issues !== "false");
  });

  app.post("/issues/batch", async (request, reply) => {
    if (!isIssuesRequest(request.body)) return reply.code(422).send({ detail: "Invalid issues request" });
    const body = request.body;
    const entries = await mapWithConcurrency(body.repositories, 20, async (fullName) => {
      if (!fullName.includes("/")) return [fullName, []] as const;
      const [owner, ...nameParts] = fullName.split("/");
      try {
        const issues = await fetchIssues({ owner: { login: owner! }, name: nameParts.join("/") }, body.experience);
        return [fullName, serializeIssues(issues)] as const;
      } catch {
        return [fullName, []] as const;
      }
    });
    return { issues: Object.fromEntries(entries) };
  });

  return app;
}

declare module "fastify" {
  interface FastifyContextConfig { startedAt?: number }
}
