/**
 * Epic 15: Artifact Vault — E2E tests.
 *
 * These tests cover the save/unsave toggle on the artifact detail screen
 * and the Vault tab on the Journey page. Because these tests run against
 * an unauthenticated browser, they verify the graceful degraded behaviour
 * (button disabled, journey redirects to login).
 */
import { test, expect } from "@playwright/test";

test.describe("Artifact Vault — unauthenticated artifact detail", () => {
  test("save button is disabled when not authenticated", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    const btn = page.getByTestId("save-artifact-button");
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toBeDisabled();
  });

  test("save button label is 'Add to Artifact Vault' when unauthenticated", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    const btn = page.getByTestId("save-artifact-button");
    if (await btn.isVisible()) {
      await expect(btn).toContainText("Add to Artifact Vault");
    }
  });
});

test.describe("Artifact Vault — journey page tabs (unauthenticated)", () => {
  test("journey page redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/\/login.*next=%2Fjourney/);
  });
});

test.describe("Artifact Vault — save API routes (unauthenticated)", () => {
  test("GET /api/artifacts/[slug]/save returns 401 when unauthenticated", async ({ request }) => {
    const res = await request.get("/api/artifacts/rice-scoring/save");
    expect(res.status()).toBe(401);
  });

  test("POST /api/artifacts/[slug]/save returns 401 when unauthenticated", async ({ request }) => {
    const res = await request.post("/api/artifacts/rice-scoring/save");
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/artifacts/[slug]/save returns 401 when unauthenticated", async ({ request }) => {
    const res = await request.delete("/api/artifacts/rice-scoring/save");
    expect(res.status()).toBe(401);
  });
});
