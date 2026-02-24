import { expect, Page, test } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/server/auth/token";
import { db } from "../src/lib/db";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "playwright-auth-secret";
}

type AuditRoute = {
  path: string;
  auth?: "admin" | "student";
};

const routes: AuditRoute[] = [
  { path: "/" },
  { path: "/styles" },
  { path: "/moves" },
  { path: "/learn" },
  { path: "/pricing" },
  { path: "/maps/lineage" },
  { path: "/me/achievements", auth: "student" },
  { path: "/admin", auth: "admin" },
  { path: "/admin/review?item=the-shuffle", auth: "admin" },
  { path: "/admin/styles", auth: "admin" },
  { path: "/admin/substyles", auth: "admin" },
];

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
] as const;
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
    throw new Error(`Missing user for design audit session: ${email}`);
  }

  sessionUserIdCache.set(email, user.id);
  return user.id;
}

async function ensureAuth(page: Page, auth?: "admin" | "student") {
  if (!auth) {
    return;
  }

  const sessionTemplate =
    auth === "admin"
      ? {
          email: "admin@dance.local",
          name: "Admin",
          role: "ADMIN" as const,
        }
      : {
          id: "00000000-0000-0000-0000-000000000002",
          email: "luna@dance.local",
          name: "Luna",
          role: "STUDENT" as const,
        };

  const session = {
    ...sessionTemplate,
    id: await getUserIdByEmail(sessionTemplate.email),
  };

  const token = await createSessionToken(session);
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

async function detectHorizontalOverflow(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.evaluate(() => {
        const doc = document.documentElement;
        if (!doc) {
          return false;
        }
        const body = document.body;
        const maxWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
        return maxWidth > doc.clientWidth + 1;
      });
    } catch (error) {
      if (error instanceof Error && /Execution context was destroyed/i.test(error.message)) {
        await page.waitForLoadState("networkidle");
        continue;
      }
      throw error;
    }
  }

  return false;
}

for (const viewport of viewports) {
  for (const route of routes) {
    test(`design audit ${viewport.label}: ${route.path}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });

      await ensureAuth(page, route.auth);

      const response = await page.goto(route.path);
      expect(response).not.toBeNull();
      expect(response?.ok()).toBeTruthy();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle");
      const hasOverflow = await detectHorizontalOverflow(page);

      expect(hasOverflow, `Horizontal overflow detected on ${route.path} (${viewport.label}).`).toBe(false);
      expect(consoleErrors, `Console errors detected on ${route.path} (${viewport.label}).`).toEqual([]);
    });
  }
}
