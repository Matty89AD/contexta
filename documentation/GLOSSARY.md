# Contexta — Glossary

> Domain knowledge reference for the Contexta product and codebase. Terms are grouped by area.

---

## Table of Contents

1. [User Profile Fields](#1-user-profile-fields)
2. [Challenge Fields](#2-challenge-fields)
3. [Content & Knowledge Base](#3-content--knowledge-base)
4. [Content Intelligence Fields](#4-content-intelligence-fields)
5. [Chunk Fields](#5-chunk-fields)
6. [Matching Engine](#6-matching-engine)
7. [Match Reason Labels](#7-match-reason-labels)
8. [PM Artefact Types (PM_Artefakt)](#8-pm-artefact-types-pm_artefakt)
9. [System & Technical Terms](#9-system--technical-terms)

---

## 1. User Profile Fields

These four fields describe who the user is. They are collected in Step 1 (Context) and used to personalise the AI summary and matching.

### role
The user's current professional role in product.

| Value | Display label |
|-------|--------------|
| `founder` | Founder |
| `cpo_director` | CPO / Director of Product |
| `head_of_product` | Head of Product |
| `sr_pm` | Sr. / Product Manager |
| `associate_pm` | Associate / Aspiring PM |

### company_stage
The current funding and growth stage of the user's organisation.

| Value | Display label |
|-------|--------------|
| `preseed_seed` | Pre-Seed / Seed |
| `series_a_b` | Series A-B |
| `growth_series_c_plus` | Growth (Series C+) |
| `enterprise` | Enterprise |
| `corporate` | Corporate |

### team_size
The number of people on the user's immediate product team.

| Value |
|-------|
| `1-5` |
| `6-15` |
| `16-50` |
| `51+` |

### experience_level
The user's overall level of experience as a product professional.

| Value | Meaning |
|-------|---------|
| `junior` | Early career; building foundational skills |
| `mid` | Independent contributor with solid experience |
| `senior` | Experienced; can lead complex work |
| `lead` | Sets direction; mentors others; manages across teams |

---

## 2. Challenge Fields

A **challenge** is the problem a user submits in Step 2. It is the central input to the matching pipeline.

### raw_description
The verbatim free-text the user types to describe their challenge. No processing applied. Stored as-is.

### domain
The primary area of product work that a challenge (or content item) belongs to. A challenge must have at least one domain. Users select from five fixed options.

| Value | Meaning |
|-------|---------|
| `strategy` | Product vision, roadmap, goals, and prioritisation |
| `discovery` | User research, problem framing, opportunity identification |
| `delivery` | Execution, sprint management, shipping, cross-functional coordination |
| `growth` | Acquisition, activation, retention, monetisation |
| `leadership` | Influence, stakeholder management, team culture, org dynamics |

### domains
An array of one or more `domain` values. Replaces the single `domain` field where multi-domain support is needed (e.g. a challenge that spans both `delivery` and `leadership`). At least one value is always required.

### subdomain
Optional free text that narrows the domain further (e.g. "OKR alignment" within `strategy`, or "opportunity solution tree" within `discovery`). Not a fixed enum — the user types it freely. Up to 200 characters.

### impact_reach
Optional free text describing who is affected by the challenge and what is at stake (e.g. "Affects the entire engineering org; blocking Q2 roadmap sign-off"). Up to 1,000 characters.

### structured_summary
An AI-generated 2–3 sentence summary of the challenge, written after the user submits. This is what the user sees at the top of the results page.

### problem_statement
The AI-distilled one-sentence formulation of the core problem, extracted from the raw description. Used as one of the inputs to the matching embedding.

### desired_outcome
The AI-distilled statement of what success looks like for the user. Used alongside `problem_statement` in the matching embedding.

---

## 3. Content & Knowledge Base

A **content item** is one curated piece of knowledge in the knowledge base. Content items are not created by end users — they are added by the team via ingestion scripts.

### source_type
What kind of content the item is. Determines how it is displayed and ingested.

| Value | Meaning |
|-------|---------|
| `podcast` | A recorded conversation or interview (typically ingested from a transcript) |
| `video` | A recorded video lesson, talk, or presentation |
| `website` | A web page, article, or online resource |
| `book` | A full-length book or extended written work |

### primary_domain
The single most relevant domain for a content item. Used when a content item is assigned to exactly one domain. Derived from the first entry in `domains` at ingest time.

### domains (on content)
An array of one or more `domain` values assigned to a content item. A podcast about both stakeholder alignment and roadmap prioritisation would have `["leadership", "strategy"]`. Domain overlap with the user's challenge domains contributes to the domain score in matching.

### url
The external URL where the content can be accessed. Shown as the destination for the "Open" button on a recommendation card. Optional — some content items (e.g. internal frameworks) may not have a public URL.

### chunk
A segment of a content item produced during ingestion. Content is split into chunks of approximately 1,500 characters, respecting paragraph boundaries. Matching operates on chunks, not on whole content items. This allows the system to surface the specific part of a podcast or article that is most relevant to the challenge.

---

## 4. Content Intelligence Fields

These fields are automatically extracted by the **Content Intelligence Service** (Epic 8) when a content item is ingested. They enrich keyword search and enable future metadata filtering.

### topics
An array of 2–6 high-level subject tags describing what the content is broadly about (e.g. `["continuous discovery", "stakeholder alignment", "roadmap planning"]`). Included in the full-text search index.

### keywords
An array of 4–10 specific terms, methodology names, or tools explicitly mentioned in the content (e.g. `["opportunity solution tree", "RICE scoring", "jobs to be done"]`). Included in the full-text search index.

### author
The name of the primary speaker, host, or author as identified by the AI (e.g. `"Teresa Torres"`). Extracted when clearly identifiable. `null` if not detectable.

### publication_date
An approximate ISO date string (`YYYY-MM-DD`) if the content's publish date is detectable. `null` otherwise.

### language
ISO 639-1 two-letter language code for the content (e.g. `"en"`). Almost always `"en"` for the current knowledge base.

### extraction_confidence
A float between `0.0` and `1.0` indicating how complete and reliable the AI metadata extraction was. A score of `0` means the extraction failed entirely. Items with a confidence of `0` should be retried with `npm run backfill-intelligence`.

---

## 5. Chunk Fields

Each **chunk** (segment of a content item) has these fields in addition to its body text and embedding.

### chunk_type
The structural or rhetorical role a chunk plays within its parent content item. Classified by the Content Intelligence Service at ingestion time.

| Value | When it applies |
|-------|----------------|
| `introduction` | Host intro, guest bio, sponsor reads — the opening framing of a podcast (first 1–2 chunks only) |
| `discussion` | Substantive interview dialogue that does not fit a more specific type; the default for mid-episode Q&A |
| `framework` | A structured model, named method, or process is described (see also: PM_Artefakt) |
| `principle` | A rule, mental model, or guideline stated as general advice |
| `example` | A concrete story, anecdote, or specific illustration of how something was applied |
| `case_study` | An extended real-world application with full context and outcome |
| `tool` | A specific technique, template, or tactical action a practitioner can directly apply |
| `warning` | An anti-pattern, common mistake, or caveat to watch out for |
| `summary` | Synthesises or recaps the broader content |

### key_concepts
An array of 0–5 specific named concepts, frameworks, methods, or products mentioned in the chunk (e.g. `["opportunity solution tree", "Shape Up", "JTBD"]`). Included in the full-text search index, so a keyword search for "opportunity solution tree" will match chunks that mention it even if that phrase doesn't appear in the main body text.

### chunk_index
Zero-based integer indicating the position of this chunk within its parent content item. Used to preserve reading order and for backfill processing.

### embedding
A 1,536-dimensional numerical vector (produced by `openai/text-embedding-3-small`) that encodes the semantic meaning of the chunk body. Used for vector similarity search. Never returned to the browser.

---

## 6. Matching Engine

The pipeline that takes a user's challenge and returns ranked content recommendations.

### semantic search (vector search)
Finds chunks whose embedding is close to the challenge embedding in vector space, using **cosine similarity**. Conceptually similar content surfaces even when different words are used. Powered by pgvector.

### keyword search (full-text search)
Finds chunks where the same words appear as in the challenge description, using PostgreSQL's built-in `tsvector`/`tsquery` engine. Useful for precise terminology, framework names, and product jargon. Stop words are stripped; remaining words are stemmed before matching. Results are ranked by `ts_rank_cd`.

### hybrid search
Using both semantic search and keyword search simultaneously. Chunks that appear in both result sets are treated as stronger matches (`hybrid` match reason).

### cosine similarity
The mathematical measure of how similar two embedding vectors are. Returns a value between `−1` and `1`; values above `0.7` indicate strong semantic similarity for this model. Used as the `semanticScore` in the scoring formula.

### domain score
A structured fit signal: `1.0` if the content item's domains overlap with the challenge's domains; `0.5` otherwise. Acts as a soft boost — never a hard filter. Weighted by `STRUCTURED_FIT_WEIGHT` (default `0.3`).

### semantic score
The cosine similarity between the challenge embedding and a chunk embedding (`0.0`–`1.0`). Weighted by `EMBEDDING_SIMILARITY_WEIGHT` (default `0.7`).

### keyword score
The `ts_rank_cd` relevance score from the full-text search, normalised to `0.0`–`1.0`. Weighted by `KEYWORD_RELEVANCE_WEIGHT` (default `0.3`).

### TOP_K
Environment variable controlling how many top-scoring chunks the retrieval layer passes to the LLM for final recommendation generation. Higher values give the LLM more candidates to choose from. Required; no code default.

### precision@3 / precision@5
Evaluation metrics from the Challenge Eval Harness. **Precision@3** = the fraction of the 3 expected "correct" content items that appear in the top 3 retrieval results. **Precision@5** = the same fraction measured against the top 5 results. Both run across all 15 test challenges and are averaged.

### ground truth
The manually annotated set of 3 expected content items per test challenge in the eval dataset (`data/ChallengeTestData.md`). Serves as the reference answer for precision scoring.

### archetype
A named pattern of challenge type (e.g. "prioritisation paralysis," "stakeholder misalignment"). Planned as a future third matching layer to boost content items that match the archetype profile. Not yet implemented.

### decision pattern
A structured rule in the form "When X → do Y (unless Z)." Planned for a future epic to turn the product from a content finder into a decision guide. Not yet implemented.

---

## 7. Match Reason Labels

Each recommendation card shows one of four labels explaining why that item was selected.

| Label | Code | Meaning |
|-------|------|---------|
| Matches your focus area | `structured_fit` | The content's domains overlap with at least one domain the user selected |
| Hybrid match | `hybrid` | The chunk appeared in both semantic search and keyword search results |
| Keyword match | `keyword` | Found by keyword search only (not by semantic similarity) |
| Semantic match | `semantic` | Found by semantic similarity only (not by keyword search) |

---

## 8. PM Artefact Types (PM_Artefakt)

**PM_Artefakt** is the umbrella term for any structured piece of product management knowledge — a named thing a PM can reference, apply, or adapt. In Contexta's knowledge base, PM artefacts are found across all content types (`source_type: podcast`, `video`, `website`, `book`) and are identified at the chunk level via `chunk_type: framework`, `tool`, `principle`, or `warning`.

| Type | Definition | Examples |
|------|-----------|---------|
| **Framework** | A named structured model or process with defined components that guides how to think about or approach a class of problem | RICE, MoSCoW, Shape Up, the Opportunity Solution Tree, JTBD, North Star Framework |
| **Playbook** | A step-by-step operational guide for a repeatable task or situation | Discovery sprint playbook, onboarding playbook, incident response playbook |
| **Method** | A systematic approach or technique that is more flexible than a framework — describes *how* to do something without being fully prescriptive | Continuous discovery, dual-track agile, structured user interviews |
| **Model** | A conceptual representation of a system, behaviour, or relationship used to reason about a problem | Business model canvas, Kano model, pirate metrics (AARRR), product-market fit model |
| **Principle** | A general rule or mental model that guides decision-making across many situations | "Outcomes over outputs," "fall in love with the problem not the solution," "be stubborn on vision, flexible on details" |
| **Rule** | A more specific, context-bound directive — often a team norm or operating agreement | "No feature ships without a success metric," "discovery and delivery run in parallel" |
| **Anti-pattern** | A commonly used approach that looks reasonable but consistently leads to bad outcomes — the opposite of a best practice | Activity-based roadmaps, HiPPO-driven prioritisation, building without validating, feature factories |
| **Template** | A reusable document structure for a recurring PM artefact | PRD template, user story template, retrospective template, OKR template |
| **Heuristic** | A practical rule of thumb derived from experience, useful when a formal framework is overkill | "If it takes less than two days, just do it," "if you need more than three metrics to explain success, simplify the goal" |

---

## 9. System & Technical Terms

### ingestion / ingest
The process of adding a content item to the knowledge base. Includes reading the source text, splitting it into chunks, generating embeddings for each chunk, extracting intelligence metadata, and saving everything to the database. Run via `npm run ingest-transcript` (single file) or `npm run ingest-content-batch` (folder).

### backfill
Re-running the Content Intelligence Service on content items that were ingested before intelligence extraction was available, or on items where extraction previously failed (`extraction_confidence = 0`). Run via `npm run backfill-intelligence`. The `--force` flag re-processes all records regardless of existing confidence score.

### tsvector / tsquery
PostgreSQL's built-in full-text search types. A `tsvector` is a pre-processed, stemmed representation of a text document stored on each chunk. A `tsquery` is the search query, similarly processed. Together they power keyword search without external tools.

### pgvector
A PostgreSQL extension that stores embedding vectors and supports efficient cosine similarity queries. The engine behind semantic search in Contexta.

### embedding model
The AI model used to convert text into numerical vectors. Contexta uses `openai/text-embedding-3-small` (via OpenRouter), which produces 1,536-dimensional vectors.

### LLM (Large Language Model)
An AI model capable of generating, summarising, classifying, and extracting information from text. Contexta uses LLMs for three tasks: challenge summarisation, content intelligence extraction, and recommendation generation. Accessed via the OpenRouter API.

### OpenRouter
The AI provider used by Contexta. Acts as a unified gateway to multiple AI models. Used for both text generation and embedding generation.

### seed
The process of populating the database with a small set of curated sample content for development and testing. Run via `npm run seed`. Uses `scripts/seed-content.ts`.

### eval harness
The internal quality measurement tool (`npm run eval`) that runs 15 synthetic test challenges through the retrieval pipeline and reports precision@3 and precision@5 against ground truth. Used to validate matching quality after knowledge base or configuration changes.
