---
name: code-review
description: Scans the codebase for dead code, stale imports, obsolete migrations, unused types, and leftover scaffolding. Opens a dedicated branch, applies safe removals and clean-ups, commits, and creates a GitHub PR tagged for peer review.
argument-hint: [--dry-run]
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# /code-review — Regular codebase hygiene audit

Perform a routine code health audit. Identify outdated and unused code across all layers of the
Contexta codebase, apply safe changes on a dedicated branch, and open a PR for peer review.

This skill is **not** tied to any epic. Run it at any time to keep the codebase clean.

## Inputs

- `$ARGUMENTS` — optional. Pass `--dry-run` to print the findings report without touching any
  files or creating a branch.

---

## Phase 1 — Preparation

1. Parse `$ARGUMENTS`. Set `DRY_RUN=true` if `--dry-run` is present, otherwise `DRY_RUN=false`.
2. Verify the working tree is clean before doing anything:
   ```bash
   git status --short
   ```
   If there are uncommitted changes, **stop** and tell the user to commit or stash them first.
3. Note today's date (`YYYY-MM-DD`) — used for the branch name and PR description.

---

## Phase 2 — Audit (read-only, never modify files in this phase)

Use an `Explore` subagent with `thoroughness: "very thorough"` to scan **every layer** of the
codebase. Collect findings under the categories below. For each finding record:

- **File path + line number(s)**
- **Category** (see list below)
- **Confidence**: `high` (machine-verifiable) or `medium` (needs human confirmation)
- **Safe to auto-remove?** `yes` | `no` (default `no` unless clearly unreferenced)

### Audit categories

#### A — Dead exports / unreferenced symbols
- TypeScript types, interfaces, enums, constants, and functions that are exported from a module
  but never imported anywhere in the project.
- Run:
  ```bash
  npx ts-prune --skip "node_modules|.next|scripts" 2>/dev/null | head -120
  ```
  Treat output as `medium` confidence — cross-check each symbol with a `Grep` before flagging.

#### B — Unused imports
- Files that import a symbol but never use it (`ESLint no-unused-vars` / TS `noUnusedLocals`).
- Run:
  ```bash
  npm run lint -- --format=json 2>/dev/null | node -e "
    const data = require('fs').readFileSync('/dev/stdin','utf8');
    const msgs = JSON.parse(data).flatMap(f => f.messages.filter(m => m.ruleId === 'no-unused-vars' || m.ruleId === '@typescript-eslint/no-unused-vars').map(m => f.filePath + ':' + m.line + ' — ' + m.message));
    msgs.forEach(m => console.log(m));
  " 2>/dev/null || echo "(lint JSON parse failed — check manually)"
  ```

#### C — Obsolete migrations / SQL
- Migrations that add columns or indexes that were later dropped or replaced in a subsequent
  migration. Cross-check against the latest migration file.
- Read all files in `supabase/migrations/` and trace column/index lifecycle.

#### D — Stale feature flags / env vars
- Environment variable references in source code that are no longer listed in `core/config.ts`,
  `.env.example`, or `CLAUDE.md`.
- Run:
  ```bash
  grep -rn "process\.env\." --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".next"
  ```
  Compare found vars against `core/config.ts` and CLAUDE.md's required vars list.

#### E — Commented-out code blocks
- Multi-line commented-out code (not documentation comments) that has persisted beyond a single
  commit. Flag blocks of 3+ consecutive commented lines that contain code syntax.
- Glob `**/*.ts`, `**/*.tsx`, `**/*.sql`; grep for `// ` or `/* ` patterns with inline code.

#### F — Orphaned files
- Files that are never imported and not entry points (not `app/**/page.tsx`, `app/**/route.ts`,
  `e2e/*.spec.ts`, `scripts/*.ts`, or migration files).
- Use `Glob` + `Grep` to cross-check: for each candidate file, search for its import path across
  all `.ts`/`.tsx` files. Mark as orphaned only when zero matches are found.

#### G — Duplicate / superseded logic
- Service functions, repository queries, or prompt helpers that do the same thing as a newer
  equivalent introduced in a later epic. Check git log for functions with near-identical names.

#### H — TODO / FIXME comments older than 30 days (informational only)
- Grep for `TODO`, `FIXME`, `HACK`, `XXX` in `.ts` / `.tsx` / `.sql`. Always mark these as
  **not safe to auto-remove** — list them for the PR reviewer's attention only.

---

## Phase 3 — Triage

After the audit, group findings into two lists:

### Auto-apply (safe, high-confidence only)
Changes that are safe to apply automatically:
- Unused import removal (category B) — confidence `high` only.
- Orphaned files with **zero** import references (category F) — confidence `high` only.
- Commented-out code blocks confirmed as dead (category E) — confidence `high` only.

