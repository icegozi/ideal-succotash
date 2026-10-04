---
trigger: always_on
description: "Mandatory production-grade coding style, code quality, comments, testing, UI verification, regression checks, and final test report."
---

# Production-Grade Code Quality & Testing Rules

These rules apply to ALL implementation, bug-fix, refactoring, frontend, backend, database, API, and integration tasks.

The goal is to produce code that is:

- correct;
- readable;
- maintainable;
- testable;
- secure;
- consistent with the existing project;
- minimally complex;
- production-ready.

## 1. Read Project Rules Before Coding

Before writing or modifying code:

1. Read `MEMORY.md`.
2. Read applicable files under `.agents/rules/`.
3. Inspect the relevant existing implementation.
4. Inspect nearby code for coding conventions.
5. Inspect relevant tests.
6. Search for reusable components, services, utilities, hooks, helpers, validators, models, DTOs, types, and existing patterns.

Do not create a new pattern before checking whether the project already has one.

Existing project conventions have priority over generic stylistic preferences unless the user explicitly requests a change.

## 2. Code Must Follow Existing Project Style

Never impose an unrelated personal coding style onto an established codebase.

Before coding, inspect nearby files and follow existing conventions for:

- naming;
- file organization;
- folder structure;
- dependency injection;
- imports;
- exports;
- typing;
- DTOs;
- validation;
- exception handling;
- database access;
- component structure;
- hooks/composables;
- API response formats;
- service architecture;
- testing;
- documentation.

Consistency with the project is more important than personal preference.

## 3. General Coding Principles

Follow these principles where appropriate:

- SOLID
- KISS
- DRY
- YAGNI
- Separation of Concerns
- Single Responsibility
- Fail Fast
- Explicit over Implicit
- Composition over unnecessary inheritance

However:

- Do NOT apply design principles mechanically.
- Do NOT overengineer.
- Do NOT introduce architecture that the current project does not need.

## 4. Write the Simplest Correct Solution

Prefer:

simple + readable + testable + consistent

over:

clever + abstract + generic + hard to understand

Do not create unnecessary:

- interfaces;
- factories;
- repositories;
- adapters;
- providers;
- DTO layers;
- wrappers;
- helper classes;
- utility files;
- abstraction layers.

Only introduce abstraction when it solves an actual problem.

## 5. Single Responsibility

Each class, service, component, function, method, or module should have a clear responsibility.

Avoid functions that validate, query the database, transform data, perform business logic, send notifications, and format responses all at once.

Split responsibilities when doing so improves readability and testability.

Do not split trivial logic into excessive micro-functions.

## 6. Function Size

Functions and methods should be concise.

Prefer functions that can be understood without scrolling through large amounts of unrelated logic.

When a function becomes difficult to understand, extract meaningful operations.

Bad:

```text
processEverything()
```

Better:

```text
validateRequest()
allocateInventory()
persistTransaction()
createStockMovement()
```

Function names must describe intent.

## 7. Naming

Use descriptive names.

Avoid meaningless names such as:

```text
a
b
x
tmp
data2
obj
itemX
result2
test123
abc
```

Except for very small scopes where conventional names are obvious.

Prefer:

```text
availableQuantity
requestedQuantity
allocatedQuantity
expiryDate
inventoryBalance
stockMovement
```

Boolean variables should communicate state clearly:

```text
isActive
hasPermission
canOverrideFefo
shouldNotify
```

Avoid vague names such as:

```text
flag
statusFlag
check
value
```

unless project conventions require otherwise.

## 8. No Magic Values

Do not scatter magic values throughout the code.

Bad:

```ts
if (days <= 90)
```

Prefer:

```ts
if (days <= NEAR_EXPIRY_DAYS)
```

Use appropriate constants, enums, configuration, or domain values.

Do not create constants for trivial values where abstraction adds no value.

## 9. Comments Must Be in English

All source-code comments must be written in English.

Do not write Vietnamese comments inside source code unless the user explicitly requests otherwise.

Bad:

```php
// Kiểm tra thuốc đã hết hạn chưa
```

Good:

```php
// Prevent expired batches from being allocated.
```

## 10. Comment Length

A functional comment should normally be no more than 3 lines.

Example:

```php
// Allocate stock using FEFO so batches with the nearest
// expiration date are consumed before batches with
// later expiration dates.
```

Do not write long essays inside source code.

