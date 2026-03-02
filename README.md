# Contexta

AI-powered product management knowledge system. Describe a real challenge and get structured, context-aware recommendations from curated content (frameworks, articles, podcasts).

## Tech stack

- **Next.js** (App Router), TypeScript, Tailwind CSS
- **Supabase**: Postgres, Auth, pgvector for embeddings
- **OpenRouter**: text generation and embeddings via OpenAI-compatible API (swappable AI provider interface)
- **Zod** for validation

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from your [Supabase](https://supabase.com) project
   - `OPENROUTER_API_KEY` — get one at [OpenRouter](https://openrouter.ai)
   - `TOP_K` (e.g. `5`) — number of content chunks to retrieve per challenge

3. **Database**

   Apply migrations (Supabase Dashboard SQL editor or CLI):

   ```bash
   supabase db push
   ```

   Or run the SQL in `supabase/migrations/20250302000001_initial_schema.sql` manually.

4. **Seed content (optional)**

   Populate sample content and embeddings:

   ```bash
   npm run seed
   ```

   Requires `OPENROUTER_API_KEY` and Supabase keys. Uses OpenRouter’s `openai/text-embedding-3-small` (1536 dimensions).

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use “Start with your challenge” to run the flow: context → challenge → recommendations.

## Project layout

- `app/` — Routes (page.tsx, flow, login, api)
- `components/` — UI (flow steps: context, challenge, results)
- `core/` — AI provider interface, prompts, config, errors, logger
- `lib/` — Supabase client, DB types, constants
- `repositories/` — Data access (users, challenges, content, embeddings)
- `services/` — Business logic (auth, profile, challenge pipeline, ingest)
- `specs/` — Epic-level specs; `requirements/` — Product spec and Q&A

## Architecture

- **Route handlers** (`app/api/*`) are thin: parse request, call one service, return response.
- **Business logic** lives in `services/` and uses the **AI provider interface** (`core/ai/types.ts`); no direct provider SDK in domain code.
- **Data** is accessed via **repositories**; services receive Supabase client and (where needed) AI provider.
- **Prompts** are in `core/prompts/`.
- **TOP_K** is required in env (no default in code).

## Auth

Supabase Auth is wired for email/password and OAuth (e.g. Google). Configure providers in the Supabase dashboard. The flow works without sign-up; users are prompted to create an account after seeing recommendations. Profile is created/updated via `POST /api/profile` when the user is authenticated.

## License

Private / your choice.
