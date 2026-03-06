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

- If it contains `--changed-files=` → **Fast Path (Epic Edit)**
- If the first token is `all`, or no argument is given → **Full Rewrite**
- If the first token looks like an epic name (e.g. `epic-13`) but no `--changed-files` → **Guided Epic Edit**

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
4. Determine the minimal set of edits (same as Fast Path step 4).
5. Use Edit to apply changes (same as Fast Path step 5).
6. Commit.

---

## MODE C — Full Rewrite [high token usage — only for `all`]

Use this only when `$ARGUMENTS` is `all` or blank, or when the document does not yet exist.

### Steps

1. Read `documentation/DOCUMENTATION.md` fully (in sections if needed).
2. Read `specs/*.md` — all spec files for scope.
3. Read `lib/db/types.ts`, `core/config.ts`, key services and route files.
4. Write the complete document from scratch following the document structure below.
5. Commit.

---

## Document structure (for Mode C or new sections in Modes A/B)

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

### Feature section format (Modes A/B — write only the new section)

```
### 3.N Feature Name

**What it does**: 1-2 plain-language sentences.

**What the user sees**: describe the UI element or interaction.

**Business rules**:
- Rule 1
- Rule 2

**Status**: Implemented
```

### Changelog row format (always append, never remove old rows)

```
| YYYY-MM-DD | X.Y | Epic N | One-sentence plain-language summary of what changed. |
```

---

## Versioning rules

- `MAJOR.MINOR`:
  - **MAJOR**: new user-facing page, flow, or major capability
  - **MINOR**: enhancement to an existing flow or feature
- Read current version from the document header; increment correctly.

---

## Section writing rules (for new content)

**New Feature sections** — answer four questions concisely:
1. What does this feature do (in plain English, no jargon)?
2. What does the user see / interact with?
3. What business rules apply?
4. What is the current status?

**Data Model additions** — add a row to the existing table; describe the new entity or new field in plain English without column names.

**API additions** — add rows to the existing API table: Endpoint | Purpose | Auth required | Key inputs | Key outputs.

**Known Limitations removals** — use Edit to delete the bullet(s) that this epic resolves.

**Future Epics removals** — use Edit to delete or update the row(s) that this epic delivers.

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
- [ ] Language is accessible to a non-technical PM.
