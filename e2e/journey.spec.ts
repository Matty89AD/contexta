import { test, expect } from "@playwright/test";

test.describe("Journey page — unauthenticated", () => {
  test("redirects to /login with ?next=/journey", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/\/login.*next=%2Fjourney/);
  });
});

test.describe("Flow page — rerun param", () => {
  test("falls back to context step when rerun challenge is not found", async ({ page }) => {
    await page.goto("/flow?rerun=00000000-0000-0000-0000-000000000000");
    // The rerun fetch returns 401 (unauthenticated), so we fall back to context step.
    await expect(
      page.getByRole("heading", { name: "Tell us about yourself" })
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Results page — missing session state", () => {
  test("redirects to /flow when no sessionStorage entry exists", async ({ page }) => {
    await page.goto("/results?cid=00000000-0000-0000-0000-000000000000");
    await expect(page).toHaveURL(/\/flow/, { timeout: 5000 });
  });
});
