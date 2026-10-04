---
trigger: always_on
description: "Mandatory post-implementation branch review against develop/main with Critical, Important, and Minor findings, minimal safe patches, regression checks, and merge-gate reporting."
---

# Branch Code Review & Pre-Merge Gate

This rule applies after implementation work is complete and before the task is reported as ready to merge.

The purpose is to review ONLY the changes introduced by the current branch, compare them against the correct base branch, identify merge risks, apply the smallest safe fixes, verify the result, and produce a clear merge recommendation.

The severity model is:

- CRITICAL
- IMPORTANT
- MINOR

These correspond to the requested review groups:
- "circle / circal" → CRITICAL
- "impotain / importian" → IMPORTANT
- "mirror" → MINOR

---

# 1. Mandatory Review Timing

After coding is complete, but BEFORE declaring the task complete or ready to merge:

1. Read `MEMORY.md`.
2. Read applicable rules under `.agents/rules/`.
3. Verify the current Git branch.
4. Determine the correct comparison branch.
5. Review the complete branch diff.
6. Run applicable tests and static checks.
7. Classify findings as CRITICAL, IMPORTANT, or MINOR.
8. Apply only the minimum safe patches required.
9. Retest after patches.
10. Re-review the final diff.
11. Provide a merge-gate report.

Do not skip the review because automated tests already pass.

Passing tests do not prove the branch is safe to merge.

---

# 2. Determine the Base Branch

Use the repository's actual branch structure.

Preferred base branch order:

1. `develop`, when the feature branch is normally merged into `develop`.
2. `main`, when `develop` does not exist or the repository uses `main` as the integration branch.
3. `master`, only when the repository actually uses it.

Do not assume the branch name.

Inspect the repository first.

Useful commands may include:

```bash
git branch --show-current
git branch --all
git status --short
```

Prefer local repository state first.

Do not run destructive Git commands.

Do not switch branches if switching could overwrite uncommitted work.

---

# 3. Use the Merge Base

Review branch changes relative to the common ancestor with the base branch.

Prefer three-dot comparison:

```bash
git diff <base>...HEAD
```

Also inspect:

```bash
git diff --stat <base>...HEAD
git diff --name-status <base>...HEAD
```

When useful:

```bash
git log --oneline --decorate <base>..HEAD
```

This prevents unrelated changes already present in the base branch from being incorrectly attributed to the current branch.

---

# 4. Include Uncommitted Work

The review must not ignore local changes.

Inspect:

```bash
git status --short
git diff
git diff --cached
```

If the current implementation includes uncommitted changes, review them too.

The final report must explicitly state whether the review covered:

- committed branch changes;
- staged changes;
- unstaged changes;
- untracked files relevant to the task.

Do not claim the entire implementation was reviewed if some local changes were excluded.

---

# 5. Scope of Review

Review the current branch for:

## Correctness

- wrong business logic;
- incorrect condition;
- wrong calculation;
- incorrect state transition;
- broken validation;
- incorrect API behavior;
- incorrect database behavior;
- off-by-one errors;
- incorrect date/time behavior;
- null/undefined issues;
- incorrect error handling.

## Architecture

- logic placed in the wrong layer;
- duplicated domain logic;
- unnecessary abstraction;
- violation of existing project architecture;
- cross-layer coupling;
- circular dependency;
- unnecessary dependency introduction.

## Security

- missing authorization;
- trusting frontend data;
- SQL injection risk;
- XSS risk;
- unsafe file handling;
- exposed secrets;
- raw internal errors;
- insecure direct object reference;
- missing ownership checks;
- unsafe mass assignment.

## Database

- unsafe migration;
- missing transaction;
- race condition;
- possible negative inventory;
- duplicate data;
- missing or incorrect constraint;
- poor index strategy;
- N+1 queries;
- query inside loops;
- incorrect nullable/default behavior;
- destructive schema changes.

## API

- accidental contract changes;
- wrong HTTP status;
- inconsistent response shape;
- missing validation;
- missing error mapping;
- breaking field rename;
- unexpected nullable behavior.

## Frontend / UI

- broken route;
- broken interaction;
- incorrect loading state;
- missing error state;
- duplicate submission;
- stale UI after mutation;
- form validation mismatch;
- accessibility regression;
- responsive regression;
- browser console errors;
- failed network requests;
- wrong permissions in UI;
- inconsistent design-system usage.

