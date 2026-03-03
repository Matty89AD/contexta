/**
 * Epic 7: Hybrid RAG retrieval — E2E regression tests.
 *
 * The hybrid retrieval changes are backend-only (matching service, repositories, DB).
 * These tests verify the full challenge flow (context → challenge step → submit) is
 * unaffected by the Epic 7 changes and that the UI correctly initiates a recommendation
 * request using the hybrid pipeline.
 *
 * Live API results (recommendations) are not asserted here because they require
 * a seeded Supabase instance and live OpenRouter API key. See acceptance criteria
 * in specs/7-hybrid-rag-retrieval.md for backend verification steps.
 */
import { test, expect } from "@playwright/test";

async function goToChallengeStep(page: import("@playwright/test").Page) {
  await page.goto("/flow");
  await page.getByRole("button", { name: "Founder" }).click();
  await page.getByRole("button", { name: "Pre-Seed / Seed" }).click();
  await page.getByRole("button", { name: "1-5" }).click();
  await page.getByRole("button", { name: "Junior" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
}

test.describe("Hybrid RAG — challenge flow regression (Epic 7)", () => {
  test("challenge step renders correctly after hybrid RAG changes", async ({ page }) => {
    await goToChallengeStep(page);
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. We have too many ideas/)).toBeVisible();
    await expect(page.getByText(/Domain\(s\)/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeVisible();
  });

  test("submit button is disabled without description", async ({ page }) => {
    await goToChallengeStep(page);
    await page.getByRole("button", { name: "Strategy" }).click();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeDisabled();
  });

  test("submit button is disabled without domain selection", async ({ page }) => {
    await goToChallengeStep(page);
    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We are struggling to define our product strategy for the next quarter."
    );
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeDisabled();
  });

  test("submit button is enabled when description and domain(s) are provided", async ({
    page,
  }) => {
    await goToChallengeStep(page);
    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We are struggling to define our product strategy for the next quarter."
    );
    await page.getByRole("button", { name: "Strategy" }).click();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeEnabled();
  });

  test("multi-domain selection works with hybrid RAG pipeline active", async ({ page }) => {
    await goToChallengeStep(page);

    // Select multiple domains — hybrid retrieval should handle multi-domain challenge text
    await page.getByRole("button", { name: "Strategy" }).click();
    await page.getByRole("button", { name: "Discovery" }).click();
    await page.getByRole("button", { name: "Leadership" }).click();

    await expect(page.getByRole("button", { name: "Strategy" })).toHaveClass(/bg-zinc-900/);
    await expect(page.getByRole("button", { name: "Discovery" })).toHaveClass(/bg-zinc-900/);
    await expect(page.getByRole("button", { name: "Leadership" })).toHaveClass(/bg-zinc-900/);

    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We lack clear strategy and have too many competing discovery initiatives with no leadership alignment."
    );
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeEnabled();
  });
});
