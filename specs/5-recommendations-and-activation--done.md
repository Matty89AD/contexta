# Epic 5: Recommendations & activation

> **Status:** ✅ done  |  **As of:** 2026-03-02

Generate and present a prioritized, explainable content recommendation overview (3–5 items, one "most relevant") and provide clear activation CTAs (select, save, open) with tracking for product success measurement.

## Scope

- **Content_Recommender**: Use matching engine output; produce 3–5 recommendations with one marked "most relevant"; short explanation per item; no deep content or multiple strategies. No framework steps or thought leaders in MVP view.
- **Recommendation structure**: Clear titles/descriptions; relevance explanations; structured for immediate understanding.
- **Activation_Prompter**: "Open" CTA only per item (MVP); confirm when user opens. Select/save deferred.
- **Explainability**: Primary matching reason, context fit indicators where applicable (archetype name and blocker alignment when archetype layer is added later).
- **Tracking**: Server/console logging with consistent event shape (e.g. recommendation_opened, activation_completed) for future analytics integration.

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 14 | Content Recommendation Generation |
| 15 | Content Recommendation Structure |
| 16 | Recommendation Activation Call-to-Action |
| 17 | Activation Event Tracking |
| 21 | Enhanced Content Recommendation with Domain Knowledge |
| 32 | Explainable Recommendation Output |
| 33 | Archetype Evolution Logging |

## Key acceptance criteria (summary)

- When a challenge is submitted, Content_Recommender produces a prioritized overview immediately; 3–5 items; one clearly marked "most relevant"; short explanation per item describing why it helps; no additional user input or waiting; exclude deep content, full summaries, and multiple strategies from the overview.
- Each recommendation has clear title and description and is structured for immediate understanding; focus on relevance explanations, not long summaries.
- Content_Recommender uses structured filter + semantic matching only in MVP (no archetype classification yet); recommendations remain context-aware via schema and similarity.
- When recommendations are displayed, Activation_Prompter shows an "Open" CTA per item; confirm when user opens. Select and save are out of scope for MVP.
- Explainability: each recommendation includes primary matching reason (structured fit / semantic); context fit indicators where available. Archetype name and blocker alignment when archetype layer is added later.
- Log to server/console: recommendation_opened, activation_completed (and any other events with a consistent event shape) for future analytics integration. No full analytics pipeline in MVP.

## Out of scope for this epic

- Matching logic (Epic 4).
- Schema and knowledge definition (Epic 3).

## Dependencies

- Epic 2 (challenge submitted, session context).
- Epic 4 (matching engine output).

## Notes

- MVP: 3–5 content items + explanations only; no framework steps or thought leaders (per q-and-a).
- Activation: "Open" only; select/save in follow-up.
- Analytics: server/console logging with consistent event shape only.
