import { test, expect } from "@playwright/test";

/** Check that an unauthenticated request to an admin route gets a redirect to /. */
async function expectAdminRedirect(
  request: Parameters<Parameters<typeof test>[2]>[0]["request"],
  path: string
) {
  const res = await request.get(path, { maxRedirects: 0 });
  // Middleware redirects: 307 (temporary redirect), location = "/"
  expect([302, 307]).toContain(res.status());
  const location = res.headers()["location"] ?? "";
  // Location may be relative "/" or absolute "http://localhost:3000/"
  expect(location === "/" || location.endsWith(":3000/")).toBe(true);
}

test.describe("Admin routes — unauthenticated access", () => {
  test("/admin redirects unauthenticated users to /", async ({ request }) => {
    await expectAdminRedirect(request, "/admin");
  });

  test("/admin/content redirects unauthenticated users to /", async ({ request }) => {
    await expectAdminRedirect(request, "/admin/content");
  });

  test("/admin/news redirects unauthenticated users to /", async ({ request }) => {
    await expectAdminRedirect(request, "/admin/news");
  });

  test("/admin/sources redirects unauthenticated users to /", async ({ request }) => {
    await expectAdminRedirect(request, "/admin/sources");
  });
});

test.describe("Admin API routes — unauthenticated access", () => {
  test("GET /api/admin/stats returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/content returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/content");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/news returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/news");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/transcript-jobs returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/transcript-jobs");
    expect(res.status()).toBe(401);
  });

  test("POST /api/admin/transcript-jobs returns 401", async ({ request }) => {
    const res = await request.post("/api/admin/transcript-jobs", {
      data: { url: "https://example.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/transcript-jobs/nonexistent returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/transcript-jobs/some-id");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/rss-feed returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/rss-feed?url=https://example.com/feed");
    expect(res.status()).toBe(401);
  });
});

test.describe("Public journey/news endpoint", () => {
  test("GET /api/journey/news returns 200 with an array", async ({ request }) => {
    const res = await request.get("/api/journey/news");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