## Performance

- unnecessary repeated queries;
- N+1;
- loading an entire dataset where pagination is expected;
- repeated expensive computation;
- unnecessary re-render;
- large object copying;
- inefficient loops on large datasets;
- missing index for newly introduced hot query.

## Maintainability

- duplicated logic;
- vague naming;
- excessive function complexity;
- dead code;
- debug code;
- magic values;
- unnecessary comments;
- comments that contradict code;
- missing tests for critical behavior.

## Tests

- missing test for a critical business rule;
- tests that do not actually verify behavior;
- flaky logic;
- implementation-only assertions;
- missing negative test;
- missing regression test;
- test data inconsistent with production assumptions.

---

# 6. Severity Model

Every finding must be classified into exactly one of the following levels.

## CRITICAL

A CRITICAL issue is merge-blocking.

Examples:

- data loss;
- corrupted inventory;
- security vulnerability;
- authorization bypass;
- broken primary business workflow;
- negative stock possibility;
- race condition causing incorrect critical state;
- destructive migration;
- production crash on normal usage;
- irreversible state corruption;
- incorrect financial or inventory calculation;
- broken authentication;
- confirmed regression in a core workflow;
- branch cannot build or start;
- required migration fails;
- critical automated test fails.

CRITICAL findings must be fixed before merge.

Do not recommend merge while any CRITICAL finding remains unresolved.

---

## IMPORTANT

An IMPORTANT issue materially affects correctness, reliability, maintainability, performance, or user experience.

Examples:

- missing backend validation;
- missing transaction where partial writes are possible;
- missing important error handling;
- incomplete permission check;
- significant N+1 query;
- duplicated business logic likely to diverge;
- important edge case not handled;
- broken empty/loading/error UI state;
- major responsive issue;
- API inconsistency;
- insufficient test coverage for important new behavior;
- stale state after successful mutation;
- code that violates established architecture.

IMPORTANT issues should normally be fixed before merge.

If an IMPORTANT issue is intentionally deferred, the final report must clearly explain:

- why it is safe to defer;
- what risk remains;
- who must accept the risk.

Do not silently downgrade an IMPORTANT issue to avoid blocking merge.

---

## MINOR

A MINOR issue does not materially break correctness but is worth cleaning up.

Examples:

- naming improvement;
- small readability issue;
- unnecessary duplication with low risk;
- non-critical comment cleanup;
- small UI alignment inconsistency;
- minor test naming issue;
- small refactor that reduces confusion;
- low-impact lint issue;
- non-critical formatting problem.

MINOR issues are normally non-blocking.

Do not turn MINOR findings into large refactors.

---

# 7. Evidence Is Required

Do not create vague findings.

Each finding must include:

- severity;
- file;
- relevant line or function;
- concrete problem;
- why it matters;
- evidence from code or behavior;
- smallest reasonable fix.

Bad review:

```text
IMPORTANT: Code quality could be better.
```

Good review:

```text
IMPORTANT
File: app/Services/StockOutService.php
Method: confirm()

Problem:
Available stock is checked before entering the transaction.

Risk:
Two concurrent requests can both pass the check and over-allocate inventory.

Minimal patch:
Move the availability check inside the transaction and lock affected
inventory rows before recalculating available quantity.
```

Do not report speculative issues as confirmed defects without evidence.

If uncertain, label the uncertainty explicitly.

---

# 8. Review Only Branch-Introduced Problems

The primary review scope is the current branch.

Do not flood the review with unrelated legacy issues that already exist on the base branch.

If an existing base-branch issue becomes relevant because the current change interacts with it, clearly mark it as:

```text
PRE-EXISTING / INTERACTION RISK
```

Do not pretend the current branch introduced it.

---

# 9. Minimal Patch Principle

Before merge, fix issues using the smallest safe patch.

A minimal patch should:

- directly address the finding;
- preserve existing architecture;
- preserve public contracts unless the bug requires a contract change;
- avoid unrelated refactoring;
- avoid mass formatting;
- avoid renaming unrelated code;
- avoid dependency upgrades unrelated to the finding;
- avoid speculative redesign.

Prefer:

```text
fix the exact validation
```

over:

```text
rewrite the entire module
```

Prefer:

```text
move the check inside the transaction
```

over:

```text
replace the data-access architecture
```

---

