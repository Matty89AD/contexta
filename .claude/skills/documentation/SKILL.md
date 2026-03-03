---
name: documentation
description: Reads the current codebase and all implemented epics, then writes or updates documentation/DOCUMENTATION.md with PM-focused, plain-language documentation covering user flows, features, APIs, configuration, limitations, and a changelog. Run this after /dev delivers a new epic.
argument-hint: [epic-name or "all"]
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent
---

# /documentation — PM-focused product documentation

Produce or update `documentation/DOCUMENTATION.md` to reflect the current state
of the Contexta codebase. The audience is a **Product Manager**, not an engineer.
Write in plain language: explain *what* the system does and *why*, not *how* it
is implemented. Never include raw code blocks in the final document.

## Inputs

- `$ARGUMENTS` — optional. An epic name (e.g. `epic-7`) or feature area to focus
  the changelog entry on. When omitted, do a full refresh of all sections.

---

## Phase 1 — Read existing documentation

1. Read `documentation/DOCUMENTATION.md` if it exists. Note:
   - The current version number and "Last updated" date.
   - Every section already present.
   - The existing Changelog (to append to, not overwrite).

---

## Phase 2 — Explore the codebase

Use an `Explore` subagent with `thoroughness: "very thorough"` to gather:

### Specs & requirements
- All files in `specs/*.md` — read scope, acceptance criteria, and out-of-scope.
- `requirements/spec.md` and `requirements/q-and-a.md` — product decisions and enums.

### Implemented features (what is actually in code today)
- `supabase/migrations/*.sql` — what tables and columns exist; what RPCs exist.
- `lib/db/types.ts` — the canonical enum values and data shapes.
- `services/*.ts` — what the system actually does (matching, ingestion, challenge pipeline).
- `app/api/*/route.ts` — what API endpoints exist and what inputs they accept.
- `components/flow/*.tsx`, `app/**/*.tsx` — what UI steps exist and what they collect.
- `core/config.ts` — what is configurable via environment variables.
- `core/prompts/*.ts` — what the AI generates (summaries, recommendations).
- `e2e/*.spec.ts` — what user journeys are tested (useful proxy for "what's live").

### What is NOT yet implemented
- Compare spec epic list against migration/service/component evidence. Note gaps.

---

## Phase 3 — Write the documentation

Write the complete `documentation/DOCUMENTATION.md`. Follow this exact structure.
Keep language at a business level throughout — no code, no TypeScript, no SQL.

---

### Document structure

```
# Contexta — Product Documentation

> **Version:** X.Y  |  **Last updated:** YYYY-MM-DD  |  **Audience:** Product Managers

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Flow](#2-user-flow)
3. [Feature Reference](#3-feature-reference)
   - 3.1 Context Collection
   - 3.2 Challenge Submission
   - 3.3 Matching Engine
   - 3.4 Recommendations
   - 3.5 Multi-Domain Support
   - 3.6 Hybrid RAG Retrieval
   - 3.7 Content Ingestion
   - 3.8 Authentication & Profiles
4. [Data Model for PMs](#4-data-model-for-pms)
5. [API Reference](#5-api-reference)
6. [Configuration & Tuning](#6-configuration--tuning)
7. [Known Limitations & Out of Scope](#7-known-limitations--out-of-scope)
8. [Future Epics (Planned)](#8-future-epics-planned)
9. [Changelog](#9-changelog)
```

---

### Section writing rules

**Section 1 — Product Overview**
- One-paragraph product elevator pitch.
- The core problem it solves.
- The target user persona.
- The three-step value loop (context → challenge → recommendations).

**Section 2 — User Flow**
- Write as a numbered narrative ("First the user does X. Then…").
- Cover the full journey from landing to seeing recommendations, including the auth prompt.
- Note where data is persisted (client-side vs. server) and when.
- Include edge cases: what happens if the user hits Back, refreshes, or is not logged in.

**Section 3 — Feature Reference**
Write one sub-section per implemented feature. For each feature:
- **What it does**: 1-2 plain-language sentences.
- **What the user sees**: describe the UI element or interaction.
- **What data it captures**: list in plain English (no field names).
- **Business rules**: list any rules that affect what the user can or cannot do.
- **Status**: mark as `Implemented`, `Partially implemented`, or `Planned`.

**Section 4 — Data Model for PMs**
- Do NOT show column names. Describe what information the system stores.
- Use a table: Entity | What it represents | Key fields (in plain English) | Who can access it.
- Cover: User Profiles, Challenges, Content Items, Content Chunks.
- Note what's configurable vs. hardcoded.

**Section 5 — API Reference**
- One row per endpoint in a table: Endpoint | Purpose | Who calls it | Key inputs | Key outputs.
- Use human-readable descriptions, not technical schemas.
- Flag which endpoints require authentication.

**Section 6 — Configuration & Tuning**
- Table: Setting name | What it controls (plain English) | Default | Range / Options.
- Cover every env var in `core/config.ts` plus any relevant ones in scripts.
- Add a "Tuning guide" subsection: plain-language advice on when a PM might want to change each setting (e.g. "Increase TOP_K if recommendations feel too narrow").

**Section 7 — Known Limitations & Out of Scope**
- Bullet list of what the system explicitly does NOT do today.
- Reference the relevant spec's "Out of scope" items.
- Flag user-visible limitations (e.g. "No saved history for unauthenticated users").

**Section 8 — Future Epics (Planned)**
- Table: Epic | What it adds | Status.
- Derive from spec files that have no corresponding migration/service evidence.

**Section 9 — Changelog**
- Reverse-chronological table: Date | Version | Epic | Summary of changes.
- Always append a new row; never delete old rows.
- Use the format below:

```
| Date | Version | Epic | What changed |
|------|---------|------|--------------|
| YYYY-MM-DD | X.Y | epic-N | One-sentence plain-language summary |
```

---

## Phase 4 — Versioning rules

- Version is `MAJOR.MINOR` where:
  - `MAJOR` increments when a new user-facing flow or major capability is added.
  - `MINOR` increments when a feature within an existing flow is enhanced.
- Start at `1.0` if the file does not exist yet.
- Read the existing version from the document header and increment correctly.

---

## Phase 5 — Write the file

Write the complete updated `documentation/DOCUMENTATION.md`.

Rules:
- The file is the **single source of truth** — always write the full file (not a diff).
- Every section must be present, even if a section body is "Not yet implemented."
- The Changelog section always retains all previous entries.
- Maximum one code fence in the entire document (and only if quoting a CLI command
  that a non-engineer PM might need to run, e.g. the seed command).
- Table of Contents links must use lowercase-hyphenated anchors matching the headings.
- Use clear headings, bullet points, and tables. Avoid walls of prose.

---

## Phase 6 — Commit

After writing the file:

```bash
git add documentation/DOCUMENTATION.md
git commit -F - << 'EOF'
docs: update PM documentation for $ARGUMENTS

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

---

## Quality checklist

- [ ] No code, TypeScript, SQL, or JSON in the document body.
- [ ] Every implemented feature has a sub-section; every planned feature is listed.
- [ ] Changelog has a new entry dated today.
- [ ] Table of Contents anchors all resolve (headings match links exactly).
- [ ] Configuration table covers every env var from `core/config.ts`.
- [ ] "Known Limitations" covers every "Out of scope" item from the latest spec.
- [ ] Version number incremented correctly from the previous version.
- [ ] Language is accessible to a non-technical PM — no jargon without explanation.
