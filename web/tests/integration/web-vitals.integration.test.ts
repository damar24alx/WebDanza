import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import { POST as postWebVitals } from "../../src/app/api/observability/web-vitals/route";

function buildJsonRequest(
  payload: unknown,
  headers?: Record<string, string>,
) {
  const requestHeaders = new Headers({
    "content-type": "application/json",
    origin: "http://localhost:3000",
    ...headers,
  });

  return new NextRequest("http://localhost:3000/api/observability/web-vitals", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(payload),
  });
}

describe("web vitals endpoint (integration)", () => {
  test("accepts valid web vital payload", async () => {
    const response = await postWebVitals(
      buildJsonRequest({
        name: "LCP",
        value: 2400,
        rating: "good",
        id: "lcp:test",
        path: "/learn",
        navigationType: "navigate",
      }),
    );

    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean };
    assert.equal(body.ok, true);
  });

  test("returns 422 for invalid payload", async () => {
    const response = await postWebVitals(
      buildJsonRequest({
        name: "LCP",
        value: -1,
        rating: "good",
        id: "bad",
        path: "/learn",
        navigationType: "navigate",
      }),
    );

    assert.equal(response.status, 422);
    const body = (await response.json()) as { ok: boolean; fieldErrors: Record<string, string[]> };
    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.value?.length > 0);
  });

  test("rejects cross-origin requests", async () => {
    const response = await postWebVitals(
      buildJsonRequest(
        {
          name: "TTFB",
          value: 800,
          rating: "good",
          id: "ttfb:test",
          path: "/",
          navigationType: "navigate",
        },
        {
          origin: "https://evil.example",
        },
      ),
    );

    assert.equal(response.status, 403);
    const body = (await response.json()) as { ok: boolean };
    assert.equal(body.ok, false);
  });
});

