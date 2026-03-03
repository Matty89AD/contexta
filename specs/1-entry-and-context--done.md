# Epic 1: Entry, access & context collection

> **Status:** ✅ done  |  **As of:** 2026-03-02

Enable first-time users to enter the product without mandatory signup, see a clear first action, and complete context (role, company stage, team size, experience level) with a button to proceed to the challenge step.

## Scope

- **Access_Controller**: Entry without mandatory signup; defer signup until after user sees recommendations (prompt to sign up to save/return later).
- **Entry_Interface**: Landing with one primary CTA.
- **Context_Collector**: Role, company stage, team size, and experience level selection; validation; session persistence (client-side state until sign-up).
- **Navigation_Controller**: User clicks a button to proceed to challenge input when context is complete (no automatic transition).
- **Progress_Indicator**: Step indicators (e.g. "Step 1 of 3").
- **Analytics**: Server/console logging with consistent event shape (context_step_started, role_selected, stage_selected, context_completed, challenge_input_transition).

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 1 | Immediate Product Entry |
| 2 | Clear First Action Definition |
| 3 | Role Selection |
| 4 | Startup Stage Selection |
| 5 | Context Completion Validation |
| 6 | Rapid Completion Design |
| 7 | Automatic Navigation |
| 8 | Context Data Persistence |
| 9 | Analytics Integration (context-step events) |

## Key acceptance criteria (summary)

- Users can start the core flow without signup; no email verification before first interaction.
- Entry shows one primary CTA (e.g. "Start with your challenge") leading into context collection.
- Role_Selector: five options — Founder, CPO / Director of Product, Head of Product, Sr. / Product Manager, Associate / Aspiring PM; single selection; clear visual state.
- Stage_Selector: Pre-Seed / Seed, Series A-B, Growth (Series C+), Enterprise, Corporate; single selection; clear visual state.
- Team size and experience level selectors (enums per q-and-a: team_size 1-5, 6-15, 16-50, 51+; experience_level junior, mid, senior, lead). Single selection each; all four (role, stage, team size, experience) required to enable the "Continue" button.
- When all four are selected, a "Continue" (or equivalent) button is enabled; user must click it to go to the challenge step (no auto-transition).
- Context step is completable in ~30 seconds; minimal cognitive load.
- Context data is stored in client-side state (React state / localStorage) for the session; returning to the step shows previous selections; cleared when session ends or when user signs up (then persisted per auth).
- Log: context_step_started, role_selected, stage_selected, context_completed, challenge_input_transition.

## Out of scope for this epic

- Challenge input and validation (Epic 2).
- Challenge/Content schemas and matching (Epics 3–4).
- Recommendation display and activation (Epic 5).

## Dependencies

- None (first epic in flow).

## Notes

- Role and company_stage display labels and internal enum values are defined in `requirements/q-and-a.md`. Use stable slugs (e.g. `founder`, `cpo_director`, `preseed_seed`, `series_a_b`) for storage and API.
- Session persistence is client-side until sign-up; no Supabase anonymous auth for MVP.
