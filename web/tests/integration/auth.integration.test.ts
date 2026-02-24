import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as loginPost } from "../../src/app/api/auth/login/route";
import { POST as recoveryRequestPost } from "../../src/app/api/auth/recovery/request/route";
import { POST as recoveryResetPost } from "../../src/app/api/auth/recovery/reset/route";
import { POST as registerPost } from "../../src/app/api/auth/register/route";
import { hashPassword, verifyPassword } from "../../src/server/auth/password";
import { db } from "../../src/lib/db";

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

function buildFormRequest(
  pathname: string,
  formValues: Record<string, string>,
  extraHeaders?: Record<string, string>,
) {
  const body = new URLSearchParams(formValues);
  const headers = new Headers();
  headers.set("content-type", "application/x-www-form-urlencoded");
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
  }

  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers,
    body: body.toString(),
  });
}

function getRedirectLocation(response: Response) {
  const location = response.headers.get("location");
  assert.ok(location, "Expected redirect location header.");
  return new URL(location, "http://localhost:3000");
}

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
  await db.rateLimitEntry.deleteMany();
});

after(async () => {
  await db.$disconnect();
});

describe("auth routes (integration)", () => {
  test("login returns unified credential error and preserves email + next path", async () => {
    const email = "missing-user@dance.local";
    const nextPath = "/learn/hip-hop-foundations";
    const request = buildFormRequest("/api/auth/login", {
      email,
      password: "WrongPass123",
      redirectTo: nextPath,
    });

    const response = await loginPost(request);
    assert.equal(response.status, 303);

    const redirect = getRedirectLocation(response);
    assert.equal(redirect.pathname, "/auth/login");
    assert.equal(
      redirect.searchParams.get("error"),
      "Usuario no encontrado o contrasena incorrecta.",
    );
    assert.equal(redirect.searchParams.get("email"), email);
    assert.equal(redirect.searchParams.get("next"), nextPath);
  });

  test("login rejects cross-origin mutation attempts", async () => {
    const request = buildFormRequest(
      "/api/auth/login",
      {
        email: "student@dance.local",
        password: "Student123!",
      },
      {
        origin: "https://evil.example",
      },
    );

    const response = await loginPost(request);
    assert.equal(response.status, 303);
    const redirect = getRedirectLocation(response);
    assert.equal(redirect.pathname, "/auth/login");
    assert.equal(redirect.searchParams.get("error"), "Solicitud invalida.");
  });

  test("login enforces rate limit after repeated failed attempts", async () => {
    const email = `rate-limit-${Date.now()}@dance.local`;
    let lastRedirect: URL | null = null;

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const request = buildFormRequest("/api/auth/login", {
        email,
        password: "WrongPass123",
      });
      const response = await loginPost(request);
      assert.equal(response.status, 303);
      lastRedirect = getRedirectLocation(response);
    }

    assert.ok(lastRedirect);
    assert.equal(lastRedirect.pathname, "/auth/login");
    assert.match(lastRedirect.searchParams.get("error") ?? "", /Demasiados intentos/i);
  });

  test("login returns 429 + Retry-After in JSON mode when rate limited", async () => {
    const email = `rate-limit-json-${Date.now()}@dance.local`;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const request = buildFormRequest(
        "/api/auth/login",
        {
          email,
          password: "WrongPass123",
        },
        {
          accept: "application/json",
        },
      );
      lastResponse = await loginPost(request);
    }

    assert.ok(lastResponse);
    assert.equal(lastResponse?.status, 429);
    assert.ok(lastResponse?.headers.get("retry-after"));
    const body = (await lastResponse?.json()) as {
      ok: boolean;
      formError: string;
    };
    assert.equal(body.ok, false);
    assert.match(body.formError, /Demasiados intentos/i);
  });

  test("register route validates fields and keeps entered values", async () => {
    const request = buildFormRequest("/api/auth/register", {
      firstName: "Ana",
      lastName: "",
      email: "invalid-email",
      password: "123",
      passwordConfirm: "1234",
    });

    const response = await registerPost(request);
    assert.equal(response.status, 303);

    const redirect = getRedirectLocation(response);
    assert.equal(redirect.pathname, "/auth/register");
    assert.equal(redirect.searchParams.get("firstName"), "Ana");
    assert.equal(redirect.searchParams.get("email"), "invalid-email");
    assert.ok(redirect.searchParams.get("lastNameError"));
    assert.ok(redirect.searchParams.get("emailError"));
    assert.ok(redirect.searchParams.get("passwordError"));
    assert.ok(redirect.searchParams.get("passwordConfirmError"));
  });

  test("register creates student account, hashes password and starts session", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const email = `register-flow-${suffix}@dance.local`;
    const request = buildFormRequest("/api/auth/register", {
      firstName: "Registro",
      lastName: "Prueba",
      email,
      password: "DancePass123",
      passwordConfirm: "DancePass123",
    });

    try {
      const response = await registerPost(request);
      assert.equal(response.status, 303);

      const redirect = getRedirectLocation(response);
      assert.equal(redirect.pathname, "/me");
      assert.match(response.headers.get("set-cookie") ?? "", /dance_session=/);

      const user = await db.user.findUnique({
        where: { email },
      });
      assert.ok(user);
      assert.equal(user.role, "STUDENT");
      assert.ok(user.passwordHash);
      assert.notEqual(user.passwordHash, "DancePass123");
    } finally {
      await db.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });

  test("register returns 429 + Retry-After in JSON mode when rate limited", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const email = `register-limit-${suffix}@dance.local`;
    let lastResponse: Response | null = null;

    try {
      for (let attempt = 0; attempt < 7; attempt += 1) {
        const request = buildFormRequest(
          "/api/auth/register",
          {
            firstName: "Rate",
            lastName: "Limit",
            email,
            password: "DancePass123",
            passwordConfirm: "DancePass123",
          },
          {
            accept: "application/json",
          },
        );
        lastResponse = await registerPost(request);
      }

      assert.ok(lastResponse);
      assert.equal(lastResponse?.status, 429);
      assert.ok(lastResponse?.headers.get("retry-after"));
      const body = (await lastResponse?.json()) as {
        ok: boolean;
        formError: string;
      };
      assert.equal(body.ok, false);
      assert.match(body.formError, /Demasiados intentos/i);
    } finally {
      await db.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });

  test("recovery request validates email format and preserves input", async () => {
    const request = buildFormRequest("/api/auth/recovery/request", {
      email: "bad-email",
    });
    const response = await recoveryRequestPost(request);
    assert.equal(response.status, 303);

    const redirect = getRedirectLocation(response);
    assert.equal(redirect.pathname, "/auth/recovery");
    assert.ok(redirect.searchParams.get("error"));
    assert.ok(redirect.searchParams.get("emailError"));
    assert.equal(redirect.searchParams.get("email"), "bad-email");
  });

  test("recovery request returns neutral success message for valid emails", async () => {
    const request = buildFormRequest("/api/auth/recovery/request", {
      email: "nobody@dance.local",
    });
    const response = await recoveryRequestPost(request);
    assert.equal(response.status, 303);

    const redirect = getRedirectLocation(response);
    assert.equal(redirect.pathname, "/auth/recovery");
    assert.equal(
      redirect.searchParams.get("success"),
      "Si el correo existe, enviaremos instrucciones de recuperacion.",
    );
    assert.equal(redirect.searchParams.get("email"), "nobody@dance.local");
  });

  test("recovery request returns 429 + Retry-After in JSON mode when rate limited", async () => {
    const email = `recovery-limit-${Date.now()}@dance.local`;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const request = buildFormRequest(
        "/api/auth/recovery/request",
        {
          email,
        },
        {
          accept: "application/json",
        },
      );
      lastResponse = await recoveryRequestPost(request);
    }

    assert.ok(lastResponse);
    assert.equal(lastResponse?.status, 429);
    assert.ok(lastResponse?.headers.get("retry-after"));
    const body = (await lastResponse?.json()) as {
      ok: boolean;
      formError: string;
    };
    assert.equal(body.ok, false);
    assert.match(body.formError, /Demasiados intentos/i);
  });

  test("recovery request creates persistent reset token for existing user", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const email = `recovery-user-${suffix}@dance.local`;
    const user = await db.user.create({
      data: {
        email,
        name: "Recovery User",
        role: "STUDENT",
        passwordHash: hashPassword("OldPass123"),
      },
      select: {
        id: true,
      },
    });

    try {
      const request = buildFormRequest(
        "/api/auth/recovery/request",
        {
          email,
        },
        {
          accept: "application/json",
        },
      );
      const response = await recoveryRequestPost(request);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        ok: boolean;
        debugToken: string | null;
      };
      assert.equal(body.ok, true);
      assert.ok(body.debugToken);

      const tokenRow = await db.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          usedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      assert.ok(tokenRow);
      assert.ok((tokenRow?.expiresAt.getTime() ?? 0) > Date.now());
    } finally {
      await db.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });
      await db.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  });

  test("recovery reset updates password and invalidates used token", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const email = `recovery-reset-${suffix}@dance.local`;
    const user = await db.user.create({
      data: {
        email,
        name: "Recovery Reset User",
        role: "STUDENT",
        passwordHash: hashPassword("OldPass123"),
      },
      select: {
        id: true,
      },
    });

    try {
      const requestTokenResponse = await recoveryRequestPost(
        buildFormRequest(
          "/api/auth/recovery/request",
          {
            email,
          },
          {
            accept: "application/json",
          },
        ),
      );
      assert.equal(requestTokenResponse.status, 200);
      const requestBody = (await requestTokenResponse.json()) as {
        ok: boolean;
        debugToken: string | null;
      };
      assert.equal(requestBody.ok, true);
      const debugToken = requestBody.debugToken ?? "";
      assert.ok(debugToken);

      const resetResponse = await recoveryResetPost(
        buildFormRequest(
          "/api/auth/recovery/reset",
          {
            token: debugToken,
            password: "NewSecure123",
            passwordConfirm: "NewSecure123",
          },
          {
            accept: "application/json",
          },
        ),
      );
      assert.equal(resetResponse.status, 200);
      const resetBody = (await resetResponse.json()) as { ok: boolean };
      assert.equal(resetBody.ok, true);

      const refreshedUser = await db.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          passwordHash: true,
        },
      });
      assert.ok(refreshedUser?.passwordHash);
      assert.equal(verifyPassword("NewSecure123", refreshedUser?.passwordHash ?? ""), true);

      const tokenRows = await db.passwordResetToken.findMany({
        where: {
          userId: user.id,
        },
      });
      assert.ok(tokenRows.length >= 1);
      assert.equal(tokenRows.every((row) => row.usedAt !== null), true);

      const reuseResponse = await recoveryResetPost(
        buildFormRequest(
          "/api/auth/recovery/reset",
          {
            token: debugToken,
            password: "AnotherPass123",
            passwordConfirm: "AnotherPass123",
          },
          {
            accept: "application/json",
          },
        ),
      );
      assert.equal(reuseResponse.status, 422);
      const reuseBody = (await reuseResponse.json()) as {
        ok: boolean;
        formError: string;
      };
      assert.equal(reuseBody.ok, false);
      assert.match(reuseBody.formError, /Token invalido o expirado/i);
    } finally {
      await db.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });
      await db.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  });

  test("recovery reset rejects expired token", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const email = `recovery-expired-${suffix}@dance.local`;
    const initialPassword = "OldPass123";
    const user = await db.user.create({
      data: {
        email,
        name: "Recovery Expired User",
        role: "STUDENT",
        passwordHash: hashPassword(initialPassword),
      },
      select: {
        id: true,
      },
    });

    try {
      const requestTokenResponse = await recoveryRequestPost(
        buildFormRequest(
          "/api/auth/recovery/request",
          {
            email,
          },
          {
            accept: "application/json",
          },
        ),
      );
      assert.equal(requestTokenResponse.status, 200);
      const requestBody = (await requestTokenResponse.json()) as {
        ok: boolean;
        debugToken: string | null;
      };
      assert.equal(requestBody.ok, true);
      const debugToken = requestBody.debugToken ?? "";
      assert.ok(debugToken);

      const tokenHash = createHash("sha256").update(debugToken).digest("hex");
      await db.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          tokenHash,
          usedAt: null,
        },
        data: {
          expiresAt: new Date(Date.now() - 60_000),
        },
      });

      const expiredResetResponse = await recoveryResetPost(
        buildFormRequest(
          "/api/auth/recovery/reset",
          {
            token: debugToken,
            password: "NewSecure123",
            passwordConfirm: "NewSecure123",
          },
          {
            accept: "application/json",
          },
        ),
      );

      assert.equal(expiredResetResponse.status, 422);
      const expiredBody = (await expiredResetResponse.json()) as {
        ok: boolean;
        formError: string;
      };
      assert.equal(expiredBody.ok, false);
      assert.match(expiredBody.formError, /Token invalido o expirado/i);

      const refreshedUser = await db.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          passwordHash: true,
        },
      });
      assert.equal(verifyPassword(initialPassword, refreshedUser?.passwordHash ?? ""), true);
    } finally {
      await db.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });
      await db.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  });
});
