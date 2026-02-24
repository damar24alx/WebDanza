import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/server/auth/session";
import { evaluateCourseAccess, getUserEntitlement } from "@/server/db/subscriptions";
import { wantsJsonResponse } from "@/server/http/response";
import { logEvent } from "@/server/observability/logger";
import { validateSameOrigin } from "@/server/security/csrf";
import { setLessonStepProgress } from "@/server/db/progress";
import { validateStepProgressInput } from "@/server/validation/progress";

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

function parseCompleted(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") {
    return false;
  }

  return null;
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
  const completed = parseCompleted(formData.get("completed"));
  const parsedInput = validateStepProgressInput({
    courseSlug: formData.get("courseSlug")?.toString() ?? "",
    lessonSlug: formData.get("lessonSlug")?.toString() ?? "",
    stepIndex: formData.get("stepIndex"),
    completed: completed ?? false,
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  const courseSlug = parsedInput.ok ? parsedInput.data.courseSlug : "";
  const lessonSlug = parsedInput.ok ? parsedInput.data.lessonSlug : "";
  const fallbackPath =
    courseSlug && lessonSlug
      ? `/learn/${courseSlug}?lesson=${encodeURIComponent(lessonSlug)}`
      : "/learn";
  const redirectTo = safeRedirectPath(
    parsedInput.ok ? parsedInput.data.redirectTo : formData.get("redirectTo"),
    fallbackPath,
  );

  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "progress.step_toggle.csrf_rejected", {
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
    logEvent("warn", "progress.step_toggle.unauthenticated", {
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

  if (completed === null) {
    logEvent("warn", "progress.step_toggle.validation_failed", {
      path: requestPath,
      reason: "completed_invalid",
    });
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          formError: "No se pudo actualizar el checklist.",
          fieldErrors: {
            completed: ["Valor invalido para completed."],
          },
        },
        { status: 422 },
      );
    }
    return withStatusMessage(request, redirectTo, {
      error: "No se pudo actualizar el checklist.",
    });
  }

  if (!parsedInput.ok) {
    logEvent("warn", "progress.step_toggle.validation_failed", {
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

  const course = await db.course.findFirst({
    where: {
      slug: parsedInput.data.courseSlug,
      publishedStatus: "published",
    },
    select: {
      slug: true,
      style: {
        select: {
          slug: true,
        },
      },
    },
  });
  if (!course?.style?.slug) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: "Curso no disponible.", fieldErrors: {} },
        { status: 404 },
      );
    }
    return withStatusMessage(request, redirectTo, {
      error: "Curso no disponible.",
    });
  }

  const entitlement = await getUserEntitlement(session.id);
  const access = evaluateCourseAccess(entitlement, course.style.slug);
  if (!access.allowed) {
    const checkoutParams = new URLSearchParams();
    checkoutParams.set("plan", access.requiredPlan ?? "pro");
    if (access.suggestedStyleSlug) {
      checkoutParams.set("style", access.suggestedStyleSlug);
    }
    checkoutParams.set("next", `/learn/${course.slug}`);
    const checkoutHref = `/checkout?${checkoutParams.toString()}`;

    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: "Tu plan no permite actualizar progreso en este curso.", fieldErrors: {}, checkoutHref },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL(checkoutHref, request.url), { status: 303 });
  }

  const result = await setLessonStepProgress({
    userId: session.id,
    courseSlug: parsedInput.data.courseSlug,
    lessonSlug: parsedInput.data.lessonSlug,
    stepIndex: parsedInput.data.stepIndex,
    completed: parsedInput.data.completed,
  });

  if (!result.ok) {
    logEvent("warn", "progress.step_toggle.rejected", {
      path: requestPath,
      userId: session.id,
      courseSlug: parsedInput.data.courseSlug,
      lessonSlug: parsedInput.data.lessonSlug,
      stepIndex: parsedInput.data.stepIndex,
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
    logEvent("info", "progress.step_toggle.success", {
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

  logEvent("info", "progress.step_toggle.success", {
    path: requestPath,
    userId: session.id,
    courseSlug: result.courseSlug,
    lessonSlug: result.lessonSlug,
    percent: result.percent,
    status: result.status,
  });

  return withStatusMessage(request, redirectTo, {
    success: result.message,
  });
}
