# Epic 12: Profile, Login & Auth (MVP)

> **Status:** done  |  **As of:** 2026-03-06



Wire up real authentication using existing Supabase Auth infrastructure. Users complete a challenge without logging in, then see a "Save your recommendations" CTA. Clicking it opens the auth page with the Sign Up tab pre-selected. After signup the challenge is claimed to their account and they are redirected to `/journey`. Returning users log in via a Login link in the Nav. `/journey` and `/profile` are protected routes.

---

## Current state (what already exists)

- `profiles` table exists with `NOT NULL` constraints on `role`, `company_stage`, `team_size`, `experience_level`.
- `challenges.user_id` references `profiles(id)` (nullable — anon challenges have `user_id = null`).
- `challenges` are already saved to DB with `user_id = null` on every pipeline run. `challengeId` is returned from the pipeline.
- `app/api/auth/callback/route.ts` — OAuth callback handler (exchanges code, redirects to `next`).
- `app/api/profile/route.ts` — POST, creates/updates the PM context profile (role, stage, etc.).
- `services/auth.ts` — only `getCurrentUser()`.
- `lib/supabase/client.ts` + `lib/supabase/server.ts` — browser and server Supabase clients.
- `app/login/page.tsx` — stub placeholder only.
- `components/layout/Nav.tsx` — no Login button.
- `ResultsStep` — "Create account →" `<a href="/login">` (no `?tab` or `?cid`).

---

## Scope

- **Migration `20260306000001_auth_nullable_profile.sql`:** Make `role`, `company_stage`, `team_size`, `experience_level` nullable on `profiles`. This allows creating a bare profile row (id + email) on signup without PM context. PM context is filled in when the user next completes a challenge.
- **`app/login/page.tsx`:** Replace stub with a real client-side auth page. Two tabs: **Sign Up** / **Log In**, default tab controlled by `?tab=signup` or `?tab=login` query param. Accepts `?cid=[challengeId]` to know which challenge to claim after signup. After successful auth, redirects to `/journey`.
  - Sign Up form: email + password. On submit: `supabase.auth.signUp()` → `POST /api/profile` with context from localStorage → `PATCH /api/challenges/[cid]/claim` → redirect `/journey`.
  - Log In form: email + password. On submit: `supabase.auth.signInWithPassword()` → redirect `/journey`.
  - **Google OAuth button:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/api/auth/callback?next=/journey&cid=[cid]' } })`. Requires Google OAuth configured in Supabase dashboard. If not configured, Supabase returns an error which is shown inline.
- **`app/api/challenges/[id]/claim/route.ts`:** PATCH handler. Requires authenticated session (via `createClient()` + `getUser()`). Uses `getServiceRoleClient()` to update `challenges.user_id = auth.user.id` for the given challenge. Guards: challenge must exist; challenge `user_id` must be `null` or already equal to `auth.user.id` (idempotent).
- **`services/auth.ts`:** Extend with `claimChallenge(challengeId, userId, supabase)` — validates + updates via `repositories/challenges`.
- **`app/journey/page.tsx`:** Blank protected page. Shows a minimal heading ("Your Journey — coming soon"). Server component — uses `getCurrentUser()` server-side; if no user, redirects to `/login?next=/journey`.
- **`app/profile/page.tsx`:** Protected client page. Shows authenticated user's email and a change-password form (`supabase.auth.updateUser({ password })`). Redirects to `/login?next=/profile` if not authenticated.
- **`middleware.ts`:** Next.js middleware protecting `/journey` and `/profile`. Reads session from cookies via `@supabase/ssr`; redirects to `/login?next=[path]` if no valid session.
- **`components/layout/Nav.tsx`:** Add auth state awareness (client component with `useEffect` + `supabase.auth.onAuthStateChange`). Unauthenticated: show "Login" link. Authenticated: show user email abbreviation + "Logout" button (calls `supabase.auth.signOut()` → redirect `/`).
- **`components/flow/ResultsStep.tsx`:** Update "Create account →" href from `/login` to `/login?tab=signup&cid=${result.challengeId}`.
- **`app/api/auth/callback/route.ts`:** After exchanging the code, if `cid` is present in the `next` param, pass it through to the redirect URL so `/journey` can auto-claim.

---

## Requirements