If documentation requires more explanation, use appropriate project documentation instead.

## 11. Comment the Why, Not the What

Do not add obvious comments.

Bad:

```php
// Increase quantity by 1
$quantity++;
```

Bad:

```ts
// Get user
const user = getUser();
```

Comments should explain:

- why the implementation exists;
- non-obvious business rules;
- edge cases;
- compatibility behavior;
- workaround reasons;
- security considerations.

Example:

```php
// Lock inventory rows to prevent concurrent stock issues
// from allocating the same available quantity.
```

## 12. Do Not Over-Comment

Readable code is preferred over comments.

Do not comment every variable, line, condition, loop, or assignment.

Comments are not a replacement for clear naming and good structure.

## 13. Public API Documentation

If the project uses PHPDoc, JSDoc, TSDoc, OpenAPI, Swagger, or language-specific documentation, follow the existing project convention.

Document public APIs when their behavior cannot be understood from the signature alone.

Do not add verbose documentation merely to increase documentation coverage.

## 14. Remove Dead Code

Do not leave:

- commented-out code;
- unused imports;
- unused variables;
- unused functions;
- debug statements;
- temporary logs;
- temporary files;
- experimental code.

Remove them before completing the task.

Do not leave `console.log(...)` unless it is intentionally part of the project's logging mechanism.

## 15. No Debug Artifacts

Before finishing, search for accidental debug artifacts such as:

```text
console.log
dd()
dump()
var_dump()
print_r()
debugger
TODO temporary
FIXME temporary
```

Do not remove legitimate existing diagnostic code unrelated to the task.

## 16. Error Handling

Errors must be handled explicitly.

Do not silently ignore exceptions.

Bad:

```ts
try {
    await save();
} catch {
}
```

Avoid broad exception handling that hides programming errors.

Bad:

```php
catch (\Throwable $e) {
    return null;
}
```

unless that behavior is explicitly required.

Use project-standard exception classes, error responses, logging, and validation errors.

## 17. Never Expose Internal Errors

Do not expose raw SQL errors, stack traces, internal paths, credentials, or internal exception messages to end users.

Return user-safe messages while preserving diagnostic information through the project's logging system.

## 18. Validation

Validate data at the correct boundary.

Frontend validation improves UX.

Backend validation protects the system.

Frontend validation NEVER replaces backend validation.

Validate:

- required data;
- type;
- format;
- range;
- state;
- permission;
- business constraints.

Do not trust request data merely because it came from the application's own frontend.

## 19. Type Safety

Use the strongest practical typing supported by the project.

Avoid disabling type safety for convenience.

For TypeScript, avoid unnecessary `any`.

Prefer `unknown` followed by proper validation/narrowing where appropriate.

Do not use `// @ts-ignore` unless absolutely necessary and clearly justified.

If such suppression is required, explain why with a concise English comment.

## 20. Null / Undefined Handling

Handle nullable data explicitly.

Do not assume nested values always exist.

Do not use excessive optional chaining to hide invalid application state.

Differentiate between:

- optional;
- nullable;
- missing;
- empty;
- invalid.

## 21. Database Access

Follow existing ORM/query conventions.

Avoid N+1 queries.

Avoid querying inside loops where a batch/eager-loading approach is appropriate.

Use indexes, eager loading, pagination, and query filters where appropriate.

Do not optimize prematurely without evidence.

## 22. Database Transactions

Operations that must remain consistent must use database transactions.

Examples:

- inventory changes;
- financial transactions;
- multi-table state changes;
- document confirmation;
- stock allocation;
- stock reversal.

Never allow partial success where atomic behavior is required.

## 23. Concurrency

When concurrent writes may violate business rules, use appropriate database/application locking.

Never rely solely on:

```text
read value
check value
update value
```

when another transaction can modify the same data in between.

For critical resources:

```text
lock
→ revalidate
→ update
→ commit
```

## 24. Security

Never trust the client.

Backend must enforce:

- authentication;
- authorization;
- validation;
- ownership;
- business constraints.

Do not hide buttons on frontend and assume this provides authorization.

Never hard-code passwords, tokens, API keys, private keys, database credentials, or production secrets.

## 25. No Unnecessary Dependencies

Before installing a dependency:

1. Search current dependencies.
2. Check whether the project already provides the functionality.
3. Determine whether implementing it internally is simpler.
4. Evaluate maintenance cost.

