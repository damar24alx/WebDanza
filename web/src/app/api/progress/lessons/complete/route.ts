import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/auth/session";
import { validateSameOrigin } from "@/server/security/csrf";
import { completeLessonByCourseAndLessonSlug } from "@/server/db/progress";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";
import { validateCompleteLessonInput } from "@/server/validation/progress";

function safeRedirectPath(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();
  if (!candidate.startsWith("/learn/")) {
    return fallback;
  }

  return candidate;
}

function withStatusMessage(request: NextRequest, redirectPath: string, payload: { success?: string; error?: string }) {
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

export async function POST(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  const formData = await request.formData();
  const wantsJson = wantsJsonResponse(request);
  const parsedInput = validateCompleteLessonInput({
    courseSlug: formData.get("courseSlug")?.toString() ?? "",
    lessonSlug: formData.get("lessonSlug")?.toString() ?? "",
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  const courseSlug = parsedInput.ok ? parsedInput.data.courseSlug : "";
  const lessonSlug = parsedInput.ok ? parsedInput.data.lessonSlug : "";
  const defaultPath = courseSlug ? `/learn/${courseSlug}` : "/learn";
  const redirectTo = safeRedirectPath(
    parsedInput.ok ? parsedInput.data.redirectTo : formData.get("redirectTo"),
    defaultPath,
  );
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "progress.complete.csrf_rejected", {
      path: requestPath,
    });
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: "Solicitud invalida.", fieldErrors: {} },
        { status: 403 },
      );
    }
    return withStatusMessage(request, redirectTo, {
      error: "Solicitud invalida.",
    });
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    logEvent("warn", "progress.complete.unauthenticated", {
      path: requestPath,
    });
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: "Autenticacion requerida.", fieldErrors: {} },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", redirectTo);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (!parsedInput.ok) {
    logEvent("warn", "progress.complete.validation_failed", {
      path: requestPath,
      fieldErrors: Object.keys(parsedInput.fieldErrors),
    });
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          formError: parsedInput.formError,
          fieldErrors: parsedInput.fieldErrors,
        },
        { status: 422 },
      );
    }

    return withStatusMessage(request, redirectTo, {
      error: parsedInput.formError,
    });
  }

  const result = await completeLessonByCourseAndLessonSlug({
    userId: session.id,
    courseSlug,
    lessonSlug,
  });

  if (!result.ok) {
    logEvent("warn", "progress.complete.rejected", {
      path: requestPath,
      userId: session.id,
      courseSlug,
      lessonSlug,
      reason: result.message,
    });
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          formError: result.message,
          fieldErrors: {},
        },
        { status: 422 },
      );
    }

    return withStatusMessage(request, redirectTo, {
      error: result.message,
    });
  }

  if (wantsJson) {
    logEvent("info", "progress.complete.success", {
      path: requestPath,
      userId: session.id,
      courseSlug: result.courseSlug,
      lessonSlug: result.lessonSlug,
      percent: result.percent,
      status: result.status,
    });
    return NextResponse.json({
      ok: true,
      message: result.message,
      courseSlug: result.courseSlug,
      lessonSlug: result.lessonSlug,
      nextLessonSlug: result.nextLessonSlug,
      resumeLessonSlug: result.resumeLessonSlug,
      resumeStepIndex: result.resumeStepIndex,
      percent: result.percent ?? 0,
      status: result.status,
      certificateIssued: result.certificateIssued ?? false,
      certificateCode: result.certificateCode ?? null,
    });
  }

  const targetLesson = result.resumeLessonSlug ?? result.nextLessonSlug ?? lessonSlug;
  const stepQuery =
    typeof result.resumeStepIndex === "number" ? `&step=${result.resumeStepIndex}` : "";
  const successPath = `/learn/${result.courseSlug}?lesson=${encodeURIComponent(targetLesson)}${stepQuery}`;

  logEvent("info", "progress.complete.success", {
    path: requestPath,
    userId: session.id,
    courseSlug: result.courseSlug,
    lessonSlug: result.lessonSlug,
    percent: result.percent,
    status: result.status,
  });

  return withStatusMessage(request, successPath, {
    success: `Leccion completada. Progreso ${result.percent ?? 0}%.`,
  });
}
