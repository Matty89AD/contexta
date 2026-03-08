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
| Q16 | Content Intelligence implementation | New `services/content-intelligence.ts` module called from the ingest pipeline (not a standalone microservice). |
| Q17 | Metadata extraction scope | LLM extracts general PRD fields only (topics, keywords, author, date, category, language, confidence). Audience-targeting fields (`target_roles`, `target_stages`, `target_experience_levels`) are out of scope for Epic 8. |
| Q18 | Metadata storage | Dedicated typed columns via migration (not jsonb); GIN indexes on array fields. |
| Q19 | Chunk-level metadata | In scope for Epic 8: `chunk_type` text and `key_concepts text[]` columns on `content_chunks`. |
| Q20 | Challenge dataset evaluation | Both automated scoring (precision@3/5) and manual review — but evals are Epic 9 (deferred). |
| Q21 | Challenge dataset epic | Separate Epic 9, after Epic 8 enriches the content. |

---

## Epic 8 — Content Intelligence Service (open questions)

*Please answer below each question. Only append your answers; do not remove the questions.*

---

### Implementation model

**Q16.** The PRD describes a standalone "Content Intelligence Service" with its own API. In our codebase, ingestion lives in `services/ingest.ts`. Should the Content Intelligence Service be:
(a) A new `services/content-intelligence.ts` module called during ingestion (fits existing architecture), or
(b) A future standalone microservice — meaning we only define the interface/schema now and defer the actual service?

a
**A16.**

---

### Metadata extraction: LLM vs. manual

**Q17.** The PRD implies LLM-automated extraction of fields like topics, keywords, author, and publication_date. For Contexta-specific audience fields (`target_roles`, `target_stages`, `target_experience_levels`), an LLM could make a guess but they'd need human review to be reliable. Should we:
(a) LLM extracts all fields (general + audience targeting) — curator reviews before publishing,
(b) LLM extracts only general fields (topics, keywords, author, date); audience targeting fields are manually specified at ingest time, or
(c) Audience targeting fields are out of scope for this epic entirely?

c

**A17.**

---

### Schema: jsonb vs. dedicated columns

**Q18.** New metadata fields can be stored two ways:
(a) Inside the existing `content.metadata` jsonb column — no migration needed, queryable but not indexed,
(b) As dedicated typed columns via a new migration — indexed, strongly typed, queryable with filters.
The PRD's goal of "metadata filtering / ranking" eventually needs (b) for high-use fields like `topics` and `target_roles`. Should we start with (a) and migrate later, or go straight to (b) for the fields we're confident about?

b
**A18.**

---

### Chunk-level metadata

**Q19.** My earlier proposal also suggested adding a `chunk_metadata` jsonb column to `content_chunks` with `chunk_type` (framework, example, principle, tool, warning) and `key_concepts` (string[]). This would improve retrieval precision by surfacing actionable chunks over intro material. Is chunk-level metadata in scope for this epic, or a later one?

in scope

**A19.**

---

### Challenge test dataset scope

**Q20.** You mentioned providing a `data/challenge_dataset.md`. For validating matching quality, should the evaluation be:
(a) Manual review — run challenges through the app, eyeball results,
(b) Automated script — loads the dataset, runs each challenge through the matching engine, compares ranked results to expected matches, outputs precision@3 / precision@5, or
(c) Both — automated script for repeatability, with the dataset also serving as manual reference?

c (later with evals)

**A20.**

---

### Challenge dataset and this epic

**Q21.** Should the challenge test dataset + evaluation harness be part of this same epic, or a separate Epic 9 that runs after Epic 8 enriches the content?

separate
**A21.**

---

## Epic 16 — Admin UI (open questions)

*Please answer below each question. Only append your answers; do not remove the questions.*

---

### Access and authentication

**Q22.** How should `/admin` be protected? Options:
- (a) Hard-coded email allowlist in an env var (e.g. `ADMIN_EMAILS=you@example.com`)
- (b) A boolean `is_admin` column on the `profiles` table
- (c) A Supabase role / RLS policy

**A22.**
b
---

### Content status workflow

**Q23.** The `content` table has no `status` field yet. I'd propose four states: `draft → pending_review → active → archived`. Does that match your intent? Any state to add, remove, or rename?

**A23.**
no, sounds good
---

### Transcript generation (MVP scope)

**Q24.** For MVP, should auto-transcript generation be in or out of scope? Options:
- (a) In scope — integrate an external API (e.g. summarize.sh or similar) to generate transcripts from a URL
- (b) Out of scope for MVP — admin pastes/uploads transcript text manually; auto-generation is a future epic

**A24.**
b
---

### "blog" as a content type

**Q25.** You mentioned "blog" as a content type, but the current `CONTENT_SOURCE_TYPES` enum is `podcast | video | website | book`. Should we add `blog` as a distinct type, or should blog posts map to `website`?

**A25.**
leave blog out
---

### News posts — data model

**Q26.** The `NewsCard` on the Journey page uses hardcoded mock data (type, title, description, date). For the admin-managed version, which additional fields do you want on a news post?
- (a) Minimal: type, title, description, date, status — no changes to the current shape
- (b) Add a source URL (link out to the original piece)
- (c) Add image/thumbnail support
- (d) Other fields you have in mind?

**A26.**
a
---

### News post status workflow

**Q27.** Proposed two states for news posts: `draft` and `published`. Is that enough, or do you want a review step (e.g. `draft → pending_review → published → archived`)?

**A27.**
keep it simple
---

### Ingest pipeline — trigger

**Q28.** When an admin submits a URL + transcript, should the chunking / embedding / intelligence pipeline:
- (a) Run immediately and automatically in the background
- (b) Require an explicit "Process now" button so the admin can review the raw content first

**A28.**
b
---

### Editable metadata fields

**Q29.** After content is ingested, which metadata fields should be editable from the admin UI? Proposed editable set: title, URL, author, domains, topics, keywords, publication_date, status. Anything you'd add or make read-only (e.g. raw chunks, embedding vectors)?

**A29.**
like you proposed
---

### Content sources (cron) — MVP scope

**Q30.** For the content source monitoring feature (e.g. watch Lenny's Podcast feed for new episodes), should we:
- (a) Skip entirely for MVP — no UI placeholder
- (b) Include a read-only "Content Sources" section in the admin UI as a scaffold for later, but with no active functionality
- (c) Implement a basic version (add source URL + schedule, trigger scrape manually) with auto-polling deferred

**A30.**
b
---

### Admin home / dashboard

**Q31.** Should the admin landing page be:
- (a) A dashboard with headline stats (total content, pending review count, active count, news posts count)
- (b) Go straight to the content list — no separate dashboard screen

**A31.**
a