Do not introduce libraries for trivial tasks.

## 26. Reuse Before Create

Before creating a component, helper, service, hook, composable, validator, formatter, table, modal, form, or button, search whether the project already contains an equivalent.

Prefer reuse where appropriate.

Do not force reuse if the existing abstraction is incompatible with the requirement.

## 27. Frontend Component Rules

Components should have clear responsibilities.

Avoid massive components that contain fetching, business logic, formatting, form state, modal management, table logic, permissions, and navigation all in one file.

Extract logic only when it meaningfully improves maintainability.

## 28. UI Consistency

Use the existing design system.

Reuse existing:

- Button
- Input
- Select
- Modal
- Dialog
- Table
- Badge
- DatePicker
- Pagination
- Toast
- Form
- Card

components whenever available.

Do not create slightly different versions of existing components without reason.

## 29. UI States

Interactive screens must handle relevant states:

- initial;
- loading;
- success;
- empty;
- error;
- disabled;
- validation error.

Where applicable also handle:

- unauthorized;
- no results;
- submitting;
- stale data.

## 30. Responsive UI

When the existing application supports responsive design, verify the changed UI at relevant viewport sizes.

At minimum check Desktop and, when applicable, Tablet and Mobile.

Do not break existing responsive layouts.

## 31. Accessibility

Follow existing accessibility practices.

Interactive controls should be usable through appropriate semantic elements.

Prefer:

```html
<button>
```

over clickable:

```html
<div>
```

Use labels for form fields.

Do not rely only on color to communicate important status.

## 32. Test Before Declaring Complete

Implementation is NOT complete immediately after writing code.

Relevant tests must be executed.

Depending on the project, run applicable:

- unit tests;
- feature tests;
- integration tests;
- API tests;
- database tests;
- lint;
- formatter/check;
- static analysis;
- type-check;
- build;
- end-to-end tests.

Never claim a command passed unless it was actually executed and returned successfully.

## 33. UI Must Be Tested

If a task changes a page, form, modal, button, menu, navigation, table, filters, search, dialog, or workflow, the UI must be tested.

Do not consider a frontend implementation complete only because `npm run build` passed.

A successful build does NOT prove the UI works correctly.

## 34. Manual UI Verification

Where UI/browser testing capability is available, verify the actual application.

Test the main user flow.

Example:

```text
Open page
↓
Verify page loads
↓
Interact with controls
↓
Submit form
↓
Verify validation
↓
Verify success state
↓
Verify data is refreshed
↓
Verify navigation
↓
Verify error cases
```

Do not inspect only source code.

Interact with the UI.

## 35. UI Bug Policy

Any bug discovered during verification that was caused by the current implementation must be fixed before declaring the task complete.

Repeat:

```text
IMPLEMENT
↓
RUN
↓
TEST UI
↓
FIND BUG
↓
FIX
↓
RETEST
```

until the tested flows pass.

Do NOT claim "No bugs" unless this specifically means:

> No bugs were found in the tested scenarios.

Never imply that all possible bugs have been proven absent.

## 36. UI Test Checklist

For changed UI, test relevant cases including:

### Rendering

- page loads;
- no blank screen;
- no unexpected runtime error;
- no obvious broken layout;
- icons render correctly;
- labels render correctly.

### Navigation

- menu works;
- route works;
- browser navigation works where relevant;
- active state is correct.

### Forms

- valid input;
- required fields;
- invalid input;
- submit;
- loading state;
- duplicate submit protection;
- success feedback;
- error feedback.

### Table

- data renders;
- empty state;
- pagination;
- sorting if implemented;
- filtering;
- searching;
- row actions.

### Modal/Dialog

- open;
- close;
- cancel;
- submit;
- overlay behavior;
- state reset.

### Permissions

- allowed user;
- restricted user if test accounts are available.

### Error Handling

- API error;
- validation error;
- empty response where relevant.

Only test scenarios applicable to the current task.

## 37. Check Browser Console

When UI/browser access is available, inspect browser console after exercising the modified flow.

The task should not introduce:

- runtime exceptions;
- Vue/React warnings caused by the implementation;
- failed network requests caused by incorrect endpoints;
- duplicate-key warnings;
- hydration issues;
- uncaught promise errors.

Fix errors introduced by the current change.

Do not spend unrelated scope fixing pre-existing warnings unless they block verification.

## 38. Check Network Requests

