import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";

export type CheckoutPlanId = "free" | "style-pack" | "pro" | "studio";

export type UserEntitlement = {
  userId: string;
  role: UserRole;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  styleSlug: string | null;
  roleBypass: boolean;
};

export type CourseAccessDecision = {
  allowed: boolean;
  reason:
    | "ok"
    | "unauthenticated"
    | "subscription_inactive"
    | "free_requires_upgrade"
    | "style_pack_mismatch";
  requiredPlan: CheckoutPlanId | null;
  suggestedStyleSlug: string | null;
};

const INTERNAL_ROLES = new Set<UserRole>(["ADMIN", "EDITOR", "REVIEWER"]);

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function normalizePlanId(value: string) {
  return value.trim().toLowerCase();
}

export function parseCheckoutPlanId(value: string): CheckoutPlanId | null {
  const normalized = normalizePlanId(value);
  if (normalized === "free") {
    return "free";
  }
  if (normalized === "style-pack") {
    return "style-pack";
  }
  if (normalized === "pro") {
    return "pro";
  }
  if (normalized === "studio") {
    return "studio";
  }

  return null;
}

export function toSubscriptionPlan(planId: CheckoutPlanId): SubscriptionPlan {
  if (planId === "style-pack") {
    return "STYLE_PACK";
  }
  if (planId === "pro") {
    return "PRO";
  }
  if (planId === "studio") {
    return "STUDIO";
  }

  return "FREE";
}

export function toCheckoutPlanId(plan: SubscriptionPlan): CheckoutPlanId {
  if (plan === "STYLE_PACK") {
    return "style-pack";
  }
  if (plan === "PRO") {
    return "pro";
  }
  if (plan === "STUDIO") {
    return "studio";
  }

  return "free";
}

export function planLabel(plan: SubscriptionPlan) {
  if (plan === "STYLE_PACK") {
    return "Pack por Estilo";
  }
  if (plan === "PRO") {
    return "Pro";
  }
  if (plan === "STUDIO") {
    return "Studio";
  }

  return "Free";
}

export async function getUserEntitlement(userId: string): Promise<UserEntitlement | null> {
  assertDatabaseConfigured();

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          style: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const roleBypass = INTERNAL_ROLES.has(user.role);
  const fallbackPlan = roleBypass ? SubscriptionPlan.STUDIO : SubscriptionPlan.FREE;

  return {
    userId: user.id,
    role: user.role,
    plan: user.subscription?.plan ?? fallbackPlan,
    status: user.subscription?.status ?? SubscriptionStatus.active,
    styleSlug: user.subscription?.style?.slug ?? null,
    roleBypass,
  };
}

export function evaluateCourseAccess(
  entitlement: UserEntitlement | null,
  courseStyleSlug: string,
): CourseAccessDecision {
  if (!entitlement) {
    return {
      allowed: false,
      reason: "unauthenticated",
      requiredPlan: "pro",
      suggestedStyleSlug: courseStyleSlug,
    };
  }

  if (entitlement.roleBypass) {
    return {
      allowed: true,
      reason: "ok",
      requiredPlan: null,
      suggestedStyleSlug: null,
    };
  }

  if (entitlement.status !== "active") {
    return {
      allowed: false,
      reason: "subscription_inactive",
      requiredPlan: "pro",
      suggestedStyleSlug: courseStyleSlug,
    };
  }

  if (entitlement.plan === "PRO" || entitlement.plan === "STUDIO") {
    return {
      allowed: true,
      reason: "ok",
      requiredPlan: null,
      suggestedStyleSlug: null,
    };
  }

  if (entitlement.plan === "STYLE_PACK") {
    const matchesStyle = Boolean(entitlement.styleSlug && entitlement.styleSlug === courseStyleSlug);
    if (matchesStyle) {
      return {
        allowed: true,
        reason: "ok",
        requiredPlan: null,
        suggestedStyleSlug: null,
      };
    }

    return {
      allowed: false,
      reason: "style_pack_mismatch",
      requiredPlan: "style-pack",
      suggestedStyleSlug: courseStyleSlug,
    };
  }

  return {
    allowed: false,
    reason: "free_requires_upgrade",
    requiredPlan: "style-pack",
    suggestedStyleSlug: courseStyleSlug,
  };
}

export async function setUserSubscription(input: {
  userId: string;
  plan: SubscriptionPlan;
  styleSlug?: string;
}) {
  assertDatabaseConfigured();

  let styleId: string | null = null;
  let styleSlug: string | null = null;

  if (input.plan === "STYLE_PACK") {
    const candidateSlug = (input.styleSlug ?? "").trim().toLowerCase();
    if (!candidateSlug) {
      return {
        ok: false,
        message: "Selecciona un estilo para activar el plan Pack por Estilo.",
      } as const;
    }

    const style = await db.style.findFirst({
      where: {
        slug: candidateSlug,
        publishedStatus: "published",
        isArchived: false,
      },
      select: {
        id: true,
        slug: true,
      },
    });
    if (!style) {
      return {
        ok: false,
        message: "El estilo seleccionado no esta disponible.",
      } as const;
    }

    styleId = style.id;
    styleSlug = style.slug;
  }

  const subscription = await db.userSubscription.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      plan: input.plan,
      status: "active",
      styleId,
      canceledAt: null,
      startedAt: new Date(),
    },
    create: {
      userId: input.userId,
      plan: input.plan,
      status: "active",
      styleId,
    },
    include: {
      style: {
        select: {
          slug: true,
        },
      },
    },
  });

  return {
    ok: true,
    message: "Plan actualizado correctamente.",
    subscription: {
      plan: subscription.plan,
      status: subscription.status,
      styleSlug: subscription.style?.slug ?? styleSlug,
    },
  } as const;
}

