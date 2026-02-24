import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";
import { validateSameOrigin } from "@/server/security/csrf";
import { consumeRateLimit, resetRateLimit } from "@/server/security/rate-limit";
import { validateLoginInput } from "@/server/validation/auth";

const LOGIN_IP_LIMIT = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
};

const LOGIN_EMAIL_LIMIT = {
  limit: 8,
  windowMs: 10 * 60 * 1000,
};

function safeRedirectPath(rawValue: unknown, fallback: string) {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const value = rawValue.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function getRequestIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

function withError(
  request: NextRequest,
  payload: {
    message: string;
    email?: string;
    redirectTo?: string;
    fieldErrors?: Record<string, string[]>;
    status?: number;
    retryAfterSeconds?: number;
  },
) {
  const status = payload.status ?? 422;
  const retryAfterValue =
    typeof payload.retryAfterSeconds === "number" && payload.retryAfterSeconds > 0
      ? `${payload.retryAfterSeconds}`
      : null;
  if (wantsJsonResponse(request)) {
    return NextResponse.json(
      {
        ok: false,
        formError: payload.message,
        fieldErrors: payload.fieldErrors ?? {},
      },
      {
        status,
        headers: retryAfterValue ? { "Retry-After": retryAfterValue } : undefined,
      },
    );
  }

  const url = new URL("/auth/login", request.url);
  url.searchParams.set("error", payload.message);
  if (payload.email) {
    url.searchParams.set("email", payload.email);
  }
  if (payload.redirectTo) {
    url.searchParams.set("next", payload.redirectTo);
  }
  if (payload.fieldErrors?.email?.[0]) {
    url.searchParams.set("emailError", payload.fieldErrors.email[0]);
  }
  if (payload.fieldErrors?.password?.[0]) {
    url.searchParams.set("passwordError", payload.fieldErrors.password[0]);
  }

  const response = NextResponse.redirect(url, { status: 303 });
  if (retryAfterValue) {
    response.headers.set("Retry-After", retryAfterValue);
  }
  return response;
}

export async function POST(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "auth.login.csrf_rejected", {
      path: requestPath,
    });
    return withError(request, {
      message: "Solicitud invalida.",
      status: 403,
    });
  }

  const formData = await request.formData();
  const redirectTo = safeRedirectPath(formData.get("redirectTo"), "");
  const parsedInput = validateLoginInput({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsedInput.ok) {
    logEvent("warn", "auth.login.validation_failed", {
      path: requestPath,
      email: formData.get("email")?.toString() ?? "",
      fieldErrors: Object.keys(parsedInput.fieldErrors),
    });
    return withError(request, {
      message: parsedInput.formError,
      email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
      redirectTo,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const { email, password } = parsedInput.data;
  const ip = getRequestIp(request);
  const ipKey = `login:ip:${ip}`;
  const accountKey = `login:account:${email}:${ip}`;
  const ipAttempt = await consumeRateLimit(ipKey, LOGIN_IP_LIMIT);
  if (!ipAttempt.allowed) {
    logEvent("warn", "auth.login.rate_limited_ip", {
      path: requestPath,
      email,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${ipAttempt.retryAfterSeconds}s.`,
      email,
      redirectTo,
      status: 429,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
  }
  const accountAttempt = await consumeRateLimit(accountKey, LOGIN_EMAIL_LIMIT);
  if (!accountAttempt.allowed) {
    logEvent("warn", "auth.login.rate_limited_account", {
      path: requestPath,
      email,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${accountAttempt.retryAfterSeconds}s.`,
      email,
      redirectTo,
      status: 429,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    logEvent("warn", "auth.login.invalid_credentials", {
      path: requestPath,
      email,
    });
    return withError(request, {
      message: "Usuario no encontrado o contrasena incorrecta.",
      email,
      redirectTo,
      status: 401,
    });
  }

  await resetRateLimit(ipKey);
  await resetRateLimit(accountKey);

  const token = await createSessionToken({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const fallbackPath = user.role === "ADMIN" ? "/admin" : "/me";
  const nextPath = redirectTo || fallbackPath;

  logEvent("info", "auth.login.success", {
    path: requestPath,
    userId: user.id,
    role: user.role,
  });

  if (wantsJsonResponse(request)) {
    const response = NextResponse.json({
      ok: true,
      nextPath,
    });
    response.cookies.set("dance_session", token, sessionCookieOptions());
    return response;
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set("dance_session", token, sessionCookieOptions());

  return response;
}
