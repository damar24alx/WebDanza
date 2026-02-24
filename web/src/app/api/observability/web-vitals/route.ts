import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/server/observability/logger";
import { validateSameOrigin } from "@/server/security/csrf";
import { validateWebVitalPayload } from "@/server/validation/observability";

export async function POST(request: NextRequest) {
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "observability.web_vitals.csrf_rejected", {
      path: request.nextUrl.pathname,
    });
    return NextResponse.json(
      {
        ok: false,
        formError: "Solicitud invalida.",
        fieldErrors: {},
      },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        formError: "JSON invalido.",
        fieldErrors: {},
      },
      { status: 400 },
    );
  }

  const parsed = validateWebVitalPayload(payload);
  if (!parsed.ok) {
    logEvent("warn", "observability.web_vitals.validation_failed", {
      path: request.nextUrl.pathname,
      fieldErrors: Object.keys(parsed.fieldErrors),
    });
    return NextResponse.json(
      {
        ok: false,
        formError: parsed.formError,
        fieldErrors: parsed.fieldErrors,
      },
      { status: 422 },
    );
  }

  logEvent("info", "observability.web_vitals.received", parsed.data);

  return NextResponse.json({
    ok: true,
  });
}

