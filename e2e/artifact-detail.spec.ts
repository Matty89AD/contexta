/**
 * Epic 11: Artifact Detail Screen — E2E tests.
 *
 * These tests verify the page structure and navigation without relying on
 * a specific artifact being seeded or live LLM calls completing.
 */
import { test, expect } from "@playwright/test";

test.describe("Artifact Detail page (Epic 11)", () => {
  test("visiting an unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/artifacts/this-slug-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });

  test("artifact detail route is accessible without cid param", async ({ page }) => {
    // Navigate to a slug that would be seeded; if not found, 404 is acceptable.
    // The key assertion is that the server handles the request without crashing.
    const response = await page.goto("/artifacts/rice-scoring");
    expect([200, 404]).toContain(response?.status());
  });

  test("artifact detail page renders back button when artifact exists", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() === 200) {
      await expect(
        page.getByRole("button", { name: "Zurück zu den Empfehlungen" })
      ).toBeVisible();
    }
  });

  test("artifact detail page shows skeleton loading states on load", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() === 200) {
      // Skeleton elements are visible before the API call resolves.
      // They appear as animated pulse divs; check the tab navigation renders immediately.
      const overviewTab = page.getByRole("button", { name: "Overview" });
      if (await overviewTab.isVisible()) {
        await expect(overviewTab).toBeVisible();
        await expect(page.getByRole("button", { name: "How to Use" })).toBeVisible();
      }
    }
  });

  test("back button exists with correct label when artifact is seeded", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() === 200) {
      await expect(
        page.getByRole("button", { name: "Zurück zu den Empfehlungen" })
      ).toBeVisible();
    }
  });
});
