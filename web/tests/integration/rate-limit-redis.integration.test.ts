import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { consumeRateLimit, resetRateLimit } from "../../src/server/security/rate-limit";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

describe("rate-limit redis fallback (integration)", () => {
  test("falls back to shared/local stores when Redis is unavailable", async () => {
    const previousStore = process.env.RATE_LIMIT_STORE;
    const previousRedisUrl = process.env.REDIS_URL;
    process.env.RATE_LIMIT_STORE = "redis";
    process.env.REDIS_URL = "redis://127.0.0.1:6399";

    const key = `integration:redis-fallback:${Date.now()}:${Math.round(Math.random() * 1000)}`;
    const options = { limit: 2, windowMs: 30_000 };

    try {
      const first = await consumeRateLimit(key, options);
      const second = await consumeRateLimit(key, options);
      const third = await consumeRateLimit(key, options);

      assert.equal(first.allowed, true);
      assert.equal(second.allowed, true);
      assert.equal(third.allowed, false);
      assert.ok(third.retryAfterSeconds >= 1);

      await resetRateLimit(key);
      const afterReset = await consumeRateLimit(key, options);
      assert.equal(afterReset.allowed, true);
    } finally {
      await resetRateLimit(key);
      if (typeof previousStore === "string") {
        process.env.RATE_LIMIT_STORE = previousStore;
      } else {
        delete process.env.RATE_LIMIT_STORE;
      }

      if (typeof previousRedisUrl === "string") {
        process.env.REDIS_URL = previousRedisUrl;
      } else {
        delete process.env.REDIS_URL;
      }
    }
  });
});
