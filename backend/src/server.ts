import { buildApp } from "./api/app.js";
import { config } from "./config/environment.js";

const app = buildApp();

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

try {
  await app.listen({ host: "0.0.0.0", port: config.port });
  console.log(`Repo Scout backend listening on http://0.0.0.0:${config.port}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