For changed API-driven UI, verify relevant network requests.

Check:

- HTTP method;
- endpoint;
- request payload;
- response status;
- response handling;
- validation errors.

Do not rely solely on UI appearance when backend interaction is important.

## 39. Test Main Happy Path

Always verify the primary expected user workflow.

Examples:

```text
Create
→ Save
→ Display
→ Edit
→ Save
```

or:

```text
Create stock receipt
→ Confirm
→ Inventory increases
→ Movement appears
```

The exact happy path depends on the task.

## 40. Test Important Negative Paths

Test relevant failure scenarios.

Examples:

- empty required field;
- invalid value;
- insufficient permission;
- duplicate request;
- insufficient stock;
- invalid document status;
- expired data.

A feature that only works with perfect input is not production-ready.

## 41. Test Regression

Do not test only the newly added behavior.

Check nearby existing flows that could be affected.

Examples:

If changing authentication, check login/logout.

If changing inventory, check stock in/out.

If changing sidebar, check existing navigation.

If changing a shared table component, check another table using the same component.

## 42. Automated Tests

Business-critical logic should be covered by automated tests where the project has testing infrastructure.

Prioritize tests for:

- business rules;
- calculations;
- state transitions;
- permissions;
- transactions;
- edge cases;
- validation;
- concurrency-sensitive behavior.

Do not create tests that merely assert implementation details.

Test behavior.

## 43. Test Names

Test names should describe behavior.

Prefer:

```text
it_rejects_stock_issue_when_available_quantity_is_insufficient
```

or:

```ts
it("allocates the earliest-expiring batch first", ...)
```

Avoid vague names such as:

```text
test1
testFunction
testStock
works
```

## 44. Test Independence

Tests should not depend on execution order.

Avoid shared mutable state.

Each test should clearly arrange the state it needs.

Use Arrange / Act / Assert or the testing convention already used by the project.

## 45. Do Not Fake Test Results

Never fabricate:

- screenshots;
- test results;
- browser verification;
- command output;
- test counts;
- coverage;
- successful builds.

If a test cannot be executed, explicitly state:

```text
NOT TESTED
```

and explain why.

## 46. Final Diff Review

Before completing the task, inspect the final diff.

Check for:

- accidental formatting changes;
- unrelated changes;
- duplicated code;
- debug code;
- dead code;
- wrong imports;
- unused imports;
- typo;
- naming inconsistency;
- missing validation;
- missing permission;
- unhandled null;
- accidental API contract change;
- accidental schema change.

## 47. Formatter and Linter

Use the project's existing formatter and linter.

Do not introduce a new formatting standard solely for the current task.

Modified files should not introduce new lint errors.

If the repository already contains unrelated lint failures, report them separately.

## 48. Build Verification

For frontend/full-stack changes, run the existing build command when practical.

Examples:

```bash
npm run build
pnpm build
yarn build
```

depending on the project.

Do not invent commands.

Read `package.json`, README, scripts, CI, or project documentation first.

## 49. Test Report Is Mandatory

After completing implementation, provide the user with a TESTED TABLE.

The final response must contain a table similar to:

| # | Test scenario | Expected result | Actual result | Status |
|---|---------------|-----------------|---------------|--------|
| 1 | Open inventory page | Page loads normally | Page loaded normally | PASS |
| 2 | Search medicine | Matching medicines shown | Matching medicines shown | PASS |
| 3 | Submit empty form | Validation displayed | Validation displayed | PASS |
| 4 | Confirm stock receipt | Inventory increases | Inventory increased | PASS |
| 5 | FEFO stock issue | Earliest expiry allocated first | Correct batch allocated | PASS |

Allowed status values:

```text
PASS
FAIL
NOT TESTED
BLOCKED
```

Do not mark PASS unless actually verified.

## 50. Include Test Method

For important tests, identify how they were verified.

Examples:

```text
Automated test
Browser UI test
API test
Database verification
Build
Lint
Type-check
```

Preferred table:

| Test | Method | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| FEFO allocation | Automated test | Earliest expiry first | Earliest expiry first | PASS |
| Create stock receipt | Browser UI | Receipt created | Receipt created | PASS |
| Inventory update | DB + UI | +100 units | +100 units | PASS |

## 51. Do Not Hide Failed Tests

If a test fails, show it.

Do not remove failed tests from the final report.

Then fix the issue and retest.

If it remains unresolved, clearly report the limitation.