# 10. Patch Priority

Apply patches in this order:

1. CRITICAL
2. IMPORTANT
3. MINOR only when safe, trivial, and directly related

After each CRITICAL or IMPORTANT patch:

- inspect the diff;
- run targeted tests;
- run affected regression tests.

After all patches:

- run the full relevant verification set again.

---

# 11. Do Not Hide Findings by Refactoring

Never "fix" a review by rewriting large unrelated sections so the original issue becomes hard to trace.

Every patch must be easy to explain.

The final diff should remain focused.

If the safest fix requires a broader change, explain why before treating it as minimal.

---

# 12. Business Rule Review

Compare branch behavior against:

- user requirements;
- `MEMORY.md`;
- existing business rules;
- existing tests;
- similar implementation in the repository.

Check for silent changes to business behavior.

For inventory systems, pay special attention to:

- quantity integrity;
- FEFO/FIFO/LIFO rules where applicable;
- expiration rules;
- stock status;
- document status;
- confirm/cancel/reversal behavior;
- concurrency;
- traceability;
- permissions.

Do not assume a new implementation is correct merely because it compiles.

---

# 13. Database Review

For every migration/schema change, review:

- upgrade safety;
- rollback safety where supported;
- nullable/default values;
- foreign keys;
- unique constraints;
- indexes;
- data migration behavior;
- existing production data compatibility.

Do not modify old deployed migrations merely to make the current branch convenient unless the repository explicitly follows that practice.

Prefer additive and backward-compatible migrations.

Flag destructive operations as CRITICAL unless explicitly required and safely handled.

---

# 14. Transaction Review

For multi-step writes, ask:

- Can partial success occur?
- Can another request modify the same data concurrently?
- Is the state revalidated inside the transaction?
- Are required rows locked?
- Can retry or duplicate submission create duplicate effects?

Important operations such as inventory changes must be atomic.

---

# 15. API Contract Review

Compare changed APIs against existing consumers.

Review:

- route;
- method;
- request fields;
- required/optional behavior;
- response fields;
- response types;
- status codes;
- error format.

Any accidental breaking contract change must be reported.

Do not call a change backward compatible unless existing callers remain compatible.

---

# 16. UI Review

For changed UI, verify actual behavior where browser/UI capability is available.

Check:

- route opens;
- no blank screen;
- menu works;
- form works;
- validation appears;
- submit works;
- duplicate submit is prevented where necessary;
- success state updates correctly;
- error state is usable;
- table/search/filter/pagination work where changed;
- modal open/close/reset works;
- browser console has no implementation-caused errors;
- relevant network calls succeed;
- responsive layout is not broken.

A successful build is not enough.

---

# 17. Regression Review

Identify what existing behavior can be affected by the branch.

Run targeted regression checks.

Examples:

Change:
shared table component

Regression:
another existing page using that table.

Change:
inventory balance logic

Regression:
stock-in and stock-out.

Change:
authentication middleware

Regression:
login, logout, protected routes.

Do not only test the new happy path.

---

# 18. Required Static Checks

Run applicable project commands discovered from:

- `package.json`;
- `composer.json`;
- Makefile;
- CI configuration;
- README;
- project scripts.

Examples may include:

```text
lint
format check
type-check
static analysis
unit tests
feature tests
integration tests
build
```

Do not invent commands.

Do not claim a command passed unless it was actually executed successfully.

---

# 19. Review the Final Diff Again

After applying patches, repeat the diff review.

At minimum inspect:

```bash
git diff --stat <base>...HEAD
git diff <base>...HEAD
git status --short
```

Also review any remaining staged/unstaged changes.

Check specifically for:

- accidental files;
- generated artifacts;
- secrets;
- debug code;
- temporary files;
- unrelated formatting;
- duplicated logic;
- unintended contract changes.

The review is not complete until the patched diff is reviewed again.

---

# 20. Secret Detection

Before merge, inspect the branch for accidental secrets.

Examples:

- `.env` contents;
- API keys;
- access tokens;
- passwords;
- private keys;
- production credentials;
- signed URLs with sensitive tokens.

Any committed secret is CRITICAL.

Do not copy a discovered secret into `MEMORY.md` or the final report.

Report only the type and location necessary to remediate it.

---

# 21. Comment Review

Code comments must follow the project coding rule:

- English only;
- explain WHY rather than obvious WHAT;
- normally no more than 3 lines;
- no stale comments;
- no commented-out code.

A misleading comment is worse than no comment.

---

# 22. Patch Verification

Every applied patch must have verification appropriate to its risk.

Examples:

Validation patch:
- valid request;
- invalid request.

Transaction patch:
- normal flow;
- forced failure/rollback;
- concurrency-sensitive test if available.

UI patch:
- browser interaction;
- console/network check.

Permission patch:
- authorized user;
- unauthorized user.

Do not mark a review finding as fixed merely because code was edited.

---

# 23. Review Findings Table

The final review must include a findings table.

Use:

| # | Severity | File / Area | Finding | Risk | Minimal Patch | Status |
|---|----------|-------------|---------|------|---------------|--------|

Status must be one of:

```text
FIXED
OPEN
ACCEPTED RISK
NOT APPLICABLE
```

Do not hide findings that were discovered and fixed.

Keep them in the table with status `FIXED`.

---

# 24. Verification Table

Also provide a verification table.

Use:

| # | Verification | Method | Result | Status |
|---|--------------|--------|--------|--------|

Allowed status:

```text
PASS
FAIL
NOT TESTED
BLOCKED
```

Examples:

| # | Verification | Method | Result | Status |
|---|--------------|--------|--------|--------|
| 1 | Branch diff review | Git diff | Reviewed all changed files | PASS |
| 2 | Unit tests | PHPUnit/Vitest | All relevant tests passed | PASS |
| 3 | UI happy path | Browser | Flow completed successfully | PASS |
| 4 | Build | Project build command | Build completed | PASS |

Never mark PASS without actual verification.

---

# 25. Merge Gate

Use exactly one final merge recommendation:

## READY TO MERGE

Use only when:

- no unresolved CRITICAL findings;
- no unresolved merge-blocking IMPORTANT findings;
- required tests pass;
- build/type-check/lint pass where applicable;
- UI verification passes when UI changed;
- final diff review is complete;
- no accidental secrets or debug artifacts remain.

## READY TO MERGE WITH ACCEPTED RISKS

Use only when:

- no CRITICAL findings remain;
- remaining IMPORTANT/MINOR issues are explicitly documented;
- the remaining risk is understood;
- merge is still reasonably safe.

List every accepted risk.

## NOT READY TO MERGE

Use when:

- any CRITICAL finding is unresolved;
- important correctness risk remains unresolved;
- required tests fail;
- build fails;
- migration is unsafe;
- UI primary flow is broken;
- review is incomplete;
- important changes could not be verified.

Never recommend merge merely because the implementation looks correct.

---

# 26. Merge-Blocking Rules

The following automatically block merge unless the user explicitly accepts a documented risk and doing so is safe:

- CRITICAL defect;
- failing required automated test;
- application cannot build/start;
- migration failure;
- known data corruption risk;
- security vulnerability;
- authorization bypass;
- primary workflow broken;
- negative inventory possibility;
- unhandled concurrency bug in critical state updates;
- committed secret;
- unresolved conflict marker;
- accidental destructive operation.

---

# 27. Conflict Marker Check

Before merge, ensure no conflict markers remain.

Search for:

```text
<<<<<<<
=======
>>>>>>>
```

Do not blindly remove legitimate strings that merely resemble markers.

Any actual unresolved merge conflict blocks merge.

---

# 28. Generated and Unrelated Files

Check whether the branch accidentally contains:

- logs;
- screenshots;
- local database files;
- cache;
- coverage artifacts;
- IDE files;
- build output;
- temporary exports;
- machine-specific config.

Remove only artifacts introduced by the current branch and clearly not intended for version control.

Do not delete unrelated existing files.

---

# 29. Review Commit Scope

Inspect the branch's commit list when useful.

Check whether commits include unrelated work.

If the branch contains mixed unrelated changes, report that as an IMPORTANT maintainability/reviewability issue when it materially increases merge risk.

Do not rewrite history or force-push unless explicitly requested.

---

# 30. No Destructive Git Operations

