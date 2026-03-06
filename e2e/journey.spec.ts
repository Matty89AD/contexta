import { test, expect } from "@playwright/test";

test.describe("Journey page — unauthenticated", () => {
  test("redirects to /login with ?next=/journey", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/\/login.*next=%2Fjourney/);
  });
});

test.describe("Flow page — resume param", () => {
  test("falls back to context step when resume challenge is not found", async ({ page }) => {
    await page.goto("/flow?resume=00000000-0000-0000-0000-000000000000");
    // The resume fetch returns 401 (unauthenticated), so we fall back to context step.
    await expect(
      page.getByRole("heading", { name: "Tell us about yourself" })
    ).toBeVisible({ timeout: 8000 });
  });
});
