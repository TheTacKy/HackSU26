import { createClient, type RedisClientType } from "redis";
import { config } from "./config.js";

let client: RedisClientType | null = null;
let connection: Promise<boolean> | null = null;
let retryAfter = 0;

async function connectedClient(): Promise<RedisClientType | null> {
  if (client?.isReady) return client;
  if (Date.now() < retryAfter) return null;
  if (!connection) {
    client = createClient({
      url: config.redisUrl,
      socket: { connectTimeout: 1_000, reconnectStrategy: false },
    });
    client.on("error", () => undefined);
    connection = client.connect().then(() => true).catch(() => {
      retryAfter = Date.now() + 30_000;
      return false;
    });
  }
  const connected = await connection;
  if (!connected) {
    client = null;
    connection = null;
    return null;
  }
  return client?.isReady ? client : null;
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const redis = await connectedClient();
    const value = await redis?.get(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export async function setJson(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    const redis = await connectedClient();
    if (redis) await redis.setEx(key, ttl, JSON.stringify(value));
  } catch {
    // Cache failures must not fail requests.
  }
}
