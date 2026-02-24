import { expect, Page, test } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/server/auth/token";
import { db } from "../src/lib/db";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "playwright-auth-secret";
}

const publicRoutes = [
  "/",
  "/search?q=house",
  "/styles",
  "/moves",
  "/learn",
  "/maps",
  "/pricing",
  "/auth/login",
  "/maps/lineage",
  "/maps/steps",
];

const adminRoutes = [
  "/admin",
  "/admin/kpis",
  "/admin/certificates",
  "/admin/review?item=the-shuffle",
  "/admin/styles",
  "/admin/styles/hip-hop",
  "/admin/substyles",
  "/admin/substyles/boogaloo",
];

const validSlugRoutes = ["/styles/house", "/moves/the-shuffle"];
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL?.trim() || "http://localhost:4173";
const sessionUserIdCache = new Map<string, string>();

async function getUserIdByEmail(email: string) {
  const cached = sessionUserIdCache.get(email);
  if (cached) {
    return cached;
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (!user?.id) {
    throw new Error(`Missing user for smoke session: ${email}`);
  }

  sessionUserIdCache.set(email, user.id);
  return user.id;
}

async function setSession(
  page: Page,
  input: { email: string; name: string; role: "ADMIN" | "STUDENT" },
) {
  const userId = await getUserIdByEmail(input.email);
  const token = await createSessionToken({
    id: userId,
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

async function gotoStable(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(path);
    } catch (error) {
      if (error instanceof Error && /ERR_ABORTED/i.test(error.message)) {
        await page.waitForTimeout(150);
        continue;
      }
      throw error;
    }
  }

  return null;
}

for (const route of publicRoutes) {
  test(`smoke public route: ${route}`, async ({ page }) => {
    const response = await gotoStable(page, route);
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

test("smoke home hero keeps visible title", async ({ page }) => {
  const response = await gotoStable(page, "/");
  expect(response).not.toBeNull();
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /aprende danza con una ruta clara/i })).toBeVisible();
});

for (const route of validSlugRoutes) {
  test(`smoke slug route: ${route}`, async ({ page }) => {
    const response = await gotoStable(page, route);
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

test("smoke lineage timeline updates map era without reload", async ({ page }) => {
  const response = await gotoStable(page, "/maps/lineage");
  expect(response).not.toBeNull();
  expect(response?.ok()).toBeTruthy();

  const yearLabel = page.getByTestId("lineage-current-year");
  const slider = page.getByTestId("lineage-timeline-slider");

  await expect(yearLabel).toContainText("1973");

  await slider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );
    descriptor?.set?.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, 1978);
  await expect(yearLabel).toContainText("1978");

  await slider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );
    descriptor?.set?.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, 1975);
  await expect(yearLabel).toContainText("1975");
});

test("smoke protected route redirects anonymous user to login", async ({ page }) => {
  await gotoStable(page, "/admin");
  await expect(page).toHaveURL(/\/auth\/login/);

  await gotoStable(page, "/me/achievements");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("smoke student cannot access /admin", async ({ page }) => {
  await setSession(page, {
    email: "luna@dance.local",
    name: "Luna Rivera",
    role: "STUDENT",
  });
  await gotoStable(page, "/admin");
  await expect(page).toHaveURL(/\/me\?error=admin_only/);
});

test("smoke student routes after login", async ({ page }) => {
  await setSession(page, {
    email: "luna@dance.local",
    name: "Luna Rivera",
    role: "STUDENT",
  });

  await gotoStable(page, "/me");
  await expect(page).toHaveURL(/\/me$/);

  await gotoStable(page, "/me/achievements");
  await expect(page).toHaveURL(/\/me\/achievements$/);
});

for (const route of adminRoutes) {
  test(`smoke admin route with session: ${route}`, async ({ page }) => {
    await setSession(page, {
      email: "admin@dance.local",
      name: "Admin",
      role: "ADMIN",
    });
    const response = await gotoStable(page, route);
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

test("smoke not-found route: /__nope__", async ({ page }) => {
  const response = await gotoStable(page, "/__nope__");
  expect(response).not.toBeNull();
  expect([200, 404]).toContain(response?.status() ?? 0);
  await expect(page.getByRole("heading", { name: /off beat|fuera de ritmo/i })).toBeVisible();
});
