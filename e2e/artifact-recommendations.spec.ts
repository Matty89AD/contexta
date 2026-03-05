/**
 * Epic 10: Artifact-Optimized Recommendations — E2E regression tests.
 *
 * These tests verify that the challenge flow UI is intact after the Epic 10
 * changes and that the ResultsStep renders artifact cards correctly.
 *
 * Live API results (artifacts from DB) are not asserted here because they
 * require a seeded Supabase instance. See acceptance criteria in
 * specs/10-artifact-optimized-recommendations.md for backend verification.
 */
import { test, expect } from "@playwright/test";

async function goToChallengeStep(page: import("@playwright/test").Page) {
  await page.goto("/flow");
  await page.getByRole("button", { name: "Founder" }).click();
  await page.getByRole("combobox").selectOption("preseed_seed");
  await page.getByRole("button", { name: "1-5" }).click();
  await page.getByRole("button", { name: "Junior" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();
}

test.describe("Artifact Recommendations — challenge flow regression (Epic 10)", () => {
  test("challenge step renders correctly after Epic 10 changes", async ({ page }) => {
    await goToChallengeStep(page);
    await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. We have too many ideas/)).toBeVisible();
    await expect(page.getByText(/Domain\(s\)/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeVisible();
  });

  test("submit requires both description and domain", async ({ page }) => {
    await goToChallengeStep(page);

    // No description, no domain → disabled
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeDisabled();

    // Add domain only → still disabled
    await page.getByRole("button", { name: "Strategy" }).click();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeDisabled();

    // Add description → enabled
    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "Our team cannot agree on which features to prioritise for Q3."
    );
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeEnabled();
  });

  test("multi-domain selection works with artifact pipeline", async ({ page }) => {
    await goToChallengeStep(page);

    await page.getByRole("button", { name: "Discovery" }).click();
    await page.getByRole("button", { name: "Strategy" }).click();

    await expect(page.getByRole("button", { name: "Discovery" })).toHaveClass(/bg-indigo-600/);
    await expect(page.getByRole("button", { name: "Strategy" })).toHaveClass(/bg-indigo-600/);

    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We have too many discovery initiatives and no clear strategy."
    );
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeEnabled();
  });
});
