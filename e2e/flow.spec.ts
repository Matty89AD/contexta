import { test, expect } from "@playwright/test";

async function fillContext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Founder" }).click();
  await page.getByRole("combobox").selectOption("preseed_seed");
  await page.getByRole("button", { name: "1-5" }).click();
  await page.getByRole("button", { name: "Junior" }).click();
}

test.describe("Flow page", () => {
  test("shows context step on load", async ({ page }) => {
    await page.goto("/flow");
    await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
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
    await page.getByRole("combobox").selectOption("preseed_seed");
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
    await fillContext(page);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();
    await expect(
      page.getByText(/What is currently blocking you or your team/)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back to context" })
    ).toBeVisible();
  });

  test("back from challenge step returns to context step", async ({
    page,
  }) => {
    await page.goto("/flow");
    await fillContext(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Describe your challenge" })).toBeVisible();

    await page.getByRole("button", { name: "Back to context" }).click();
    await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
  });
});
