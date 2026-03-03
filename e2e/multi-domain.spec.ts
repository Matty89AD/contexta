import { test, expect } from "@playwright/test";

test.describe("Multi-domain challenge step (Epic 6)", () => {
  async function goToChallengeStep(page: import("@playwright/test").Page) {
    await page.goto("/flow");
    await page.getByRole("button", { name: "Founder" }).click();
    await page.getByRole("button", { name: "Pre-Seed / Seed" }).click();
    await page.getByRole("button", { name: "1-5" }).click();
    await page.getByRole("button", { name: "Junior" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
  }

  test("shows multi-select domain label", async ({ page }) => {
    await goToChallengeStep(page);
    await expect(page.getByText(/Domain\(s\)/)).toBeVisible();
    await expect(page.getByText(/select one or more/)).toBeVisible();
  });

  test("multiple domains can be selected simultaneously", async ({ page }) => {
    await goToChallengeStep(page);

    // Select two domains
    await page.getByRole("button", { name: "Strategy" }).click();
    await page.getByRole("button", { name: "Leadership" }).click();

    await expect(page.getByRole("button", { name: "Strategy" })).toHaveClass(/bg-zinc-900/);
    await expect(page.getByRole("button", { name: "Leadership" })).toHaveClass(/bg-zinc-900/);
  });

  test("clicking an active domain deselects it", async ({ page }) => {
    await goToChallengeStep(page);

    await page.getByRole("button", { name: "Strategy" }).click();
    await expect(page.getByRole("button", { name: "Strategy" })).toHaveClass(/bg-zinc-900/);

    // Click again to deselect
    await page.getByRole("button", { name: "Strategy" }).click();
    await expect(page.getByRole("button", { name: "Strategy" })).not.toHaveClass(/bg-zinc-900/);
  });

  test("submit is disabled with no domain selected", async ({ page }) => {
    await goToChallengeStep(page);
    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We cannot prioritize our backlog and stakeholders keep changing priorities."
    );
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeDisabled();
  });

  test("submit is enabled after selecting at least one domain and filling description", async ({
    page,
  }) => {
    await goToChallengeStep(page);
    await page.getByPlaceholder(/e\.g\. We have too many ideas/).fill(
      "We cannot prioritize our backlog and stakeholders keep changing priorities."
    );
    await page.getByRole("button", { name: "Discovery" }).click();
    await expect(page.getByRole("button", { name: "Get recommendations" })).toBeEnabled();
  });
});
