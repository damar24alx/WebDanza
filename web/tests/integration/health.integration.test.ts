import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GET as healthGet } from "../../src/app/api/health/route";

describe("health endpoint (integration)", () => {
  test("returns ok status with database connectivity", async () => {
    const response = await healthGet();
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      ok: boolean;
      status: string;
      services: {
        database: string;
        redis: string;
      };
    };

    assert.equal(body.ok, true);
    assert.equal(body.status, "ok");
    assert.equal(body.services.database, "ok");
    assert.ok(
      body.services.redis === "ok" ||
        body.services.redis === "not_configured" ||
        body.services.redis === "error",
    );
  });
});
