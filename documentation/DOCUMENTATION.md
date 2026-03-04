# Contexta — Product Documentation

> **Version:** 1.1 &nbsp;|&nbsp; **Last updated:** 2026-03-04 &nbsp;|&nbsp; **Audience:** Product Managers

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Flow](#2-user-flow)
3. [Feature Reference](#3-feature-reference)
   - [3.1 Context Collection](#31-context-collection)
   - [3.2 Challenge Submission](#32-challenge-submission)
   - [3.3 Matching Engine & Recommendations](#33-matching-engine--recommendations)
   - [3.4 Multi-Domain Support](#34-multi-domain-support)
   - [3.5 Content Ingestion](#35-content-ingestion)
   - [3.6 Authentication & Profiles](#36-authentication--profiles)
4. [Data Model for PMs](#4-data-model-for-pms)
5. [API Reference](#5-api-reference)
6. [Configuration & Tuning](#6-configuration--tuning)
7. [Known Limitations & Out of Scope](#7-known-limitations--out-of-scope)
8. [Future Epics (Planned)](#8-future-epics-planned)
9. [Changelog](#9-changelog)

---

## 1. Product Overview

Contexta is an AI-powered recommendation tool for product leaders. A user describes a professional challenge they are facing — a prioritisation crisis, an unclear strategy, a misaligned team — and the system responds with 3 to 5 curated content recommendations (podcasts, articles, frameworks, playbooks, or case studies) that are most relevant to that specific challenge and context.

The core problem it solves: product leaders spend too much time searching for the right knowledge and too little time applying it. Generic search returns too much; asking a colleague takes too long. Contexta cuts through the noise by matching the user's exact situation — their role, company stage, team size, experience level, and the nature of their challenge — to a pre-curated knowledge base, using both AI embeddings and keyword matching.

**Target user persona**: Founders, CPOs, Heads of Product, Senior PMs, and Associate PMs who are actively working through a product or leadership challenge and need actionable guidance immediately.

**Three-step value loop**:
1. **Context** — Tell us who you are and where your company is.
2. **Challenge** — Describe the problem you are facing right now.
3. **Recommendations** — Receive 3–5 tailored content items with plain-language explanations of why each one is relevant.

---

## 2. User Flow

### Getting started (no account required)

The user lands on the home page and clicks **"Start with your challenge."** They are not asked to sign up. There is no email gate, no trial, and no paywall before they see value.

### Step 1 — Context (approximately 30 seconds)

The user selects four options from button groups: their **role**, their **company stage**, their **team size**, and their **experience level**. Each field has a fixed set of options (no free text). The Continue button stays disabled until all four are filled in — the user must actively confirm each field. There is no automatic advance.

The selections are saved locally in the browser. If the user refreshes or navigates away and comes back, their answers are preserved.

### Step 2 — Challenge (approximately 1–3 minutes)

The user describes their challenge in a free-text field. They also select one or more **domains** (Strategy, Discovery, Delivery, Growth, Leadership) that best describe the area their challenge falls under. Optionally they can add a subdomain and describe the impact and reach of the problem.

The **Get recommendations** button becomes active only when the description has at least 10 characters and at least one domain is selected. Clicking it triggers the AI pipeline. The button shows a loading state while results are being generated.

A **Back** button at the top returns the user to Step 1 with their context preserved.

### Step 3 — Recommendations (results in approximately 3 minutes)

The user sees their challenge summarised in 2–3 sentences by the AI, followed by 3–5 content recommendations. One recommendation is highlighted as **"most relevant."** Each item shows a title, a 1–2 sentence explanation of why it was selected, and an **Open** button.

Clicking **Open** logs the interaction and opens the content URL in a new browser tab. If a content item has no URL, the button is disabled.

At the bottom of the results page, a prompt invites the user to create an account to save their challenges and return to them later.

### Edge cases

- **Hitting Back from Step 3**: returns the user to the challenge form with their previous input intact.
- **No matching content**: if the knowledge base has no relevant content, a message appears instead of recommendations.
- **API failure**: a clear error message is shown; the user can retry.
- **Not signed in**: the full flow works without an account. Data is held in the browser until sign-up.
- **Signed in**: challenge records are saved to the user's profile in the database.

---

## 3. Feature Reference

### 3.1 Context Collection

**What it does**: Captures four pieces of information about the user before they describe their challenge. This context is used to tailor the AI summary and to influence which content is most relevant.

**What the user sees**: A form with four groups of selection buttons. No dropdowns, no text input. The user clicks one button per group.

**What data it captures**:
- Role (one of five fixed options)
- Company stage (one of five fixed options)
- Team size (one of four fixed options)
- Experience level (one of four fixed options)

**Business rules**:
- All four fields are required before proceeding.
- Selections are saved locally in the browser and persist across page refreshes.
- Changing a selection after proceeding to Step 2 is possible by clicking Back.

**Status**: Implemented

---

### 3.2 Challenge Submission

**What it does**: Collects the user's challenge description and domain(s), then triggers the full AI pipeline (summary generation, embedding, matching, recommendations).

**What the user sees**: A text area for the description, domain selection buttons, optional subdomain and impact fields, and a submit button that shows a loading state during processing.

**What data it captures**:
- Challenge description (required, 10–5,000 characters)
- Domain(s) selected (required, at least one; up to five)
- Subdomain (optional free text, up to 200 characters)
- Impact and reach (optional, up to 1,000 characters — who is affected and what is at stake)

**Business rules**:
- Description must be at least 10 characters.
- At least one domain must be selected.
- The context from Step 1 is silently attached to the submission and passed to the AI.
- If the submission fails (network error, AI error), a user-friendly error message is shown.

**Status**: Implemented

---

### 3.3 Matching Engine & Recommendations

**What it does**: Finds the most relevant content from the knowledge base for a given challenge, ranks it using three complementary scoring signals, and uses an AI model to produce 3–5 curated recommendations with plain-language explanations.

**What the user sees**: Nothing during the matching phase — this runs invisibly in the background. The output is the recommendation cards shown in Step 3 of the flow.

---

#### Pipeline overview

The full pipeline runs in sequence when the user submits their challenge:

1. **AI summary** — The challenge description and user context are sent to an AI model, which generates a concise summary and a focused problem statement.
2. **Embedding** — That combined text is converted into a numerical vector (an embedding) that captures its semantic meaning.
3. **Dual retrieval** — Two independent searches run simultaneously against the knowledge base (described below).
4. **Merge and deduplicate** — Results from both searches are combined into a single candidate list. A chunk that appeared in both searches is flagged as a stronger match.
5. **Scoring and ranking** — Every candidate is scored across three dimensions. The scores are summed into a final ranking score.
6. **LLM recommendation pass** — The top 6–8 highest-scoring chunks are sent to an AI model, which selects 3–5 items, writes a relevance explanation for each, and identifies the single most relevant one.

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

Keyword search failure is non-fatal. If the search returns no results or encounters an error (for example, if the full-text index has not yet been built for a chunk), the pipeline silently falls back to vector-only results.

---

#### Scoring formula

Each candidate chunk in the merged list receives a final score calculated as:

```
finalScore = (STRUCTURED_FIT_WEIGHT × domainScore)
           + (EMBEDDING_SIMILARITY_WEIGHT × semanticScore)
           + (KEYWORD_RELEVANCE_WEIGHT × keywordScore)
```

| Component | How it is calculated | Default weight |
|-----------|---------------------|---------------|
| **Domain score** | 1.0 if the content's domain(s) overlap with the challenge domain(s); 0.5 otherwise | 0.3 |
| **Semantic score** | Cosine similarity between the challenge embedding and the chunk embedding (0–1) | 0.7 |
| **Keyword score** | `ts_rank_cd` relevance from the full-text search, normalised (0–1) | 0.3 |

All three weights are additive and independent — they do not need to sum to 1. Each weight is configurable via environment variable (see Section 6).

Domain scoring is a soft boost: content from other domains can still appear if its semantic or keyword score is high enough. It is never a hard filter.

---

#### Match reason labels

Each recommendation surfaces a match reason label that tells the user *why* an item was selected:

| Label | Meaning |
|-------|---------|
| **Matches your focus area** (`structured_fit`) | The content's domain overlaps with at least one domain the user selected |
| **Hybrid match** (`hybrid`) | The chunk appeared in *both* the semantic search and the keyword search |
| **Keyword match** (`keyword`) | The chunk was found by keyword search but not by semantic similarity |
| **Semantic match** (`semantic`) | The chunk was found by semantic similarity only |

---

#### What the user sees in Step 3

A labelled list of 3–5 content cards. The most relevant item is visually highlighted with a "Most relevant" badge and a darker border. Each card shows:
- The content title
- A 1–2 sentence explanation of why it was selected for this specific challenge
- A match reason label
- An **Open** button linking to the content URL (disabled if no URL is available)

Exactly one item is marked "most relevant." Save and Select actions are not available; Open is the only CTA. Framework steps and thought leader suggestions are not shown in the current version.

**Status**: Implemented (domain matching, semantic similarity, keyword search, hybrid reranking, recommendations)

---

### 3.4 Multi-Domain Support

**What it does**: Allows users to select more than one domain when submitting a challenge, and ensures content that spans multiple domains is matched accordingly.

**What the user sees**: Domain buttons in the challenge step that can all be selected or deselected independently. Selecting two or more domains signals that the challenge spans multiple areas.

**Business rules**:
- At least one domain is required.
- Up to five domains can be selected simultaneously.
- Domain overlap is treated as a scoring boost, not an exclusion rule — content from domains the user did not select can still appear if it is semantically relevant.
- All existing single-domain content continues to work correctly (backward compatible).

**Status**: Implemented

---

### 3.5 Content Ingestion

**What it does**: Allows curated content (podcasts, articles, frameworks, playbooks, case studies) to be loaded into the knowledge base so it becomes available for matching.

**What the user sees**: Nothing — this is an internal process run by the team, not an end-user feature.

**What it does technically (plain English)**:
- Content is broken into chunks of approximately 1,500 characters.
- Each chunk gets an AI embedding (a numerical fingerprint) stored for semantic search.
- Each chunk also gets a full-text search index entry stored for keyword search.
- The content record is saved with its title, source type, domains, summary, and URL.

**Configuration available**:
- Chunk size target (default 1,500 characters) configurable via environment variable or command-line flag.
- Maximum chunk size (default 8,000 characters) also configurable.
- One or more domains can be assigned to each content item.

**Status**: Implemented (CLI script `npm run ingest-transcript`)

---

### 3.6 Authentication & Profiles

**What it does**: Lets users create an account to save their challenges and return to them later. Authentication is prompted after the user has already seen their recommendations — not before.

**What the user sees**: A sign-up prompt at the bottom of the results page. The link goes to a login/signup page supporting email and Google OAuth.

**What data is saved on sign-up**:
- User profile (role, company stage, team size, experience level)
- Challenge records linked to the user account

**Business rules**:
- Users can complete the full flow anonymously. Sign-up is never required to see recommendations.
- For anonymous users, challenge data is held in the browser only and is not recovered if the session ends.
- For signed-in users, challenges are saved to the database and can be retrieved later.

**Status**: Partially implemented (auth infrastructure exists; challenge history retrieval UI not yet built)

---

## 4. Data Model for PMs

The following describes what information the system stores, in plain language. Column names and technical details are omitted.

| Entity | What it represents | Key information stored | Who can access it |
|--------|-------------------|----------------------|-------------------|
| **User Profile** | One record per signed-in user | Role, company stage, team size, experience level, timestamps | The user themselves only |
| **Challenge** | One record per challenge submitted by a signed-in user | Raw description, AI-generated summary, domain(s) selected, optional subdomain and impact text, link to the user who submitted it | The user themselves only |
| **Content Item** | One curated piece of content (podcast, article, etc.) | Title, source type, URL, summary, key takeaways, domain(s), any extra metadata (e.g. author, speaker) | Internal service only (not exposed to end users directly) |
| **Content Chunk** | A segment of a content item, used for matching | The chunk text, an AI embedding for semantic search, a full-text index for keyword search, a pointer to its parent content item | Internal service only |

### Key rules

- User data (profiles, challenges) is access-controlled — each user can only see their own data.
- Content and content chunks are managed by the internal team only (no user-facing content management).
- Challenges submitted anonymously (before sign-up) are not saved to the database.
- The knowledge base is pre-seeded by the team; there is no user-generated content in the current version.

---

## 5. API Reference

All endpoints return JSON. All errors include a plain-text description of what went wrong.

| Endpoint | Purpose | Auth required | Key inputs | Key outputs |
|----------|---------|--------------|-----------|------------|
| `POST /api/challenges` | Submit a challenge; run the full AI matching and recommendation pipeline | No (works anonymously) | Challenge description, domain(s), optional context fields | Challenge summary, 3–5 recommendations with explanations, match reasons, and content URLs |
| `POST /api/profile` | Create or update the signed-in user's profile | Yes | Role, company stage, team size, experience level | Saved profile record |
| `POST /api/events` | Log a user interaction event for analytics | No | Event name, optional properties (content ID, title, etc.) | Empty response (fire-and-forget) |
| `GET /api/health` | Check that the service and AI provider are running | No | None | Status confirmation |

### Notes on the challenges endpoint

- The context fields (role, company stage, etc.) are optional at the API level; the UI always sends them when available.
- The endpoint runs the full pipeline end-to-end: it generates an AI summary, runs two searches (semantic + keyword), reranks results, and generates recommendation explanations. This is the most compute-intensive call in the product.
- Typical response time target: under 5 seconds.

---

## 6. Configuration & Tuning

All settings are controlled via environment variables. They do not require a code change to adjust.

| Setting | What it controls | Default | Range / Options | Required |
|---------|----------------|---------|----------------|----------|
| `TOP_K` | How many top content chunks are returned by the matching engine and passed to the recommendations AI. Higher values mean the AI has more content to choose from, potentially improving recommendation diversity. | — | 1–20 (integer) | **Yes** |
| `STRUCTURED_FIT_WEIGHT` | How much the domain overlap between the challenge and a content item influences its final score. | 0.3 | 0–1 (float) | No |
| `EMBEDDING_SIMILARITY_WEIGHT` | How much the AI semantic similarity between the challenge and a content chunk influences its final score. | 0.7 | 0–1 (float) | No |
| `KEYWORD_RELEVANCE_WEIGHT` | How much keyword (full-text) match relevance influences the final score. | 0.3 | 0–1 (float) | No |
| `CHUNK_SIZE` | Target size (in characters) for each content chunk during ingestion. Smaller chunks = more precise matching; larger chunks = more context per result. | 1,500 | Positive integer | No |
| `MAX_CHUNK_CHARS` | Hard maximum size (in characters) for any single content chunk. | 8,000 | Positive integer | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | — | Valid URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key (public) | — | String | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — grants full DB access, used server-side only | — | String | **Yes** |
| `OPENROUTER_API_KEY` | API key for the AI provider (OpenRouter) used for text generation and embeddings | — | String | **Yes** |

### Tuning guide for PMs

**"Recommendations feel too generic or off-topic"**
- Try increasing `STRUCTURED_FIT_WEIGHT` (e.g. to 0.5) so domain alignment counts more in the final score.
- If your knowledge base has a lot of content, also try increasing `TOP_K` (e.g. to 10) so the AI has more candidates to choose from.

**"Recommendations feel too narrow — we're missing relevant content from other domains"**
- Reduce `STRUCTURED_FIT_WEIGHT` (e.g. to 0.1) to let semantic similarity dominate.
- Ensure `EMBEDDING_SIMILARITY_WEIGHT` is at 0.7 or higher.

**"Exact-term matching matters a lot for our knowledge base (e.g. framework names, jargon)"**
- Increase `KEYWORD_RELEVANCE_WEIGHT` (e.g. to 0.5) to give more weight to the keyword search results.

**"Ingested content chunks feel too small / context is getting cut off"**
- Increase `CHUNK_SIZE` (e.g. to 2,500) and `MAX_CHUNK_CHARS` (e.g. to 12,000). Re-ingest the affected content for changes to take effect.

**Note**: The three scoring weights (`STRUCTURED_FIT_WEIGHT`, `EMBEDDING_SIMILARITY_WEIGHT`, `KEYWORD_RELEVANCE_WEIGHT`) are additive and do not need to sum to 1. Each is applied independently to its component, and the sum becomes the final ranking score.

---

## 7. Known Limitations & Out of Scope

The following are intentional decisions for the current version. They are not bugs.

- **No saved recommendations view** — users can open content immediately, but there is no page to review past challenges or saved items. Sign-up persists challenge records in the database; retrieval UI is deferred.
- **No archetype-based matching** — the system does not classify challenges into problem archetypes (e.g. "prioritisation paralysis," "stakeholder misalignment"). Archetype boosting is planned for a future version.
- **No decision pattern logic** — the system does not apply "When X → do Y (unless Z)" rules to recommendations. Recommendations are driven purely by semantic similarity and keyword matching.
- **No framework steps or thought leader suggestions** — results show content titles and relevance explanations only. Actionable step-by-step frameworks and thought leader attribution are deferred.
- **No admin content management UI** — content is added to the knowledge base via a command-line ingestion script, not a dashboard.
- **No analytics dashboard** — user events are logged to the server console. There is no third-party analytics integration or internal dashboard in the current version.
- **No Q&A or cited-answer format** — the product returns curated content links, not synthesised answers. A conversational or cited-answer format is explicitly out of scope.
- **No per-chunk domain tagging** — domain assignments apply to the whole content item, not to individual chunks within it.
- **Unauthenticated challenges are not persisted** — if a user closes the browser before signing up, their challenge and recommendations cannot be recovered.
- **No multi-hop or agent-based reasoning** — the matching pipeline is a single-pass retrieval and ranking. Graph databases, multi-step reasoning, and agent orchestration are non-goals.

---

## 8. Future Epics (Planned)

| Epic | What it would add | Status |
|------|-------------------|--------|
| Archetype classification (Layer 3 matching) | Classify challenges into 5–7 problem archetypes; boost content items that match the archetype profile. Improves recommendation precision for common, well-understood challenge patterns. | Planned (post-MVP) |
| Decision patterns | Store "When X → do Y (unless Z)" rules in the knowledge base; surface the most applicable rule alongside recommendations. Turns the product from a content finder into a decision guide. | Planned (post-MVP) |
| Challenge history & saved items | Allow signed-in users to view past challenges and their recommendations; save specific content items for later. | Planned (post-MVP) |
| Thought leaders & framework steps | Surface author/speaker attribution alongside recommendations; offer 3–5 actionable steps per recommendation. | Planned (post-MVP) |
| Analytics pipeline | Integrate server events with a third-party analytics tool (e.g. Segment, PostHog). Enable funnel analysis, recommendation quality tracking, and content performance reporting. | Planned (post-MVP) |
| Content management UI | Allow internal team members to add, edit, tag, and retire content items via a web interface rather than the CLI. | Planned (post-MVP) |
| Challenge history retrieval | Build a UI for signed-in users to browse past challenges and revisit their recommendations. | Planned (post-MVP) |

---

## 9. Changelog

| Date | Version | Epic | What changed |
|------|---------|------|--------------|
| 2026-03-04 | 1.1 | 3, 4, 6, 7 | Merged Matching Engine, Recommendations, and Hybrid RAG Retrieval into a single section (3.3). Expanded keyword search documentation: stop word stripping, Snowball stemming, AND-logic matching, and ts_rank_cd normalisation. Added scoring formula table and match reason label reference. Renumbered sections 3.4–3.6 accordingly. |
| 2026-03-03 | 1.0 | all (1–7) | Initial documentation covering all seven implemented epics: context collection, challenge flow, schemas and embeddings, matching engine, recommendations and activation, multi-domain support, and hybrid RAG retrieval. |
