import { createClient } from "redis";
import { db } from "@/lib/db";

type RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

const memoryBuckets = new Map<string, RateLimitBucket>();
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
const REDIS_FAILURE_BACKOFF_MS = 30 * 1000;
const REDIS_KEY_PREFIX = "rate_limit:";
type RedisClient = ReturnType<typeof createClient>;

let lastMemoryPruneAt = 0;
let lastDbPruneAt = 0;
let redisClient: RedisClient | null = null;
let redisConnectPromise: Promise<RedisClient | null> | null = null;
let redisDisabledUntilMs = 0;

function getRateLimitStoreMode() {
  return (process.env.RATE_LIMIT_STORE ?? "auto").trim().toLowerCase();
}

function shouldTryRedisStore() {
  const mode = getRateLimitStoreMode();
  if (mode === "memory" || mode === "db") {
    return false;
  }

  return Boolean(process.env.REDIS_URL);
}

function shouldUseDbStore() {
  return getRateLimitStoreMode() !== "memory" && Boolean(process.env.DATABASE_URL);
}

function markRedisUnavailable() {
  redisDisabledUntilMs = Date.now() + REDIS_FAILURE_BACKOFF_MS;
}

function pruneMemoryBuckets(now: number) {
  if (now - lastMemoryPruneAt < PRUNE_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of memoryBuckets.entries()) {
    if (bucket.resetAtMs <= now) {
      memoryBuckets.delete(key);
    }
  }
  lastMemoryPruneAt = now;
}

async function pruneDbBuckets(now: number) {
  if (now - lastDbPruneAt < PRUNE_INTERVAL_MS) {
    return;
  }

  await db.rateLimitEntry.deleteMany({
    where: {
      resetAt: {
        lte: new Date(now),
      },
    },
  });
  lastDbPruneAt = now;
}

async function getRedisClient(): Promise<RedisClient | null> {
  if (!shouldTryRedisStore()) {
    return null;
  }

  const now = Date.now();
  if (now < redisDisabledUntilMs) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  redisConnectPromise = (async () => {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 300,
        reconnectStrategy: () => false,
      },
    });

    client.on("error", () => {
      markRedisUnavailable();
    });

    try {
      await client.connect();
      redisClient = client;
      redisDisabledUntilMs = 0;
      return client;
    } catch {
      markRedisUnavailable();
      try {
        await client.quit();
      } catch {
        // noop
      }
      return null;
    } finally {
      redisConnectPromise = null;
    }
  })();

  return redisConnectPromise;
}

function consumeRateLimitMemory(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  pruneMemoryBuckets(now);

  const current = memoryBuckets.get(key);

  if (!current || current.resetAtMs <= now) {
    const fresh: RateLimitBucket = {
      count: 1,
      resetAtMs: now + options.windowMs,
    };
    memoryBuckets.set(key, fresh);
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, options.limit - fresh.count),
    };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAtMs - now) / 1000)),
      remaining: 0,
    };
  }

  current.count += 1;
  memoryBuckets.set(key, current);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, options.limit - current.count),
  };
}

async function consumeRateLimitDb(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  await pruneDbBuckets(now);

  return db.$transaction(async (tx) => {
    const current = await tx.rateLimitEntry.findUnique({
      where: {
        key,
      },
      select: {
        count: true,
        resetAt: true,
      },
    });

    if (!current || current.resetAt.getTime() <= now) {
      await tx.rateLimitEntry.upsert({
        where: {
          key,
        },
        update: {
          count: 1,
          resetAt: new Date(now + options.windowMs),
        },
        create: {
          key,
          count: 1,
          resetAt: new Date(now + options.windowMs),
        },
      });

      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, options.limit - 1),
      } satisfies RateLimitResult;
    }

    if (current.count >= options.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt.getTime() - now) / 1000)),
        remaining: 0,
      } satisfies RateLimitResult;
    }

    const updated = await tx.rateLimitEntry.update({
      where: {
        key,
      },
      data: {
        count: {
          increment: 1,
        },
      },
      select: {
        count: true,
      },
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, options.limit - updated.count),
    } satisfies RateLimitResult;
  });
}

function buildRedisKey(key: string) {
  return `${REDIS_KEY_PREFIX}${key}`;
}

async function consumeRateLimitRedis(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    throw new Error("Redis rate-limit store is not available.");
  }

  const redisKey = buildRedisKey(key);
  const count = await client.incr(redisKey);

  if (count === 1) {
    await client.pExpire(redisKey, options.windowMs);
  }

  let ttlMs = await client.pTTL(redisKey);
  if (ttlMs < 0) {
    await client.pExpire(redisKey, options.windowMs);
    ttlMs = options.windowMs;
  }

  if (count > options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, options.limit - count),
  };
}

export async function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  if (shouldTryRedisStore()) {
    try {
      return await consumeRateLimitRedis(key, options);
    } catch {
      markRedisUnavailable();
    }
  }

  if (shouldUseDbStore()) {
    try {
      return await consumeRateLimitDb(key, options);
    } catch {
      // Fallback to in-memory store when shared stores fail.
    }
  }

  return consumeRateLimitMemory(key, options);
}

async function resetRateLimitRedis(key: string) {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  await client.del(buildRedisKey(key));
}

export async function resetRateLimit(key: string) {
  memoryBuckets.delete(key);

  if (shouldTryRedisStore()) {
    try {
      await resetRateLimitRedis(key);
    } catch {
      markRedisUnavailable();
    }
  }

  if (!shouldUseDbStore()) {
    return;
  }

  try {
    await db.rateLimitEntry.deleteMany({
      where: {
        key,
      },
    });
  } catch {
    // noop fallback: in-memory bucket is already cleared.
  }
}