| Req | Title |
|-----|-------|
| 64 | Migration: make profile PM-context fields nullable |
| 65 | `app/login/page.tsx` — Sign Up / Log In tabs + Google OAuth |
| 66 | Sign Up flow: create auth user → bare profile → claim challenge → redirect `/journey` |
| 67 | Log In flow: email + password → redirect `/journey` |
| 68 | `PATCH /api/challenges/[id]/claim` — assign challenge to authenticated user |
| 69 | `app/journey/page.tsx` — blank protected stub |
| 70 | `app/profile/page.tsx` — email display + change-password |
| 71 | `middleware.ts` — protect `/journey` and `/profile` |
| 72 | `Nav` — Login link (unauth) + email + Logout (auth) |
| 73 | `ResultsStep` — "Create account" CTA links to `/login?tab=signup&cid=[id]` |

---

## Key acceptance criteria

- User completes challenge without an account → "Save your recommendations" card → clicks "Create account →" → arrives at `/login?tab=signup&cid=[id]` with Sign Up tab pre-selected.
- After signup: auth user is created, bare `profiles` row exists, challenge `user_id` is set to the new user's ID, user lands on `/journey`.
- After login (existing user): email + password → lands on `/journey`.
- Google OAuth button is present; clicking it initiates OAuth flow and, on success, lands on `/journey`.
- `/journey` renders a blank page for authenticated users; unauthenticated users are redirected to `/login?next=/journey`.
- `/profile` renders email + change-password form for authenticated users; unauthenticated users are redirected to `/login?next=/profile`.
- Nav shows "Login" when unauthenticated; shows user email initial/abbreviation and a "Logout" button when authenticated.
- Challenge claim is idempotent: claiming the same challenge twice by the same user returns success without error.
- `npm run lint && npm run build && npm run test:e2e` pass.

---

## Migration: nullable profile fields

```sql
-- supabase/migrations/20260306000001_auth_nullable_profile.sql
alter table public.profiles
  alter column role drop not null,
  alter column company_stage drop not null,
  alter column team_size drop not null,
  alter column experience_level drop not null;
```

This does not break existing data. `POST /api/profile` still validates + sets all four fields when PM context is available. The bare profile created at signup has `null` for these — they are backfilled the next time the user completes a challenge flow.

---

## Challenge claim flow

```
Client (after signUp success):
  1. supabase.auth.getUser() → userId
  2. POST /api/profile  { role?, company_stage?, team_size?, experience_level? }
     → creates profiles row (nullable fields if no context)
  3. PATCH /api/challenges/[cid]/claim
     → service: challenges.user_id = userId  (service role client, bypasses RLS)
  4. router.push('/journey')
```

Profile context (from localStorage) is passed if available (user came from the flow). If the user signed up from the navbar directly without a challenge, step 3 is skipped and step 2 may omit the PM context fields.

---

## Google OAuth challenge claiming

`cid` is passed through the redirect chain:

```
/login?tab=signup&cid=[id]
  → signInWithOAuth redirectTo: /api/auth/callback?next=/journey&cid=[id]
  → callback redirects to: /journey?cid=[id]
  → /journey sees ?cid, user is authed → calls PATCH /api/challenges/[id]/claim
```

The `/journey` stub page should handle the `?cid` auto-claim on mount (client-side `useEffect`). Non-fatal if cid is missing or claim fails.

---

## Nav auth state

Nav becomes a client component. It subscribes to `supabase.auth.onAuthStateChange` to reactively update between logged-in and logged-out states without a full page reload.

Authenticated state shows:
- User email truncated to first segment before `@` (e.g. `matt@...` → `matt`)
- "Logout" button

Unauthenticated state shows:
- "Login" link → `/login`

---

## Out of scope

- Email verification flow (Supabase sends the email; no custom verification UI).
- Forgot password / password reset email (deferred).
- "Continue without account" explicit button — the existing flow already works without auth; users can just navigate away.
- Extended profile fields (role, company_stage, etc.) on the profile page — only email + change-password.
- Journey dashboard content — `/journey` is a blank stub.
- Social auth providers beyond Google.

---

## Dependencies

- Epics 1–11 complete.
- Supabase project with Auth enabled (email + Google OAuth configured in Supabase dashboard for Google OAuth to work).
- `NEXT_PUBLIC_SITE_URL` env var required for OAuth `redirectTo` in production.

---

## New env var

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # used for OAuth redirectTo
```
