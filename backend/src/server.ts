import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

try {
  await app.listen({ host: "0.0.0.0", port: config.port });
  console.log(`Repo Scout backend listening on http://0.0.0.0:${config.port}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
