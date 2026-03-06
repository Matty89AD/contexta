import { test, expect } from "@playwright/test";

test.describe("Auth — login page", () => {
  test("shows Sign up and Log in tabs", async ({ page }) => {
    await page.goto("/login");
    // Two tab buttons live inside the tab switcher div; use first() to target the tab.
    await expect(page.getByRole("button", { name: "Sign up" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" }).first()).toBeVisible();
  });

  test("defaults to log in tab", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("defaults to sign up tab when ?tab=signup", async ({ page }) => {
    await page.goto("/login?tab=signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("shows email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
  });

  test("shows Continue with Google button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  });

  test("switches to sign up tab on click", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign up" }).first().click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });
});

test.describe("Auth — Nav", () => {
  test("shows Login link in nav when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});

test.describe("Auth — protected routes", () => {
  test("/journey redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/profile redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login redirect includes ?next param", async ({ page }) => {
    await page.goto("/journey");
    await expect(page).toHaveURL(/next=%2Fjourney/);
  });
});
