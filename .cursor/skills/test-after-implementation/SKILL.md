---
name: test-after-implementation
description: Runs and updates tests after implementing features or epics. Use when the user asks to test results, verify implementation, run e2e, add or update Playwright tests, or validate after implementing specs/epics.
---

# Test After Implementation

## When to use

- After implementing an epic or a feature from `specs/`.
- User asks to test the app, run e2e, or verify that changes work.
- Adding or updating tests to cover new behavior.

## Workflow

1. **Run E2E tests**  
   From project root:
   ```bash
   npm run test:e2e
   ```
   For interactive debugging:
   ```bash
   npm run test:e2e:ui
   ```
   E2E tests live in `e2e/*.spec.ts` (Playwright).

2. **Add or update E2E tests for new behavior**  
   - Mirror the flow in the spec: entry → context step → challenge step → results (as applicable).
   - Prefer role-based selectors: `getByRole('button', { name: '...' })`, `getByRole('heading')`, `getByLabelText()`.
   - Cover: visible CTAs, navigation (e.g. `/` → `/flow`), form completion (context/challenge), and key outcomes (e.g. recommendations visible).
   - Keep tests in `e2e/`; one or more `*.spec.ts` files by feature or page (e.g. `home.spec.ts`, `flow.spec.ts`).

3. **Run lint and build**  
   ```bash
   npm run lint
   npm run build
   ```
   Fix any lint or build errors before considering the task done.

4. **Optional: seed and smoke checks**  
   If the change touches content or embeddings:
   - `npm run seed` (if seed script exists and is appropriate).
   - Hit health or main API routes if needed (e.g. `app/api/health/route.ts`).

## Test layout

- **e2e/** — Playwright specs; run with `npm run test:e2e`.
- **playwright.config.ts** — Playwright config (baseURL, etc.); use when adding new projects or env.

## Checklist

- [ ] `npm run test:e2e` passes (or new tests added and passing).
- [ ] `npm run lint` passes.
- [ ] `npm run build` succeeds.
- [ ] New behavior from the epic/spec is covered by at least one meaningful E2E (or unit) test where applicable.
