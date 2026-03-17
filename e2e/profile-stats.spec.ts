/**
 * Profile Stats dashboard — E2E tests.
 *
 * Covers the "viewed content count" widget on the profile page and the
 * backing API route. Tests run against an unauthenticated browser, so they
 * verify graceful degraded behaviour (401 responses, auth redirect).
 */
import { test, expect } from "@playwright/test";

test.describe("Profile Stats — API route (unauthenticated)", () => {
  test("GET /api/profile/stats returns 401 when unauthenticated", async ({
    request,
  }) => {
    const res = await request.get("/api/profile/stats");
    expect(res.status()).toBe(401);
  });

  test("GET /api/profile/stats response body contains error key on 401", async ({
    request,
  }) => {
    const res = await request.get("/api/profile/stats");
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});

test.describe("Profile Stats — profile page (unauthenticated)", () => {
  test("profile page redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login.*next=%2Fprofile/);
  });
});

const AUTH_FILE = "e2e/.auth/user.json";
const hasTestUser = !!process.env.E2E_TEST_EMAIL;

test.describe("Profile Stats — API route (authenticated)", () => {
  test.use({
    storageState: hasTestUser ? AUTH_FILE : { cookies: [], origins: [] },
  });

  test("GET /api/profile/stats returns viewedContentCount as a number", async ({
    page,
  }) => {
    test.skip(!hasTestUser, "Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars");

    const res = await page.request.get("/api/profile/stats");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body.viewedContentCount).toBe("number");
  });
});
