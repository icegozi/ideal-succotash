---
name: antigravity-new-task
description: Handles a new software-development task from requirement analysis and repository inspection through planning, user approval, implementation, testing, branch review, minimal patches, memory updates, and merge readiness.
---

# Antigravity New Task Workflow

## Purpose

Use this skill whenever a new development task is assigned, including:

- feature implementation;
- bug fixing;
- UI/UX changes;
- API work;
- database changes;
- refactoring;
- import/export;
- batch/job/command work;
- integrations;
- performance/security improvements;
- ticket implementation from Jira/Redmine/GitHub.

The objective is to ship the **smallest correct change safely**, while preserving the project's architecture and conventions.

Required lifecycle:

```text
READ CONTEXT
↓
UNDERSTAND REQUIREMENT
↓
INSPECT REPOSITORY
↓
IDENTIFY IMPACT
↓
CREATE PLAN
↓
STOP FOR USER REVIEW
↓
IMPLEMENT AFTER APPROVAL
↓
TEST
↓
VERIFY UI / API / DB
↓
REVIEW BRANCH AGAINST BASE
↓
APPLY MINIMAL PATCHES
↓
RETEST
↓
UPDATE MEMORY
↓
REPORT MERGE READINESS
```

---

# 1. Read Project Context First

Before creating a plan or changing code:

1. Read `MEMORY.md`.
2. Read all applicable rules in `.agents/rules/`.
3. Check relevant skills in `.agents/skills/`.
4. Inspect repository structure.
5. Inspect the current Git branch and working tree.
6. Search for similar existing implementations.

Do not code from the task description alone.

Do not create an implementation plan before reading project memory and actual source code.

If `MEMORY.md` does not exist, do not invent conventions merely to create one.

---

# 2. Understand the Requirement

Convert the request into a clear task specification.

Identify:

- objective;
- current behavior;
- expected behavior;
- affected users;
- affected screens;
- affected APIs;
- affected database entities;
- business rules;
- validation;
- permissions;
- edge cases;
- acceptance criteria.

If the task comes from a ticket, extract:

- ticket ID;
- title;
- description;
- expected result;
- reproduction steps;
- screenshots/attachments;
- comments/notes relevant to implementation.

Do not silently invent missing business requirements.

---

# 3. Classify the Task

Classify the task as one or more of:

```text
FEATURE
BUG
REFACTOR
UI_UX
DATABASE
API
BATCH_JOB
IMPORT_EXPORT
INTEGRATION
PERFORMANCE
SECURITY
TEST
OTHER
```

The classification determines what must be inspected and verified.

---

# 4. Inspect Existing Implementation

Search before creating anything new.

Inspect relevant:

- routes;
- controllers/handlers;
- services/use-cases;
- repositories/data access;
- models/entities;
- schema/migrations;
- validators/requests/DTOs;
- serializers/resources;
- frontend pages;
- shared/common components;
- state/store;
- hooks/composables;
- policies/permissions;
- tests;
- jobs/commands;
- configs;
- similar completed features.

Prefer project consistency over introducing a new pattern.

---

# 5. Inspect Project Conventions

Determine actual conventions for:

- naming;
- folder structure;
- service architecture;
- validation;
- API response format;
- exception handling;
- logging;
- database transactions;
- UI/form components;
- confirmation/error dialogs;
- toast/notification;
- tests;
- migration style;
- typing;
- comments.

Existing project conventions have priority over generic preferences unless the user explicitly requests a change.

---

# 6. Check Git State

Before modification, inspect:

```bash
git branch --show-current
git status --short
```

Identify:

- current branch;
- staged changes;
- unstaged changes;
- untracked files;
- unrelated work that must be preserved.

Never destroy unrelated local changes.

Do not use destructive Git commands unless explicitly requested and safe.

If a new branch is required, follow repository naming conventions. If none are documented, propose a concise task-based name.

---

# 7. Impact Analysis

Create an impact table before planning:

| Area | Impact | Files / Modules | Risk |
|---|---|---|---|
| UI | ... | ... | Low/Medium/High |
| API | ... | ... | ... |
| Database | ... | ... | ... |
| Business logic | ... | ... | ... |
| Permissions | ... | ... | ... |
| Tests | ... | ... | ... |

Check for:

- backward compatibility;
- shared components/services;
- downstream consumers;
- schema migration risk;
- concurrency;
- caching;
- events/queues;
- import/export dependencies;
- responsive/mobile impact.

---

# 8. Business Rule Analysis

Derive business rules from:

- task requirements;
- existing code;
- tests;
- `MEMORY.md`;
- similar flows.

Document important rules explicitly.

