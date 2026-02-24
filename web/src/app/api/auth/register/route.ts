import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import { wantsJsonResponse } from "@/server/http/response";
import { validateSameOrigin } from "@/server/security/csrf";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { createSessionToken, sessionCookieOptions } from "@/server/auth/session";
import { logEvent } from "@/server/observability/logger";
import { validateRegisterInput } from "@/server/validation/auth";

const REGISTER_IP_LIMIT = {
  limit: 12,
  windowMs: 10 * 60 * 1000,
};

const REGISTER_EMAIL_LIMIT = {
  limit: 6,
  windowMs: 10 * 60 * 1000,
};

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
    firstName?: string;
    lastName?: string;
    email?: string;
    fieldErrors?: Record<string, string[]>;
    status?: number;
    retryAfterSeconds?: number;
  },
) {
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
        status: payload.status ?? 422,
        headers: retryAfterValue ? { "Retry-After": retryAfterValue } : undefined,
      },
    );
  }

  const url = new URL("/auth/register", request.url);
  url.searchParams.set("error", payload.message);
  if (payload.firstName) {
    url.searchParams.set("firstName", payload.firstName);
  }
  if (payload.lastName) {
    url.searchParams.set("lastName", payload.lastName);
  }
  if (payload.email) {
    url.searchParams.set("email", payload.email);
  }

  if (payload.fieldErrors?.firstName?.[0]) {
    url.searchParams.set("firstNameError", payload.fieldErrors.firstName[0]);
  }
  if (payload.fieldErrors?.lastName?.[0]) {
    url.searchParams.set("lastNameError", payload.fieldErrors.lastName[0]);
  }
  if (payload.fieldErrors?.email?.[0]) {
    url.searchParams.set("emailError", payload.fieldErrors.email[0]);
  }
  if (payload.fieldErrors?.password?.[0]) {
    url.searchParams.set("passwordError", payload.fieldErrors.password[0]);
  }
  if (payload.fieldErrors?.passwordConfirm?.[0]) {
    url.searchParams.set("passwordConfirmError", payload.fieldErrors.passwordConfirm[0]);
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
    logEvent("warn", "auth.register.csrf_rejected", {
      path: requestPath,
    });
    return withError(request, {
      message: "Solicitud invalida.",
    });
  }

  const formData = await request.formData();
  const parsedInput = validateRegisterInput({
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    passwordConfirm: formData.get("passwordConfirm")?.toString() ?? "",
  });

  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!parsedInput.ok) {
    logEvent("warn", "auth.register.validation_failed", {
      path: requestPath,
      email,
      fieldErrors: Object.keys(parsedInput.fieldErrors),
    });
    return withError(request, {
      message: parsedInput.formError,
      firstName,
      lastName,
      email,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const ip = getRequestIp(request);
  const ipAttempt = await consumeRateLimit(`register:ip:${ip}`, REGISTER_IP_LIMIT);
  if (!ipAttempt.allowed) {
    logEvent("warn", "auth.register.rate_limited_ip", {
      path: requestPath,
      email: parsedInput.data.email,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${ipAttempt.retryAfterSeconds}s.`,
      firstName: parsedInput.data.firstName,
      lastName: parsedInput.data.lastName,
      email: parsedInput.data.email,
      status: 429,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
  }

  const accountAttempt = await consumeRateLimit(
    `register:account:${parsedInput.data.email}:${ip}`,
    REGISTER_EMAIL_LIMIT,
  );
  if (!accountAttempt.allowed) {
    logEvent("warn", "auth.register.rate_limited_account", {
      path: requestPath,
      email: parsedInput.data.email,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${accountAttempt.retryAfterSeconds}s.`,
      firstName: parsedInput.data.firstName,
      lastName: parsedInput.data.lastName,
      email: parsedInput.data.email,
      status: 429,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
  }

  const existing = await db.user.findUnique({
    where: {
      email: parsedInput.data.email,
    },
    select: {
      id: true,
    },
  });
  if (existing) {
    logEvent("warn", "auth.register.duplicate_email", {
      path: requestPath,
      email: parsedInput.data.email,
    });
    return withError(request, {
      message: "Ya existe una cuenta con ese correo.",
      firstName: parsedInput.data.firstName,
      lastName: parsedInput.data.lastName,
      email: parsedInput.data.email,
      status: 422,
    });
  }

  const fullName = `${parsedInput.data.firstName} ${parsedInput.data.lastName}`.trim();
  const user = await db.user.create({
    data: {
      name: fullName,
      email: parsedInput.data.email,
      role: "STUDENT",
      passwordHash: hashPassword(parsedInput.data.password),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const token = await createSessionToken({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.redirect(new URL("/me", request.url), { status: 303 });
  response.cookies.set("dance_session", token, sessionCookieOptions());

  logEvent("info", "auth.register.success", {
    path: requestPath,
    userId: user.id,
    role: user.role,
  });

  return response;
}
