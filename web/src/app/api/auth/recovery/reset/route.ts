import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/server/auth/password-reset";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";
import { validateSameOrigin } from "@/server/security/csrf";
import { validateRecoveryResetInput } from "@/server/validation/auth";

function withError(
  request: NextRequest,
  payload: {
    message: string;
    token?: string;
    fieldErrors?: Record<string, string[]>;
  },
) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json(
      {
        ok: false,
        formError: payload.message,
        fieldErrors: payload.fieldErrors ?? {},
      },
      { status: 422 },
    );
  }

  const url = new URL("/auth/recovery/reset", request.url);
  url.searchParams.set("error", payload.message);
  if (payload.token) {
    url.searchParams.set("token", payload.token);
  }
  if (payload.fieldErrors?.token?.[0]) {
    url.searchParams.set("tokenError", payload.fieldErrors.token[0]);
  }
  if (payload.fieldErrors?.password?.[0]) {
    url.searchParams.set("passwordError", payload.fieldErrors.password[0]);
  }
  if (payload.fieldErrors?.passwordConfirm?.[0]) {
    url.searchParams.set("passwordConfirmError", payload.fieldErrors.passwordConfirm[0]);
  }

  return NextResponse.redirect(url, { status: 303 });
}

function withSuccess(request: NextRequest) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json(
      {
        ok: true,
        message: "Contrasena actualizada correctamente.",
      },
      { status: 200 },
    );
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("success", "Contrasena actualizada. Inicia sesion.");
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function POST(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "auth.recovery_reset.csrf_rejected", {
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
    });
  }

  const formData = await request.formData();
  const token = formData.get("token")?.toString() ?? "";
  const parsed = validateRecoveryResetInput({
    token,
    password: formData.get("password")?.toString() ?? "",
    passwordConfirm: formData.get("passwordConfirm")?.toString() ?? "",
  });

  if (!parsed.ok) {
    logEvent("warn", "auth.recovery_reset.validation_failed", {
      path: requestPath,
      fieldErrors: Object.keys(parsed.fieldErrors),
    });
    return withError(request, {
      message: parsed.formError,
      token: token.trim(),
      fieldErrors: parsed.fieldErrors,
    });
  }

  const resetResult = await resetPasswordWithToken({
    token: parsed.data.token,
    newPassword: parsed.data.password,
  });
  if (!resetResult.ok) {
    logEvent("warn", "auth.recovery_reset.rejected", {
      path: requestPath,
      reason: resetResult.message,
    });
    return withError(request, {
      message: resetResult.message,
      token: parsed.data.token,
    });
  }

  logEvent("info", "auth.recovery_reset.success", {
    path: requestPath,
  });

  return withSuccess(request);
}
