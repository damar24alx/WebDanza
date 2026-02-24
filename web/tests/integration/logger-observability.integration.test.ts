import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { logEvent } from "../../src/server/observability/logger";

type FetchCall = {
  input: string;
  init: RequestInit | undefined;
};

async function withTemporaryEnv(
  values: Record<string, string | undefined>,
  action: () => Promise<void>,
) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function withFetchMock(
  action: (calls: FetchCall[]) => Promise<void>,
) {
  const calls: FetchCall[] = [];
  const originalFetch = global.fetch;
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      input: input.toString(),
      init,
    });
    return new Response(null, {
      status: 204,
    });
  }) as typeof fetch;

  try {
    await action(calls);
  } finally {
    global.fetch = originalFetch;
  }
}

describe("observability logger forwarding (integration)", () => {
  test("forwards logs to central endpoint when configured", async () => {
    await withTemporaryEnv(
      {
        OBSERVABILITY_HTTP_ENDPOINT: "https://observability.local/ingest",
        OBSERVABILITY_HTTP_TOKEN: "token-central",
        OBSERVABILITY_ALERT_WEBHOOK_URL: undefined,
      },
      async () => {
        await withFetchMock(async (calls) => {
          logEvent("info", "test.central.forward", {
            path: "/integration",
          });
          await new Promise((resolve) => setTimeout(resolve, 25));

          assert.equal(calls.length, 1);
          assert.equal(calls[0]?.input, "https://observability.local/ingest");
          assert.equal(
            (calls[0]?.init?.headers as Record<string, string>)?.authorization,
            "Bearer token-central",
          );
        });
      },
    );
  });

  test("sends alert webhook for warn/error levels with cooldown", async () => {
    await withTemporaryEnv(
      {
        OBSERVABILITY_HTTP_ENDPOINT: "https://observability.local/ingest",
        OBSERVABILITY_ALERT_WEBHOOK_URL: "https://alerts.local/webhook",
        OBSERVABILITY_ALERT_MIN_LEVEL: "warn",
        OBSERVABILITY_ALERT_COOLDOWN_MS: "120000",
      },
      async () => {
        await withFetchMock(async (calls) => {
          logEvent("warn", "auth.login.failed", {
            email: "test@example.com",
          });
          logEvent("warn", "auth.login.failed", {
            email: "test@example.com",
          });
          await new Promise((resolve) => setTimeout(resolve, 30));

          const alertCalls = calls.filter(
            (call) => call.input === "https://alerts.local/webhook",
          );
          assert.equal(alertCalls.length, 1);
          assert.equal(
            calls.filter((call) => call.input === "https://observability.local/ingest").length,
            2,
          );
        });
      },
    );
  });
});
