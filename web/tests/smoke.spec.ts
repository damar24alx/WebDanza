import { expect, test } from "@playwright/test";

const staticRoutes = ["/", "/styles", "/moves", "/learn", "/pricing", "/auth/login"];
const validSlugRoutes = ["/styles/hip-hop", "/moves/the-shuffle"];

for (const route of staticRoutes) {
  test(`smoke static route: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

for (const route of validSlugRoutes) {
  test(`smoke slug route: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

test("smoke not-found route: /__nope__", async ({ page }) => {
  const response = await page.goto("/__nope__");
  expect(response).not.toBeNull();
  expect([200, 404]).toContain(response?.status() ?? 0);
  await expect(page.getByRole("heading", { name: /off beat/i })).toBeVisible();
});
