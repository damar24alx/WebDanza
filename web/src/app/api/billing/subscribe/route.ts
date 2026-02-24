import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/auth/session";
import { wantsJsonResponse } from "@/server/http/response";
import {
  parseCheckoutPlanId,
  setUserSubscription,
  toSubscriptionPlan,
} from "@/server/db/subscriptions";
import { validateSameOrigin } from "@/server/security/csrf";

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

function buildCheckoutUrl(request: NextRequest, params: {
  plan: string;
  style?: string;
  next?: string;
  error?: string;
  success?: string;
}) {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("plan", params.plan);
  if (params.style) {
    url.searchParams.set("style", params.style);
  }
  if (params.next) {
    url.searchParams.set("next", params.next);
  }
  if (params.error) {
    url.searchParams.set("error", params.error);
  }
  if (params.success) {
    url.searchParams.set("success", params.success);
  }
  return url;
}

export async function POST(request: NextRequest) {
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    return NextResponse.json(
      { ok: false, formError: "Solicitud invalida.", fieldErrors: {} },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const wantsJson = wantsJsonResponse(request);
  const rawPlan = formData.get("plan")?.toString() ?? "";
  const planId = parseCheckoutPlanId(rawPlan);
  const styleSlug = (formData.get("styleSlug")?.toString() ?? "").trim().toLowerCase();
  const redirectTo = safeRedirectPath(formData.get("redirectTo"), "/learn");
  const session = await getSessionFromRequest(request);

  if (!session) {
    const checkoutUrl = buildCheckoutUrl(request, {
      plan: rawPlan || "pro",
      style: styleSlug || undefined,
      next: redirectTo,
    });
    const nextCheckout = `${checkoutUrl.pathname}${checkoutUrl.search}`;
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", nextCheckout);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (!planId) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: "Plan invalido.", fieldErrors: { plan: ["Plan invalido."] } },
        { status: 422 },
      );
    }
    return NextResponse.redirect(
      buildCheckoutUrl(request, {
        plan: "pro",
        next: redirectTo,
        error: "Plan invalido.",
      }),
      { status: 303 },
    );
  }

  const result = await setUserSubscription({
    userId: session.id,
    plan: toSubscriptionPlan(planId),
    styleSlug,
  });

  if (!result.ok) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, formError: result.message, fieldErrors: {} },
        { status: 422 },
      );
    }
    return NextResponse.redirect(
      buildCheckoutUrl(request, {
        plan: planId,
        style: styleSlug || undefined,
        next: redirectTo,
        error: result.message,
      }),
      { status: 303 },
    );
  }

  if (wantsJson) {
    return NextResponse.json({
      ok: true,
      nextPath: redirectTo,
      plan: result.subscription.plan,
      styleSlug: result.subscription.styleSlug,
    });
  }

  const destination = new URL(redirectTo, request.url);
  destination.searchParams.set("success", "plan_updated");
  return NextResponse.redirect(destination, { status: 303 });
}