During review, do NOT use destructive commands such as:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
git push --force
git rebase --onto
```

unless explicitly requested and safe.

Code review must not destroy the user's work.

---

# 31. Memory Update

If the review discovers a reusable project convention, recurring failure mode, or explicit user correction:

update `MEMORY.md`.

Examples:

- all inventory mutations require row locking;
- controllers must remain thin;
- this project never edits historical migrations;
- UI tests must cover a specific browser behavior.

Do not store temporary review findings that only apply to one branch.

Do not store secrets.

---

# 32. Required Review Workflow

Use this sequence:

```text
READ MEMORY + RULES
↓
IDENTIFY CURRENT BRANCH
↓
IDENTIFY BASE BRANCH
↓
INSPECT STATUS
↓
COMPUTE MERGE-BASE DIFF
↓
REVIEW CHANGED FILES
↓
REVIEW BUSINESS / SECURITY / DB / API / UI IMPACT
↓
RUN STATIC CHECKS + TESTS
↓
TEST UI WHEN APPLICABLE
↓
CLASSIFY FINDINGS
    CRITICAL
    IMPORTANT
    MINOR
↓
APPLY MINIMAL PATCHES
↓
RETEST
↓
REVIEW FINAL DIFF
↓
UPDATE MEMORY IF NEEDED
↓
PRODUCE MERGE-GATE REPORT
```

---

# 33. Required Final Response Format

After branch review, respond using this format:

## Branch Review

- Current branch: `<branch>`
- Base branch: `<develop/main/master>`
- Comparison: `<base>...HEAD`
- Review scope: committed / staged / unstaged / relevant untracked files

## Change Summary

Briefly explain what the branch changes.

## Findings

| # | Severity | File / Area | Finding | Risk | Minimal Patch | Status |
|---|----------|-------------|---------|------|---------------|--------|

If no findings exist in one severity group, do not invent findings.

## Critical

List CRITICAL findings or:

```text
No CRITICAL findings found in the reviewed scope.
```

## Important

List IMPORTANT findings or:

```text
No IMPORTANT findings found in the reviewed scope.
```

## Minor

List MINOR findings or:

```text
No MINOR findings found in the reviewed scope.
```

## Patches Applied

For each applied patch, explain:

- issue fixed;
- files changed;
- why the patch is minimal;
- verification performed.

## Verification

| # | Verification | Method | Result | Status |
|---|--------------|--------|--------|--------|

## Regression Check

State which existing flows were rechecked.

## Remaining Risks

List unresolved or untested risks.

Do not hide them.

## Merge Gate

Return exactly one:

```text
READY TO MERGE
```

or:

```text
READY TO MERGE WITH ACCEPTED RISKS
```

or:

```text
NOT READY TO MERGE
```

Then give a concise reason.

---

# 34. Definition of Done for Code Review

The branch review is complete only when all applicable items are satisfied:

- [ ] `MEMORY.md` was read.
- [ ] Applicable `.agents/rules/` were read.
- [ ] Current branch was identified.
- [ ] Correct base branch was identified.
- [ ] Merge-base diff was reviewed.
- [ ] Committed changes were reviewed.
- [ ] Staged changes were reviewed.
- [ ] Unstaged changes were reviewed.
- [ ] Relevant untracked files were considered.
- [ ] Business logic was reviewed.
- [ ] Security was reviewed.
- [ ] Database changes were reviewed.
- [ ] API changes were reviewed.
- [ ] UI changes were reviewed where applicable.
- [ ] Performance risks were reviewed.
- [ ] Automated checks were run where available.
- [ ] UI was tested where applicable.
- [ ] Findings were classified CRITICAL / IMPORTANT / MINOR.
- [ ] Minimal patches were applied for blocking issues.
- [ ] Patches were retested.
- [ ] Final diff was re-reviewed.
- [ ] Debug artifacts were checked.
- [ ] Secrets were checked.
- [ ] Conflict markers were checked.
- [ ] Regression-sensitive flows were checked.
- [ ] Verification table was produced.
- [ ] Merge recommendation was produced.
- [ ] Unverified areas were disclosed.
- [ ] Reusable lessons were added to `MEMORY.md` when appropriate.

If an applicable item is incomplete, do not claim the review is complete.

---

# 35. Core Principle

The purpose of review is not to maximize the number of comments.

The purpose is to reduce merge risk.

Prioritize:

```text
correctness
→ data integrity
→ security
→ business rules
→ regression risk
→ maintainability
→ performance
→ style
```

Use evidence, not preference.

Fix the smallest amount of code necessary to make the branch safe.

Never turn a pre-merge review into an unrelated rewrite.
