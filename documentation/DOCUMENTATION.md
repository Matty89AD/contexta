# Contexta — Product Documentation

> **Version:** 4.4 &nbsp;|&nbsp; **Last updated:** 2026-03-10 &nbsp;|&nbsp; **Audience:** Product Managers

---

## Table of Contents

- [Product Overview](#product-overview)
- [User Flow](#user-flow)
- [Feature Reference](#feature-reference)
  - [Context Collection](#context-collection)
  - [Challenge Submission](#challenge-submission)
  - [Matching Engine & Recommendations](#matching-engine--recommendations)
  - [Multi-Domain Support](#multi-domain-support)
  - [Content Ingestion](#content-ingestion)
  - [Content Intelligence Service](#content-intelligence-service)
  - [Authentication & Profiles](#authentication--profiles)
  - [Challenge Eval Harness](#challenge-eval-harness)
  - [Artifact Catalog](#artifact-catalog)
  - [Artifact Detail Page](#artifact-detail-page)
  - [Your Journey](#your-journey)
  - [Save & Revisit Challenge Results](#save--revisit-challenge-results)
  - [Artifact Vault](#artifact-vault)
  - [Admin UI](#admin-ui)
  - [Journey News Feed](#journey-news-feed)
  - [Auto-Transcript from URL](#auto-transcript-from-url)
  - [Content Card Enrichment](#content-card-enrichment)
  - [Smart Artifact Detection & News Proposals](#smart-artifact-detection--news-proposals)
  - [API Security & Rate Limiting](#api-security--rate-limiting)
- [Data Model for PMs](#data-model-for-pms)
- [API Reference](#api-reference)
- [Configuration & Tuning](#configuration--tuning)
- [AI Flows, Models & Prompts](#ai-flows-models--prompts)
  - [Models](#models)
  - [Flow 1 — User Challenge Pipeline](#flow-1--user-challenge-pipeline-real-time)
  - [Flow 2 — Artifact Detail & Knowledge Cards](#flow-2--artifact-detail--knowledge-cards-on-demand)
  - [Flow 3 — Content Ingestion Pipeline](#flow-3--content-ingestion-pipeline-background-job)
  - [Prompt File Reference](#prompt-file-reference)
  - [Cost & Token Notes](#cost--token-notes)
- [Known Limitations & Out of Scope](#known-limitations--out-of-scope)
- [Future Epics (Planned)](#future-epics-planned)
- [Changelog](#changelog)

---

## Product Overview

Contexta is an AI-powered recommendation tool for product leaders. A user describes a professional challenge they are facing — a prioritisation crisis, an unclear strategy, a misaligned team — and the system responds with 3 to 5 curated **PM artifact recommendations** (frameworks, methodologies, and mental models) that are most relevant to that specific challenge and context.

The core problem it solves: product leaders spend too much time searching for the right framework or methodology and too little time applying it. Generic search returns too much; asking a colleague takes too long. Contexta cuts through the noise by matching the user's exact situation — their role, company stage, team size, experience level, and the nature of their challenge — to a curated catalog of proven PM artifacts, using both AI embeddings and keyword matching to find the most relevant knowledge and then selecting the best artifacts from a known, trustworthy list. Once a user sees a recommendation they want to act on, they can open a dedicated artifact detail page for a deep-dive explanation, step-by-step guidance, thought-leader attribution, and knowledge base references — all personalised to their original challenge context.

**Target user persona**: Founders, CPOs, Heads of Product, Senior PMs, and Associate PMs who are actively working through a product or leadership challenge and need actionable guidance immediately.

**Three-step value loop**:
1. **Context** — Tell us who you are and where your company is.
2. **Challenge** — Describe the problem you are facing right now.
3. **Recommendations** — Receive 3–5 tailored PM artifact cards; open any card for a full deep-dive with AI-generated guidance.

---

## User Flow

### Getting started (no account required)

The user lands on the home page and clicks **"Start with your challenge."** They are not asked to sign up. There is no email gate, no trial, and no paywall before they see value.

### Step 1 — Context (approximately 30 seconds)

The user fills in four fields about themselves: their **role**, their **company stage** (via a dropdown), their **team size**, and their **experience level**. Role, team size, and experience level use button groups; company stage uses a dropdown menu. The Continue button stays disabled until all four are filled in. There is no automatic advance.

The selections are saved locally in the browser. If the user refreshes or navigates away and comes back, their answers are preserved.

Signed-in users see a **Skip** button alongside Continue. Clicking Skip bypasses the context step entirely and proceeds directly to Step 2 — useful when rerunning a challenge and context has not changed.

### Step 2 — Challenge (approximately 1–3 minutes)

The user describes their challenge in a free-text field. They also select one or more **domains** (Strategy, Discovery, Delivery, Growth, Leadership) that best describe the area their challenge falls under. Optionally they can add a subdomain and describe the impact and reach of the problem.

The **Get recommendations** button becomes active only when the description has at least 10 characters and at least one domain is selected. Clicking it immediately transitions the screen to a loading state — the user does not wait on the challenge form.

A **Back** button at the top returns the user to Step 1 with their context preserved.

### Loading screen (approximately 10–12 seconds)

After the user submits their challenge, a full-screen loading animation replaces the challenge form immediately. The screen cycles through four status messages — "Analyzing your challenge…", "Searching the knowledge base…", "Matching PM frameworks…", "Preparing your results…" — with animated progress dots that advance as each phase completes. The step indicator at the top of the page advances to show the user they are progressing towards the Recommendations step.

This loading phase covers both AI phases running back-to-back — Phase 1 (challenge summary) and Phase 2 (artifact recommendations). Once both complete, the user is automatically redirected to the Results page.

### Step 3 — Results page (`/results`)

The user lands on a dedicated results page outside the flow stepper. The page shows:

- **Left column**: the **Challenge Summary card** — the AI's interpretation of the challenge, with domain badges — and a save prompt (see below).
- **Right column**: 3–5 **artifact recommendation cards**. One card is highlighted as **"Most Relevant."** Each card shows the artifact name, domain badges, a use-case description, and a tailored 1–2 sentence explanation of why this artifact fits the challenge. Clicking any card opens the artifact's detail page with the challenge context attached.

**Save prompt — signed-in users**: A **"Save Challenge"** button is shown in the left column. Clicking it saves the challenge and its recommendations to the user's account and redirects them to the saved challenge page (`/challenges/[id]`).

**Save prompt — guests**: A **"Create account to save"** card is shown instead. Clicking **"Create account →"** takes the user to the sign-up page with their challenge pre-attached, so the challenge can be explicitly saved to the new account.

The results page is transient — if the user navigates away or closes the browser without saving, the results are not recoverable. Only challenges that have been explicitly saved appear in the Journey.

### Step 4 — Artifact Detail (optional, per artifact)

After clicking any recommendation card, the user lands on a dedicated detail page for that artifact. The page fires three independent data requests in parallel on load — the page structure and artifact header are visible immediately with no waiting.

**Static content (loads in under 1 second for pre-generated artifacts):**
- The artifact's title, domain badges, and one-line use-case description appear in the header with no delay.
- The **Overview tab** and **How to Use tab** content — the description, suitability card, thought leaders, and numbered steps — are stored in the database and served instantly for any artifact that has been pre-generated via the backfill script.

**Main content (with tabs):**
- An **Overview tab** showing: the artifact's full description (3–5 sentences), a suitability card describing which company stages benefit most, and a thought leaders card listing 1–4 practitioners known for this artifact.
- A **How to Use tab** showing: a 1–3 sentence intro and a numbered, vertical step-by-step guide (3–8 steps) explaining how to apply the artifact in practice.

**Sidebar (sticky):**
- A **Contexta Pro-Tipp** card. When the user arrived from the flow with a known challenge, a separate AI call generates a personalised 2–3 sentence tip tailored to that challenge — this loads independently in a few seconds while the rest of the page is already visible. Without a challenge context, the stored generic guidance appears immediately alongside the static content.
- A **Save to Playbook** button — visible but non-functional in the current version (deferred to a future epic).

**Knowledge base section (full-width, below the grid):**
- A "Who talks about it" heading followed by a horizontal scrollable carousel of up to 5 content cards showing which podcast episodes, articles, videos, or books in the knowledge base are semantically related to this artifact. Each card shows the title, author, and source type badge. The search uses AI vector similarity — meaning it finds conceptually related content even if the artifact name does not appear verbatim in the transcript.
- Only one result per content item appears — if multiple chunks from the same podcast episode are related, the episode appears only once.
- If no relevant content is found, a plain empty-state message is shown.

A **"Zurück zu den Empfehlungen"** back button returns the user to their previous view.

### Edge cases

- **No matching artifacts**: if the artifact catalog is empty or the AI cannot select from it, a message appears instead of recommendations.
- **API failure during phase 1**: a clear error message is shown on the challenge step; the user can retry.
- **API failure during phase 2**: the summary is still shown; the recommendations area shows an empty state.
- **Not signed in**: the full flow works without an account. Results are shown on `/results` with a "Create account to save" prompt. The challenge record exists in the database but will not appear in any Journey unless the user signs up and the challenge is explicitly saved.
- **Signed in**: results page shows a "Save Challenge" button. Saving persists the challenge and its recommendations; the user is then redirected to the permanent saved challenge page at `/challenges/[id]`.
- **Sign-up from the results page**: clicking "Create account →" opens the sign-up page pre-set to Sign Up. After account creation, the challenge is linked to the account; the user can then return to save it.
- **Navigating away from `/results` without saving**: results are lost. The page redirects to `/flow` if revisited directly (no session data present).
- **Login from the nav**: returning users click "Login" in the navigation bar, fill in their email and password (or use Google), and are redirected to their Journey page.
- **Protected pages**: visiting `/journey` or `/profile` without being signed in redirects to the login page, then back to the intended destination after authentication.
- **Artifact detail without challenge context**: if the user navigates to an artifact page without a challenge ID (e.g. directly or by sharing the URL), the Pro-Tipp shows the stored generic guidance immediately and no extra AI call is made.
- **Artifact not found**: if the slug in the URL does not match any artifact in the catalog, the server returns a 404 page.
- **Artifact detail not yet pre-generated**: if the backfill script has not run for a given artifact, the static content is generated on the fly on the first visit and stored for future visits.

---

## Feature Reference

### Context Collection

**What it does**: Captures four pieces of information about the user before they describe their challenge. This context is used to tailor the AI summary and to influence which content is most relevant.

**What the user sees**: A form with button groups for role, team size, and experience level, and a dropdown for company stage. The user makes one selection per field.

**What data it captures**:
- Role (one of five fixed options)
- Company stage (one of five fixed options, selected via dropdown)
- Team size (one of four fixed options)
- Experience level (one of four fixed options)

**Business rules**:
- All four fields are required before proceeding for guests.
- Signed-in users can click **Skip** to bypass the context step — their previously saved context (from browser storage) is used automatically.
- Selections are saved locally in the browser and persist across page refreshes.
- Changing a selection after proceeding to Step 2 is possible by clicking Back.

**Status**: Implemented

---

### Challenge Submission

**What it does**: Collects the user's challenge description and domain(s), then triggers the AI pipeline in two asynchronous phases. Phase 1 generates the challenge summary; Phase 2 generates artifact recommendations. The user sees a loading screen during Phase 1, and the results page with the summary appears as soon as Phase 1 completes — without waiting for Phase 2.

**What the user sees**: A text area for the description, domain selection buttons, optional subdomain and impact fields, and a submit button. On submit, the screen transitions immediately to an animated loading screen with cycling status messages. Once the summary is ready, the results page renders with the summary visible and skeleton placeholders for the recommendation cards. Recommendations populate the skeletons when Phase 2 finishes.

**What data it captures**:
- Challenge description (required, 10–5,000 characters)
- Domain(s) selected (required, at least one; up to five)
- Subdomain (optional free text, up to 200 characters)
- Impact and reach (optional, up to 1,000 characters — who is affected and what is at stake)

**Business rules**:
- Description must be at least 10 characters.
- At least one domain must be selected.
- The context from Step 1 is silently attached to the submission and passed to the AI.
- If Phase 1 fails (network error, AI error), the loading screen reverts to the challenge form with a clear error message. The user can retry.
- If Phase 2 fails, the summary and challenge card remain visible; the recommendation area shows an empty state instead of crashing.

**Status**: Implemented

---

### Matching Engine & Recommendations

**What it does**: Finds the most relevant content from the knowledge base for a given challenge, ranks it using three complementary scoring signals, and uses an AI model to select 3–5 artifacts from the known artifact catalog — writing a tailored explanation for why each one fits the user's specific challenge.

**What the user sees**: Nothing during the matching phase — this runs invisibly in the background. The output is the artifact recommendation cards shown in Step 3 of the flow.

---

#### Pipeline overview

The pipeline runs in two phases. Phase 1 runs on challenge submission; Phase 2 runs in the background while the user is already reading their challenge summary.

**Phase 1 (challenge summary — runs on submission):**

1. **AI summary** — The challenge description and user context are sent to an AI model, which generates a concise summary, a focused problem statement, and a desired outcome statement.
2. **Persist** — All three fields are saved to the database against the challenge record, ready for Phase 2.
3. **Return** — The summary and challenge ID are returned to the client immediately. The results page renders with the summary visible.

**Phase 2 (artifact recommendations — runs in parallel after Phase 1):**

4. **Embedding + artifact fetch (parallel)** — The combined text of the summary, problem statement, and desired outcome statement is converted into a numerical vector (an embedding). Simultaneously, the artifact catalog is fetched from the database. Both happen at the same time.
5. **Dual retrieval** — Two independent searches run simultaneously against the knowledge base (described below).
6. **Merge and deduplicate** — Results from both searches are combined into a single candidate list. A chunk appearing in both searches is flagged as a stronger match.
7. **Scoring and ranking** — Every candidate is scored across three dimensions. The scores are summed into a final ranking score.
8. **Domain-filtered artifact selection** — The artifact catalog is filtered to artifacts whose domains overlap with the user's chosen challenge domains before being passed to the AI. This typically reduces the catalog from 68 artifacts to 10–20 candidates, making the AI call faster and more focused. If no domain overlap exists, the full catalog is used as a fallback.
9. **Artifact selection pass** — The top-ranked chunks (as context) and the filtered artifact list are sent to an AI model. The AI selects 3–5 artifacts by name from the filtered list, writes a 1–2 sentence explanation for each one referencing the specific challenge, and identifies the single most relevant artifact. The AI can only recommend artifacts from the provided list — it cannot invent new ones.

---

#### The two retrieval methods

**Semantic search (vector search)**

The challenge embedding is compared against the embedding stored for every content chunk using cosine similarity. This finds content that is *conceptually* close to the challenge — even if different words are used. For example, a challenge about "not knowing which feature to build next" will surface content about prioritisation frameworks even if the word "prioritisation" was never written.

**Keyword search (full-text search)**

The raw challenge text is passed to PostgreSQL's built-in full-text search engine (`tsvector`/`tsquery`) using the `english` language configuration. This finds content chunks where the *same words* appear — useful for precise terminology, framework names, methodologies, and product jargon.

How the keyword search processes the query text:

- **Stop words are stripped** — common English words that carry little meaning are discarded before matching. These include function words like *the*, *a*, *an*, *is*, *are*, *was*, *were*, *of*, *in*, *on*, *at*, *to*, *for*, *with*, *and*, *or*, *but*, *not*, *by*, *from*, *as*, *this*, *that*, *it*, *be*, *have*, *do*, *will*, *would*, *can*, *could* — and approximately 170 others defined in PostgreSQL's English stop-word list. Writing "I need help with the strategy for my team" is equivalent to writing "need help strategy team."

- **Words are stemmed** — the remaining words are reduced to their root form using the Snowball English stemmer, so that different inflections of the same word match each other. Examples: "prioritizing" → `prioritiz`, "challenges" → `challeng`, "strategies" → `strategi`, "delivering" → `deliv`, "leadership" → `leadership`, "discovery" → `discoveri`. The same stemming is applied to the content chunks at ingestion time, so "we were prioritising features" in a chunk will match a challenge that mentions "feature prioritization."

- **What is actually used for matching** — the stemmed, non-stop-word tokens that remain. A content chunk must contain *all* of these tokens to be considered a match (logical AND). If a challenge description reduces to three meaningful tokens after processing, every returned chunk contains all three.

- **Ranking within keyword results** — matching chunks are ranked by `ts_rank_cd` with normalization 8, which divides the raw rank by the number of unique words in the chunk. This prevents long chunks from unfairly dominating just because they contain more words overall.

- **Enhanced by key concepts** — since Epic 8, the full-text index on each chunk also includes extracted key concepts (specific framework names and terminology identified during ingestion). This means a chunk about "opportunity solution tree" will now also match keyword searches for those exact terms, even if they appear only implicitly in the chunk body.

Keyword search failure is non-fatal. If the search returns no results or encounters an error (for example, if the full-text index has not yet been built for a chunk), the pipeline silently falls back to vector-only results.

---

#### Scoring formula

Each candidate chunk in the merged list receives a final score calculated as:

| Component | How it is calculated | Default weight |
|-----------|---------------------|---------------|
| **Domain score** | 1.0 if the content's domain(s) overlap with the challenge domain(s); 0.5 otherwise | 0.3 |
| **Semantic score** | Cosine similarity between the challenge embedding and the chunk embedding (0–1) | 0.7 |
| **Keyword score** | `ts_rank_cd` relevance from the full-text search, normalised (0–1) | 0.3 |

All three weights are additive and independent — they do not need to sum to 1. Each weight is configurable via environment variable (see Section 6).

Domain scoring is a soft boost: content from other domains can still appear if its semantic or keyword score is high enough. It is never a hard filter.

---

#### What the user sees in Step 3

A labelled list of 3–5 artifact cards. The most relevant item is visually highlighted with a "Most Relevant" badge and a darker left border. Each card shows:
- The artifact name (e.g. "Jobs to be Done", "RICE Framework", "Opportunity Solution Tree")
- One or more **domain badges** (e.g. "Discovery", "Strategy") showing which practice areas the artifact covers
- A **use-case line** summarising what the artifact is typically applied to
- A **tailored explanation** of why this specific artifact fits the challenge the user just described

Clicking any card navigates to the artifact detail page (Step 4). Exactly one item is marked "most relevant." Navigation is entirely within the product.

**Status**: Implemented (domain matching, semantic similarity, keyword search, hybrid reranking, artifact-based recommendations, two-phase pipeline)

---

### Multi-Domain Support

**What it does**: Allows users to select more than one domain when submitting a challenge, and ensures content that spans multiple domains is matched accordingly.

**What the user sees**: Domain buttons in the challenge step that can all be selected or deselected independently. Selecting two or more domains signals that the challenge spans multiple areas.

**Business rules**:
- At least one domain is required.
- Up to five domains can be selected simultaneously.
- Domain overlap is treated as a scoring boost, not an exclusion rule — content from domains the user did not select can still appear if it is semantically relevant.
- The artifact list passed to the AI recommendations step is filtered to artifacts whose domains match the selected challenge domains, reducing the candidate set and improving both speed and relevance.
- All existing single-domain content continues to work correctly (backward compatible).

**Status**: Implemented

---

### Content Ingestion

**What it does**: Allows curated content (podcasts, articles, frameworks, playbooks, case studies) to be loaded into the knowledge base so it becomes available for matching. Since Epic 8, ingestion also automatically extracts structured metadata from each content item using an AI model.

**What the user sees**: Nothing — this is an internal process run by the team, not an end-user feature.

**What it does (plain English)**:
- Content is broken into chunks of approximately 1,500 characters.
- Each chunk gets an AI embedding (a numerical fingerprint) stored for semantic search.
- Each chunk also gets a full-text search index entry stored for keyword search.
- An AI model analyses the full content and automatically extracts document-level metadata (topics, keywords, author, category, language) and classifies each chunk by type and key concepts.
- The content record is saved with its title, source type, domains, summary, URL, and all extracted metadata.

**Configuration available**:
- Chunk size target (default 1,500 characters) configurable via environment variable or command-line flag.
- Maximum chunk size (default 8,000 characters) also configurable.
- One or more domains can be assigned to each content item at ingest time.

**Scripts available**:
- Ingest a single transcript file: `npm run ingest-transcript`
- Batch-ingest all transcript files from a folder: `npm run ingest-content-batch`
- Re-run metadata extraction on existing content: `npm run backfill-intelligence`
- Seed the PM artifact catalog: `npm run seed-artifacts`
- Pre-generate and store AI detail for all artifacts: `npm run backfill-artifact-details`

**Status**: Implemented

---

### Content Intelligence Service

**What it does**: Automatically extracts structured metadata from every content item at the time of ingestion. A single AI call per content item analyses the full text and classifies both the document as a whole and each individual chunk within it.

**What the user sees**: Nothing directly. The extracted metadata improves the quality of keyword search results and lays the foundation for future metadata-based filtering and discovery features.

**What it extracts at the document level**:
- **Topics** — 2 to 6 high-level subject tags (e.g. "continuous discovery", "stakeholder alignment")
- **Keywords** — 4 to 10 specific terms, framework names, or methodologies mentioned (e.g. "opportunity solution tree", "RICE scoring")
- **Author** — the name of the primary speaker or author, when clearly identifiable
- **Publication date** — an approximate date if detectable from the content
- **Content category** — a single descriptive label summarising the content area (e.g. "product discovery", "growth & retention")
- **Language** — ISO language code (almost always English for the current knowledge base)
- **Extraction confidence** — a 0–1 score indicating how complete and reliable the extraction was

**What it extracts at the chunk level**:
- **Chunk type** — classifies each chunk into one of nine categories (see table below)
- **Key concepts** — up to 5 specific named concepts, frameworks, or methods mentioned in that chunk

**Chunk type classifications**:

| Type | When it applies |
|------|----------------|
| **Framework** | A structured model, method, or named process is described (e.g. Shape Up, the opportunity solution tree) |
| **Principle** | A rule, mental model, or guideline is stated as general advice |
| **Example** | A concrete story, anecdote, or specific illustration of how something was applied |
| **Case study** | An extended real-world application with context and outcome |
| **Tool** | A specific technique, template, or tactical action a practitioner can directly apply |
| **Warning** | An anti-pattern, common mistake, or caveat to watch out for |
| **Summary** | Synthesises or recaps the broader content |
| **Introduction** | The host's opening words, guest introduction, or sponsor reads (typically the first 1–2 chunks of a podcast only) |
| **Discussion** | Substantive interview dialogue that does not fit a more specific type; the default for mid-episode Q&A exchanges |

**Business rules**:
- Metadata extraction runs automatically at the end of every ingest call. It is non-fatal — if the AI call fails, the content and its chunks are still saved and available for matching.
- Records that failed extraction (confidence score of 0) are retried by the backfill script on the next run.
- The `--force` flag on the backfill script re-processes all records, including previously successful ones — useful after prompt improvements.
- Topics and key concepts are included in the full-text search index, enriching keyword retrieval without any changes to the matching engine.

**Status**: Implemented

---

### Authentication & Profiles

**What it does**: Lets users create an account after completing a challenge to save their results and return to them later. The sign-up prompt appears on the results page — not before. Returning users can log in from the navigation bar. A profile page lets users manage their email and password.

**What the user sees**:
- **Results page**: an "Save your recommendations" card with a "Create account →" button. Clicking it goes directly to the Sign Up tab on the auth page with the challenge ID pre-attached.
- **Auth page (`/login`)**: a unified sign-in / sign-up page with two tabs. Either tab supports email and password. A "Continue with Google" button is also available (requires Google OAuth configured in the Supabase dashboard to function).
- **Navigation bar**: shows a "Login" link when the user is not signed in. Shows the user's email prefix and a "Logout" button when signed in.
- **Journey page (`/journey`)**: a protected page showing the user's full challenge history, active challenge cards with a "Continue" button, and a filterable history table. Fully implemented as of Epic 13.
- **Profile page (`/profile`)**: a protected page showing the user's email address and a form to change their password.

**What happens on sign-up**:
1. The user creates an account with email and password (or via Google OAuth).
2. A user profile record is created in the database. If the user came from the challenge flow, their role, company stage, team size, and experience level are carried over from their browser storage and saved automatically.
3. If a challenge ID was present when the user clicked "Create account →", that challenge is linked to the new account immediately — so the user's results are saved without any extra steps.
4. The user is redirected to the Journey page.

**What happens on login**:
1. The user enters their email and password (or uses Google OAuth).
2. They are redirected to the Journey page.

**Protected routes**:
- `/journey` and `/profile` are accessible only when signed in. Visiting either page without an account redirects to the login page, then back to the intended destination after authentication.

**Business rules**:
- The complete challenge flow — context, submission, and recommendations — works without an account. Sign-up is never required to see results.
- Challenges are always saved to the database when submitted, even anonymously. An anonymous challenge has no user link; it can be claimed by signing up immediately after.
- Each challenge can only be claimed once. If a challenge was already linked to a different user account, a second claim will be rejected.
- The PM context fields on a user profile (role, stage, etc.) are optional at sign-up. They are filled in from browser storage if available, and can be updated when the user completes a new challenge while signed in.
- Google OAuth requires configuration in the Supabase dashboard before the button becomes functional. The button is always visible; an unconfigured OAuth provider returns a descriptive error.

**Status**: Implemented (sign-up, login, Google OAuth button, challenge claiming, profile page, journey page, Nav login/logout/Your Journey links)

---

### Challenge Eval Harness

**What it does**: Measures the quality of the matching engine by running a fixed set of 15 synthetic test challenges through the full retrieval pipeline and comparing the results against manually annotated ground truth. This gives the team a repeatable precision score they can track as the knowledge base grows or the matching engine changes.

**What the user sees**: Nothing — this is an internal quality tool run by the team, not an end-user feature.

**How it works**:
- 15 synthetic product and leadership challenges are stored in a typed dataset, each with three manually selected "correct" content items.
- The harness generates a real embedding for each challenge description, runs the full hybrid retrieval pipeline (vector search + keyword search), and deduplicates the results to find the top 5 unique content items.
- It compares those results against the expected matches and calculates two metrics for each challenge:
  - **precision@3** — what fraction of the 3 expected items appear in the top 3 results
  - **precision@5** — what fraction of the 3 expected items appear in the top 5 results
- After all 15 challenges run, the harness prints aggregate precision scores and hit rates.

**Key design decisions**:
- The harness does not create any database records during a run — it calls the retrieval layer directly.
- Title comparison is case-insensitive and strips file extensions to ensure consistent matching.
- A `--dry-run` flag prints the dataset without making any API calls, useful for verifying the dataset before a full run.

**Script**: `npm run eval`

**When to run it**:
- After ingesting new content, to check whether precision improved or regressed.
- After changing scoring weights or matching configuration, to validate the impact.
- As a baseline measurement before experimenting with new matching strategies.

**Status**: Implemented

---

### Artifact Catalog

**What it does**: Maintains a curated, pre-seeded list of known PM frameworks and methodologies (collectively called "artifacts"). Every recommendation returned to users is drawn exclusively from this list — the AI selects the best matches but can never invent or suggest an artifact that is not in the catalog. This guarantees that all recommendations are well-defined, named practices rather than vague suggestions.

**What the user sees**: Artifact names and domain badges on the recommendation cards in Step 3. Each artifact's title, use-case description, and associated domain(s) are displayed directly on the card. Clicking any card opens the artifact's detail page.

**Initial catalog**: 68 artifacts sourced from Lenny's Frameworks — a community-curated collection drawn from Lenny's Podcast. The catalog spans five practice domains and includes frameworks such as Jobs to be Done, RICE, Opportunity Solution Tree, Shape Up, and Growth Loops.

**What each artifact record contains**:
- **Slug** — a URL-safe unique identifier used for internal navigation (e.g. `jobs-to-be-done`, `rice-framework`)
- **Title** — the full display name of the artifact
- **Domains** — one or more of the five practice areas: Strategy, Discovery, Delivery, Growth, Leadership
- **Use case** — a one-line description of the situations this artifact is typically applied to
- **Pre-generated detail** — a stored AI-generated block containing the artifact's description, suitability, thought leaders, generic Pro-Tipp, and how-to steps. Generated once and reused on every page load.

**Business rules**:
- The AI recommendations step only selects from artifacts matching the challenge's domains — no hallucinated or invented artifact names can appear in results.
- The catalog is seeded via a command-line script and is idempotent — running the seed script multiple times will not create duplicate entries.
- The catalog can be expanded at any time by adding new entries and re-running the seed script, followed by the backfill script to pre-generate their detail.
- Domain assignments on artifacts are independent from domain assignments on content items — they are separate catalogs.

**Scripts**: `npm run seed-artifacts` to seed the catalog; `npm run backfill-artifact-details` to pre-generate AI detail for all artifacts.

**Status**: Implemented

---

### Artifact Detail Page

**What it does**: Provides a full-page deep-dive for any artifact in the catalog. On load, three independent data requests fire in parallel — static artifact content (from the database), a personalised Pro-Tipp (from the AI, only when a challenge context is present), and knowledge base content cards (from a vector similarity search). Each section renders as soon as its data arrives, with skeleton placeholders shown in the meantime.

**What the user sees**: A three-area layout with the header and page structure visible immediately.

**Header**: The artifact's title, domain badge(s), and one-line use-case description — present immediately on load.

**Main content (tabbed)**:
- **Overview tab**: A 3–5 sentence description of what the artifact is and why it matters, a suitability card ("Best For") indicating which company stages benefit most, and a thought leaders card listing 1–4 practitioners most associated with it.
- **How to Use tab**: A 1–3 sentence introduction followed by a numbered, vertical step list (3–8 steps), each with a short title and a 1–2 sentence explanation.

Both tabs load from the pre-generated database record — for any artifact that has been through the backfill process, this content appears in under one second with no AI call needed.

**Sidebar (sticky)**:
- A "Contexta Pro-Tipp" card. When the user arrived from the flow with a known challenge, a separate AI call generates a personalised 2–3 sentence tip tailored to that specific challenge — this loads in a few seconds while the rest of the page content is already visible. Without challenge context, the stored generic Pro-Tipp from the database record is shown immediately with no AI call.
- A "Save to Playbook" button (visible, non-functional — deferred to a future epic).

**Knowledge base section (below the grid)**:
- A "Who talks about it" heading followed by a horizontal scrollable carousel of up to 5 content cards. Each card shows the content title, author, and source type badge (Podcast, Video, Article, Book).
- Content is found using two parallel searches: a vector similarity search (finds conceptually related content even when the artifact name is not mentioned verbatim) and a keyword search (finds content that explicitly names the artifact or uses its exact terminology). Both searches fire simultaneously and their results are merged, with vector matches ranked first.
- Only one result per content item appears — if multiple chunks from the same podcast episode are related, the episode appears only once.
- If no relevant content is found, a plain empty-state message is shown.

**What data it needs**:
- **From the URL**: the artifact slug (to identify which artifact to display) and an optional challenge ID (to personalise the Pro-Tipp).
- **From the database**: pre-generated static detail (description, suitability, thought leaders, how-to, generic Pro-Tipp).
- **From the AI (only when a challenge is present)**: personalised Pro-Tipp specific to the user's challenge.
- **From the knowledge base**: up to 5 deduplicated content items semantically related to the artifact.

**Business rules**:
- If the artifact slug does not exist in the catalog, the server returns a 404.
- The `cid` (challenge ID) query parameter is fully optional — the page renders completely without it. Without it, the stored generic Pro-Tipp is shown immediately and no additional AI call is made.
- The three data calls (static detail, Pro-Tipp, knowledge cards) are independent — a failure in one does not block the others.
- If the static detail has not been pre-generated yet (no database record), the system generates it on demand and stores it for future visits.
- Skeleton loaders are shown for each async section until its respective call completes.
- The "Save to Playbook" button is always visible but always disabled in the current version.
- The back button always uses browser history navigation — it returns the user to wherever they came from.

**Status**: Implemented

---

### Your Journey

**What it does**: Gives signed-in users a personal workspace showing all their **saved** challenges, summary stats, and quick navigation to any past challenge view.

**What the user sees**: A three-section page at `/journey`, accessible only when signed in.

- **Journey Insights** (top): Four stat cards — Total Challenges, Active, Completed, and Saved Artifacts. A content-type distribution bar chart and a Top Thought Leaders strip. These three sub-components currently display illustrative placeholder data; real aggregation is a future step.
- **Active Challenges** (middle): A horizontally scrollable row of cards for any saved challenge with status "open" or "in progress." Each card shows the challenge title, domain badges, status badge, and a **"View"** button. Clicking "View" opens the saved challenge page at `/challenges/[id]`. If there are no active challenges, an empty state with a link to start a new challenge is shown.
- **Challenge History** (bottom): A full table of all the user's **saved** challenges, ordered by most recently saved first. Each row shows the challenge title, raw description preview, domain badges, status badge, and date. A status dropdown filters the table client-side. Clicking any row navigates to the saved challenge page at `/challenges/[id]`.

**Business rules**:
- The page redirects unauthenticated users to the login page, then back to `/journey` after sign-in.
- Only **explicitly saved** challenges appear here. Challenges that were generated but never saved are not shown.
- Stats (total, active, completed) are calculated against saved challenges only.
- Challenge status is a lifecycle field: every challenge starts as "open." Status update UI is read-only for now (users see their current status but cannot manually change it in this version).

**Status**: Implemented

---

### Save & Revisit Challenge Results

**What it does**: Lets signed-in users explicitly save a set of recommendations to their account, revisit them any time without re-running the AI, rename the challenge, and rerun the flow with the same challenge text prefilled.

**What the user sees**:

**On the Results page (`/results`)** — after a challenge completes, signed-in users see a **"Save Challenge"** button in the left column. Clicking it:
1. Persists the challenge and its full list of artifact recommendations to the user's account.
2. Auto-generates a short display title from the first sentence of the challenge description (no AI call — happens instantly).
3. Redirects the user to the permanent saved challenge page.

**On the Saved Challenge page (`/challenges/[id]`)** — a full-page view showing:
- The challenge title (editable inline — click to rename, press Enter or click the tick to confirm).
- The date the challenge was saved.
- The challenge summary card with domain badges.
- The full list of stored artifact recommendation cards, identical to those shown on the Results page. Clicking any card opens the artifact's detail page.
- A **"Rerun"** button in the top-right corner.

**Rerun flow** — clicking "Rerun" starts a fresh flow with the challenge text pre-filled in Step 2 and the context step skippable. The user can edit the description or leave it as-is, then submit. A **new** challenge record is created — the original saved challenge is not modified.

**Business rules**:
- Only signed-in users can save challenges. Guests see a "Create account to save" prompt instead.
- A challenge must be explicitly saved — results are not persisted automatically.
- Unsaved challenges (generated but navigated away from) do not appear in the Journey.
- The auto-generated title is derived from the challenge description text; it requires no AI call.
- The user can rename the title any time from the saved challenge page. The rename is saved immediately on confirmation.
- Stored recommendations are loaded directly from the database — no AI pipeline runs on revisit.
- Artifact detail content ("who speaks about it" / "Pro-Tipp") is intentionally regenerated fresh each time the artifact detail page is visited, since the knowledge base is updated regularly and fresh associations provide ongoing value.
- Rerun always creates a new record; the original saved challenge and its recommendations remain unchanged.

**Status**: Implemented

---

### Artifact Vault

**What it does**: Lets signed-in users save specific artifacts to a personal collection — the Artifact Vault — directly from an artifact's detail page, then browse and revisit all saved artifacts from a dedicated tab on the Journey page.

**What the user sees**:

**On the Artifact Detail page** — a button labelled "Add to Artifact Vault" appears in the sidebar. For signed-in users the button is fully interactive:
- Clicking it saves the artifact and the label immediately changes to "Saved to Vault".
- Clicking "Saved to Vault" unsaves the artifact and the label reverts to "Add to Artifact Vault".
- A brief loading indicator is shown during each save/unsave action.
- For users who are not signed in, the button is visible but disabled — no error is shown.

**On the Journey page (`/journey`)** — a second tab, "My Artifacts Vault", appears in the page's sub-navigation alongside the existing "Challenges & Progress" tab:
- The tab label shows a live count badge of how many artifacts have been saved.
- The Vault tab shows a card grid of all saved artifacts, each displaying the artifact title, domain badge(s), a short use-case description, and the date it was saved.
- Clicking any card navigates to the artifact's detail page (`/artifacts/[slug]`).
- If no artifacts have been saved yet, an empty state prompts the user to open any artifact and tap "Add to Artifact Vault", with a link to start a new challenge flow.

**Journey Insights panel** — the "Saved Artifacts" stat card on the Journey page now shows the real count pulled from the database (previously it showed a placeholder).

**Business rules**:
- Only signed-in users can save or unsave artifacts. Unauthenticated users see the button in a disabled state with no error message.
- Each artifact can only be saved once per user — saving the same artifact again is a no-op (no duplicates).
- Unsaving immediately removes the artifact from the Vault tab; the count badge updates accordingly.
- Vault cards link directly to the artifact detail page; no additional actions (download, rating, progress) are available on the card.
- Saved artifacts are not linked to any specific challenge — they are a cross-challenge personal collection.

**Status**: Implemented

---

### Admin UI

**What it does**: Provides a protected web interface at `/admin` for the internal team to manage the knowledge base — adding and processing content, editing metadata, publishing news posts, and monitoring content health — without needing command-line access.

**What the user sees**: A sidebar-navigated admin area with four sections: Dashboard, Content, News Posts, and Content Sources. Only users with an admin flag on their account can access it; all other users (including logged-in non-admins) are redirected to the home page when they try to visit any `/admin` URL.

**Dashboard**
The landing page at `/admin` shows headline stat cards: total content items broken down by status (draft, pending review, active, archived) and total news posts broken down by status (draft, published). Quick-action links navigate to "Add content" and "New news post."

**Content management**
- The content list page shows all content items in a filterable, searchable table. Columns include title, source type, primary domain, status, and creation date. Tabs filter by status; dropdowns filter by source type and domain; a text box filters by title (client-side).
- The "Add content" form captures source type (podcast, video, website, book), URL (stored as provenance — nothing is fetched), optional title, and a transcript/full-text textarea. Submitting creates a draft content record.
- The content edit page exposes all editable metadata: title, URL, author, domains, topics, keywords, publication date, and status. A read-only panel shows source type, chunk count, extraction confidence, and creation date.
- A **"Process now"** button on the edit page triggers the full ingest pipeline: the stored transcript is chunked, each chunk is embedded and indexed, intelligence metadata is extracted, and the status advances automatically to "pending review." Re-processing a previously processed item replaces all existing chunks.

**News post management**
- The news posts list shows all posts with title, type (podcast, artifact, article), display date, status, and sort order. Posts can be toggled between draft and published directly from the list, or deleted with a two-step confirmation.
- The news post editor captures type, title, description (the short text shown in the Journey news card), display date (free text, e.g. "Mar 2026"), status, and sort order.

**Content Sources scaffold**
A static read-only placeholder page describing a future cron-based monitoring system. No database interaction. The "Add source" button is disabled with a "Coming soon" tooltip.

**Business rules**:
- All `/admin` routes are server-side guarded — unauthenticated users and non-admins are redirected to the home page before any page renders.
- The `is_admin` flag must be set directly in the database by an operator; there is no self-serve admin upgrade flow.
- Content items with status "active" cannot be hard-deleted — the API returns an error. Only "draft" and "archived" items can be deleted.
- After a successful "Process now" run, status advances to "pending review." The team manually moves items to "active" when ready to include them in matching.
- The Admin link appears in the navigation dropdown only for users who have the admin flag.

**Status**: Implemented

---

### Journey News Feed

**What it does**: Replaces the hardcoded mock news items on the Journey page with live published news posts fetched from the database, so the team can manage what appears in the news section without a code deployment.

**What the user sees**: The "What's New" (NewsCard) section on the Journey page. Previously this showed static placeholder cards baked into the code. Now it shows only news posts that have been published via the Admin UI, ordered by sort order (ascending) and then by creation date (newest first). If no published posts exist, the entire section is hidden.

**Business rules**:
- Only news posts with status "published" are shown. Draft posts are invisible to end users.
- The display order is controlled by the sort order field set in the Admin UI — lower numbers appear first.
- Removing a post from the feed is done by unpublishing it in the Admin UI (no deletion required).
- The public endpoint that serves the news feed (`/api/journey/news`) returns an empty array silently on error, so a failed database call does not break the Journey page.

**Status**: Implemented

---

### Auto-Transcript from URL

**What it does**: Lets admins generate a transcript and pre-fill a content draft by pasting any URL — a YouTube video, a podcast RSS feed, a direct audio file, or a web page. The system detects the URL type, extracts the transcript in the background, runs content intelligence automatically, and creates a ready-to-review draft. The admin receives a notification when the job is done and can then trigger ingestion with one click.

**What the user sees**: A new **"Add from URL"** button on the `/admin/content` page. Clicking it opens a three-step modal:
1. **URL entry** — the admin pastes a URL; the interface detects and displays the URL type (YouTube video, Podcast RSS feed, Podcast episode, or Web page).
2. **Podcast RSS episode picker** (RSS feeds only) — a table of the 50 most recent episodes is shown; the admin selects one before continuing.
3. **Confirmation** — the admin sees the URL, detected type, and an estimated processing time before clicking "Generate Transcript" to start the job.

Once the job is submitted, a **bell icon** in the admin navigation shows how many jobs are pending or processing. When a job finishes, a toast notification appears with a link to the newly created draft content page. Failed jobs also trigger a toast with the error message.

On the draft content page (`/admin/content/[id]`), all metadata fields (title, author, publication date, source type) and the raw transcript are pre-filled and ready to review. An **"Run Ingestion"** button is visible while the content is in draft status — clicking it generates the semantic embeddings and chunks that make the content searchable by users.

**Business rules**:
- Only admins can create or view transcript jobs.
- A job is processed asynchronously after the HTTP response is returned — the admin does not wait on the page for it to complete.
- Transcript extraction uses a 10-minute timeout; if the job exceeds this, it is marked as failed with an explanatory message.
- Content intelligence (domain classification, keyword extraction, tagging) runs automatically inside the job pipeline. The admin does not need to trigger it separately.
- Embeddings and search chunks are only generated when the admin explicitly clicks "Run Ingestion" on the draft review page.
- After ingestion the admin changes the content status to "active" to make it visible to the matching engine.
- Authenticated/paywalled content, bulk URL submission, scheduled re-ingestion, and inline transcript editing are all explicitly out of scope for this version.

**Status**: Implemented

---

### Content Card Enrichment

**What it does**: When a user views an artifact detail page, each knowledge base card is now interactive. Clicking a card opens a detailed overlay showing an AI-generated summary of the content item, its topics, keywords, domain badges, and an estimated read or listen time. Signed-in users also have their views tracked — a "Viewed" badge appears on cards they have already opened.

**What the user sees**: Knowledge base cards at the bottom of the artifact detail page now show a subtle info icon and respond to clicks. Tapping a card opens a centred modal overlay:
- **Header** — source type badge (Podcast / Video / Article / Book), title, author and publication date (when available), and an estimated reading or listening time based on the transcript length.
- **Body** — an AI-generated 2–4 sentence summary of the content item; pill lists of topics and keywords; domain badges.
- **Footer** — for signed-in users who have viewed the card before: a line showing the first-seen date and total view count. For all users: an "Open [source type]" button that opens the original URL in a new tab; the button is disabled with a tooltip if no URL is stored.
The overlay closes by pressing Escape, clicking the X button, or clicking outside the panel. A small filled dot plus a "Viewed" label appears in the bottom-left corner of any card the signed-in user has previously opened.

**Business rules**:
- Summaries are generated automatically at the end of the ingestion pipeline; if generation fails the ingest still succeeds and the summary is stored as null. The overlay shows "No summary available." gracefully in that case.
- The summary generation uses a smart chunk selection strategy: chunks classified as "summary" type are preferred; if none exist, the first two and last two chunks are used instead; if no chunks exist at all, the AI synthesises from the title, topics, and keywords alone.
- Re-processing a content item (via Admin UI → "Run Ingestion") also regenerates the summary.
- View tracking is available to signed-in users only. Anonymous users see the overlay without any view history or "Viewed" badges.
- View records accumulate: each time a user opens the same content card the view count increments and the "last seen" timestamp updates. The first-seen date never changes.
- View status is fetched in parallel for all cards on page load so there is no additional delay after cards appear.
- Estimated time is shown only when transcript text is stored for the content item. Video and podcast content uses 130 words per minute; articles and books use 200 words per minute.

**Status**: Implemented

---

### Smart Artifact Detection & News Proposals

**What it does**: After a content item is ingested, the system automatically analyses the content and detects any PM artifacts (frameworks, methodologies, tools) that are mentioned or explained in depth. Each detected artifact is saved as a `draft` in the artifact catalog for admin review before going live. In parallel, a draft news card is generated for the Journey news feed, also awaiting admin approval. The admin is notified in real-time via the notification bell.

**What the admin sees**:
- A notification badge appears on the bell icon in the admin nav. Clicking it reveals new entries such as "Detected: RICE Scoring" with a link to the draft artifact, and "News proposal ready" with a link to the draft news post.
- The `/admin/artifacts` page lists all artifacts, filterable by status (draft / pending review / active / archived), domain, and AI-generated flag. Drafts from detection are tagged with a purple "AI detected" badge.
- Clicking an artifact opens the editor with all fields pre-filled from the LLM output. The admin can review, edit any field, change the status to `active`, or delete.
- A "Possible duplicate" warning banner appears if the LLM flagged a near-duplicate against an existing artifact.

**Business rules**:
- Detection analyses only the first 12 000 characters of concatenated chunk text. Content with very long transcripts may not have all artifacts detected in a single pass; re-detection can be triggered manually from the content detail page.
- Detected artifacts are always created as `draft` and never surfaced to end users until an admin sets them to `active`.
- Each ingestion run creates at most one news proposal per content item (the proposal is based on the content metadata, not on individual artifacts).
- If the same content item is re-processed, detection runs again. Slugs that already exist in the DB are skipped automatically (slug uniqueness constraint).
- News proposals are created as `draft` in the news_posts table. The admin must publish them from `/admin/news` for them to appear in the Journey feed.
- Activating a content item or artifact from the admin UI also triggers a news proposal automatically (non-blocking; failures are logged but do not block the status update).

**Status**: Implemented

---

### API Security & Rate Limiting

**What it does**: Protects all AI-powered API endpoints from abuse before the product goes public. Three independent layers work together: request throttling prevents any single user from exhausting the AI budget, call timeouts prevent slow AI responses from hanging the server, and prompt safeguards prevent users from smuggling instructions into the AI through their challenge text.

**What the user sees**: Under normal usage this is invisible. If a user submits challenges too rapidly they receive a "Too many requests" error with a message indicating when they can try again. If the AI provider is unresponsive, requests fail cleanly after 30 seconds rather than spinning indefinitely.

**Business rules**:
- A user (identified by their IP address) may submit at most 5 challenges per 10-minute window. The same limit applies to the recommendations step.
- Personalised Pro-Tipp requests are limited to 10 per minute per IP.
- Analytics event logging is limited to 30 calls per minute per IP.
- All AI text generation calls time out after 30 seconds; embedding calls time out after 20 seconds. Timed-out requests return a clean error to the user rather than hanging.
- The challenge summary and personalised Pro-Tipp prompts use explicit data delimiters around user-supplied text, instructing the AI to treat that content as data to analyse rather than as instructions to follow. This limits the impact of prompt injection attempts.
- The personalised Pro-Tipp endpoint now accepts a challenge ID rather than raw summary text. The server fetches the summary directly from the database, preventing callers from substituting arbitrary text into the AI call.
- The analytics event endpoint validates event names against an allowlist of characters (letters, numbers, and a small set of separators). Freeform strings are rejected.
- The health check endpoint no longer discloses the name of the AI provider in its response.
- Rate limiting is enforced per server instance. For a multi-region or high-traffic deployment, a distributed store (such as Upstash Redis) would be required to enforce global limits across all instances.

**Status**: Implemented

---

## Data Model for PMs

The following describes what information the system stores, in plain language. Column names and technical details are omitted.

| Entity | What it represents | Key information stored | Who can access it |
|--------|-------------------|----------------------|-------------------|
| **User Profile** | One record per signed-in user | Email (via the auth system), role, company stage, team size, experience level (all context fields are optional at sign-up and filled in automatically from browser storage), admin flag, timestamps | The user themselves only (admin flag managed by operators) |
| **Challenge** | One record per challenge submitted | Raw description, AI-generated summary, problem statement, desired outcome statement, domain(s) selected, optional subdomain and impact text, link to the user who submitted it (if signed in), lifecycle status (open / in progress / completed / archived / abandoned — defaults to "open"), save state (saved / unsaved), save timestamp, display title (auto-generated on save, user-editable), and the full list of artifact recommendations stored at save time | The user themselves only (or anonymous, stored temporarily in the browser) |
| **Content Item** | One curated piece of content (podcast, article, etc.) | Title, source type, URL, domain(s); since Epic 8: topics, keywords, author, publication date, content category, language, and extraction confidence score; lifecycle status (draft, pending review, active, archived); raw transcript text; and since Epic 18: an AI-generated 2–4 sentence summary | Internal team via the Admin UI; end users see enriched metadata in the knowledge card overlay |
| **Content Chunk** | A segment of a content item, used for matching | The chunk text, an AI embedding for semantic search, a full-text index for keyword search, a pointer to its parent content item; and since Epic 8: chunk type classification and key concepts extracted by the AI | Internal service only; surfaced indirectly on artifact detail knowledge base cards |
| **Artifact** | A named PM framework or methodology in the recommendation catalog | Unique slug (URL identifier), display title, one or more practice domains, a use-case description, and pre-generated AI detail (description, suitability, thought leaders, how-to steps, generic Pro-Tipp) | Surfaced to users on recommendation cards and artifact detail pages |
| **Saved Artifact** | A record of one artifact saved to a user's personal Artifact Vault | Link to the user, link to the artifact (by slug), and the date it was saved | The user themselves only |
| **News Post** | A news item published to the Journey page news feed | Type (podcast, artifact, article), title, short description, display date (free text, e.g. "Mar 2026"), status (draft or published), sort order, and timestamps | Internal team via the Admin UI; published posts are visible to all users on the Journey page |
| **Transcript Job** | A background processing job that extracts a transcript from a URL and creates a draft content item | The source URL, detected URL type (YouTube, Podcast RSS, Podcast episode, or Web page), job status (pending / processing / completed / failed), error message if applicable, link to the resulting draft content item (once complete), and timestamps | Admin users only |
| **Content View** | A record of a signed-in user opening a knowledge card overlay for a specific content item | Link to the user, link to the content item, first-seen timestamp, last-seen timestamp, and total view count | The user themselves only (each user can only see their own view history) |

### Key rules

- User data (profiles, challenges) is access-controlled — each user can only see their own data.
- Content and content chunks are managed by the internal team via the Admin UI (`/admin/content`). Command-line scripts remain available for bulk ingestion.
- A challenge record is always created in the database when the pipeline runs (including for anonymous users). However, only **explicitly saved** challenges appear in the Journey. Unsaved challenge records are invisible to the user and are treated as abandoned.
- Signed-in users save a challenge by clicking the "Save Challenge" button on the Results page. Guests see a "Create account to save" prompt instead.
- The knowledge base is pre-seeded by the team; there is no user-generated content in the current version.
- Content items with an extraction confidence score of 0 were not successfully processed by the intelligence service and should be re-run with the backfill script.
- Artifacts are a separate catalog from content items. They are not derived from content ingestion — they are seeded directly and represent the fixed set of recommendations the AI can choose from.
- Saved Artifact records link a user to an artifact slug. Saving the same artifact a second time is silently ignored (no duplicate is created). Deleting a Saved Artifact record unsaves it; the underlying artifact is not affected.
- Challenge records now store both the AI-generated summary and the underlying problem statement and desired outcome — these are used in Phase 2 of the pipeline to generate recommendations without re-running Phase 1.
- Artifact detail content (description, how-to steps, thought leaders, generic Pro-Tipp) is pre-generated and stored on the artifact record. It is generated on first visit for any artifact that has not been through the backfill process.

---

## API Reference

All endpoints return JSON. All errors include a plain-text description of what went wrong.

| Endpoint | Purpose | Auth required | Key inputs | Key outputs |
|----------|---------|--------------|-----------|------------|
| `POST /api/challenges` | Phase 1: submit a challenge and generate the AI summary | No (works anonymously) | Challenge description, domain(s), optional context fields | Challenge ID, AI summary, problem statement, desired outcome statement |
| `POST /api/challenges/[id]/recommendations` | Phase 2: generate artifact recommendations for an existing challenge | No | Challenge ID (in URL) | 3–5 artifact recommendations (each with title, domains, use case, tailored explanation, and most-relevant flag) |
| `GET /api/artifacts/[slug]/detail` | Return the pre-generated static deep-dive content for a specific artifact | No | Artifact slug (in URL) | Description, company stage suitability, thought leaders, generic Pro-Tipp, how-to intro, numbered how-to steps |
| `POST /api/artifacts/[slug]/pro-tip` | Generate a personalised Pro-Tipp for an artifact given a specific challenge | No | Artifact slug (in URL), challenge ID (in body — the server fetches the summary from the database) | Personalised 2–3 sentence Pro-Tipp |
| `GET /api/artifacts/[slug]/knowledge` | Find knowledge base content semantically related to a specific artifact | No | Artifact slug (in URL) | Up to 5 deduplicated enriched content cards (title, author, source type, URL, summary, topics, keywords, domains, publication date, and estimated word count) |
| `GET /api/content/[id]` | Return full metadata for a single content item (used by the knowledge card overlay) | No | Content ID (in URL) | Title, source type, author, URL, publication date, domains, topics, keywords, AI-generated summary, extraction confidence, and estimated word count |
| `GET /api/content/[id]/view` | Check whether the signed-in user has viewed a specific content item | **Yes** | Content ID (in URL) | Viewed flag, first-seen timestamp, last-seen timestamp, and view count; returns 401 if unauthenticated |
| `POST /api/content/[id]/view` | Record that the signed-in user has opened a content item overlay (increments the view count on repeat opens) | **Yes** | Content ID (in URL) | Success confirmation; returns 401 if unauthenticated (client fails silently) |
| `GET /api/challenges/[id]` | Load a saved challenge with its stored recommendations | **Yes** | Challenge ID (in URL) | Full challenge record including stored artifact recommendations, title, save timestamp |
| `PATCH /api/challenges/[id]` | Save a challenge (with recommendations) or rename its title | **Yes** | Challenge ID (in URL); body: save flag, recommendations array, and/or new title | Success confirmation |
| `PATCH /api/challenges/[id]/claim` | Link an anonymous challenge to the signed-in user's account | Yes | Challenge ID (in URL) | Success confirmation |
| `POST /api/profile` | Create or update the signed-in user's profile | Yes | Role, company stage, team size, experience level | Saved profile record |
| `GET /api/journey` | Return the signed-in user's full challenge list, summary stats (total, active, completed, saved artifacts), and saved artifact list | **Yes** | None | List of challenges ordered by most recent first, stats object, and list of saved artifacts |
| `POST /api/artifacts/[slug]/save` | Save an artifact to the signed-in user's Artifact Vault | **Yes** | Artifact slug (in URL) | Confirmation that the artifact is saved |
| `DELETE /api/artifacts/[slug]/save` | Remove an artifact from the signed-in user's Artifact Vault | **Yes** | Artifact slug (in URL) | Confirmation that the artifact is unsaved |
| `GET /api/artifacts/[slug]/save` | Check whether the signed-in user has saved a specific artifact | **Yes** | Artifact slug (in URL) | Boolean indicating whether the artifact is currently saved |
| `GET /api/challenges/[id]/resume` | Return the stored phase-1 fields for a specific challenge so the client can re-enter the recommendations step without re-running phase 1 | **Yes** | Challenge ID (in URL) | Challenge summary, problem statement, desired outcome, domains, raw description |
| `POST /api/events` | Log a user interaction event for analytics | No | Event name, optional properties (artifact slug, title, etc.) | Empty response (fire-and-forget) |
| `GET /api/health` | Check that the service and AI provider are running | No | None | Status confirmation |
| `GET /api/journey/news` | Return all published news posts ordered by sort order (ascending) then creation date (newest first) | No | None | Array of published news post records (type, title, description, display date, sort order) |
| `GET /api/admin/stats` | Return dashboard headline counts for content items and news posts, broken down by status | **Admin only** | None | Content item counts by status; news post counts by status |
| `GET /api/admin/content` | Return a paginated, filterable list of all content items | **Admin only** | Optional filters: status, source type, domain, title search (query param `q`) | Paginated list of content items with chunk count |
| `POST /api/admin/content` | Create a new draft content item | **Admin only** | Source type, URL, optional title, optional transcript text | Newly created content item record |
| `GET /api/admin/content/[id]` | Return a single content item with its chunk count | **Admin only** | Content ID (in URL) | Full content item record including transcript and chunk count |
| `PATCH /api/admin/content/[id]` | Update editable metadata fields or status for a content item | **Admin only** | Any subset of: title, URL, author, domains, topics, keywords, publication date, status | Updated content item record |
| `DELETE /api/admin/content/[id]` | Hard-delete a content item (only allowed for draft or archived items) | **Admin only** | Content ID (in URL) | Success confirmation; 409 error if status is active |
| `POST /api/admin/content/[id]/process` | Trigger the ingest pipeline on a content item's stored transcript | **Admin only** | Content ID (in URL) | Number of chunks created; status advances to pending review |
| `GET /api/admin/news` | Return all news posts (all statuses) | **Admin only** | None | Full list of news post records |
| `POST /api/admin/news` | Create a new news post | **Admin only** | Type, title, description, display date, status, optional sort order | Newly created news post record |
| `GET /api/admin/news/[id]` | Return a single news post | **Admin only** | News post ID (in URL) | Full news post record |
| `PATCH /api/admin/news/[id]` | Update a news post | **Admin only** | Any subset of: type, title, description, display date, status, sort order | Updated news post record |
| `DELETE /api/admin/news/[id]` | Hard-delete a news post | **Admin only** | News post ID (in URL) | Success confirmation |
| `POST /api/admin/transcript-jobs` | Submit a URL to create a background transcript extraction job. For podcast RSS feed URLs the response includes a list of recent episodes so the admin can select one before confirming. | **Admin only** | URL (in body) | Job ID, detected URL type, and episode list (RSS feeds only); HTTP 202 on success |
| `GET /api/admin/transcript-jobs` | Return the 20 most recent transcript jobs for the current admin | **Admin only** | None | List of jobs with status, URL, URL type, and link to content item (if completed) |
| `GET /api/admin/transcript-jobs/[id]` | Return a single transcript job by ID | **Admin only** | Job ID (in URL) | Full job record including status, error message, and content item ID if completed |

### Notes on the challenge endpoints

- The submission flow runs Phase 1 then Phase 2 back-to-back on the loading screen, then redirects the user to `/results`.
- Phase 1 (`POST /api/challenges`) stores the challenge summary, problem statement, and desired outcome to the database. This is the only compute-intensive AI call in Phase 1.
- Phase 2 (`POST /api/challenges/[id]/recommendations`) reads the stored challenge fields, generates an embedding, runs hybrid matching, and calls the AI to select artifacts. The artifact catalog is filtered to challenge-relevant domains before the AI call, significantly reducing prompt size.
- The AI selects artifacts strictly from the domain-filtered catalog — it cannot return artifact names that are not in the database.
- `GET /api/challenges/[id]` returns a challenge only if it is both owned by the requesting user and has been explicitly saved (`is_saved = true`). Unsaved records return 404.
- `PATCH /api/challenges/[id]` accepts two modes: (a) save mode — marks the challenge as saved and stores the recommendations list; (b) rename mode — updates the display title only. Both modes verify ownership.

### Notes on the artifact detail endpoints

- All three artifact-related calls (`/detail`, `/pro-tip`, `/knowledge`) are fired in parallel by the client on page load.
- `/detail` is a GET request and requires no body — it always returns the stored pre-generated content.
- `/pro-tip` is only called when a `challengeSummary` is available in the client; it is skipped entirely when the user visits the artifact page without a challenge context.
- `/knowledge` uses vector similarity search — it embeds the artifact title and use case, then finds the most semantically related content chunks in the knowledge base, deduplicating to one result per content item. Since Epic 18, each returned card is enriched with the full content metadata (summary, topics, keywords, domains, publication date, word count) so the overlay can render without a second round-trip.
- A failure in any one of the three calls does not affect the other two.

### Notes on content view endpoints

- `GET /api/content/[id]/view` and `POST /api/content/[id]/view` both require authentication. A 401 response means the user is not signed in; the client ignores this silently — unauthenticated users still see the overlay but view tracking is skipped.
- On every overlay open, the client fires `POST /api/content/[id]/view` and then immediately re-fetches `GET /api/content/[id]/view` to refresh the local view state without a page reload.
- The first open creates a view record; subsequent opens increment the view count and update the last-seen timestamp. The first-seen timestamp never changes.

---

## Configuration & Tuning

All settings are controlled via environment variables. They do not require a code change to adjust.

| Setting | What it controls | Default | Range / Options | Required |
|---------|----------------|---------|----------------|----------|
| `TOP_K` | How many top content chunks are returned by the matching engine and passed to the recommendations AI. Higher values mean the AI has more context to inform its artifact selection, potentially improving recommendation quality. | — | 1–20 (integer) | **Yes** |
| `STRUCTURED_FIT_WEIGHT` | How much the domain overlap between the challenge and a content item influences its final score. | 0.3 | 0–1 (float) | No |
| `EMBEDDING_SIMILARITY_WEIGHT` | How much the AI semantic similarity between the challenge and a content chunk influences its final score. | 0.7 | 0–1 (float) | No |
| `KEYWORD_RELEVANCE_WEIGHT` | How much keyword (full-text) match relevance influences the final score. | 0.3 | 0–1 (float) | No |
| `CHUNK_SIZE` | Target size (in characters) for each content chunk during ingestion. Smaller chunks = more precise matching; larger chunks = more context per result. | 1,500 | Positive integer | No |
| `MAX_CHUNK_CHARS` | Hard maximum size (in characters) for any single content chunk. | 8,000 | Positive integer | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | — | Valid URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key (public) | — | String | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — grants full DB access, used server-side only | — | String | **Yes** |
| `OPENROUTER_API_KEY` | API key for the AI provider (OpenRouter) used for text generation and embeddings | — | String | **Yes** |
| `OPENROUTER_CHAT_MODEL` | The specific AI model used for text generation. Switching to a faster model can significantly reduce response times. | `openai/gpt-4o-mini` | Any model available on OpenRouter | No |
| `OPENROUTER_INGEST_MODEL` | The AI model used for content intelligence extraction inside background transcript jobs. Uses a model with a larger context window than the chat model so that full podcast transcripts (30–80K tokens) fit in a single call. Falls back to `OPENROUTER_CHAT_MODEL` if not set. | `google/gemini-2.0-flash` | Any model available on OpenRouter | No |
| `NEXT_PUBLIC_SITE_URL` | The public base URL of the deployment. Used to build the OAuth callback redirect URL for Google sign-in. Must be set correctly in production for Google OAuth to work. | — | Valid URL (e.g. `https://yourapp.com`) | For Google OAuth |

### Tuning guide for PMs

**"Transcript jobs are failing with a context-length error for long podcast episodes"**
- The default ingest model (`google/gemini-2.0-flash`) has a 1M token context window and should handle most transcripts. If you are using a different model via `OPENROUTER_INGEST_MODEL`, switch to one with a larger context window (1M+ tokens recommended for long-form audio).

**"Transcript job intelligence extraction feels low quality (wrong domain, poor keywords)"**
- Set `OPENROUTER_INGEST_MODEL` to a higher-capability model (e.g. `google/gemini-2.0-pro` or `anthropic/claude-3.5-sonnet`). Background jobs are not user-facing, so latency is not a concern — you can prioritise quality over speed.

**"The challenge summary loading screen takes too long (over 15 seconds)"**
- Switch to a faster model by setting `OPENROUTER_CHAT_MODEL` (e.g. `google/gemini-flash-1.5-8b` or `meta-llama/llama-3.3-70b-instruct`). This requires no code change — just an environment variable update.

**"Recommendations feel too generic or off-topic"**
- Try increasing `STRUCTURED_FIT_WEIGHT` (e.g. to 0.5) so domain alignment counts more in the final score.
- If your knowledge base has a lot of content, also try increasing `TOP_K` (e.g. to 10) so the AI has more context chunks to inform its artifact selection.

**"Recommendations feel too narrow — we're missing relevant artifacts from other domains"**
- Reduce `STRUCTURED_FIT_WEIGHT` (e.g. to 0.1) to let semantic similarity dominate.
- Ensure `EMBEDDING_SIMILARITY_WEIGHT` is at 0.7 or higher.

**"Exact-term matching matters a lot for our knowledge base (e.g. framework names, jargon)"**
- Increase `KEYWORD_RELEVANCE_WEIGHT` (e.g. to 0.5) to give more weight to the keyword search results.
- Ensure content has been processed by the Content Intelligence Service — extracted key concepts significantly enrich the keyword index.

**"Ingested content chunks feel too small / context is getting cut off"**
- Increase `CHUNK_SIZE` (e.g. to 2,500) and `MAX_CHUNK_CHARS` (e.g. to 12,000). Re-ingest the affected content for changes to take effect.

**"Some content items show extraction confidence of 0"**
- These failed the AI metadata extraction step. Run `npm run backfill-intelligence` to retry. If the issue persists, the content may be too short or too noisy for reliable extraction.

**"I want to measure whether a configuration change improved matching quality"**
- Run `npm run eval` before and after your change. Compare mean precision@3 and precision@5 between the two runs to see whether the change helped.

**"The artifact catalog needs to be expanded or updated"**
- Add new entries to the seed script and run `npm run seed-artifacts`, then run `npm run backfill-artifact-details` to pre-generate their detail pages. Both scripts are idempotent — existing records are skipped automatically.

**"An artifact detail page is slow to load"**
- This means the artifact has not yet been pre-generated. Run `npm run backfill-artifact-details` to pre-generate all 68 artifacts at once. Use the `--force` flag to regenerate all of them (e.g. after a prompt update).

**"The knowledge base carousel on an artifact detail page shows no results"**
- Knowledge cards are found via vector similarity — the system looks for semantically related content in the knowledge base. If no related content exists, the empty state is correct. Ingesting more content covering the relevant topic areas will populate the carousel over time.

**Note**: The three scoring weights (`STRUCTURED_FIT_WEIGHT`, `EMBEDDING_SIMILARITY_WEIGHT`, `KEYWORD_RELEVANCE_WEIGHT`) are additive and do not need to sum to 1. Each is applied independently to its component, and the sum becomes the final ranking score.

---

## AI Flows, Models & Prompts

This section maps every AI call in the system to its model, prompt file, output schema, and trigger. Use it as a reference when changing models, debugging inference costs, or auditing what the system does with user data.

---

### Models

Three env vars control which models are used. All calls are routed through the OpenRouter API unless `OPENROUTER_EMBEDDING_MODEL` is an `openai/*` model **and** `OPENAI_API_KEY` is set — in that case embedding calls go directly to OpenAI.

| Env var | Default | Current `.env.local` override | Used for |
|---------|---------|-------------------------------|----------|
| `OPENROUTER_CHAT_MODEL` | `openai/gpt-4o-mini` | `openai/gpt-oss-20b:nitro` | All generative tasks: challenge summary, artifact recommendations, artifact detail, content summary, artifact detection, news proposals |
| `OPENROUTER_INGEST_MODEL` | `google/gemini-2.0-flash` | _(not overridden — default used)_ | Transcript intelligence extraction. Needs 1 M+ token context window for long podcast transcripts. Falls back to `OPENROUTER_CHAT_MODEL` if unset. |
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` | _(not overridden — default used)_ | Chunk embeddings at ingest, query embeddings at match time, artifact knowledge-card retrieval. Must produce 1 536-dim vectors (pgvector index). |

---

### Flow 1 — User Challenge Pipeline (real-time)

**Trigger:** User submits a challenge via the `/flow` page.
**Execution:** Synchronous; user waits ~10–12 s on the loading screen.

| Step | Service call | Prompt file | Output schema | Model env var |
|------|-------------|-------------|---------------|---------------|
| 1. Challenge summary | `services/challenge.ts` → `generateText` | `core/prompts/challenge-summary.ts` → `buildChallengeSummaryPrompt()` | `challengeSummaryOutputSchema` — `{ structured_summary, problem_statement, desired_outcome_statement }` | `OPENROUTER_CHAT_MODEL` |
| 2. Artifact recommendations | `services/matching.ts` → `generateText` | `core/prompts/recommendations.ts` → `buildRecommendationsPrompt()` | `recommendationsOutputSchema` — `{ recommendations: [{ slug, title, domains, use_case, explanation, is_most_relevant }] }`, 1–5 items | `OPENROUTER_CHAT_MODEL` |

**No embedding call** in this flow. Embeddings are generated at ingest time and stored; at query time one embedding call is made (see Flow 2, step 3).

---

### Flow 2 — Artifact Detail & Knowledge Cards (on-demand)

**Trigger:** User opens an artifact detail page (`/artifacts/[slug]`).
**Execution:** Two parallel async calls; static content (description, how-to) loads from DB if pre-generated; falls back to an on-demand LLM call on first visit.

| Step | Service call | Prompt file | Output schema | Model env var |
|------|-------------|-------------|---------------|---------------|
| 3a. Artifact detail generation | `services/artifact-detail.ts` → `generateText` | `core/prompts/artifact-detail.ts` → `buildArtifactDetailPrompt()` | `artifactDetailOutputSchema` — `{ description, how_to_intro, how_to_steps[], thought_leaders[], pro_tip, company_stage_suitability }` | `OPENROUTER_CHAT_MODEL` |
| 3b. Knowledge card retrieval | `services/matching.ts` → `generateEmbedding` + DB queries | _(no generative prompt)_ | Vector similarity results + keyword fallback — array of content items | `OPENROUTER_EMBEDDING_MODEL` |

**Content card overlay (Epic 18):** Clicking a knowledge card opens a modal with an AI-generated summary. This is a third parallel call:

| Step | Service call | Prompt file | Output schema | Model env var |
|------|-------------|-------------|---------------|---------------|
| 3c. Content summary overlay | `services/content-summary.ts` → `generateText` | `core/prompts/content-summary.ts` → `buildContentSummaryPrompt()` | `contentSummaryOutputSchema` — `{ summary }` (2–4 sentences) | `OPENROUTER_CHAT_MODEL` |

Content summaries are pre-generated at ingest time and cached in the `content.summary` column; step 3c only fires if the cached value is missing.

---

### Flow 3 — Content Ingestion Pipeline (background job)

**Trigger:** Admin clicks "Run Ingestion" on a draft content item, or the transcript job finishes for a URL-ingested item.
**Execution:** Asynchronous background job; admin sees progress via the notification bell. Artifact detection and news proposal are non-blocking: failures are logged but do not fail the ingestion job.

| Step | Service call | Prompt file | Output schema | Model env var |
|------|-------------|-------------|---------------|---------------|
| 4a. Transcript intelligence extraction | `services/ingest.ts` → `generateText` | `core/prompts/content-intelligence.ts` → `buildContentIntelligencePrompt()` | `contentIntelligenceOutputSchema` — topics, keywords, author, publication date, content category, language, confidence score; per-chunk: type + key concepts | `OPENROUTER_INGEST_MODEL` (large context) |
| 4b. Chunk embedding generation | `services/ingest.ts` → `generateEmbedding` (per chunk) | _(no generative prompt)_ | 1 536-dim float vector stored in `content_chunks.embedding` | `OPENROUTER_EMBEDDING_MODEL` |
| 4c. Content summary generation | `services/ingest.ts` → `generateText` | `core/prompts/content-summary.ts` → `buildContentSummaryPrompt()` | `contentSummaryOutputSchema` — `{ summary }` cached to `content.summary` | `OPENROUTER_CHAT_MODEL` |
| 4d. Artifact detection | `services/artifact-detection.ts` → `generateText` | `core/prompts/artifact-detection.ts` → `buildArtifactDetectionPrompt()` | `artifactDetectionOutputSchema` — `{ artifacts: [{ title, slug, domains, use_case, description, how_to_intro, how_to_steps[], is_possible_duplicate, possible_duplicate_of }] }` | `OPENROUTER_CHAT_MODEL` |
| 4e. News proposal generation | `services/news-proposal.ts` → `generateText` | `core/prompts/news-proposal.ts` → `buildNewsProposalPrompt()` | `newsProposalOutputSchema` — `{ type, title, description, published_date }` | `OPENROUTER_CHAT_MODEL` |

Steps 4d and 4e each create a draft record (artifacts / news_posts with `status = 'draft'`) and an `admin_notifications` entry that appears in the admin notification bell in real-time via Supabase Realtime.

---

### Prompt File Reference

| File | Builder function | Zod output schema | Used in |
|------|-----------------|-------------------|---------|
| `core/prompts/challenge-summary.ts` | `buildChallengeSummaryPrompt(description, domains, context?)` | `challengeSummaryOutputSchema` | Flow 1 step 1 |
| `core/prompts/recommendations.ts` | `buildRecommendationsPrompt(summary, artifactList, context?)` | `recommendationsOutputSchema` | Flow 1 step 2 |
| `core/prompts/artifact-detail.ts` | `buildArtifactDetailPrompt(artifact, challengeContext?)` | `artifactDetailOutputSchema` | Flow 2 step 3a |
| `core/prompts/content-summary.ts` | `buildContentSummaryPrompt(title, sourceType, body)` | `contentSummaryOutputSchema` | Flow 2 step 3c; Flow 3 step 4c |
| `core/prompts/content-intelligence.ts` | `buildContentIntelligencePrompt(chunks)` | `contentIntelligenceOutputSchema` | Flow 3 step 4a |
| `core/prompts/artifact-detection.ts` | `buildArtifactDetectionPrompt(title, sourceType, chunks, existingTitles)` | `artifactDetectionOutputSchema` | Flow 3 step 4d |
| `core/prompts/news-proposal.ts` | `buildNewsProposalPrompt({ itemType, title, author?, domains?, … })` | `newsProposalOutputSchema` | Flow 3 step 4e |

---

### Cost & Token Notes

- **Flow 1** fires 2 chat calls per challenge submission. The recommendations prompt includes the full filtered artifact list (~70% token reduction vs. unfiltered, achieved by domain pre-filtering).
- **Flow 2** fires at most 1 chat call + 1 embedding call per artifact page visit. The chat call is skipped on subsequent visits because the result is cached in the DB.
- **Flow 3** fires 1 ingest call (large context — potentially 100 K+ tokens for a long transcript) + N embedding calls (one per chunk, typically 20–60 chunks) + 2 chat calls (content summary + artifact detection) + 1 chat call (news proposal) per content item.
- **Artifact detection** truncates the concatenated chunk text to 12 000 characters before sending to the chat model. For very long transcripts this means only the first ~12 K chars are analysed. If better recall is needed on long content, switch `OPENROUTER_CHAT_MODEL` to a large-context model or route the detection step through `OPENROUTER_INGEST_MODEL` instead.
- **Embedding model** must always produce 1 536-dim vectors. Changing the embedding model without re-embedding the entire knowledge base (chunks + query vectors) will break pgvector similarity search.

---

## Known Limitations & Out of Scope

The following are intentional decisions or known gaps in the current version. They are not bugs.

- **Challenge status is read-only** — users can see the status of each challenge (open, in progress, completed, etc.) but cannot manually change it through the UI. Status update controls are deferred.
- **No archetype-based matching** — the system does not classify challenges into problem archetypes (e.g. "prioritisation paralysis," "stakeholder misalignment"). Archetype boosting is planned for a future version.
- **No decision pattern logic** — the system does not apply "When X → do Y (unless Z)" rules to recommendations. Recommendations are driven purely by semantic similarity, keyword matching, and artifact selection.
- **No analytics dashboard** — user events are logged to the server console. There is no third-party analytics integration or internal dashboard in the current version.
- **No Q&A or cited-answer format** — the product returns curated artifact recommendations, not synthesised answers. A conversational or cited-answer format is explicitly out of scope.
- **No audience-targeting metadata** — artifacts and content items are not tagged by target role, company stage, or experience level. Domain overlap is the only structured signal in the matching score.
- **No per-chunk domain tagging** — domain assignments apply to the whole content item, not to individual chunks within it.
- **Unsaved challenges are unrecoverable** — a challenge record is always created when the pipeline runs, but it only appears in the Journey if explicitly saved. Guests who close the browser without signing up, and signed-in users who leave the Results page without clicking "Save Challenge", lose access to those results permanently.
- **Google OAuth requires Supabase dashboard configuration** — the "Continue with Google" button is always visible, but Google OAuth will not work until configured in the Supabase dashboard. Without this, the button returns an error.
- **Password reset ("forgot password") not yet implemented** — the login page has no forgot-password flow.
- **Email confirmation is off by default (Supabase development settings)** — in production, ensure Supabase email templates and SMTP settings are configured before going live.
- **No multi-hop or agent-based reasoning** — the matching pipeline is a single-pass retrieval and ranking. Graph databases, multi-step reasoning, and agent orchestration are non-goals.
- **Eval harness has no CI integration** — the evaluation script is run manually. It is not automatically triggered on code changes or content updates.
- **Eval precision targets are not set** — the harness measures a baseline; no minimum precision threshold is enforced or tracked automatically.
- **Artifact difficulty, progress, ratings, and comments** — the detail page does not include user progress indicators, difficulty ratings, peer comments, or social signals. These are explicitly out of scope.
- **Artifact detail for uncached artifacts loads via LLM on first visit** — if a new artifact is added but the backfill script has not been run, the first visit to that artifact's detail page triggers an on-demand LLM call (result is then cached). Run `npm run backfill-artifact-details` after adding new artifacts.
- **Artifact detection analyses only the first 12 000 characters** — for very long podcast transcripts the model sees only the opening portion of the content. Artifacts discussed later in the episode may be missed. Re-detection can be triggered manually from the content detail page in the Admin UI.
- **AI-detected artifacts require admin review before going live** — detected artifacts are always created with `status = draft`. They do not appear in the public artifact catalog or in recommendations until an admin changes the status to `active`.
- **News proposals require admin publishing** — AI-generated news cards are created with `status = draft` in the news_posts table. They do not appear in the Journey feed until an admin publishes them from `/admin/news`.
- **No deduplication across ingestion runs** — if the same content item is re-processed, artifact detection runs again. The slug uniqueness constraint prevents exact-duplicate artifacts from being inserted, but near-duplicates with a different slug may be created if the LLM generates a slightly different slug.

---

## Future Epics (Planned)

| Epic | What it would add | Status |
|------|-------------------|--------|
| Archetype classification (Layer 3 matching) | Classify challenges into 5–7 problem archetypes; boost artifacts that match the archetype profile. Improves recommendation precision for common, well-understood challenge patterns. | Planned (post-MVP) |
| Audience-targeting metadata | Tag content items and artifacts with the roles, company stages, and experience levels they are most suited to. Use this to add a role/stage/experience signal to the structured fit score. | Planned (post-MVP) |
| Decision patterns | Store "When X → do Y (unless Z)" rules in the knowledge base; surface the most applicable rule alongside recommendations. Turns the product from a content finder into a decision guide. | Planned (post-MVP) |
| Analytics pipeline | Integrate server events with a third-party analytics tool (e.g. Segment, PostHog). Enable funnel analysis, recommendation quality tracking, and content performance reporting. | Planned (post-MVP) |

---

## Changelog

| Date | Version | Epic | What changed |
|------|---------|------|--------------|
| 2026-03-10 | 4.4 | — | Added API Security & Rate Limiting: all AI-powered endpoints now enforce per-IP request limits (5 challenges per 10 minutes, 10 Pro-Tipp calls per minute, 30 analytics events per minute). All AI calls have hard timeouts (30 s for text generation, 20 s for embeddings). User-supplied text in challenge and Pro-Tipp prompts is now isolated with explicit data delimiters to limit prompt injection impact. The personalised Pro-Tipp endpoint now accepts a challenge ID and fetches the summary server-side, eliminating a free-form injection surface. Analytics event names are validated against a character allowlist. Health check no longer discloses the AI provider name. Removed the "Content Intelligence Service has no timeout guard" known limitation. |
| 2026-03-09 | 4.3 | Epic 19 | Added Smart Artifact Detection + News Proposal Pipeline: content ingestion now automatically detects new PM artifacts and generates draft news proposals using the chat model. Artifacts are inserted as `draft` records and queued for admin review. News proposals are inserted as AI-generated drafts. Both actions create real-time `admin_notifications` records (surfaced via the notification bell). Added Artifacts admin section (`/admin/artifacts`) with list view (filter by status, domain, AI-only toggle), editor form, and per-artifact status management. Dashboard stats extended with artifact counts by status and unread notification count. Admin notification bell now shows a combined badge and a combined dropdown with notifications and transcript jobs. Activating a content item or an artifact triggers a news proposal automatically. Added new section 10 (AI Flows, Models & Prompts) to this document. |
| 2026-03-09 | 4.2 | Epic 18 | Added Content Card Enrichment: knowledge base cards on the artifact detail page are now interactive. Clicking a card opens a modal overlay with an AI-generated summary, topics, keywords, domain badges, and an estimated read/listen time. Signed-in users have their views tracked per content item — a "Viewed" badge appears on previously-opened cards and the overlay shows a first-seen date and view count. Summaries are generated automatically during ingestion (and regenerated on reprocess) using a smart chunk selection strategy. Added three new API endpoints (`GET /api/content/[id]`, `GET /api/content/[id]/view`, `POST /api/content/[id]/view`), a new Content View entity in the data model, and enriched the knowledge card shape with full content metadata. Removed "No content detail screen from knowledge carousel" from Known Limitations. |
| 2026-03-09 | 4.1 | Epic 17 | Added Auto-Transcript from URL: admins can now paste any URL (YouTube video, podcast RSS feed, direct audio file, or web page) to automatically generate a transcript, extract metadata, and create a pre-filled draft content item in the background. A notification bell in the admin nav shows in-progress job count and fires a toast when a job completes. "Run Ingestion" button on the draft review page triggers embedding generation to make content searchable. Added Transcript Job to the Data Model, three new admin-only API endpoints, and a new `OPENROUTER_INGEST_MODEL` configuration setting. |
| 2026-03-08 | 4.0 | Epic 16 | Added Admin UI: a protected web interface at `/admin` for internal content and news management. Admins can create, edit, process, and delete content items; publish and manage news posts; and view a dashboard of knowledge base stats. The Journey page news feed is now live-fetched from the database (published posts only) rather than hardcoded. Added 13 new API endpoints (9 admin-only, 1 public). Updated Data Model to add News Post entity and admin flag on User Profile, and content lifecycle status on Content Item. Removed "No admin content management UI" from Known Limitations and "Content management UI" from Future Epics. |
| 2026-03-07 | 3.2 | Epic 15 | Added Artifact Vault: users can save artifacts from the detail page ("Add to Artifact Vault" / "Saved to Vault" toggle) and browse their full personal collection in a new "My Artifacts Vault" tab on the Journey page. The "Saved Artifacts" stat card on Journey now shows the real count. Added three new API endpoints for save/unsave/check. Removed "No Save to Playbook" from Known Limitations and from Future Epics. Updated Data Model and API Reference accordingly. |
| 2026-03-06 | 3.1 | — | Improved artifact knowledge card retrieval to use both vector similarity and keyword search in parallel. Vector matches are ranked first; keyword-only matches are appended, ensuring content that explicitly names the artifact is never missed. |
| 2026-03-06 | 3.0 | Epic 14 | Added explicit save flow: results now appear on a dedicated `/results` page outside the flow stepper; signed-in users save with a "Save Challenge" button, guests see a "Create account to save" prompt. Saved challenges appear on a permanent `/challenges/[id]` page with stored recommendations (no AI re-run), inline title rename, and a Rerun button that prefills the flow. Journey now shows only saved challenges and links each row to the saved challenge page. Context step gains a Skip button for signed-in users. |
| 2026-03-06 | 2.0 | Epic 13 | Added Your Journey page: a full auth-guarded workspace with three sections — a Journey Insights panel (placeholder stats, content-type chart, thought leaders), an Active Challenges card row with a resume flow that re-generates recommendations for any past challenge without re-running the AI summary phase, and a filterable Challenge History table with status badges. Added a challenge status lifecycle (open / in progress / completed / archived / abandoned). Desktop nav now shows persistent "Your Journey" and "Login" links. Added GET /api/journey and GET /api/challenges/[id]/resume endpoints. |
| 2026-03-06 | 1.7 | Epic 12 | Implemented authentication and profile MVP. The login page (`/login`) now has real Sign Up / Log In tabs and a "Continue with Google" button. Signing up after a challenge automatically links the challenge to the new account. Navigation bar shows a Login link when unauthenticated and user email + Logout when signed in. Added protected `/journey` (blank stub, redirect to listing content is next) and `/profile` (email display + change-password form) pages. Added a `PATCH /api/challenges/[id]/claim` endpoint for challenge claiming. Made PM-context profile fields optional at sign-up so bare profiles can be created immediately without requiring the user to re-enter their role and stage. Updated User Flow, Section 3.7, Data Model, API Reference, Configuration, and Known Limitations sections. |
| 2026-03-05 | 1.6 | Epic 11 (performance) | Split the challenge pipeline into two phases: Phase 1 returns the AI summary in ~10 seconds and shows the results page immediately; Phase 2 generates artifact recommendations in the background while the user reads their summary (skeleton cards shown during loading). Added an animated loading screen between challenge submission and results. Artifact detail page now loads static content (description, how-to, thought leaders) instantly from a pre-generated database record instead of via an on-demand LLM call. Pro-Tipp is now a separate, parallel API call so it no longer blocks static content from rendering. Knowledge base carousel now uses vector similarity search instead of keyword matching, fixing empty results for most artifacts. Added `npm run backfill-artifact-details` script to pre-generate all 68 artifacts. Artifact list passed to the recommendations AI is now filtered to challenge-relevant domains (~70% token reduction). Updated User Flow, Feature Reference, Data Model, API Reference, Configuration, and Known Limitations sections accordingly. |
| 2026-03-05 | 1.5 | Epic 11 | Added Artifact Detail Page (section 3.10): full-page deep-dive for any artifact, with two parallel async data sources — an LLM call generating description, company stage suitability, thought leaders, personalised Pro-Tipp, and numbered how-to steps; and a keyword RAG call returning up to 5 deduplicated knowledge base content cards. Skeleton loading states shown for both sources. Tabs (Overview / How to Use), sticky sidebar with Pro-Tipp and a non-functional "Save to Playbook" button, and a horizontal knowledge carousel. Personalisation is challenge-aware when a cid param is present; falls back to generic guidance otherwise. Added two API endpoints: POST /api/artifacts/[slug]/detail and GET /api/artifacts/[slug]/knowledge. Updated User Flow Step 3 and added Step 4. Updated API Reference with new endpoints. Removed "No artifact detail pages" from Known Limitations. Updated Known Limitations and Future Epics to reflect scope changes. |
| 2026-03-05 | 1.4 | Epic 10 | Recommendations now surface PM artifacts instead of raw content links. Added Artifact Catalog (section 3.9): 68 seeded PM frameworks from Lenny's Frameworks. Updated matching pipeline: the LLM step now selects from the known artifact list and returns artifact cards (title, domain badges, use-case, tailored explanation) instead of content URLs. Updated User Flow Step 3: clicking a recommendation navigates to the artifact detail page internally. Updated Data Model to add Artifacts entity. Added seed-artifacts script to section 3.5. Added Known Limitation for missing artifact detail pages (Epic 11). Updated Future Epics table (Epic 11 is now next). |
| 2026-03-04 | 1.3 | Epic 9 | Added Challenge Eval Harness (section 3.8): 15-challenge typed dataset, `npm run eval` script that runs hybrid retrieval against each challenge and reports mean precision@3 and precision@5 against annotated ground truth. Updated Known Limitations (eval limitations noted). Updated Future Epics table (Epic 9 removed from planned; archetype classification is now next). Added eval-specific tuning guidance in section 6. |
| 2026-03-04 | 1.2 | Epic 8 | Added Content Intelligence Service (section 3.6): automated AI extraction of topics, keywords, author, publication date, content category, language, and confidence score per content item; chunk-type classification (9 types) and key concept extraction per chunk. Updated Data Model section to reflect new metadata fields on Content Items and Content Chunks. Added tuning guidance for confidence score and key concepts. Updated Known Limitations and Future Epics table. |
| 2026-03-04 | 1.1 | 3, 4, 6, 7 | Merged Matching Engine, Recommendations, and Hybrid RAG Retrieval into a single section (3.3). Expanded keyword search documentation: stop word stripping, Snowball stemming, AND-logic matching, and ts_rank_cd normalisation. Added scoring formula table and match reason label reference. Renumbered sections 3.4–3.6 accordingly. |
| 2026-03-03 | 1.0 | all (1–7) | Initial documentation covering all seven implemented epics: context collection, challenge flow, schemas and embeddings, matching engine, recommendations and activation, multi-domain support, and hybrid RAG retrieval. |
