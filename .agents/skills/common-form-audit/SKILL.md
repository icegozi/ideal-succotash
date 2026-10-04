---
name: common-form-audit
description: Audits existing form, input, select, date, checkbox, radio, modal, confirmation, error-dialog, and toast patterns; proposes a reusable common-component architecture, migration plan, notification strategy, and test plan; waits for explicit user approval before implementation.
---

# Common Form Component Audit & Planning

## Purpose

Use this skill when the user wants to standardize existing UI form and feedback components into a smaller, reusable, consistent common-component system.

Primary scope:

- Input
- Textarea
- Pulldown / Select / Dropdown
- DatePicker
- Date Input
- DateTime Input
- Radio
- Radio Group
- Checkbox
- Checkbox Group
- Form
- FormField
- FormLabel
- FormError
- FormHelpText
- Search Input
- Number Input
- Currency Input
- Password Input
- File Input
- Multi Select
- Autocomplete / Combobox
- Modal / Dialog
- Confirmation Dialog
- Error Dialog
- Toast / Snackbar / Notification

The goals are:

1. Audit the real implementation across the project.
2. Find duplicated UI, behavior, validation, and notification patterns.
3. Decide what should become common and what should stay domain-specific.
4. Design minimal, stable component APIs.
5. Map existing screens to the proposed common components.
6. Define a phased migration plan.
7. Define regression, accessibility, and UI test coverage.
8. Stop and wait for explicit user approval before implementation.

---

# 0. Critical Approval Gate

This skill has two distinct stages.

## Stage 1 — Audit and Planning

Allowed:

- read;
- inspect;
- search;
- count;
- analyze;
- compare;
- design;
- propose;
- create migration plans;
- create test plans;
- create risk analysis.

Not allowed:

- create production components;
- edit existing production components;
- migrate screens;
- create production tests;
- install packages;
- refactor production source;
- delete legacy components;
- modify `MEMORY.md`.

After presenting the complete plan:

**STOP.**

Wait for explicit approval.

Implementation may start only after the user explicitly says something equivalent to:

- "Approve"
- "Triển khai"
- "Implement"
- "Bắt đầu code"
- "Làm theo plan"

If the user asks to revise the plan, revise the plan only and STOP again.

## Stage 2 — Implementation

Implementation starts only after explicit approval and must follow the final approved plan.

---

# 1. Mandatory Discovery Workflow

Before creating any plan:

1. Read `MEMORY.md`.
2. Read all applicable rules under `.agents/rules/`.
3. Identify the current frontend architecture.
4. Inspect relevant project configuration:
   - `package.json`
   - `composer.json` if present
   - `tsconfig*`
   - lint configuration
   - formatter configuration
   - Tailwind/theme configuration
   - CSS/SCSS/global styles
   - UI library
   - form library
   - validation library
5. Inspect existing common/shared/UI component folders.
6. Search actual component usages across screens.
7. Inspect form validation and server-error mapping.
8. Inspect modal/dialog/toast providers, hooks, services, and direct calls.
9. Inspect representative desktop and mobile screens.
10. Inspect relevant existing tests.

Do not create a plan from filenames alone.

---

# 2. Search Scope and Exclusions

Search project-owned source code.

Include relevant locations such as:

- pages
- screens
- routes/views
- forms
- modals
- dialogs
- filters
- search bars
- admin screens
- create/edit screens
- reusable partials
- shared components
- hooks/composables
- providers
- stores/state
- utility modules related to forms or notifications
- test files when they reveal expected behavior

Exclude generated or third-party directories unless the project architecture specifically requires them:

- `node_modules/`
- `vendor/`
- `dist/`
- `build/`
- `coverage/`
- `.next/`
- `.nuxt/`
- `public/build/`
- generated code folders
- cache folders
- temporary artifacts

Do not count third-party or generated components as project-owned usage.

If exact enumeration is not possible, state:

`estimated / not fully enumerated`

instead of inventing a precise count.

---

# 3. Identify Current Frontend Architecture

Document only what is confirmed by the repository.

