import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import { fetchIssues, mapWithConcurrency, serializeIssues } from "./issues.js";
import { runMatcher } from "./matcher.js";

const profileSchema = z.object({
  tech_stack: z.array(z.string()),
  interests: z.string(),
  skill_level: z.string(),
  open_source_experience: z.string(),
});

const issuesSchema = z.object({
  repositories: z.array(z.string()),
  experience: z.string(),
});

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
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });
    const query = request.query as { include_issues?: string };
    return runMatcher(parsed.data, query.include_issues !== "false");
  });

  app.post("/issues/batch", async (request, reply) => {
    const parsed = issuesSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });
    const entries = await mapWithConcurrency(parsed.data.repositories, 20, async (fullName) => {
      if (!fullName.includes("/")) return [fullName, []] as const;
      const [owner, ...nameParts] = fullName.split("/");
      try {
        const issues = await fetchIssues({ owner: { login: owner! }, name: nameParts.join("/") }, parsed.data.experience);
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
