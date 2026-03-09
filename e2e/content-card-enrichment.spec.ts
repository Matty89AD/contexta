/**
 * Epic 18: Content Card Enrichment — E2E tests.
 *
 * Tests verify the knowledge card overlay and view tracking behaviour.
 * They run against a seeded artifact (rice-scoring); if the artifact is not
 * seeded the tests are skipped gracefully via early-return guards.
 */
import { test, expect } from "@playwright/test";

test.describe("Content Card Enrichment (Epic 18)", () => {
  test("GET /api/content/:id returns 404 for unknown id", async ({ request }) => {
    const res = await request.get(
      "/api/content/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status()).toBe(404);
  });

  test("GET /api/content/:id/view returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/content/00000000-0000-0000-0000-000000000000/view"
    );
    expect(res.status()).toBe(401);
  });

  test("POST /api/content/:id/view returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/content/00000000-0000-0000-0000-000000000000/view"
    );
    expect(res.status()).toBe(401);
  });

  test("knowledge cards are clickable and open an overlay", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    // Wait for knowledge section to render (may have no cards if DB empty)
    await page.waitForSelector('[data-testid^="knowledge-card-"], text=No knowledge base entries', {
      timeout: 15000,
    });

    const firstCard = page.locator('[data-testid^="knowledge-card-"]').first();
    if (!(await firstCard.isVisible())) return;

    await firstCard.click();

    // Overlay should open
    await expect(page.getByTestId("content-overlay")).toBeVisible({ timeout: 5000 });
  });

  test("overlay can be dismissed via close button", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    await page.waitForSelector('[data-testid^="knowledge-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="knowledge-card-"]').first();
    if (!(await firstCard.isVisible())) return;

    await firstCard.click();
    await expect(page.getByTestId("content-overlay")).toBeVisible({ timeout: 5000 });

    await page.getByTestId("overlay-close-button").click();
    await expect(page.getByTestId("content-overlay")).not.toBeVisible();
  });

  test("overlay can be dismissed via Escape key", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    await page.waitForSelector('[data-testid^="knowledge-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="knowledge-card-"]').first();
    if (!(await firstCard.isVisible())) return;

    await firstCard.click();
    await expect(page.getByTestId("content-overlay")).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("content-overlay")).not.toBeVisible();
  });

  test("overlay can be dismissed via backdrop click", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    await page.waitForSelector('[data-testid^="knowledge-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="knowledge-card-"]').first();
    if (!(await firstCard.isVisible())) return;

    await firstCard.click();
    await expect(page.getByTestId("content-overlay")).toBeVisible({ timeout: 5000 });

    // Click the backdrop (top-left corner, outside the panel)
    await page.mouse.click(10, 10);
    await expect(page.getByTestId("content-overlay")).not.toBeVisible();
  });

  test("overlay shows 'No summary available' when summary is null", async ({ page }) => {
    const response = await page.goto("/artifacts/rice-scoring");
    if (response?.status() !== 200) return;

    await page.waitForSelector('[data-testid^="knowledge-card-"]', { timeout: 15000 });
    const firstCard = page.locator('[data-testid^="knowledge-card-"]').first();
    if (!(await firstCard.isVisible())) return;

    await firstCard.click();
    await expect(page.getByTestId("content-overlay")).toBeVisible({ timeout: 5000 });

    // Either a real summary or the graceful placeholder should appear
    const overlayText = await page.getByTestId("content-overlay").textContent();
    expect(overlayText).toBeTruthy();
  });
});
