---
name: senior-code-review
description: Review a branch or working tree against a base branch (default `develop`) the way a senior engineer reviews a pull request — hunting logic bugs, edge cases, null/undefined issues, async/concurrency problems, security risks, performance regressions, backward-compatibility breaks and missing tests — and produce a structured report with Critical / Important / Minor issues, test cases to add, and a minimal patch for every bug found. Use this whenever the user asks to "review", "code review", "review PR/MR", "review diff", "review changes vs develop/main", "check my changes before merge", "tìm bug", "review toàn bộ thay đổi", or pastes a diff and asks what is wrong with it — even if they only say "look at this before I open the PR".
---

# Senior Code Review

Review changes relative to a base branch and report findings the way a careful senior reviewer would: precise, evidence-based, prioritized by risk, with a concrete fix for every bug. The reviewer is not here to admire the code or to rewrite it — the job is to find what will break, prove it, and show the smallest change that fixes it.

## Workflow

### 1. Establish the scope

Default base branch is `develop`. Use another base only if the user names one or `develop` does not exist (fall back to `origin/develop`, then `main`/`master`).

If a git repository is available, run the collector script — it finds the merge base, lists changed files (committed **and** uncommitted, including untracked), separates generated/lock files, and writes the full diff to a file:

```bash
bash scripts/collect_diff.sh [base-branch] [output-dir]
# default: base=develop, output-dir=/tmp/review
```

It prints a summary and writes `diff.patch` (reviewable code), `diff.generated.patch` (generated/lock files, skim only), `files.txt`, and `stats.txt` into the output directory. If the script cannot find the base branch, it says so — ask the user which branch to compare against rather than guessing.

If there is no repository (the user pasted a diff or files), review what was pasted and say explicitly which context was unavailable (callers, tests, config).

"All current changes vs develop" means committed commits on the branch **plus** the working tree. Review both; label uncommitted findings so the user knows they are not yet in any commit.

### 2. Read beyond the hunks

A diff hunk hides most of the bugs. For every non-trivial change:

- Open the whole function/class that was modified, not just the ±3 lines git shows.
- When a signature, return type, enum, DTO/model, API contract, DB schema, or config key changes, grep for every caller/consumer (`grep -rn "symbolName"`) and check each one still works. Unchanged callers of a changed function are the most common source of regressions.
- Find the tests that cover each changed file (`*_test.*`, `test/`, `__tests__/`, `spec/`). Note which changed behaviours have no test touching them — that feeds section 4.
- Check whether the change touches anything that persists or crosses a boundary: database/migrations, local storage/cache keys, serialized models, public API, deep links, feature flags, platform channels. These are where backward-compatibility breaks hide.

### 3. Review against the checklist

Read `references/review-checklist.md` and walk the diff category by category. Load the matching stack notes when the diff contains those file types:

- `.dart` / Flutter project → `references/stack-notes.md` § Flutter/Dart (BuildContext after await, dispose/cancel, BLoC/GetX state, MethodChannel, IAP, realtime sockets)
- `.ts/.tsx/.js/.jsx` → § TypeScript/JavaScript
- `.kt/.java/.swift` (native side of a mobile app) → § Native (Kotlin/Swift)
- `.py` → § Python
- `.sql`, migrations, ORM models → § SQL & data

Then **verify** rather than guess where tooling exists: run the project's static analysis and tests (`flutter analyze && flutter test`, `npm test`, `pytest`, `go vet`, …) and read the output. A failing test or analyzer warning on changed code is evidence; put it in the report. Do not modify the user's files during the review unless they ask you to apply the patches.

### 4. Classify by real severity

Severity is about consequence, not about how clever the finding is.

| Level | Meaning | Examples |
|---|---|---|
| **Critical** | Will cause an incident or must block the merge | crash on a reachable path, data loss/corruption, wrong money/points/entitlement, security vulnerability, breaks existing clients/API/stored data, race that produces wrong results, secrets committed |
| **Important** | Wrong behaviour that real users or realistic inputs will hit, or a maintainability risk big enough to need fixing before/just after merge | unhandled null on a plausible path, missing error handling that leaves the UI stuck, noticeable perf regression (N+1, work on every rebuild/render), listener/subscription leak, missing tests on a critical path, compat break with a workaround |
| **Minor** | Worth doing, not worth blocking | naming, dead code, duplicated logic, small inefficiency, missing doc/log, style that invites future bugs |

Rules that keep the report honest:

- Every finding needs **evidence**: a file path, a line, and a quote of the code. If you cannot point at the line, you do not have a finding — you have a question. Put questions in a short "Cần xác nhận / Open questions" line under the relevant section instead of inventing a bug.
- Do not pad. If a section has nothing, write "Không phát hiện." and move on. A short honest report beats a long speculative one.
- Do not report pure style (formatting, import order) unless it masks a bug. Linters exist for that.
- Do not report things that were already wrong in `develop` and untouched by this diff, unless the change makes them worse or the user asked for a full-file review. You may mention them in one line as "pre-existing".
- Re-check a suspected bug before writing it down: trace the actual value flow. The most embarrassing review comment is one the author refutes in one sentence.

### 5. Write patches that an author will accept

For each Critical and Important issue (and Minor ones where a fix is one or two lines), include a **minimal patch** in section 5:

- Unified diff format (`--- a/path`, `+++ b/path`, `@@`), real file paths, real surrounding lines copied from the file so it applies cleanly.
- Fix only the bug. No reformatting, no renaming, no "while I was here" refactors — those are suggestions, not patches.
- If a correct fix genuinely requires a design change, give the smallest safe mitigation as the patch and describe the proper fix in prose.
- Number each patch after its issue (`Patch C1`, `Patch I2`) so the author can jump between the finding and the fix.

### 6. Produce the report

Use the exact structure in `references/report-template.md`. Write the report in the language the user used to ask for the review (Vietnamese request → Vietnamese report, with code, identifiers, and the five section titles kept as in the template). Keep prose tight: one issue = title, where, what is wrong, why it matters, evidence, pointer to patch.

Lead the report with a 2–3 sentence summary and a merge verdict (🔴 do not merge / 🟡 merge after fixing Critical+Important / 🟢 can merge). Order issues inside each section by risk, highest first.

## Handling large diffs

When the diff is large (roughly > 25 non-generated files or > 1500 changed lines):

1. Review in risk order first — authentication/authorization, payments/points/entitlements, data persistence and migrations, concurrency, public APIs/deep links, then business logic, then UI, then tests/config.
2. Say in the summary which areas were reviewed in depth and which were only skimmed.
3. Offer to continue with the skimmed areas rather than silently dropping them.

## What this skill is not

It is not a formatter, not a style guide enforcer, and not a rewrite. If the user wants a refactor or wants the patches applied, that is a separate explicit request — do it only when asked, and after they have seen the report.

## Reference files

- `references/review-checklist.md` — the category-by-category checklist (logic, edge cases, null safety, async/concurrency, security, performance, backward compatibility, tests). Read it every time.
- `references/stack-notes.md` — stack-specific pitfalls (Flutter/Dart, TypeScript/JavaScript, Kotlin/Swift, Python, SQL). Read only the sections matching the diff.
- `references/report-template.md` — the exact output template with a filled example. Read it before writing the report.
- `scripts/collect_diff.sh` — gathers the diff vs the base branch into reviewable files.
