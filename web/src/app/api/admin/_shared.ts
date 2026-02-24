import { EditorialStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { AdminActorRole } from "@/server/admin/permissions";
import { validateSameOrigin } from "@/server/security/csrf";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { getSessionFromRequest } from "@/server/auth/session";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";

const SAFE_REDIRECT_PREFIX = "/admin";
const DEFAULT_MUTATION_ERROR = "No se pudo completar la solicitud.";
const DEFAULT_ADMIN_MUTATION_LIMIT = 60;
const DEFAULT_ADMIN_MUTATION_WINDOW_MS = 60 * 1000;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value?.trim() ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getAdminMutationLimit() {
  return {
    limit: parsePositiveInt(
      process.env.ADMIN_MUTATION_RATE_LIMIT_LIMIT,
      DEFAULT_ADMIN_MUTATION_LIMIT,
    ),
    windowMs: parsePositiveInt(
      process.env.ADMIN_MUTATION_RATE_LIMIT_WINDOW_MS,
      DEFAULT_ADMIN_MUTATION_WINDOW_MS,
    ),
  };
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

export function safeAdminRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();
  if (!candidate.startsWith(SAFE_REDIRECT_PREFIX)) {
    return fallback;
  }

  return candidate;
}

export function redirectWithStatusMessage(
  request: NextRequest,
  redirectPath: string,
  payload: { success?: string; error?: string },
) {
  const url = new URL(redirectPath, request.url);
  if (payload.success) {
    url.searchParams.set("success", payload.success);
    url.searchParams.delete("error");
  }
  if (payload.error) {
    url.searchParams.set("error", payload.error);
    url.searchParams.delete("success");
  }

  return NextResponse.redirect(url, { status: 303 });
}

export function mutationErrorResponse(
  request: NextRequest,
  redirectPath: string,
  payload: {
    formError?: string;
    fieldErrors?: Record<string, string[]>;
    status?: number;
  },
) {
  const formError = payload.formError ?? DEFAULT_MUTATION_ERROR;
  if (wantsJsonResponse(request)) {
    return NextResponse.json(
      {
        ok: false,
        formError,
        fieldErrors: payload.fieldErrors ?? {},
      },
      {
        status: payload.status ?? 422,
      },
    );
  }

  return redirectWithStatusMessage(request, redirectPath, {
    error: formError,
  });
}

export function mutationSuccessResponse(
  request: NextRequest,
  redirectPath: string,
  payload: {
    message: string;
    data?: Record<string, unknown>;
  },
) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json({
      ok: true,
      message: payload.message,
      ...(payload.data ?? {}),
    });
  }

  return redirectWithStatusMessage(request, redirectPath, {
    success: payload.message,
  });
}

export function parseTargetStatus(value: unknown): EditorialStatus | undefined {
  if (
    value === "draft" ||
    value === "review" ||
    value === "ready" ||
    value === "published"
  ) {
    return value;
  }

  return undefined;
}

export async function requireAdminApiAccess(
  request: NextRequest,
): Promise<
  | { ok: true; actorRole: AdminActorRole; actorUserId: string }
  | { ok: false; response: NextResponse }
> {
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "admin.api.csrf_rejected", {
      path: request.nextUrl.pathname,
    });
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, formError: sameOrigin.message, fieldErrors: {} },
        { status: 403 },
      ),
    };
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    logEvent("warn", "admin.api.unauthenticated", {
      path: request.nextUrl.pathname,
    });
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, formError: "Autenticacion requerida.", fieldErrors: {} },
        { status: 401 },
      ),
    };
  }

  if (session.role !== "ADMIN") {
    logEvent("warn", "admin.api.forbidden", {
      path: request.nextUrl.pathname,
      role: session.role,
    });
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, formError: "Se requiere rol ADMIN.", fieldErrors: {} },
        { status: 403 },
      ),
    };
  }

  const method = request.method.toUpperCase();
  const isMutation =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";
  if (isMutation) {
    const ip = getRequestIp(request);
    const attempt = await consumeRateLimit(
      `admin:mutation:${session.id}:${ip}`,
      getAdminMutationLimit(),
    );
    if (!attempt.allowed) {
      logEvent("warn", "admin.api.rate_limited", {
        path: request.nextUrl.pathname,
        actorUserId: session.id,
        retryAfterSeconds: attempt.retryAfterSeconds,
      });
      const response = NextResponse.json(
        {
          ok: false,
          formError: `Demasiadas operaciones administrativas. Intenta nuevamente en ${attempt.retryAfterSeconds}s.`,
          fieldErrors: {},
        },
        { status: 429 },
      );
      response.headers.set("Retry-After", `${attempt.retryAfterSeconds}`);
      return {
        ok: false,
        response,
      };
    }
  }

  logEvent("info", "admin.api.access_granted", {
    path: request.nextUrl.pathname,
    role: session.role,
  });

  return {
    ok: true,
    actorRole: "ADMIN",
    actorUserId: session.id,
  };
}
