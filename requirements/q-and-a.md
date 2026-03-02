# Contexta MVP — Q&A and Decisions

Summary of planning decisions and spec for the MVP implementation.

---

## Decisions

| Topic             | Decision                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| Profile fields    | Fixed enums (role, company stage, team size, experience level)          |
| Content           | Pre-seeded via script/migration; you or we define sample content        |
| Auth              | Email + password and OAuth (e.g. Google)                                |
| Recommendations   | Short summary + framework steps + content links                         |
| Thought leaders   | Prefer content metadata (author/speaker); LLM can suggest more           |
| Top content count | Configurable only via env (e.g. `TOP_K`)                                |
| Requirements docs | Separate: `requirements/spec.md` (your doc) + `requirements/q-and-a.md`  |
| Access flow       | Enter without signup → context + challenge → recommendations → then prompt sign-up |
| Session (pre-auth) | Client-side state (React state / localStorage) until sign-up           |
| Context step      | Role, company stage, team size, experience (four fields); button to continue (no auto-transition) |
| Matching MVP      | Structured filter + semantic similarity only; archetype boosting later  |
| Recommendations MVP | 3–5 items + explanations; no framework steps or thought leaders      |
| Activation MVP    | "Open" only                                                             |
| Analytics MVP     | Server/console logging with consistent event shape                     |

---

## Profile enums

Use these fixed values in the app and database (Postgres enums or check constraints).

- **role**: `founder` | `cpo_director` | `head_of_product` | `sr_pm` | `associate_pm`  
  (Display labels: Founder, CPO / Director of Product, Head of Product, Sr. / Product Manager, Associate / Aspiring PM)
- **company_stage**: `preseed_seed` | `series_a_b` | `growth_series_c_plus` | `enterprise` | `corporate`  
  (Display labels: Pre-Seed / Seed, Series A-B, Growth (Series C+), Enterprise, Corporate)
- **team_size**: `1-5` | `6-15` | `16-50` | `51+`
- **experience_level**: `junior` | `mid` | `senior` | `lead`

---

## Challenge domain enums

- **domain**: `strategy` | `discovery` | `delivery` | `growth` | `leadership`
- **subdomain**: optional free text or extend with more enums later

---

## MVP core flow (activation)

1. User enters without signup → completes context (role, stage, team size, experience) → submits challenge → sees recommendations. Sign-up is prompted after first value (to save/return later).
2. Context step collects: role, company stage, team size, experience level. User clicks a button to proceed to challenge (no auto-transition).
3. User submits a challenge (raw description, domain, optional subdomain, impact & reach).
4. System: structured filter + semantic similarity (archetype boosting deferred); generates summary, embedding, vector search, top chunks, 3–5 recommendations with explanations.
5. User sees: challenge summary, 3–5 content items (one "most relevant") with short explanations. No framework steps or thought leaders in MVP. Activation: "Open" only.
6. Session: client-side state (React state / localStorage) until user signs up; then Supabase Auth (email/password + Google).
7. Analytics: server/console logging with consistent event shape for future integration. Decision patterns ("When X → do Y") deferred. Challenge/Content schemas: reduced/minimal set for MVP. Archetypes: minimal set (5–7), expand later.

---

## Open questions (from spec.md review)

*Please answer below each question. Only append your answers; do not remove the questions.*

---

### Access and auth

**Q1.** The spec says "immediate access without mandatory signup" and "defer signup until after first meaningful action or activation." Should the MVP flow be: (a) user enters → does context + challenge → sees recommendations → then we prompt sign-up to save/return later, or (b) we still ask for sign-up before recommendations but keep the option to "try without account" with limited persistence? Which do you want for MVP?

**A1.** option a

**Q2.** For unauthenticated/session-only use, should we rely on Supabase anonymous auth, or keep everything in client-side state (e.g. React state / localStorage) until the user signs up?

**A2.** decide yourself

---

### Context collection (role, stage, team size, experience)

**Q3.** The spec’s Role_Selector offers **PM, Founder, Other** (Req 3). The existing q-and-a had **pm, apm, cpo, other**. Should we align on the spec’s three options (PM, Founder, Other) for MVP?

**A3.** please use the following: founder, CPO / Director of Product, Head of Product, Sr. / Product Manager, Associate / Aspiring PM

**Q4.** The spec’s Glossary has Company_Stage as **idea | seed | series_a | growth | enterprise**. The existing q-and-a had **early | growth | scale**. Which set do we use for the Stage_Selector in MVP?

**A4.** use: Pre-Seed / Seed, Series A-B, Growth (Series C+), Enterprise, Corporate

**Q5.** Req 3 and 4 only mention role and startup stage. The full Challenge_Schema (Req 23) also needs experience_level, team_size, org_complexity. For MVP, do we (a) collect only role + stage in the context step (and infer or default the rest), or (b) add team size and experience level to the context step as in the original plan?