Identify:

- Framework
  - React
  - Vue
  - Next.js
  - Nuxt
  - Blade
  - other actual framework
- Language
  - TypeScript
  - JavaScript
- Styling
  - Tailwind
  - CSS Modules
  - SCSS
  - styled-components
  - other
- UI library
  - shadcn
  - Radix
  - MUI
  - Ant Design
  - Headless UI
  - PrimeVue
  - custom
  - other
- Form solution
  - React Hook Form
  - Formik
  - vee-validate
  - custom form state
  - server-driven form
  - other
- Validation
  - Zod
  - Yup
  - Joi
  - Laravel validation
  - custom
  - other
- Notification/dialog architecture
  - provider
  - hook/composable
  - global service
  - direct local component usage
  - other

Output:

## Current Frontend Architecture

Do not infer technologies that are not present in source.

---

# 4. Search All Form and Feedback Implementations

Search by both syntax and behavior.

## Input

Look for patterns such as:

```text
<input
<Input
<BaseInput
<TextInput
<FormInput
```

## Select / Pulldown / Dropdown

```text
<select
<Select
<BaseSelect
<Dropdown
<Combobox
```

Use **Select** as the canonical generic primitive name in the plan unless the current project has a stronger established naming convention.

`Pulldown` and `Dropdown` may remain domain/project terminology, but avoid creating three generic primitives that mean the same thing.

## Date

```text
type="date"
<DatePicker
<DateInput
<Calendar
```

## Radio

```text
type="radio"
<Radio
<RadioGroup
```

## Checkbox

```text
type="checkbox"
<Checkbox
<CheckboxGroup
```

## Textarea

```text
<textarea
<Textarea
```

## Form

```text
<form
<Form
<FormField
<FormItem
<FormGroup
```

## Modal / Dialog / Alert / Notification

Search reusable definitions and direct usages for patterns such as:

```text
<Modal
<Dialog
<AlertDialog
<ConfirmDialog
<ConfirmationDialog
<ConfirmationModal
<ErrorDialog
<ErrorModal
<Toast
<Snackbar
<Notification
toast(
notify(
showToast(
showModal(
openDialog(
```

Also inspect:

- notification providers;
- dialog providers;
- hooks/composables;
- global stores/services;
- direct imperative calls inside pages;
- duplicated local confirmation/error modal implementations.

Do not limit the audit to exact keywords above.

Search for equivalent behavior.

---

# 5. Create Component Inventory

Create an evidence-backed inventory.

Use:

| Component Type | Existing Component | File / Evidence | Usage Count | Variants | Duplicate? | Common Candidate |
|---|---|---|---:|---|---|---|

Example:

| Input | TextInput | `components/TextInput.*` | 12 | text/password | Yes | Yes |
| Select | StoreSelect | `components/StoreSelect.*` | 6 | async/static | Partial | Analyze |
| DatePicker | DatePicker | `components/DatePicker.*` | 4 | date-only | No | Yes |
| Confirmation | DeleteDialog | `screens/...` | 5 | destructive | Yes | Yes |

If a component family has multiple implementations, show the structure.

Example:

```text
Input
├── TextInput
├── InputField
├── SearchInput
├── InlineInput
└── Raw <input> usages
```

Evidence is mandatory for important conclusions.

---

# 6. Find Raw Native Elements

Audit direct native usage:

```html
<input>
<select>
<textarea>
<input type="checkbox">
<input type="radio">
<input type="date">
```

Report:

```text
Raw input: X usages
Raw select: X usages
Raw checkbox: X usages
Raw radio: X usages
Raw date: X usages
Raw textarea: X usages
```

Then classify each meaningful pattern:

- migrate;
- retain raw;
- wrap only in specific contexts;
- no change needed.

Do not assume every raw element must be migrated.

---

# 7. Analyze Duplication

Audit duplication in five dimensions.

## Visual duplication

Examples:

- border
- radius
- height
- spacing
- typography
- focus state
- disabled state
- error state

## Behavioral duplication

Examples:

- required handling
- clear behavior
- loading
- readonly
- disabled
- value mapping
- event mapping
- controlled/uncontrolled logic

## Validation duplication

Examples:

- label
- required marker
- field-level error
- help text
- server-error mapping

## Date duplication

Examples:

- formatting
- parsing
- timezone conversion
- date-only vs datetime handling

## Notification/dialog duplication

Examples:

- repeated delete confirmation modal markup
- repeated API error modal
- different toast APIs across screens
- inconsistent success messages
- duplicate success toast for one action
- inconsistent destructive button behavior

---

# 8. Classify Components Correctly

Classify each implementation into exactly one category.

## MUST COMMONIZE

High duplication + same responsibility + same behavior.

## SHOULD COMMONIZE

Mostly the same behavior with manageable differences.

## KEEP DOMAIN-SPECIFIC

Contains real domain behavior.

Examples:

```text
MedicineSelect
WarehouseSelect
SupplierSelect
UserSelect
DepartmentSelect
DeleteMedicineDialog
```

A domain component may use a common primitive internally:

```text
WarehouseSelect
    ↓
Common Select
```

or:

```text
DeleteMedicineDialog
    ↓
ConfirmationDialog
```

## KEEP AS-IS

Unique use case where abstraction provides no meaningful benefit.

Do not commonize only to reduce line count.

---

# 9. Proposed Common Architecture

Use existing project structure when it is already coherent.

Conceptual structure:

```text
components/
└── common/
    ├── form/
    │   ├── Input
    │   ├── Textarea
    │   ├── Select
    │   ├── DatePicker
    │   ├── Checkbox
    │   ├── CheckboxGroup
    │   ├── Radio
    │   ├── RadioGroup
    │   ├── FormField
    │   ├── FormLabel
    │   ├── FormError
    │   └── FormHelpText
    │
    └── feedback/
        ├── Dialog
        ├── ConfirmationDialog
        ├── ErrorDialog
        └── Toast
```

If the repository already uses `components/ui/` or another established structure, adapt to it instead.

Do not put business-specific API calls inside generic common primitives.

---

# 10. FormField Composition

Prefer composition.

Concept:

```text
FormField
├── Label
├── Control
├── HelpText
└── ErrorMessage
```

Example only:

```tsx
<FormField
    label="Medicine name"
    required
    error={errors.name}
>
    <Input />
</FormField>
```

The example must adapt to the actual framework.

Do not put business validation logic inside `FormField`.

---

# 11. Common Input Design

Analyze only props required by confirmed usage.

Potential props:

```text
name
value / modelValue
defaultValue
type
placeholder
disabled
readonly
required
autocomplete
maxlength
minlength
min
max
step
error
size
prefix
suffix
clearable
```

Do not design speculative APIs with dozens of unused props.

---

# 12. Common Select Design

Analyze:

```text
value
options
placeholder
disabled
readonly
required
clearable
searchable
multiple
loading
emptyText
error
```

Conceptual option shape:

```ts
{
    label: string
    value: ...
    disabled?: boolean
}
```

Respect actual domain value types.

Do not silently convert all IDs to string if the project uses number/UUID types intentionally.

---

# 13. Common DatePicker Design

Determine the actual value contract:

```text
YYYY-MM-DD
Date object
ISO string
domain date type
```

Explicitly distinguish:

```text
DATE
```

from:

```text
DATETIME
```

Audit:

- parsing;
- formatting;
- timezone behavior;
- min/max;
- disabled;
- readonly;
- required;
- clearable;
- locale;
- invalid dates.

Do not introduce datetime conversion into date-only fields.

---

# 14. Common Checkbox Design

Separate:

- single boolean checkbox;
- checkbox group / array selection.

Potential API:

```text
checked
value
label
disabled
indeterminate
```

Do not force group semantics into a single-checkbox primitive.

---

# 15. Common Radio Design

Analyze:

- `Radio`
- `RadioGroup`

Prefer a clear group API when actual usages support it:

```text
options
value
disabled
```

Do not create extra variants without evidence.

---