### Review-only (PR reviewer decides)
Everything else:
- All `medium`-confidence findings.
- Dead exports (A) — may be used by external callers or future code.
- Obsolete migrations (C) — SQL is often kept for rollback history.
- Stale env vars (D) — may be legitimately absent in dev but required in prod.
- Duplicate logic (G) — may require coordinated refactor.
- TODO/FIXME comments (H).

If `DRY_RUN=true`, print both lists and **stop here**. Do not create a branch or modify files.

---

## Phase 4 — Branch

If `DRY_RUN=false` and there is at least one auto-apply finding:

```bash
git checkout -b code-review/$(date +%Y-%m-%d)
```

---

## Phase 5 — Apply safe changes

Work through the **auto-apply** list only. For each change:

1. **Read the file** before editing — never edit without reading.
2. Apply the minimal change (remove the unused import line, delete the orphaned file, remove the
   commented block). Do **not** reformat surrounding code or make unrelated edits.
3. After each file change, re-run ESLint on that file to confirm no new errors were introduced:
   ```bash
   npx eslint <file> --max-warnings=0
   ```
   If lint fails after the edit, **revert that single change** and move it to the review-only list.

After all auto-apply changes are done, run the full suite:

```bash
npm run lint && npm run build
```

If lint or build fails:
- Identify which of your changes caused it.
- Revert only that change.
- Add it to the review-only list with a note: "Reverted — caused lint/build failure."
- Re-run `npm run lint && npm run build` until clean.

---

## Phase 6 — Commit

Stage only the changed/deleted files. No `.env`, no build artifacts.

```bash
git add <list of changed files>
git commit -F - << 'EOF'
chore(code-review): remove dead imports, orphaned files, and commented-out code

Auto-applied high-confidence findings from /code-review audit (YYYY-MM-DD).
Remaining findings are listed in the PR description for reviewer action.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

If there are **zero** auto-apply findings but there are review-only findings, create an empty
commit for the PR:

```bash
git commit --allow-empty -F - << 'EOF'
chore(code-review): audit findings — no auto-apply changes (YYYY-MM-DD)

All findings require human review. See PR description.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

---

## Phase 7 — Push and open PR

```bash
git push -u origin HEAD
```

Then open the PR:

```bash
gh pr create \
  --title "chore(code-review): codebase hygiene audit YYYY-MM-DD" \
  --body "$(cat <<'PREOF'
## Code Review Audit — YYYY-MM-DD

> **Reviewer:** This PR was generated by the `/code-review` skill.
> Review each section below and decide whether to merge, adjust, or close items.

---

## Auto-applied changes

List each change made automatically in this commit:

| File | Category | Change |
|------|----------|--------|
| (populated at runtime) | | |

---

## Review-only findings (no code changes — reviewer decides)

For each item below, the reviewer should either:
- ✅ Confirm safe to remove → apply in a follow-up commit
- 🔁 Keep for now → add a comment explaining why
- ❌ False positive → close with a note

| File | Line | Category | Finding | Confidence |
|------|------|----------|---------|------------|
| (populated at runtime) | | | | |

---

## Checklist for reviewer

- [ ] All auto-applied import removals are correct (no symbol was actually used at runtime)
- [ ] Orphaned file deletions do not break any runtime or build path
- [ ] Review-only findings have been triaged (accept / defer / close)
- [ ] `npm run lint && npm run build && npm run test:e2e` passes after any additional changes
- [ ] No env vars were removed that are required in staging/production

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
)" \
  --label "code-review" \
  --label "peer-review"
```

> **Note:** If the `code-review` or `peer-review` labels do not exist in the repo, create them
> first:
> ```bash
> gh label create "code-review" --color "0075ca" --description "Automated codebase hygiene audit" 2>/dev/null || true
> gh label create "peer-review"  --color "e4e669" --description "Needs human peer review before merge" 2>/dev/null || true
> ```

After creating the PR, print the PR URL so the user can share it with another reviewer or agent.

---

## Phase 8 — Return to main branch

```bash
git checkout master
```

---

## Quality checklist

- [ ] Working tree was clean before the branch was created.
- [ ] Only auto-apply (high-confidence) changes were committed — no speculative removals.
- [ ] `npm run lint && npm run build` passes on the review branch before pushing.
- [ ] PR description lists **every** finding: both auto-applied and review-only.
- [ ] PR is labelled `code-review` and `peer-review`.
- [ ] Session ends on `master`, not on the review branch.
- [ ] If `--dry-run` was passed, no files were modified and no branch was created.
