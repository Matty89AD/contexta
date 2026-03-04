import { test, expect } from "@playwright/test";

test.describe("Flow page", () => {
  test("shows context step on load", async ({ page }) => {
    await page.goto("/flow");
    await expect(page.getByRole("heading", { name: "Your context" })).toBeVisible();
    await expect(page.getByText("Role", { exact: true }).first()).toBeVisible();
  });

  test("enables Continue only when all four context fields are selected", async ({
    page,
  }) => {
    await page.goto("/flow");
    const continueBtn = page.getByRole("button", { name: "Continue" });
    await expect(continueBtn).toBeDisabled();

    await page.getByRole("button", { name: "Founder" }).click();
    await expect(continueBtn).toBeDisabled();
    await page.getByRole("button", { name: "Pre-Seed / Seed" }).click();
    await expect(continueBtn).toBeDisabled();
    await page.getByRole("button", { name: "1-5" }).click();
    await expect(continueBtn).toBeDisabled();
    await page.getByRole("button", { name: "Junior" }).click();
    await expect(continueBtn).toBeEnabled();
  });

  test("navigates to challenge step on Continue and shows expectation messaging", async ({
    page,
  }) => {
    await page.goto("/flow");
    await page.getByRole("button", { name: "Founder" }).click();
    await page.getByRole("button", { name: "Pre-Seed / Seed" }).click();
    await page.getByRole("button", { name: "1-5" }).click();
    await page.getByRole("button", { name: "Junior" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();
    await expect(
      page.getByText(/Get personalized content recommendations in ~3 minutes/)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back to context" })
    ).toBeVisible();
  });

  test("back from challenge step returns to context step", async ({
    page,
  }) => {
    await page.goto("/flow");
    await page.getByRole("button", { name: "Founder" }).click();
    await page.getByRole("button", { name: "Pre-Seed / Seed" }).click();
    await page.getByRole("button", { name: "1-5" }).click();
    await page.getByRole("button", { name: "Junior" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();

    await page.getByRole("button", { name: "Back to context" }).click();
    await expect(page.getByRole("heading", { name: "Your context" })).toBeVisible();
  });
});