Example:

```text
BR-01: Confirmed documents cannot be edited directly.
BR-02: Expired medicine batches cannot be issued.
BR-03: Email must be unique when present.
```

Do not change existing business behavior unless the task requires it.

If the new requirement conflicts with an existing rule, report the conflict in the plan.

---

# 9. Edge Cases

Identify only relevant edge cases, such as:

- null;
- empty;
- zero;
- duplicate;
- invalid status;
- expired data;
- missing relation;
- concurrent update;
- permission denied;
- API/network failure;
- large dataset;
- pagination;
- no search results;
- mobile viewport.

Do not overengineer impossible scenarios.

---

# 10. Security Review

When relevant, inspect:

- authentication;
- authorization;
- ownership;
- uploads;
- external requests;
- secrets;
- query construction;
- HTML rendering;
- redirects;
- webhooks;
- admin actions.

Backend must enforce permissions when required.

Never rely only on hidden frontend buttons.

Never hard-code secrets.

---

# 11. Database Review

If database behavior is affected, inspect:

- schema;
- migrations;
- indexes;
- foreign keys;
- unique constraints;
- nullable/default behavior;
- data volume;
- existing migration conventions.

Prefer additive/backward-compatible migrations.

Do not edit old deployed migrations unless that is explicitly the project convention.

Flag destructive changes clearly.

---

# 12. API Review

If API behavior is affected, inspect:

- route;
- HTTP method;
- request fields;
- validation;
- authorization;
- response shape;
- status codes;
- error format;
- frontend/external consumers.

Do not accidentally change an API contract.

---

# 13. UI Review

If UI is affected, inspect:

- shared/common components;
- design system;
- responsive behavior;
- form patterns;
- inline validation;
- confirmation dialogs;
- error dialogs;
- success toasts;
- loading/empty/error states;
- permissions;
- navigation.

Reuse approved common components whenever possible.

Do not redesign unrelated screens.

---

# 14. Minimal Change Principle

Implement the smallest safe change that fully satisfies the task.

Avoid:

- unrelated refactoring;
- mass formatting;
- unnecessary renaming;
- speculative abstractions;
- unnecessary dependencies;
- architecture rewrites;
- unrelated cleanup.

A new task is not permission to rewrite the project.

---

# 15. Mandatory Plan Before Coding

After inspection, produce:

# Task Analysis

## 1. Requirement Summary

## 2. Current Behavior

## 3. Expected Behavior

## 4. Relevant Existing Implementation

## 5. Business Rules

## 6. Impact Analysis

## 7. Edge Cases

## 8. Proposed Solution

## 9. File Change Plan

| Action | File | Change | Reason | Risk |
|---|---|---|---|---|

Allowed actions:

```text
CREATE
UPDATE
DELETE_LATER
NO_CHANGE
```

## 10. Database Plan

If applicable.

## 11. API Plan

If applicable.

## 12. UI Plan

If applicable.

## 13. Test Plan

## 14. Regression Plan

## 15. Risks

## 16. Suggested MEMORY.md Updates

Proposal only at planning stage.

## 17. Acceptance Criteria

---

# 16. Approval Gate — Critical

After presenting the plan:

**STOP.**

Do not:

- edit production code;
- create migrations;
- install packages;
- refactor source;
- modify tests;
- update `MEMORY.md`.

End with:

```text
PLAN READY FOR REVIEW

No implementation has been performed.

Please review:
- proposed solution;
- affected files;
- business-rule handling;
- database/API/UI impact;
- edge cases;
- testing strategy;
- migration/regression risk.

I will wait for explicit approval before modifying the codebase.
```

Implementation begins only after explicit approval.

If the user requests plan changes, update the plan only and STOP again.

---

# 17. Re-read Before Implementation

After approval:

1. Re-read `MEMORY.md`.
2. Re-read applicable `.agents/rules/`.
3. Re-read the final approved plan.
4. Re-check `git status`.
5. Confirm there are no new conflicting changes.

Only then implement.

---

# 18. Implementation Rules

During implementation:

- follow the approved plan;
- follow existing architecture;
- reuse existing components/services/helpers;
- preserve public contracts unless approved otherwise;
- keep business logic in the appropriate layer;
- avoid duplicated logic;
- use strong typing where applicable;
- remove debug code;
- avoid unnecessary dependencies.

Comments:

- English only;
- explain WHY, not obvious WHAT;
- normally no more than 3 lines;
- no commented-out code.

---

# 19. Validation

Frontend validation improves UX.

Backend validation protects the system.

Never rely on frontend validation alone.

Validate applicable:

- required fields;
- types;
- formats;
- ranges;
- status transitions;
- permissions;
- business constraints.

Follow project validation conventions.

---

# 20. Error / Confirmation / Success Feedback

Use project common components when available.

Default UX decision matrix:

| Situation | Preferred UI |
|---|---|
| Field validation | Inline field error |
| Form-level validation | Inline/form summary |
| Successful create/update/save | Success toast |
| Non-blocking request failure | Error toast |
| Destructive/high-impact action | Confirmation dialog |
| Blocking error requiring acknowledgement | Error dialog |

Never expose raw SQL errors, stack traces, internal paths, secrets, or raw framework exceptions to users.

---

# 21. Transactions

Use transactions for multi-write operations that must be atomic.

Examples:

- inventory changes;
- invoice confirmation;
- document status transitions;
- payment changes;
- reversal workflows.

Do not allow partial success where consistency is required.

---

# 22. Concurrency

When concurrent writes can violate business rules:

```text
lock
↓
revalidate
↓
update
↓
commit
```

Use supported database/application locking.

Do not trust stale frontend state for critical writes.

---

# 23. UI Implementation Rules

For UI changes:

- reuse common form components;
- reuse shared modal/dialog/toast components;
- preserve design system;
- handle loading;
- handle empty state;
- handle error state;
- prevent duplicate submit where needed;
- preserve responsive behavior;
- preserve accessibility.

A successful build does not prove the UI works.

---

# 24. Responsive Verification

When UI changes, verify representative viewports when possible:

```text
Mobile: 360–390px
Mobile wide: 414–430px
Tablet: ~768px
Desktop: ~1280px
Large desktop: ~1440px+
```

Use project-specific breakpoints when documented.

Check:

- overflow;
- wrapping;
- tables;
- modals;
- action visibility;
- navigation;
- touch targets;
- sticky overlap.

---

# 25. Automated Testing

Run relevant existing tests.

Add tests for important new behavior when infrastructure exists.

Prioritize:

- business rules;
- validation;
- state transitions;
- permissions;
- calculations;
- transaction rollback;
- concurrency-sensitive behavior;
- regression cases.

Test behavior, not implementation details.

---

# 26. UI Testing

For changed UI, verify actual flows when browser/UI capability exists.

Check applicable:

- page load;
- navigation;
- form inputs;
- validation;
- submit;
- success feedback;
- error feedback;
- confirmation modal;
- toast;
- table;
- search;
- filter;
- pagination;
- responsive behavior.

Also check:

- browser console;
- relevant network requests.

Fix implementation-caused defects and retest.

---

# 27. API Testing

If APIs changed, verify:

- method;
- endpoint;
- request payload;
- successful response;
- validation error;
- permission failure;
- business-rule failure;
- response contract.

Do not infer API correctness solely from the UI.

---

# 28. Database Verification

If database behavior changed, verify:

- migration success;
- constraints;
- indexes;
- referential integrity;
- null/duplicate behavior;
- transaction behavior;
- rollback behavior where applicable.

Do not run destructive database operations casually.

---

# 29. Regression Testing

Identify existing flows that can be affected.

Examples:

```text
shared component change
→ check another screen using it

inventory logic change
→ check stock-in and stock-out

auth middleware change
→ check login/logout/protected routes

search form change
→ check pagination/query-string behavior
```

Do not test only the new happy path.

---

# 30. Mandatory Tested Table

After implementation provide:

| # | Scenario | Method | Expected | Actual | Status |
|---|---|---|---|---|---|

Allowed status:

```text
PASS
FAIL
NOT TESTED
BLOCKED
```

Never fabricate PASS.

Never hide failed tests.

---

# 31. Review Branch Against Base

After implementation/testing, review the branch against the correct integration branch.

Determine actual base:

1. `develop` when used;
2. otherwise `main`;
3. otherwise repository-equivalent base.

Inspect:

```bash
git branch --show-current
git status --short
git branch --all
git diff --stat <base>...HEAD
git diff --name-status <base>...HEAD
git diff <base>...HEAD
git diff
git diff --cached
```

Do not miss staged or unstaged changes.

---

# 32. Review Severity

Classify findings into exactly three levels.

## CRITICAL

Merge-blocking.

Examples:

- data corruption;
- security vulnerability;
- authorization bypass;
- broken main workflow;
- race condition affecting critical state;
- unsafe migration;
- negative inventory;
- build/start failure;
- critical test failure.

## IMPORTANT

Should normally be fixed before merge.

Examples:

- missing validation;
- missing transaction;
- important edge case;
- significant N+1;
- architecture violation;
- major UI regression;
- missing important test.

## MINOR

Non-blocking cleanup.