**A5.** go with b

---

### Progress and navigation

**Q6.** Progress is "Step 2 of 3". Confirm the three steps are: (1) Context (role + stage), (2) Challenge input, (3) Recommendations?

**A6.** correct

**Q7.** Req 7 says when both role and stage are selected, we "automatically transition" to the challenge step (no extra button). Should we auto-advance immediately on the second selection, or use a short delay?

**A7.** use a button and the user has to click it, no automatic transition

---

### Challenge and content schemas (MVP scope)

**Q8.** The spec defines a full Challenge_Schema (taxonomy, context, problem pattern, constraint layers). For MVP, do we (a) implement full LLM-based extraction into this schema, or (b) start with a reduced set (e.g. raw_input, structured_summary, primary_domain, problem_statement, desired_outcome, plus context from the context step) and extend later?

**A8.** decide yourself

**Q9.** Similarly, Content_Schema has many fields (taxonomy, context_fit, maturity, authority, etc.). For MVP, do we (a) model and ingest the full schema, or (b) start with a minimal set (title, summary, key_takeaways, source_type, content_format, primary_domain, plus embedding-ready text) and add the rest later?

**A9.** decide yourself

---

### Matching architecture (MVP scope)

**Q10.** The spec requires a three-layer matching engine (structured filter → semantic similarity → archetype boosting). For MVP, do we (a) implement all three layers, (b) ship semantic similarity only and add structured filter + archetype in a follow-up, or (c) ship structured filter + semantic similarity and add archetype boosting later?

**A10.** i think c

**Q11.** How many problem archetypes do we need for MVP? Spec mentions 12–15 (Req 25) and 15–20 (Req 18). Should we define a minimal set (e.g. 5–7) for launch and expand later?

**A11.** yes, minimal and expand later

---

### Recommendations and activation

**Q12.** The spec asks for 3–5 items with one marked "most relevant" and a short explanation per item. Should we also keep the original plan’s "framework steps" (3–5 actionable steps) and "suggested thought leaders" in the same view, or are the 3–5 content items plus explanations sufficient for MVP?

**A12.** keep th steps and thought leaders out for now

**Q13.** Activation CTAs: select, save, open (Req 16). For MVP, which do we implement? (e.g. "Open" only, or "Open" + "Save" with saved list, or all three?)

**A13.** open only 

---

### Knowledge curation and decision patterns

**Q14.** Req 20 describes normalizing content into "When X → do Y (unless Z)" decision patterns. Is that in scope for MVP (e.g. we store and use patterns for recommendations), or do we defer it and rely on semantic similarity + structured metadata only for MVP?

**A14.** defer it

---

### Analytics and logging

**Q15.** The spec defines many events (context_step_started, role_selected, stage_selected, context_completed, challenge_input_transition, recommendation_selected, etc.). For MVP, do we (a) implement a full analytics pipeline (e.g. send to a third-party), (b) only log to server/console with a consistent event shape for future integration, or (c) skip event logging for MVP?

**A15.** b

---

## Resolved decisions (from Q&A above)

| # | Topic | Decision |
|---|--------|----------|
| Q1 | Access flow | Option (a): enter → context + challenge → recommendations → then prompt sign-up to save/return later. |
| Q2 | Unauthenticated state | Client-side state (React state / localStorage) until sign-up. |
| Q3 | Role options | Founder, CPO / Director of Product, Head of Product, Sr. / Product Manager, Associate / Aspiring PM. |
| Q4 | Company stage options | Pre-Seed / Seed, Series A-B, Growth (Series C+), Enterprise, Corporate. |
| Q5 | Context step fields | Collect role, stage, team size, and experience level (all four). |
| Q6 | Three steps | Confirmed: (1) Context, (2) Challenge input, (3) Recommendations. |
| Q7 | Transition to challenge | User must click a button to proceed; no automatic transition. |
| Q8 | Challenge schema MVP | Reduced set (raw_input, structured_summary, primary_domain, problem_statement, desired_outcome + context from step). |
| Q9 | Content schema MVP | Minimal set (title, summary, key_takeaways, source_type, content_format, primary_domain + embedding text). |
| Q10 | Matching layers MVP | Structured filter + semantic similarity only; add archetype boosting later. |
| Q11 | Archetypes count | Minimal set (5–7) for launch; expand later. |
| Q12 | Framework steps & thought leaders | Omit for MVP; 3–5 content items + explanations only. |
| Q13 | Activation CTAs | "Open" only for MVP. |
| Q14 | Decision patterns | Defer "When X → do Y (unless Z)" to post-MVP. |
| Q15 | Analytics | Server/console logging with consistent event shape for future integration. |
