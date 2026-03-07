/**
 * Tests for the context confirmation UX:
 *  Path 1 — Logged-in user with stored context sees confirm view, not full form
 *  Path 2 — Re-run flow: context confirm step first, then challenge step with
 *            prefilled content + Cancel re-run exit option
 */
import { test, expect, type Page } from "@playwright/test";

// --- Constants ---
const CONTEXT_KEY = "contexta_flow_context";
const STORED_CONTEXT = {
  role: "founder",
  company_stage: "preseed_seed",
  team_size: "1-5",
  experience_level: "junior",
};
const RERUN_ID = "00000000-0000-0000-0000-000000000099";

// Supabase browser client stores the session as a cookie named:
//   sb-{projectRef}-auth-token
// where projectRef = hostname.split(".")[0] of NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_COOKIE_NAME = "sb-kduwrojqahfihbtcmkwv-auth-token";

// --- Helpers ---

/** Build a fake Supabase session cookie value (base64url-encoded JSON). */
function buildFakeSessionCookieValue(): string {
  const session = {
    access_token: "test-access-token",
    token_type: "bearer",
    expires_in: 36000,
    expires_at: Math.floor(Date.now() / 1000) + 36000,
    refresh_token: "test-refresh-token",
    user: {
      id: "test-user-id",
      email: "test@example.com",
      aud: "authenticated",
      role: "authenticated",
    },
  };
  // @supabase/ssr 0.5.x stores cookie values as "base64-<base64url(json)>"
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `base64-${encoded}`;
}

/**
 * Simulate a logged-in user by:
 *  1. Injecting the Supabase session cookie (so getSession() returns a valid session)
 *  2. Mocking /auth/v1/user (so getUser() returns a fake user object)
 */
async function mockLoggedIn(page: Page) {
  await page.context().addCookies([
    {
      name: SUPABASE_COOKIE_NAME,
      value: buildFakeSessionCookieValue(),
      url: "http://localhost:3000",
    },
  ]);
  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-user-id",
        email: "test@example.com",
        aud: "authenticated",
        role: "authenticated",
      }),
    })
  );
}

/** Pre-populate the flow context in localStorage before any page JS runs. */
async function seedContext(page: Page) {
  await page.addInitScript(
    ({ key, ctx }) => localStorage.setItem(key, JSON.stringify(ctx)),
    { key: CONTEXT_KEY, ctx: STORED_CONTEXT }
  );
}

/** Mock the re-run challenge resume endpoint. */
async function mockRerunResume(page: Page) {
  await page.route(`**/api/challenges/${RERUN_ID}/resume`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        raw_description: "We cannot prioritize our backlog effectively.",
        domains: ["strategy"],
      }),
    })
  );
}

// =============================================================================
// Path 1 — New challenge, logged-in user with stored context
// =============================================================================
test.describe("Context confirmation — new challenge (logged-in + stored context)", () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page);
    await seedContext(page);
    await page.goto("/flow");
  });

  test("shows confirmation view instead of full form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByRole("heading", { name: "Tell us about yourself" })
    ).not.toBeVisible();
  });

  test("summary card shows stored context labels", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });
    // Role and experience labels should appear in the summary card
    await expect(page.getByText("Founder")).toBeVisible();
    await expect(page.getByText("Junior")).toBeVisible();
  });

  test('"Yes, looks good" advances to challenge step', async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Yes, looks good" }).click();

    await expect(
      page.getByRole("heading", { name: "Describe your challenge" })
    ).toBeVisible();
  });

  test('"Update my context" reveals full form with pre-filled values', async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Update my context" }).click();

    await expect(
      page.getByRole("heading", { name: "Tell us about yourself" })
    ).toBeVisible();
    // Stored role (Founder) should be pre-selected
    await expect(page.getByRole("button", { name: "Founder" })).toHaveClass(
      /bg-indigo-600/
    );
  });

  test('"Back" from edit form returns to confirm view', async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Update my context" }).click();
    await expect(
      page.getByRole("heading", { name: "Tell us about yourself" })
    ).toBeVisible();

    await page.getByRole("button", { name: /Back/ }).click();

    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible();
  });

  test("no Cancel re-run button on non-rerun challenge step", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "Yes, looks good" }).click();

    await expect(
      page.getByRole("heading", { name: "Describe your challenge" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel re-run" })
    ).not.toBeVisible();
  });
});

// =============================================================================
// Path 2 — Re-run flow (logged-in user with stored context)
// =============================================================================
test.describe("Re-run flow — context confirmation + exit option", () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page);
    await seedContext(page);
    await mockRerunResume(page);
    await page.goto(`/flow?rerun=${RERUN_ID}`);
  });

  test("shows context confirmation step (not challenge step) on rerun", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Describe your challenge" })
    ).not.toBeVisible();
  });

  test("after confirming context, shows challenge with prefilled description", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Yes, looks good" }).click();

    await expect(
      page.getByRole("heading", { name: "Describe your challenge" })
    ).toBeVisible();
    await expect(
      page.getByPlaceholder(/e\.g\. We have too many ideas/)
    ).toHaveValue("We cannot prioritize our backlog effectively.");
  });

  test("Cancel re-run button navigates to the saved challenge page", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Is your context still up to date?" })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Yes, looks good" }).click();
    await expect(
      page.getByRole("heading", { name: "Describe your challenge" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel re-run" }).click();

    await expect(page).toHaveURL(new RegExp(`/challenges/${RERUN_ID}`), {
      timeout: 5000,
    });
  });
});