Examples:

- naming;
- low-risk readability;
- small visual inconsistency;
- minor comment cleanup.

Do not invent findings.

Use evidence.

---

# 33. Minimal Patch Principle During Review

Fix findings with the smallest safe patch.

Avoid:

- unrelated refactoring;
- architecture rewrites;
- broad formatting;
- unnecessary dependency changes;
- unrelated renaming.

Priority:

```text
CRITICAL
↓
IMPORTANT
↓
MINOR only when safe and trivial
```

Retest after CRITICAL and IMPORTANT patches.

---

# 34. Review Findings Table

Use:

| # | Severity | File / Area | Finding | Risk | Minimal Patch | Status |
|---|---|---|---|---|---|---|

Status:

```text
FIXED
OPEN
ACCEPTED RISK
NOT APPLICABLE
```

Keep discovered-and-fixed findings visible.

---

# 35. Final Merge Gate

Return exactly one:

```text
READY TO MERGE
READY TO MERGE WITH ACCEPTED RISKS
NOT READY TO MERGE
```

`READY TO MERGE` requires:

- no unresolved CRITICAL findings;
- no merge-blocking IMPORTANT findings;
- relevant tests pass;
- build/type-check/lint pass where applicable;
- UI verified where applicable;
- final branch diff reviewed;
- no accidental secrets;
- no debug artifacts;
- no unresolved conflict markers.

---

# 36. Memory Update

After implementation/review, update `MEMORY.md` only for durable knowledge.

Examples:

- business rule;
- architecture convention;
- reusable coding convention;
- recurring pitfall;
- compatibility constraint;
- explicit user correction.

Do not store:

- secrets;
- credentials;
- temporary logs;
- one-off implementation details.

If a new correction conflicts with old memory, update the old rule instead of appending contradictory entries.

---

# 37. Final Response Format

Use:

# Task Completed

## Implemented

## Files Changed

## Business Rules Applied

## Database / API / UI Impact

Only applicable areas.

## Automated Verification

Only commands actually run.

## UI / API Verification

Only flows actually verified.

## Tested Scenarios

| # | Scenario | Method | Expected | Actual | Status |
|---|---|---|---|---|---|

## Branch Review

| # | Severity | File / Area | Finding | Minimal Patch | Status |
|---|---|---|---|---|---|

## Issues Found and Fixed

## Not Tested

Explicitly state anything not verified.

## Memory Updated

## Merge Gate

One of:

```text
READY TO MERGE
READY TO MERGE WITH ACCEPTED RISKS
NOT READY TO MERGE
```

Do not claim universal "bug free".

Use precise wording such as:

```text
No defects were found in the tested scenarios.
```

when accurate.

---

# 38. Definition of Done

A task is complete only when all applicable items are satisfied:

- [ ] `MEMORY.md` read before planning.
- [ ] Applicable rules read.
- [ ] Repository inspected.
- [ ] Similar implementation searched.
- [ ] Requirement understood.
- [ ] Business rules identified.
- [ ] Impact analysis completed.
- [ ] Edge cases identified.
- [ ] Plan presented.
- [ ] User approved the plan.
- [ ] Implementation follows approved plan.
- [ ] Existing architecture preserved.
- [ ] Backend validation added where required.
- [ ] Backend authorization added where required.
- [ ] Transactions used where required.
- [ ] Concurrency considered where relevant.
- [ ] No unnecessary dependency introduced.
- [ ] No debug artifacts remain.
- [ ] Comments follow project rules.
- [ ] Relevant automated tests pass.
- [ ] UI tested where applicable.
- [ ] API tested where applicable.
- [ ] Database behavior verified where applicable.
- [ ] Regression-sensitive flows checked.
- [ ] Browser console checked where applicable.
- [ ] Network requests checked where applicable.
- [ ] Responsive behavior checked where applicable.
- [ ] Tested table produced.
- [ ] Branch reviewed against correct base.
- [ ] CRITICAL/IMPORTANT findings fixed or explicitly reported.
- [ ] Final diff re-reviewed.
- [ ] Memory updated when durable knowledge was discovered.
- [ ] Merge gate reported.

If an applicable item is incomplete, do not report the task as fully verified.

---

# 39. Core Principle

Do not optimize for writing code quickly.

Optimize for shipping the smallest correct change safely.

```text
UNDERSTAND
↓
INSPECT
↓
PLAN
↓
USER REVIEW
↓
IMPLEMENT
↓
VERIFY
↓
REVIEW DIFF
↓
PATCH MINIMALLY
↓
RETEST
↓
MERGE SAFELY
```

**Code written is not the same as task complete.**
