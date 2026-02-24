import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/server/auth/password-reset";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";
import { validateSameOrigin } from "@/server/security/csrf";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { validateRecoveryRequestInput } from "@/server/validation/auth";

const RECOVERY_IP_LIMIT = {
  limit: 12,
  windowMs: 10 * 60 * 1000,
};

const RECOVERY_EMAIL_LIMIT = {
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

  const url = new URL("/auth/recovery", request.url);
  url.searchParams.set("error", payload.message);
  if (payload.email) {
    url.searchParams.set("email", payload.email);
  }
  if (payload.fieldErrors?.email?.[0]) {
    url.searchParams.set("emailError", payload.fieldErrors.email[0]);
  }

  const response = NextResponse.redirect(url, { status: 303 });
  if (retryAfterValue) {
    response.headers.set("Retry-After", retryAfterValue);
  }
  return response;
}

function withSuccess(
  request: NextRequest,
  payload: { email?: string; debugToken?: string },
) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json(
      {
        ok: true,
        message: "Si el correo existe, enviaremos instrucciones de recuperacion.",
        debugToken: payload.debugToken ?? null,
      },
      { status: 200 },
    );
  }

  const url = new URL("/auth/recovery", request.url);
  url.searchParams.set(
    "success",
    "Si el correo existe, enviaremos instrucciones de recuperacion.",
  );
  if (payload.email) {
    url.searchParams.set("email", payload.email);
  }
  if (payload.debugToken) {
    url.searchParams.set("debugToken", payload.debugToken);
  }

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "auth.recovery_request.csrf_rejected", {
      path: requestPath,
    });
    if (wantsJsonResponse(request)) {
      return NextResponse.json(
        {
          ok: false,
          formError: "Solicitud invalida.",
          fieldErrors: {},
        },
        { status: 403 },
      );
    }

    return withError(request, {
      message: "Solicitud invalida.",
      status: 403,
    });
  }

  const formData = await request.formData();
  const parsed = validateRecoveryRequestInput({
    email: formData.get("email")?.toString() ?? "",
  });

  if (!parsed.ok) {
    logEvent("warn", "auth.recovery_request.validation_failed", {
      path: requestPath,
      email: formData.get("email")?.toString() ?? "",
      fieldErrors: Object.keys(parsed.fieldErrors),
    });
    return withError(request, {
      message: parsed.formError,
      email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
      fieldErrors: parsed.fieldErrors,
      status: 422,
    });
  }

  const email = parsed.data.email;
  const ip = getRequestIp(request);
  const ipAttempt = await consumeRateLimit(`recovery:ip:${ip}`, RECOVERY_IP_LIMIT);
  if (!ipAttempt.allowed) {
    logEvent("warn", "auth.recovery_request.rate_limited_ip", {
      path: requestPath,
      email,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${ipAttempt.retryAfterSeconds}s.`,
      email,
      status: 429,
      retryAfterSeconds: ipAttempt.retryAfterSeconds,
    });
  }
  const accountAttempt = await consumeRateLimit(
    `recovery:account:${email}:${ip}`,
    RECOVERY_EMAIL_LIMIT,
  );
  if (!accountAttempt.allowed) {
    logEvent("warn", "auth.recovery_request.rate_limited_account", {
      path: requestPath,
      email,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
    return withError(request, {
      message: `Demasiados intentos. Intenta nuevamente en ${accountAttempt.retryAfterSeconds}s.`,
      email,
      status: 429,
      retryAfterSeconds: accountAttempt.retryAfterSeconds,
    });
  }

  const resetRequest = await createPasswordResetRequest(email);
  const debugToken =
    process.env.NODE_ENV === "production" ? undefined : resetRequest.issuedTokenForDebug;

  logEvent("info", "auth.recovery_request.accepted", {
    path: requestPath,
    email,
    tokenIssued: Boolean(debugToken),
  });

  return withSuccess(request, {
    email,
    debugToken,
  });
}
