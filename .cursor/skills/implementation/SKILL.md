---
name: implementation
description: Implements epics from specs/ following architecture rules and acceptance criteria. Use when implementing or extending features from specs (e.g. Epic 1–5), when the user refers to epics or spec files, or when building flow/API/core features aligned with the product spec.
---

# Implementation (Epics from Specs)

## When to use

- User asks to implement an epic, a spec, or a feature described in `specs/`.
- Implementing or extending the flow, APIs, or core logic to match product requirements.

## Workflow

1. **Identify the epic**  
   Read the relevant spec in `specs/` (e.g. `1-entry-and-context.md`, `2-challenge-flow.md`). Note **Scope**, **Requirements** table, **Key acceptance criteria**, **Out of scope**, and **Dependencies**.

2. **Resolve dependencies**  
   If the epic depends on another (e.g. Epic 2 depends on Epic 1), ensure that epic's behavior exists before adding new work.

3. **Use fixed enums and schemas**  
   For context, profile, and challenge fields use the enums and slugs from `requirements/q-and-a.md` (role, company_stage, team_size, experience_level, domain). Do not invent new values.

4. **Respect architecture**  
   Follow `.cursor/rules/contexta-mvp.mdc`:
   - **Routes**: `app/api/*` — parse request, call one service method, return response; no business logic in handlers.
   - **AI**: Use `AIProvider` in `core/ai/` only; no direct OpenAI (or other provider) in services/repos/domain.
   - **Data**: Repositories for users, challenges, content, embeddings; services use repos + AI provider.
   - **Prompts**: All templates and structured-output schemas in `core/prompts/`; no inline prompt strings in services.
   - **Validation**: Zod for request bodies and structured LLM output; validate in service or at route boundary.
   - **Errors**: Use structured types (e.g. ValidationError, NotFoundError, AIProviderError); map to HTTP status in routes.

5. **Map to code**  
   - **UI/flow**: `app/flow/page.tsx`, `components/flow/*` (ContextStep, ChallengeStep, ResultsStep).
   - **API**: `app/api/*/route.ts`; services and repos in `core/` or adjacent modules.
   - **Session**: Client-side state (React state / localStorage) until sign-up; no anonymous Supabase auth for MVP.

6. **Implement against acceptance criteria**  
   Treat "Key acceptance criteria" as the checklist. Implement each bullet; do not add scope from "Out of scope" for that epic.

7. **Create and run unit tests**  
   Always add or extend unit tests for new or changed logic (services, utilities, core behavior). Run the unit test suite and ensure all tests pass.

8. **Verify in browser with Playwright**  
   Run E2E tests with Playwright (`npm run test:e2e` or `npm run test:e2e:ui`). Manually or via E2E, verify the implemented flow and behavior in the browser. Add or update E2E tests as needed for the epic.

9. **Fix bugs**  
   If unit tests or Playwright (E2E/browser) verification fail, fix the bugs and re-run tests. Repeat until all tests pass and behavior is correct.

10. **Analytics (when in scope)**  
    Use a consistent event shape and server/console logging (e.g. context_step_started, role_selected, context_completed, challenge_input_transition). Do not add product analytics beyond what the spec allows for MVP.

11. **Commit when done**  
    When there are no more bugs and all tests pass, commit all changes (implementation, unit tests, E2E updates) with a clear message referencing the epic or spec.

## Reference locations

| Need | Location |
|------|----------|
| Epic breakdown | `specs/1-entry-and-context.md` … `specs/5-recommendations-and-activation.md` |
| Enums, access flow, MVP decisions | `requirements/q-and-a.md` |
| Full product requirements | `requirements/spec.md` |
| Architecture | `.cursor/rules/contexta-mvp.mdc` |
| E2E tests | `e2e/*.spec.ts` |

## Checklist before done

- [ ] All in-scope requirements and acceptance criteria for the epic are satisfied.
- [ ] No business logic in route handlers; routes only call services.
- [ ] Enums and slugs match `q-and-a.md`.
- [ ] New prompts/schemas live in `core/prompts/`; validation uses Zod.
- [ ] Unit tests added/updated and passing.
- [ ] Playwright E2E / browser verification done; any failures fixed.
- [ ] No remaining bugs; all tests pass.
- [ ] All changes committed with a clear message.
