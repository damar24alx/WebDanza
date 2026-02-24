import { NextResponse } from "next/server";
import { createClient } from "redis";
import { db } from "@/lib/db";

type RedisStatus = "ok" | "not_configured" | "error";

async function checkRedisStatus(): Promise<RedisStatus> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return "not_configured";
  }

  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 500,
      reconnectStrategy: () => false,
    },
  });

  try {
    await client.connect();
    await client.ping();
    return "ok";
  } catch {
    return "error";
  } finally {
    if (client.isOpen) {
      await client.quit().catch(() => undefined);
    }
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const redisStatus = await checkRedisStatus();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        timestamp,
        services: {
          database: "not_configured",
          redis: redisStatus,
        },
      },
      { status: 503 },
    );
  }

  try {
    await db.$queryRaw`SELECT 1`;

    const rateLimitStore = (process.env.RATE_LIMIT_STORE ?? "auto").trim().toLowerCase();
    const redisRequired = rateLimitStore === "redis";
    const redisHealthy =
      redisStatus === "ok" ||
      (!redisRequired && (redisStatus === "not_configured" || redisStatus === "error"));
    const ok = redisRequired ? redisHealthy : true;

    return NextResponse.json({
      ok,
      status: ok ? "ok" : "degraded",
      timestamp,
      services: {
        database: "ok",
        redis: redisStatus,
      },
    }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        timestamp,
        services: {
          database: "error",
          redis: redisStatus,
        },
      },
      { status: 503 },
    );
  }
}
