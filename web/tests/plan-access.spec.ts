import { expect, Page, test } from "@playwright/test";
import { SubscriptionPlan, UserRole } from "@prisma/client";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/server/auth/token";
import { db } from "../src/lib/db";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "playwright-auth-secret";
}

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL?.trim() || "http://localhost:4173";

async function ensureUserWithPlan(input: {
  email: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlan;
  styleSlug?: string;
}) {
  const user = await db.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      name: input.name,
      role: input.role,
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
    },
    select: {
      id: true,
    },
  });

  let styleId: string | null = null;
  if (input.plan === "STYLE_PACK") {
    const style = await db.style.findFirst({
      where: {
        slug: input.styleSlug ?? "house",
      },
      select: {
        id: true,
      },
    });
    styleId = style?.id ?? null;
  }

  await db.userSubscription.upsert({
    where: {
      userId: user.id,
    },
    update: {
      plan: input.plan,
      status: "active",
      styleId,
      canceledAt: null,
    },
    create: {
      userId: user.id,
      plan: input.plan,
      status: "active",
      styleId,
    },
  });

  return user.id;
}

async function setSession(page: Page, input: {
  email: string;
  name: string;
  role: UserRole;
}) {
  const user = await db.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });
  if (!user?.id) {
    throw new Error(`Missing session user: ${input.email}`);
  }

  const token = await createSessionToken({
    id: user.id,
    email: input.email,
    name: input.name,
    role: input.role,
  });

  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("plan access rules", () => {
  test.beforeAll(async () => {
    await ensureUserWithPlan({
      email: "free@dance.local",
      name: "Free Student",
      role: "STUDENT",
      plan: "FREE",
    });
    await ensureUserWithPlan({
      email: "pack@dance.local",
      name: "Style Pack Student",
      role: "STUDENT",
      plan: "STYLE_PACK",
      styleSlug: "house",
    });
    await ensureUserWithPlan({
      email: "pro@dance.local",
      name: "Pro Student",
      role: "STUDENT",
      plan: "PRO",
    });
  });

  test("anonymous paid CTA sends to login first", async ({ page }) => {
    await page.goto("/pricing");
    const proCta = page.getByRole("link", { name: "Ir Pro" });
    await expect(proCta).toHaveAttribute("href", /\/auth\/login\?next=%2Fcheckout%3Fplan%3Dpro/);
  });

  test("anonymous user cannot enter checkout directly", async ({ page }) => {
    await page.goto("/checkout?plan=pro");
    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });

  test("anonymous user cannot open course player", async ({ page }) => {
    await page.goto("/learn/hip-hop-foundations");
    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });

  test("free account is redirected to checkout on premium course", async ({ page }) => {
    await setSession(page, {
      email: "free@dance.local",
      name: "Free Student",
      role: "STUDENT",
    });
    await page.goto("/learn/hip-hop-foundations");
    await expect(page).toHaveURL(/\/checkout\?plan=style-pack/);
  });

  test("style-pack account can open own style but blocks others", async ({ page }) => {
    await setSession(page, {
      email: "pack@dance.local",
      name: "Style Pack Student",
      role: "STUDENT",
    });

    await page.goto("/learn/house-foundations");
    await expect(page).toHaveURL(/\/learn\/house-foundations/);

    await page.goto("/learn/hip-hop-foundations");
    await expect(page).toHaveURL(/\/checkout\?plan=style-pack/);
  });

  test("pro account can open premium courses", async ({ page }) => {
    await setSession(page, {
      email: "pro@dance.local",
      name: "Pro Student",
      role: "STUDENT",
    });

    await page.goto("/learn/hip-hop-foundations");
    await expect(page).toHaveURL(/\/learn\/hip-hop-foundations/);
  });
});

