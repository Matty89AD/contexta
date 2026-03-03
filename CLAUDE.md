# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run test:e2e      # Run Playwright E2E tests (headless)
npm run test:e2e:ui   # Run Playwright E2E tests (interactive UI)
npm run seed          # Seed sample content + embeddings into Supabase
npm run ingest-transcript  # Ingest knowledge base transcript
```

After implementing any feature, verify with `npm run lint && npm run build && npm run test:e2e` before considering the work done.

E2E tests live in `e2e/*.spec.ts`. There are no unit tests — Playwright is the only test layer.

## Architecture

### Layered dependency flow

```
app/api/*  →  services/  →  repositories/  →  Supabase
                ↓
           core/ai/ (via AIProvider interface)
           core/prompts/
```

- **Route handlers** (`app/api/*/route.ts`): parse request, call one service method, map errors to HTTP status. No business logic.
- **Services** (`services/`): orchestrate business logic. Depend on repositories and the `AIProvider` interface — never on a specific SDK.
- **Repositories** (`repositories/`): data access only. Separate repos for users/profiles, challenges, content, and embeddings. Receive a Supabase client.
- **AI provider** (`core/ai/`): `AIProvider` interface in `types.ts` exposes `generateText` and `generateEmbedding`. Implementations are `openrouter-provider.ts` and `openai-provider.ts`. Import the interface, not the implementation, in services.
- **Prompts** (`core/prompts/`): all LLM prompt templates and Zod structured-output schemas live here. No inline prompt strings in services.
- **Validation**: Zod at the service layer (or route boundary). Structured error types (ValidationError, NotFoundError, AIProviderError) are mapped to HTTP status in route handlers.

### UI flow (3 steps)

`/` → `/flow` → steps rendered in `components/flow/`:
1. **ContextStep** — collects role, company_stage, team_size, experience_level (button to proceed; no auto-transition)
2. **ChallengeStep** — free-text challenge + domain
3. **ResultsStep** — 3–5 matched recommendations with explanations, "Open" CTA only

Pre-auth state lives entirely in client-side React state / localStorage. Supabase Auth (email + Google) is prompted after the user sees recommendations.

### Enums (fixed — do not invent new values)

Defined in `requirements/q-and-a.md` and enforced in DB/Zod schemas:

- **role**: `founder` | `cpo_director` | `head_of_product` | `sr_pm` | `associate_pm`
- **company_stage**: `preseed_seed` | `series_a_b` | `growth_series_c_plus` | `enterprise` | `corporate`
- **team_size**: `1-5` | `6-15` | `16-50` | `51+`
- **experience_level**: `junior` | `mid` | `senior` | `lead`
- **domain**: `strategy` | `discovery` | `delivery` | `growth` | `leadership`

### Matching engine

Structured filter → semantic similarity (pgvector, `openai/text-embedding-3-small`, 1536 dims). Archetype boosting is deferred. `TOP_K` env var (required, no code default) controls how many chunks are retrieved.

### Specs and epics

Product epics are in `specs/` (numbered 1–7). When implementing a feature from a spec:
1. Read the relevant spec; note scope, acceptance criteria, and out-of-scope items.
2. Check dependencies (epic ordering).
3. Match enums/slugs to `requirements/q-and-a.md`.
4. Map UI to `components/flow/*`, APIs to `app/api/*/route.ts`, logic to `services/`, data to `repositories/`.

Analytics for MVP = server/console logging with a consistent event shape only. No third-party pipeline.
