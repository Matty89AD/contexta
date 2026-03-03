# Epic 2: Challenge flow & persistence

Guide users to submit a product or leadership challenge with minimal friction, set expectations on time-to-value, show progress, and maintain session-level persistence so they can return to recommendations without re-entering.

## Scope

- **Challenge_Prompter**: Guided prompts/examples; structured input options; clear guidance on useful challenge description.
- **Challenge_Validator**: Immediate confirmation on submit; visual feedback; error handling; minimum quality criteria.
- **Expectation_Messenger**: Effort-to-value messaging (e.g. "Get personalized content recommendations in ~3 minutes").
- **Progress_Indicator**: Visible across all steps (e.g. "Step 2 of 3").
- **Navigation_Controller / session**: Allow navigating back to recommendation overview; preserve challenge and context for the session.

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 10 | Guided Challenge Prompting |
| 11 | Challenge Submission Validation |
| 12 | Effort-to-Value Expectation Setting |
| 13 | Progress Indication |
| 22 | Persistent Recommendation Context (Session-Level) |

## Key acceptance criteria (summary)

- Challenge_Prompter shows guided prompts or examples; supports submission without long free text; explains what makes a useful challenge; minimizes cognitive load.
- On submit, Challenge_Validator gives immediate confirmation and clear visual feedback; on failure, clear error message and resolution guidance; only accepts challenges that meet minimum quality criteria.
- Expectation_Messenger shows explicit timing before/around challenge submission (e.g. ~3 minutes to value) and realistic effort expectations.
- Progress_Indicator shows current step and total steps consistently across the flow.
- Within the same session, user can navigate back to the recommendation overview; previously recommended items remain visible; challenge and context data are preserved for consistency.

## Out of scope for this epic

- Structured Challenge_Schema extraction and validation (Epic 3).
- Matching and recommendation generation (Epics 3–4).
- Recommendation UI and activation CTAs (Epic 5).

## Dependencies

- Epic 1 (context data available when user reaches challenge step).

## Notes

- Session persistence is client-side (React state / localStorage) until user signs up; then Supabase Auth.
- Challenge input feeds into a reduced Challenge schema (raw_input, structured_summary, primary_domain, problem_statement, desired_outcome + context from Epic 1). See Epic 3.