# 16. Form Component Design

Do not create a "God Form Component".

A common form abstraction should only solve confirmed cross-screen concerns.

Possible concerns:

- submit state;
- common layout;
- common form-level error rendering.

Business-specific submit and mutation logic should stay in the appropriate screen/container/domain layer.

---

# 17. Standard Component States

For each common component, audit applicable states:

- default
- hover
- focus
- filled
- disabled
- readonly
- error
- success if the project uses it
- loading if applicable

Keep state behavior visually and functionally consistent.

---

# 18. Error State Standardization

Audit how the project currently handles:

- red/error border;
- field error text;
- form-level error;
- server validation error;
- toast;
- modal/dialog.

Prefer:

```text
Label
Control
ErrorMessage
```

for field-level validation.

Server validation errors should map to fields when the backend response supports it.

---

# 19. Notification Decision Matrix

The plan must include a decision matrix.

Default recommendation:

| Situation | Preferred UI |
|---|---|
| Field validation error | Inline `FormError` |
| Form-level validation error | Form-level/inline error summary |
| Successful save/create/update | Success Toast |
| Non-blocking request failure | Error Toast |
| Destructive/high-impact action before execution | `ConfirmationDialog` |
| Critical/blocking error requiring acknowledgement | `ErrorDialog` |
| Informational non-blocking update | Info Toast only when useful |

Rules:

- Never use a modal for normal field validation.
- Do not use a success modal for ordinary save/update success.
- Do not show a confirmation dialog for trivial reversible actions.
- Never show raw SQL errors, stack traces, internal paths, secrets, or raw internal exceptions to users.
- If the current project has a different but coherent convention, explain the tradeoff before proposing a change.

---

# 20. Confirmation Dialog Design

Use confirmation dialogs for destructive or high-impact actions where confirmation is justified.

Examples:

- delete;
- cancel document;
- confirm stock in/out;
- irreversible status transition;
- destructive bulk action.

Potential API:

```text
open
title
message
confirmLabel
cancelLabel
variant
loading
disabled
onConfirm
onCancel
```

Requirements:

- destructive action has distinct treatment;
- content explains the consequence;
- loading prevents duplicate submission;
- cancel must not execute the action;
- keyboard behavior must be intentional;
- focus trap and focus restore must be correct;
- action labels should be specific where possible.

Avoid vague confirmation text such as only:

```text
Are you sure?
```

when the action context is not obvious.

---

# 21. Error Dialog Design

Do not use `ErrorDialog` for every error.

Prefer:

- field error → inline;
- normal request failure → error toast when non-blocking;
- blocking/system-level error requiring acknowledgement → `ErrorDialog`.

Potential API:

```text
open
title
message
details?
actionLabel?
onClose
onRetry?
```

User-visible error content must be safe.

Never expose:

- raw SQL errors;
- stack traces;
- secret values;
- internal file paths;
- raw framework exceptions.

---

# 22. Toast / Notification Design

Ordinary successful actions should normally use non-blocking success toast feedback.

Examples:

```text
Medicine created successfully.
Medicine updated successfully.
Stock receipt confirmed successfully.
```

Toast requirements:

- concise;
- non-blocking;
- auto-dismiss after a reasonable interval;
- manual dismiss if the existing library supports it;
- duplicate prevention for a single action;
- should not cover primary navigation or primary actions;
- should remain usable on mobile;
- should support accessibility/live-region behavior where the framework/library allows it.

Analyze whether the project also needs:

- success;
- error;
- warning;
- info.

Do not create variants with no confirmed use.

---

# 23. Accessibility Requirements

Audit:

- label association;
- keyboard navigation;
- focus visibility;
- `aria-invalid`;
- `aria-describedby`;
- disabled semantics;
- checkbox/radio keyboard behavior;
- datepicker keyboard behavior;
- screen-reader compatibility.

Dialog requirements:

- semantic dialog role;
- `aria-labelledby`;
- `aria-describedby`;
- focus trap;
- focus restore;
- intentional Escape behavior.

Toast requirements:

- appropriate live-region semantics where supported;
- enough visibility duration;
- not color-only.

---

# 24. Responsive Requirements

Audit desktop and mobile behavior for all proposed common components.

For dialogs:

Desktop:
- reasonable width;
- consistent action alignment;
- readable content.

Mobile:
- fit viewport;
- long content scrolls safely;
- buttons meet touch-target requirements;
- keyboard does not hide critical actions;
- full-width/bottom-sheet/full-screen treatment may be proposed only if consistent with the project.

For toasts:

- fit narrow viewports;
- do not cover important navigation or primary actions;
- handle multiple notifications predictably.

---

# 25. Required Field Standard

Audit existing required indicators such as:

```text
*
Required
bắt buộc
```

Propose one project-consistent convention.

Do not hard-code required markers separately on every screen.

---

# 26. Label Standard

Audit:

- label placement;
- typography;
- spacing;
- required indicator;
- `for/id` or framework equivalent.

Preserve accessibility relationships.

---

# 27. Size Standardization

Audit current control heights and size variants.

If many arbitrary variants exist without business need, propose a smaller stable set such as:

```text
sm
md
lg
```

Do not invent size variants when the project only needs one.

---

# 28. Design Token Analysis

Audit:

- colors;
- borders;
- radius;
- spacing;
- typography;
- focus ring;
- disabled color;
- error color;
- overlay/backdrop tokens;
- toast/dialog surfaces if relevant.

Reuse existing design tokens.

Do not introduce duplicate token systems.

---

# 29. Type Safety

If TypeScript is used:

- use explicit useful types;
- avoid `any` for convenience;
- use generics only when they materially simplify usage;
- avoid over-generic component APIs.

Example concept:

```ts
SelectOption<T>
```

is acceptable only if project usage justifies it.

---

# 30. Controlled vs Uncontrolled Behavior

Audit the project's current pattern.

React examples:

```text
value
defaultValue
onChange
```

Vue examples:

```text
modelValue
update:modelValue
```

Do not introduce a completely different state model without strong reason.

---

# 31. Event Standardization

Audit event patterns such as:

```text
change
input
blur
focus
clear
select
confirm
cancel
close
dismiss
retry
```

Propose a minimal consistent event API.

Do not emit redundant events.

---

# 32. Form Library Integration

If the project uses a form/validation library, common components must integrate naturally.

Examples:

- React Hook Form
- Formik
- vee-validate
- Zod
- Yup

Do not create an abstraction that makes the existing form library harder to use.

---

# 33. Search / Filter Forms

Audit search/filter behavior separately from CRUD forms.

Search/filter concerns may include:

- Enter submit;
- reset;
- clear;
- query string synchronization;
- debounce;
- pagination interaction;
- mobile filter panel.

Do not force SearchForm and CRUD Form into one oversized abstraction.

---

# 34. Screen Inventory

Create a screen inventory.

Use:

| Screen | Route | Main Form/Feedback Components | Key Issues | Migration Priority | Evidence |
|---|---|---|---|---|---|

Do not omit:

- forms inside modal/dialog;
- confirmation flows;
- error flows;
- screens with direct toast calls;
- search/filter screens.

Priority may be:

- High
- Medium
- Low

based on usage, duplication, and regression risk.

---

# 35. Migration Matrix

Map current implementations to proposed common components.

Use:

| Current Implementation | Proposed Common | Screens | Change Type | Risk | Evidence |
|---|---|---|---|---|---|
| Raw input | Common Input | Medicine Create | Replace | Low | ... |
| Custom date field | Common DatePicker | Stock In | Adapt | Medium | ... |
| WarehouseSelect | Domain wrapper + Common Select | 8 screens | Internal refactor | Medium | ... |
| Delete modal | ConfirmationDialog | 5 screens | Replace/wrap | Medium | ... |
| Local success alert | Toast | 6 screens | Replace | Low | ... |

Evidence must point to actual project files/usages.

---

# 36. Proposed API for Each Common Component

For every proposed common component, document:

- Responsibility
- Required props
- Optional props
- Events
- Slots / children
- States
- Validation integration
- Accessibility
- Responsive behavior
- Existing implementations replaced
- Screens affected
- Why the abstraction is justified

Apply this to actual proposed components, including when relevant:

- Input
- Textarea
- Select
- DatePicker
- Checkbox
- CheckboxGroup
- Radio
- RadioGroup
- FormField
- Dialog
- ConfirmationDialog
- ErrorDialog
- Toast

For ConfirmationDialog / ErrorDialog / Toast, also document:

- when to use;
- when not to use;
- dismiss behavior;
- loading behavior;
- destructive behavior;
- duplicate prevention;
- API/form-state integration;
- accessibility;
- mobile behavior.

---

# 37. Example Usage

Examples are allowed only as pseudo/example usage during planning.

Do not create production source files.

Examples must reflect the actual proposed API and project framework.

---

# 38. Migration Strategy

Use phased migration.

## Phase 1 — Foundation

Implement approved common primitives and feedback components.

## Phase 2 — Pilot

Migrate 1–3 representative screens.

Choose pilots that:

- exercise several component types;
- are representative;
- can be tested thoroughly;
- are not unnecessarily high-risk.

## Phase 3 — Core Screens

Migrate important/high-traffic screens.

## Phase 4 — Remaining Screens

Migrate remaining applicable screens.

## Phase 5 — Cleanup

Remove legacy components only after confirming zero remaining usage.

Avoid big-bang migration when regression risk is high.

---

# 39. Backward Compatibility

For heavily used legacy components, prefer:

```text
introduce/improve common primitive
↓
adapt legacy wrapper if useful
↓
migrate gradually
↓
remove legacy only after zero usage
```

Do not break public component contracts without an explicit migration plan.

---

# 40. Risk Analysis

Create:

| Risk | Impact | Probability | Affected Screens/Components | Mitigation |
|---|---|---|---|---|

At minimum consider:

- event behavior changes;
- value type changes;
- form submit regression;
- validation regression;
- styling regression;
- date timezone regression;
- select value mismatch;
- disabled/readonly behavior;
- focus/keyboard issues;
- responsive layout;
- server error mapping;
- search/filter behavior;
- notification duplication;
- confirmation double-submit;
- modal focus loss;
- toast stacking;
- insufficient test coverage.

---

# 41. Test Strategy

Define tests before implementation.

## Input

```text
render
typing
disabled
readonly
required
error
maxlength
```

## Select

```text
open
select
disabled
clear
empty
options
value mapping
```

## DatePicker

```text
select date
clear
min/max
disabled
invalid date
date-only timezone behavior
```

## Checkbox

```text
checked
unchecked
disabled
group behavior
```

## Radio

```text
selection
change
disabled
group behavior
```

## FormField

```text
label
required
error
help text
aria association
```

## ConfirmationDialog

```text
open
cancel
confirm
destructive variant
loading
double-submit prevention
Escape behavior
focus trap
focus restore
mobile viewport
```

## ErrorDialog

```text
open
close
safe error message
retry if supported
long content
keyboard
focus behavior
mobile viewport
```

## Toast / Notification

```text
success
error if supported
auto dismiss
manual dismiss if supported
duplicate prevention
multiple notifications
mobile position
accessibility/live region
```

---

# 42. UI Regression Test Plan

For each migrated screen, plan tests for:

```text
initial render
input values
validation
submit
reset
disabled
server errors
responsive behavior
browser console
network request
```

For search/filter screens:

```text
search
Enter submit
clear
reset
query persistence
pagination interaction
```

For create/update/delete/confirm actions:

- success toast appears exactly as intended;
- confirmation appears before destructive/high-impact action when required;
- cancel does not execute the action;
- confirm executes the action once;
- loading prevents duplicate submit;
- blocking errors use `ErrorDialog` only when appropriate;
- field validation remains inline;
- toast/dialog does not break focus;
- toast/dialog remains usable on mobile.

---

# 43. Before / After Analysis

Estimate or count:

- current component count;
- duplicate implementations;
- raw native usages;
- proposed common components;
- screens affected;
- legacy components removable;
- modal/dialog variants;
- toast/notification variants.

Use exact counts when reliably enumerable.

Otherwise label the number:

`estimated / not fully enumerated`.

---

# 44. Do Not Overengineer

This is CRITICAL.

Do not design common components for hypothetical future requirements.

Avoid APIs such as:

```text
40 props
10 callbacks
15 visual variants
```

unless actual project usage proves they are needed.

Commonization must reduce conceptual complexity.

---

# 45. Keep Domain Logic Out of Common UI

Generic primitives must not know about:

```text
medicine
warehouse
supplier
invoice
patient
order
customer
```

Good:

```text
WarehouseSelect
    ↓
Common Select
```

Good:

```text
DeleteMedicineDialog
    ↓
ConfirmationDialog
```

Bad:

```text
Common Select
    directly loads warehouse API
```

unless the project deliberately uses a generic async-data abstraction and that architecture is already established.

---

# 46. File Change Plan

Planning output must include:

| Action | File | Purpose | Risk |
|---|---|---|---|
| CREATE | ... | Common Input | Low |
| CREATE | ... | ConfirmationDialog | Medium |
| CREATE | ... | Toast abstraction/provider | Medium |
| UPDATE | ... | Apply common fields | Medium |
| DELETE LATER | ... | Legacy component after zero usage | Medium |

During planning this table is proposal only.

Do not create the files yet.

---

# 47. Implementation Order

Derive the order from real dependencies.

Typical example:

1. FormField
2. Input
3. Textarea
4. Select
5. Checkbox
6. Radio
7. DatePicker
8. Dialog primitive
9. ConfirmationDialog
10. ErrorDialog
11. Toast/Notification abstraction
12. Pilot screen A
13. Pilot screen B
14. Regression tests
15. Remaining migration
16. Legacy cleanup

Do not force this order if the actual architecture requires another dependency order.

---

# 48. Definition of Done for Future Implementation

The approved implementation plan should include applicable items such as:

```text
[ ] Common Input implemented
[ ] Common Select implemented
[ ] Common DatePicker implemented
[ ] Common Checkbox implemented
[ ] Common Radio implemented
[ ] FormField standardized
[ ] ConfirmationDialog standardized
[ ] ErrorDialog standardized
[ ] Success Toast standardized
[ ] Notification Decision Matrix applied
[ ] Destructive actions prevent duplicate submission
[ ] Dialog keyboard/focus behavior verified
[ ] Toast duplicate prevention verified
[ ] Unit/component tests pass
[ ] Pilot screens migrated
[ ] UI manually/browser tested
[ ] Mobile behavior verified
[ ] Browser console checked
[ ] Relevant network/API behavior checked
[ ] Existing behavior preserved
[ ] No API regression
[ ] Remaining screens migrated
[ ] Legacy components removed only after zero usage
[ ] Final branch review completed against develop/main as applicable
```

---

# 49. Required Planning Output

Output must use this structure:

# Common Form Component Audit

## 1. Current Architecture

## 2. Existing Component Inventory

## 3. Raw Element Usage

## 4. Duplicate Analysis

## 5. Component Classification

Use:

| Component | Classification | Reason | Evidence |
|---|---|---|---|

## 6. Proposed Common Architecture

## 7. Component API Design

Include actual proposed:

- form primitives;
- dialog primitives;
- ConfirmationDialog;
- ErrorDialog;
- Toast/Notification.

## 7A. Notification & Dialog Strategy

## 7B. Notification Decision Matrix

## 7C. Accessibility / Focus Strategy

## 8. Screen Inventory

## 9. Migration Matrix

## 10. Pilot Screens

## 11. Detailed Implementation Plan

## 12. File Change Plan

## 13. Test Plan

## 13A. Modal & Toast Test Plan

## 14. Risk Analysis

## 15. Expected Benefits

Benefits must be tied to actual audit findings.

## 16. Open Questions / Decisions Needed

