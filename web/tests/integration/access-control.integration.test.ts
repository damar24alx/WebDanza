import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import { requireAdminApiAccess } from "../../src/app/api/admin/_shared";
import { proxy } from "../../src/proxy";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../src/server/auth/token";

function buildRequest(
  pathname: string,
  token?: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
  },
) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }
  for (const [key, value] of Object.entries(options?.headers ?? {})) {
    headers.set(key, value);
  }

  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers,
    method: options?.method ?? "GET",
  });
}

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

describe("access control (integration)", () => {
  test("requireAdminApiAccess returns 401 without session", async () => {
    const request = buildRequest("/api/admin/moves/create");
    const result = await requireAdminApiAccess(request);
    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error("Expected non-admin access result.");
    }
    assert.equal(result.response.status, 401);
  });

  test("requireAdminApiAccess returns 403 for student session", async () => {
    const studentToken = await createSessionToken({
      id: "student-id",
      email: "student@dance.local",
      name: "Student",
      role: "STUDENT",
    });
    const request = buildRequest("/api/admin/moves/create", studentToken);
    const result = await requireAdminApiAccess(request);
    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error("Expected forbidden access result.");
    }
    assert.equal(result.response.status, 403);
  });

  test("requireAdminApiAccess allows admin session", async () => {
    const adminToken = await createSessionToken({
      id: "admin-id",
      email: "admin@dance.local",
      name: "Admin",
      role: "ADMIN",
    });
    const request = buildRequest("/api/admin/moves/create", adminToken);
    const result = await requireAdminApiAccess(request);
    assert.equal(result.ok, true);
    if (!result.ok) {
      throw new Error("Expected allowed admin access.");
    }
    assert.equal(result.actorRole, "ADMIN");
  });

  test("middleware redirects anonymous users from /admin to login", async () => {
    const request = buildRequest("/admin");
    const response = await proxy(request);
    assert.ok(response);
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/auth\/login\?next=%2Fadmin$/);
  });

  test("middleware redirects student users from /admin to /me", async () => {
    const studentToken = await createSessionToken({
      id: "student-id",
      email: "student@dance.local",
      name: "Student",
      role: "STUDENT",
    });
    const request = buildRequest("/admin", studentToken);
    const response = await proxy(request);
    assert.ok(response);
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/me\?error=admin_only$/);
  });

  test("middleware blocks student access to /api/admin with 403", async () => {
    const studentToken = await createSessionToken({
      id: "student-id",
      email: "student@dance.local",
      name: "Student",
      role: "STUDENT",
    });
    const request = buildRequest("/api/admin/moves/create", studentToken);
    const response = await proxy(request);
    assert.ok(response);
    assert.equal(response.status, 403);
  });

  test("requireAdminApiAccess rejects cross-origin admin API requests", async () => {
    const adminToken = await createSessionToken({
      id: "admin-id",
      email: "admin@dance.local",
      name: "Admin",
      role: "ADMIN",
    });
    const headers = new Headers();
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${adminToken}`);
    headers.set("origin", "https://evil.example");
    const request = new NextRequest("http://localhost:3000/api/admin/moves/create", { headers });
    const result = await requireAdminApiAccess(request);

    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error("Expected cross-origin request to be rejected.");
    }
    assert.equal(result.response.status, 403);
  });

  test("requireAdminApiAccess enforces rate limit for admin mutations", async () => {
    await withTemporaryEnv(
      {
        ADMIN_MUTATION_RATE_LIMIT_LIMIT: "2",
        ADMIN_MUTATION_RATE_LIMIT_WINDOW_MS: "600000",
      },
      async () => {
        const adminToken = await createSessionToken({
          id: `admin-rate-limit-${Date.now()}`,
          email: "admin-rate-limit@dance.local",
          name: "Admin",
          role: "ADMIN",
        });

        const req1 = buildRequest("/api/admin/moves/create", adminToken, {
          method: "POST",
          headers: {
            "x-forwarded-for": "203.0.113.77",
          },
        });
        const req2 = buildRequest("/api/admin/moves/create", adminToken, {
          method: "POST",
          headers: {
            "x-forwarded-for": "203.0.113.77",
          },
        });
        const req3 = buildRequest("/api/admin/moves/create", adminToken, {
          method: "POST",
          headers: {
            "x-forwarded-for": "203.0.113.77",
          },
        });

        const result1 = await requireAdminApiAccess(req1);
        const result2 = await requireAdminApiAccess(req2);
        const result3 = await requireAdminApiAccess(req3);

        assert.equal(result1.ok, true);
        assert.equal(result2.ok, true);
        assert.equal(result3.ok, false);
        if (result3.ok) {
          throw new Error("Expected rate-limited result.");
        }

        assert.equal(result3.response.status, 429);
        assert.ok(result3.response.headers.get("Retry-After"));
      },
    );
  });
});