## 52. UI Completion Requirement

A UI-related task is considered complete only when:

- implementation is finished;
- build succeeds where applicable;
- relevant automated tests pass;
- main UI flow has been tested;
- no implementation-caused browser runtime errors remain;
- no critical visual issue remains in tested scenarios;
- relevant negative flow has been checked;
- regression-sensitive flows have been checked.

## 53. No False "Bug Free" Claim

Never claim software is universally 100% bug-free.

Use precise wording such as:

> All defined acceptance scenarios passed.  
> No defects were found during the tested UI flows.

## 54. Code Quality Self-Review

Before completing the task, ask internally:

- Is this the simplest correct solution?
- Did I reuse existing project patterns?
- Is business logic duplicated?
- Are names descriptive?
- Are functions understandable?
- Are comments necessary and in English?
- Are comments at most 3 lines where practical?
- Are there magic values?
- Are errors handled correctly?
- Is authorization enforced server-side?
- Could this create an N+1 query?
- Could concurrent requests break this logic?
- Are there unnecessary dependencies?
- Is the implementation testable?
- Are the important paths actually tested?

Fix identified issues before reporting completion.

## 55. Memory Update

If the user corrects:

- coding style;
- naming;
- architecture;
- test approach;
- commenting style;
- UI style;
- business rule;

and the correction is reusable, update `MEMORY.md`.

Do not store trivial one-off details.

Do not duplicate an existing memory rule.

## 56. Final Response Format

After implementation, use this structure:

### Implemented

Briefly describe completed work.

### Files Changed

List important modified/created files.

### Code Quality

Mention important architectural/style decisions.

### Automated Verification

Report the unit tests, integration tests, lint, type-check, and build that were actually executed.

### UI Verification

Describe actual UI flows tested.

### Tested Scenarios

Provide the mandatory test table:

| # | Scenario | Method | Expected | Actual | Status |
|---|----------|--------|----------|--------|--------|

### Issues Found and Fixed

List bugs discovered during verification and how they were fixed.

If none were found:

> No defects were found in the tested scenarios.

Do NOT say:

> No bugs exist.

### Not Tested

Explicitly state anything that could not be tested.

### Memory Updated

Mention reusable project knowledge added to `MEMORY.md`, if any.

## 57. Definition of Done

A coding task is DONE only when all applicable items below are satisfied:

- [ ] `MEMORY.md` was read before planning.
- [ ] Relevant source code was inspected.
- [ ] Similar implementations were searched.
- [ ] Implementation follows existing architecture.
- [ ] No unnecessary abstraction was introduced.
- [ ] Code follows project naming conventions.
- [ ] Comments are written in English.
- [ ] Functional comments are concise, normally <= 3 lines.
- [ ] No unnecessary comments exist.
- [ ] No debug code remains.
- [ ] No dead code remains.
- [ ] Backend validation exists where required.
- [ ] Backend authorization exists where required.
- [ ] Relevant automated tests pass.
- [ ] Lint passes for modified scope where applicable.
- [ ] Type-check passes where applicable.
- [ ] Build passes where applicable.
- [ ] Main UI flow was manually/browser tested.
- [ ] Relevant negative UI flow was tested.
- [ ] Browser console was checked where possible.
- [ ] Relevant API/network interaction was checked.
- [ ] Regression-sensitive behavior was checked.
- [ ] Final diff was reviewed.
- [ ] Tested scenarios table was provided.
- [ ] Failed/untested scenarios were not hidden.
- [ ] Reusable lessons were written to `MEMORY.md`.

If an applicable checkbox cannot be completed, the task must not be reported as fully verified.

## 58. Core Rule

Never confuse:

```text
CODE WRITTEN
```

with:

```text
FEATURE COMPLETE
```

The required workflow is:

```text
READ MEMORY
↓
INSPECT PROJECT
↓
UNDERSTAND ARCHITECTURE
↓
PLAN
↓
IMPLEMENT
↓
SELF-REVIEW
↓
AUTOMATED TEST
↓
RUN APPLICATION
↓
TEST REAL UI
↓
CHECK CONSOLE / NETWORK
↓
FIX DISCOVERED DEFECTS
↓
RETEST
↓
REGRESSION CHECK
↓
REVIEW FINAL DIFF
↓
UPDATE MEMORY
↓
PROVIDE TESTED TABLE
```

Only then report completion.