## 17. Suggested `MEMORY.md` Updates

Proposal only. Do not modify memory during planning.

## 18. Recommendation

---

# 50. Required Planning Ending

After presenting the complete plan, finish with this intent:

```text
PLAN READY FOR REVIEW

No implementation has been performed.

Please review the proposed:
- common component architecture;
- component APIs;
- confirmation/error dialog strategy;
- toast/notification strategy;
- notification decision matrix;
- migration scope;
- pilot screens;
- implementation phases;
- testing strategy.

I will wait for explicit approval before modifying the codebase.
```

Then STOP.

---

# 51. After User Review

If the user requests a plan change:

1. Revisit only the affected analysis.
2. Update the plan.
3. Clearly show the revised part.
4. Do not implement.
5. STOP again.

Only explicit implementation approval unlocks coding.

---

# 52. Implementation After Approval

After explicit approval:

1. Re-read `MEMORY.md`.
2. Re-read applicable `.agents/rules/`.
3. Re-read the final approved plan.
4. Confirm the approved scope.
5. Implement phase-by-phase.
6. Follow existing project architecture and style.
7. Run targeted component tests.
8. Run relevant integration/feature tests.
9. Run UI regression tests.
10. Test actual affected screens in the browser when available.
11. Check browser console.
12. Check relevant network requests.
13. Test representative desktop/mobile viewports where applicable.
14. Fix defects introduced by the migration.
15. Re-test.
16. Review the final branch diff against the actual base branch (`develop`, `main`, or repository equivalent).
17. Apply only minimal safe patches discovered during review.
18. Re-run affected verification.
19. Update `MEMORY.md` with durable conventions only.
20. Provide the tested result table required by project rules.

Do not treat a successful build as proof that the UI works.

---

# 53. Plan Deviation Rule

If implementation reveals that the approved plan is materially wrong:

STOP the affected portion.

Report:

```text
PLAN DEVIATION REQUIRED
```

Explain:

- what was discovered;
- why the approved plan is no longer appropriate;
- proposed change;
- affected files/components/screens;
- migration impact;
- risk.

Wait for approval when the deviation materially changes architecture or scope.

---

# 54. Memory Rule

During planning:

- do not edit `MEMORY.md`;
- propose `Suggested MEMORY.md updates`.

After approved implementation:

update `MEMORY.md` only for durable knowledge such as:

- canonical form conventions;
- common Select value type;
- date format contract;
- common component folder;
- confirmation/toast rules;
- reusable accessibility rule.

Do not store temporary migration details.

---

# 55. Review Priority

Prioritize:

```text
behavior correctness
↓
existing architecture compatibility
↓
validation consistency
↓
notification/dialog correctness
↓
type safety
↓
accessibility
↓
reusability
↓
testability
↓
responsive behavior
↓
visual consistency
↓
code reduction
```

Do not commonize only to reduce code volume.

---

# 56. Core Principle

The goal is not:

> create as many common components as possible.

The goal is:

> create the smallest stable set of reusable components that makes behavior, validation, feedback, accessibility, and UI consistent across the product.

Required workflow:

```text
READ MEMORY
↓
READ RULES
↓
SCAN PROJECT
↓
FIND FORM + DIALOG + TOAST IMPLEMENTATIONS
↓
INVENTORY WITH EVIDENCE
↓
FIND DUPLICATION
↓
CLASSIFY
↓
DESIGN COMMON API
↓
DESIGN NOTIFICATION / DIALOG STRATEGY
↓
MAP SCREENS
↓
DEFINE MIGRATION PLAN
↓
DEFINE TEST PLAN
↓
DEFINE RISKS
↓
PRESENT PLAN
↓
STOP
↓
WAIT FOR USER REVIEW
↓
REVISE PLAN IF REQUESTED
↓
WAIT FOR EXPLICIT APPROVAL
↓
ONLY THEN IMPLEMENT
↓
TEST
↓
REVIEW FINAL BRANCH DIFF
↓
APPLY MINIMAL PATCHES
↓
RETEST
```
