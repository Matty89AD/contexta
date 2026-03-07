---
name: documentation
description: Reads the current codebase and all implemented epics, then writes or updates documentation/DOCUMENTATION.md with PM-focused, plain-language documentation covering user flows, features, APIs, configuration, limitations, and a changelog. Run this after /dev delivers a new epic.
argument-hint: [epic-name or "all"]
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /documentation — PM-focused product documentation

Produce or update `documentation/DOCUMENTATION.md` to reflect the current state
of the Contexta codebase. The audience is a **Product Manager**, not an engineer.
Write in plain language: explain *what* the system does and *why*, not *how* it
is implemented. Never include raw code blocks in the final document.

## Inputs

- `$ARGUMENTS` — optional. An epic name (e.g. `epic-13`) or `all` for a full refresh.
  May also include `--changed-files=...` and `--summary=...` passed by `/dev`.

---

## Mode selection — choose ONE of the three modes below

Parse `$ARGUMENTS`:

- If it contains `--changed-files=` → **Mode A — Fast Path (Epic Edit)**
- If the first token is `all`, or no argument is given → **Mode C — Full Rewrite**
- If the first token looks like an epic name (e.g. `epic-13`) but no `--changed-files` → **Mode B — Guided Epic Edit**

---

## MODE A — Fast Path (Epic Edit) [preferred, lowest token usage]

Use this when `/dev` has passed `--changed-files` and `--summary`.

**Token budget: minimal. Do NOT read the entire DOCUMENTATION.md.**

### Steps

1. **Read only the header and changelog of the existing doc** (first 30 lines + last 30 lines):
   - Extract current version number and "Last updated" date.
   - Note the most recent changelog entry so you don't duplicate it.

2. **Read the spec file** for the epic (`specs/*<epic>*.md`) — scope, out-of-scope, acceptance criteria only. Skim, don't read every line.

3. **Read only the changed files** listed in `--changed-files=` — enough to understand what's new. Skip files you don't need (e.g. migration SQL is rarely needed for documentation prose).

4. **Determine what needs to change** in the document:
   - New feature section(s) to add (after the last 3.x section)
   - Sections that need updating (e.g. section 3.7 if auth changed, section 4 if data model changed)
   - Lines in Known Limitations to remove (if the epic resolves a limitation)
   - Lines in Future Epics to remove or update (if the epic was planned)
   - The version header (increment version, update date)
   - The Table of Contents (add new section links if any)
   - The Changelog row to append

5. **Make all changes using Edit** — one Edit call per change. Do NOT rewrite the full file.
   - Update the version header line
   - Add new ToC entry after the last feature entry
   - Add new feature section after the last existing feature section
   - Update any changed sections
   - Remove resolved limitations
   - Remove completed future epics
   - Append changelog row

6. **Commit** (see Phase 6 below).

---

## MODE B — Guided Epic Edit [moderate token usage]

Use this when an epic name is given but no `--changed-files`. You must infer what changed.

### Steps

1. Read the spec file (`specs/*<epic>*.md`) fully.
2. Read only the header + ToC + Changelog of `documentation/DOCUMENTATION.md` (first 30 lines + last 50 lines) to get the version and existing structure.
3. Read only the files most likely changed by this epic:
   - The new/changed service file(s)
   - The new/changed API route(s)
   - The new/changed component(s)
   - `lib/db/types.ts` if the spec mentions DB changes
4. Determine the minimal set of edits (same as Mode A step 4).
5. Use Edit to apply changes (same as Mode A step 5).
6. Commit.

---

## MODE C — Full Rewrite [high token usage — only for `all` or first-time]

Use this only when `$ARGUMENTS` is `all` or blank, or when the document does not yet exist.

### Steps

