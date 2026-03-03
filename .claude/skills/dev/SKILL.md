---
name: dev
description: Implements an epic or feature end-to-end: reads the spec, explores the codebase, implements all touchpoints, writes unit tests, runs lint/build/E2E, verifies in the browser, fixes bugs, then commits. Invoke with the spec file or epic name as the argument.
argument-hint: <spec-file-or-epic>
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite
---

# /dev — End-to-end epic implementation

Implement `$ARGUMENTS` from spec to passing tests and a clean commit.

## Phase 1 — Understand

1. **Read the spec**
   - Open the spec file (e.g. `specs/$ARGUMENTS.md` or the path given).
   - Note **Scope**, **Requirements** table, **Key acceptance criteria**, **Out of scope**, and **Dependencies**.

2. **Explore all touchpoints**
   Use an `Explore` subagent to find every file that needs changing. Always look at:
   - DB schema and migrations → `supabase/migrations/`
   - Types → `lib/db/types.ts`
   - Repositories → `repositories/*.ts`
   - Services → `services/*.ts`
   - API routes → `app/api/*/route.ts`
   - UI components → `components/flow/*.tsx`, `app/**/*.tsx`
   - Core prompts and schemas → `core/prompts/*.ts`
   - Config → `core/config.ts`
   - Ingest scripts → `scripts/*.ts`, `services/ingest.ts`
   - Existing tests → `__tests__/**`, `e2e/**`

3. **Read every file you plan to touch** before writing a single line.

## Phase 2 — Plan

4. **Create a todo list** (TodoWrite) covering every file change and test to write.

5. **Resolve dependencies** — ensure earlier epics' behavior exists before building on top.

6. **Use fixed enums only** — roles, company_stage, team_size, experience_level, domain values come from `requirements/q-and-a.md`. Never invent new enum values.

## Phase 3 — Implement

Work through the todo list in dependency order. For each change:

- **DB migration** — create a new numbered SQL file in `supabase/migrations/`. Include backfill UPDATEs for existing data. Use `IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for safety.
- **Types** (`lib/db/types.ts`) — update interfaces to match the new schema. Keep backward-compat fields if rows may already exist.
- **Repositories** — update insert/select to include new fields. Keep old columns in writes for backward compat.
- **Services** — update business logic, Zod schemas, and function signatures. New behavior belongs in services, not routes.
- **API routes** — update only the request/response type if the service signature changed. No business logic in routes.
- **UI components** — update state, handlers, and JSX. Keep styling consistent with the existing pattern.
- **Prompts** (`core/prompts/`) — update or extend prompt-builder functions. Accept arrays where the spec requires multi-value input.
- **Scripts / ingest** — update CLI arg parsing and downstream interfaces.

**Architecture rules (non-negotiable):**
- Routes call one service method and return. No logic.
- AI calls go through `AIProvider` in `core/ai/`; never import provider SDKs directly in services.
- All prompts and Zod output schemas live in `core/prompts/`.
- Validate at the service boundary (or route boundary) with Zod.
- Use `ValidationError`, `NotFoundError`, `AIProviderError` — map to HTTP status in routes.

## Phase 4 — Test

### Unit tests (Vitest)

Write unit tests in `__tests__/*.test.ts` for every meaningful change to pure logic:

- Exported pure functions (e.g. scoring helpers, schema validators).
- Service schemas — test valid inputs, edge cases, and invalid inputs with `safeParse`.
- Ranking / filtering logic — mock the DB/repo layer (`vi.mock`), assert output ordering and field values.

Run:
```bash
npm test
```
All unit tests must pass before proceeding.

### Lint and build

```bash
npm run lint && npm run build
```
TypeScript must compile cleanly. Pre-existing build failures that are unrelated to the epic can be noted but should not block the commit.

### E2E tests (Playwright)

Add or update `e2e/*.spec.ts` to cover the new behavior:
- New UI interactions (e.g. multi-select, new fields).
- Navigation and state transitions if changed.
- Regression coverage for changed components.

Start the dev server (if not running) and run:
```bash
npm run test:e2e
```

## Phase 5 — Browser verification

Run Playwright headed on the new/changed spec file to visually confirm the UI works:
```bash
npx playwright test --headed --project=chromium e2e/<new-spec>.spec.ts
```
Fix any failures or visual regressions before committing.

## Phase 6 — Commit

When **all unit tests pass**, **lint/build is clean**, and **all E2E tests pass**:

```bash
git add <all relevant files>
git commit -F - << 'EOF'
feat(<epic-slug>): <short description>

<body: what changed, why, and key decisions>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

Stage only epic-related files. Do not stage `.env`, build artifacts, or unrelated changes.

## Checklist before committing

- [ ] All spec acceptance criteria satisfied; nothing from "Out of scope" included.
- [ ] DB migration created with backfill; no data loss for existing rows.
- [ ] Types updated; backward-compat fields retained where needed.
- [ ] No business logic in route handlers.
- [ ] New prompts/schemas live in `core/prompts/`; Zod used for validation.
- [ ] Unit tests added for new logic; all pass (`npm test`).
- [ ] `npm run lint` passes with no warnings.
- [ ] `npm run test:e2e` — all E2E tests pass across browsers.
- [ ] Browser verification done (headed Playwright); no visual bugs.
- [ ] Commit staged with only epic-related files; message references the epic.

## Reference locations

| Need | Location |
|------|----------|
| Specs | `specs/1-entry-and-context.md` … `specs/7-hybrid-rag.md` |
| Enums & decisions | `requirements/q-and-a.md` |
| Full product spec | `requirements/spec.md` |
| Architecture | `CLAUDE.md` |
| Unit tests | `__tests__/*.test.ts` |
| E2E tests | `e2e/*.spec.ts` |
| Unit test runner config | `vitest.config.ts` |
