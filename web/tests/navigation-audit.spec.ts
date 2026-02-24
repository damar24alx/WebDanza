import { expect, Page, test } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE_NAME } from "../src/server/auth/token";
import { db } from "../src/lib/db";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "playwright-auth-secret";
}

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL?.trim() || "http://localhost:4173";
const sessionUserIdCache = new Map<string, string>();

const publicAuditPages = [
  "/",
  "/search?q=house",
  "/styles",
  "/styles/house",
  "/moves",
  "/moves/the-shuffle",
  "/learn",
  "/learn/hip-hop-foundations",
  "/maps",
  "/maps/lineage",
  "/maps/steps",
  "/pricing",
  "/certificates/verify/DA-HOUSE-2026-91C2",
];

const studentAuditPages = [
  "/me",
  "/me/achievements",
  "/me/certificates",
];

const adminAuditPages = [
  "/admin",
  "/admin/review?item=the-shuffle",
  "/admin/styles",
  "/admin/styles/hip-hop",
  "/admin/substyles",
  "/admin/substyles/boogaloo",
  "/admin/kpis",
  "/admin/certificates",
];

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
    throw new Error(`Missing user for navigation smoke session: ${email}`);
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

function normalizeHref(rawHref: string) {
  const href = rawHref.trim();
  if (!href.startsWith("/")) {
    return null;
  }
  if (href.startsWith("/api/") || href.startsWith("/_next/")) {
    return null;
  }
  if (href === "/#") {
    return "/";
  }

  const hashIndex = href.indexOf("#");
  if (hashIndex >= 0) {
    return href.slice(0, hashIndex) || "/";
  }

  return href;
}

async function collectInternalLinks(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
        anchors
          .map((anchor) => anchor.getAttribute("href") ?? "")
          .filter((href) => href.length > 0),
      );

      const normalized = hrefs
        .map((href) => normalizeHref(href))
        .filter((href): href is string => Boolean(href));

      return Array.from(new Set(normalized)).sort();
    } catch (error) {
      if (error instanceof Error && /Execution context was destroyed/i.test(error.message)) {
        await page.waitForTimeout(150);
        continue;
      }
      throw error;
    }
  }

  return [];
}

async function assertPathResolves(page: Page, fromPath: string, targetPath: string) {
  const response = await page.request.get(targetPath);
  expect(
    response.status(),
    `Navigation path broken: from "${fromPath}" to "${targetPath}"`,
  ).toBeLessThan(400);
}

test.describe("navigation audit", () => {
  test("navbar primary links map to expected destinations", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header").first();
    const expectedLinks = [
      { label: "Inicio", href: "/" },
      { label: "Buscar", href: "/search" },
      { label: "Estilos", href: "/styles" },
      { label: "Movimientos", href: "/moves" },
      { label: "Aprender", href: "/learn" },
      { label: "Mapas", href: "/maps" },
      { label: "Precios", href: "/pricing" },
      { label: "Ingresar", href: "/auth/login" },
    ];

    for (const item of expectedLinks) {
      const link = header.getByRole("link", { name: item.label, exact: true });
      await expect(link).toHaveAttribute("href", item.href);
    }
  });

  test("public pages expose only resolvable internal links", async ({ page }) => {
    for (const path of publicAuditPages) {
      const response = await page.goto(path);
      expect(response?.ok(), `Public page did not load: ${path}`).toBeTruthy();

      const links = await collectInternalLinks(page);
      for (const link of links) {
        await assertPathResolves(page, path, link);
      }
    }
  });

  test("student pages expose only resolvable internal links", async ({ page }) => {
    await setSession(page, {
      email: "luna@dance.local",
      name: "Luna Rivera",
      role: "STUDENT",
    });

    for (const path of studentAuditPages) {
      const response = await page.goto(path);
      expect(response?.ok(), `Student page did not load: ${path}`).toBeTruthy();

      const links = await collectInternalLinks(page);
      for (const link of links) {
        await assertPathResolves(page, path, link);
      }
    }
  });

  test("admin pages expose only resolvable internal links", async ({ page }) => {
    await setSession(page, {
      email: "admin@dance.local",
      name: "Dance Admin",
      role: "ADMIN",
    });

    for (const path of adminAuditPages) {
      const response = await page.goto(path);
      expect(response?.ok(), `Admin page did not load: ${path}`).toBeTruthy();

      const links = await collectInternalLinks(page);
      for (const link of links) {
        await assertPathResolves(page, path, link);
      }
    }
  });
});
