---
name: code-review
description: Performs comprehensive code review for logging, errors, TypeScript, production readiness, React/hooks, performance, security, and architecture. Use when the user asks for a code review, review of changes, or PR review.
---

# Code Review Skill

Perform a thorough but concise code review. Systematically check the categories below, then output findings in the required format.

## Check For

### Logging
- No `console.log` (or `console.debug`/`console.info` used as debug). Use the project's logger with structured context (e.g. request id, user id, action).
- Logger levels used appropriately (error vs warn vs info).

### Error Handling
- Async code wrapped in try-catch (or equivalent) where failures can occur.
- Centralized or consistent error handlers; no swallowed errors.
- User- and log-facing messages are helpful (no raw stack traces to users, no vague "Something went wrong").

### TypeScript
- No `any`; use `unknown` and narrow, or proper types/interfaces.
- No `@ts-ignore` or `@ts-expect-error` without a short comment justifying and tracking tech debt.
- Interfaces/types for function params and return values; avoid inline object types for public APIs.

### Production Readiness
- No debug-only code paths, `alert()`, or temporary breakpoints.
- No unresolved TODOs/FIXMEs that block correctness or security (or they are tracked and scoped).
- No hardcoded secrets, API keys, or credentials; use env vars or a secrets manager.

### React / Hooks
- `useEffect`: dependency arrays complete and correct; cleanup (return fn) where needed (subscriptions, timers, listeners).
- No infinite render loops (state updates that re-trigger the same effect without a guard).
- No hooks called conditionally or after early returns.

### Performance
- No unnecessary re-renders (e.g. new object/array/function identity in props or deps every render).
- Expensive computations or derived data memoized (`useMemo`/`useCallback`) where it matters; avoid over-memoizing trivial code.

### Security
- Auth checked where required (route handlers, server actions, protected APIs).
- User/supplier inputs validated and sanitized; no raw input in queries or HTML.
- RLS (or equivalent) in place for DB access where multi-tenant or role-based access applies.

### Architecture
- Matches existing patterns (e.g. route → service → repository; no business logic in route handlers).
- Code lives in the correct directory (e.g. APIs under `app/api/`, services in `services/`, etc.).
- Dependencies flow in the allowed direction (e.g. no importing SDKs directly in domain code if an abstraction exists).

### Optional (include if relevant)
- **Accessibility**: Form labels, focus management, keyboard nav, ARIA where needed.
- **Tests**: Critical paths covered; no commented-out or skipped tests without a reason.
- **Naming**: Clear, consistent names; no single-letter or misleading variables in non-trivial code.

---

## Output Format

Use this structure for the review. Omit a section if there are no items (e.g. omit "Issues Found" if none).

```markdown
### ✅ Looks Good
- [Item 1]
- [Item 2]

### ⚠️ Issues Found
- **[SEVERITY]** [File:line] - [Issue description]
  - Fix: [Suggested fix]

### 📊 Summary
- Files reviewed: X
- Critical issues: X
- Warnings: X
```

### Severity Levels
- **CRITICAL** — Security, data loss, crashes, or undefined behavior in production.
- **HIGH** — Bugs, noticeable performance issues, or bad UX (e.g. missing error states).
- **MEDIUM** — Code quality, maintainability, or consistency with project rules.
- **LOW** — Style, naming, or minor improvements.

When suggesting fixes, be specific (e.g. "Use `logger.child({ requestId })` from `lib/logger`" not "Use a logger").

---

## Workflow

1. Identify scope: the file(s) or diff the user wants reviewed (e.g. changed files in a PR, or a path they gave).
2. Read the relevant files and any linked patterns (e.g. `CLAUDE.md`, `.cursor/rules`).
3. Run through each category above; note what’s good and what’s not, with file:line and severity.
4. Output the review in the format above and end with the Summary.