1. Read `documentation/DOCUMENTATION.md` fully (in sections if needed).
2. Read all spec files in `specs/*.md` — scope, acceptance criteria, out-of-scope.
3. Read `requirements/spec.md` and `requirements/q-and-a.md` — product decisions and enums.
4. Read implemented features from code:
   - `supabase/migrations/*.sql` — what tables and columns exist; what RPCs exist.
   - `lib/db/types.ts` — canonical enum values and data shapes.
   - `services/*.ts` — what the system actually does.
   - `app/api/*/route.ts` — what API endpoints exist and what inputs they accept.
   - `components/flow/*.tsx`, `app/**/*.tsx` — what UI steps exist.
   - `core/config.ts` — what is configurable via environment variables.
   - `core/prompts/*.ts` — what the AI generates.
   - `e2e/*.spec.ts` — what user journeys are tested.
5. Write the complete document from scratch following the document structure below.
6. Commit.

---

## Document structure

```
# Contexta — Product Documentation

> **Version:** X.Y  |  **Last updated:** YYYY-MM-DD  |  **Audience:** Product Managers

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Flow](#2-user-flow)
3. [Feature Reference](#3-feature-reference)
   - [3.1 Feature Name](#31-feature-name)
   ...
4. [Data Model for PMs](#4-data-model-for-pms)
5. [API Reference](#5-api-reference)
6. [Configuration & Tuning](#6-configuration--tuning)
7. [Known Limitations & Out of Scope](#7-known-limitations--out-of-scope)
8. [Future Epics (Planned)](#8-future-epics-planned)
9. [Changelog](#9-changelog)
```

---

## Section writing rules (Mode C full sections; Modes A/B new sections only)

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
- **Business rules**: list any rules that affect what the user can or cannot do.
- **Status**: mark as `Implemented`, `Partially implemented`, or `Planned`.

Feature section format (for new sections in Modes A/B):

```
### 3.N Feature Name

**What it does**: 1-2 plain-language sentences.

**What the user sees**: describe the UI element or interaction.

**Business rules**:
- Rule 1
- Rule 2

**Status**: Implemented
```

**Section 4 — Data Model for PMs**
- Do NOT show column names. Describe what information the system stores.
- Use a table: Entity | What it represents | Key fields (in plain English) | Who can access it.
- Cover: User Profiles, Challenges, Content Items, Content Chunks.
- Note what's configurable vs. hardcoded.

**Section 5 — API Reference**
- One row per endpoint: Endpoint | Purpose | Auth required | Key inputs | Key outputs.
- Use human-readable descriptions, not technical schemas.
- Flag which endpoints require authentication.

**Section 6 — Configuration & Tuning**
- Table: Setting name | What it controls (plain English) | Default | Range / Options.
- Cover every env var in `core/config.ts` plus any relevant ones in scripts.
- Add a "Tuning guide" subsection: plain-language advice on when a PM might want to change each setting.

**Section 7 — Known Limitations & Out of Scope**
- Bullet list of what the system explicitly does NOT do today.
- Reference the relevant spec's "Out of scope" items.
- Flag user-visible limitations.

**Section 8 — Future Epics (Planned)**
- Table: Epic | What it adds | Status.
- Derive from spec files that have no corresponding migration/service evidence.

**Section 9 — Changelog**
- Reverse-chronological table: Date | Version | Epic | Summary of changes.
- Always append a new row; never delete old rows.

Changelog row format:

```
| YYYY-MM-DD | X.Y | Epic N | One-sentence plain-language summary of what changed. |
```

---

## Versioning rules

- Version is `MAJOR.MINOR` where:
  - `MAJOR` increments when a new user-facing flow or major capability is added.
  - `MINOR` increments when a feature within an existing flow is enhanced.
- Start at `1.0` if the file does not exist yet.
- Read the existing version from the document header and increment correctly.

---

## Phase 6 — Commit

```bash
git add documentation/DOCUMENTATION.md
git commit -F - << 'EOF'
docs: update PM documentation for $ARGUMENTS

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

---

## Quality checklist (check before committing)

- [ ] Version number incremented correctly.
- [ ] "Last updated" date is today.
- [ ] New feature section added with Status: Implemented.
- [ ] ToC updated with new section link.
- [ ] Changelog has one new row (most recent, at top of table).
- [ ] Resolved limitations removed from section 7.
- [ ] Completed epics removed or updated in section 8.
- [ ] No raw code, TypeScript, SQL, or JSON in the document body.
- [ ] Language is accessible to a non-technical PM — no jargon without explanation.
