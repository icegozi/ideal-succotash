---
name: responsive-brand-ui-makeup
description: Audits and redesigns existing UI components and screens for responsive desktop/mobile use, visual consistency, functional clarity, minimalism, and distinctive brand identity. Produces a detailed design/refactor plan first and waits for explicit approval before implementation.
---

# Responsive Brand UI Makeover

## Purpose

Use this skill when the user wants to:

- make existing screens work well on both desktop and mobile;
- improve visual consistency across the application;
- simplify the interface so users focus on core functions;
- standardize spacing, typography, layout, states, and components;
- create a recognizable product visual identity;
- improve usability without changing business logic unnecessarily;
- refactor existing UI into a coherent design system;
- modernize an existing admin, ERP, hospital, inventory, CRM, or operational system.

The goal is NOT to make the interface decorative.

The goal is to create a UI that is:

- clear;
- responsive;
- minimal;
- consistent;
- fast to scan;
- easy to operate;
- visually distinctive;
- aligned with the product's brand;
- focused on business functionality.

---

# 1. Mandatory Workflow

Before proposing any visual redesign or implementation:

1. Read `MEMORY.md`.
2. Read all applicable rules under `.agents/rules/`.
3. Inspect the current frontend architecture.
4. Inspect the existing component system.
5. Inspect actual screens and component usages.
6. Inspect design tokens, global styles, CSS/Tailwind config, theme variables, fonts, icons, and layout primitives.
7. Inspect responsive behavior already present in the project.
8. Inspect shared form/table/modal/navigation components.
9. Identify the current brand language, if any.
10. Only then produce a UI audit and redesign plan.

Do NOT start editing source code during the planning phase.

---

# 2. Approval Gate

This skill uses a strict two-stage workflow.

## Stage 1 — Audit & Plan

Allowed:

- inspect;
- analyze;
- compare;
- propose;
- design;
- create component strategy;
- create responsive strategy;
- create migration plan;
- create test plan;
- create design token plan.

Not allowed:

- edit source files;
- create new production components;
- migrate screens;
- install dependencies;
- remove old components;
- rewrite styles;
- modify routes;
- alter business logic.

At the end of Stage 1:

STOP.

Wait for explicit approval.

Only begin implementation when the user explicitly says something equivalent to:

- "Approve"
- "Triển khai"
- "Implement"
- "Bắt đầu code"
- "Làm theo plan"

If the user requests changes to the plan, update the plan only and STOP again.

---

# 3. Preserve Functionality

This is a visual/responsive refactor unless the user explicitly requests functional changes.

Do not accidentally change:

- business rules;
- validation behavior;
- API contracts;
- permissions;
- data mapping;
- submit behavior;
- pagination logic;
- filter semantics;
- search semantics;
- backend behavior.

The existing function must remain correct while the presentation is improved.

If a UI issue reveals a functional bug, report it separately.

---

# 4. Audit Existing UI

Inspect all relevant areas:

- desktop layouts;
- tablet layouts;
- mobile layouts;
- sidebar;
- top navigation;
- page headers;
- breadcrumbs;
- cards;
- tables;
- search/filter sections;
- forms;
- modals;
- dialogs;
- drawers;
- tabs;
- pagination;
- alerts;
- toasts;
- empty states;
- loading states;
- error states;
- confirmation flows;
- dashboard widgets.

Do not only inspect one screen.

Build a representative UI inventory first.

---

# 5. Create Screen Inventory

Produce a table:

| Screen | Route | Main Components | Desktop Issues | Mobile Issues | Brand Consistency | Priority |
|---|---|---|---|---|---|---|

Classify priority:

- P0 — blocks important usage;
- P1 — high-traffic/core workflow;
- P2 — normal operational screen;
- P3 — lower priority/rarely used.

Do not redesign low-priority screens before critical operational flows.

---

# 6. Create Component Inventory

Audit reusable primitives and patterns such as:

- Button;
- Input;
- Textarea;
- Select/Pulldown;
- DatePicker;
- Checkbox;
- Radio;
- FormField;
- Table;
- Pagination;
- Modal/Dialog;
- Drawer;
- Card;
- Badge;
- Alert;
- Tabs;
- SearchBar;
- FilterPanel;
- EmptyState;
- Skeleton;
- Tooltip;
- DropdownMenu;
- PageHeader;
- SectionHeader;
- SidebarItem;
- MobileNavigation.

Create a table:

| Component | Existing Variants | Usage Count | Responsive Quality | Visual Consistency | Common Candidate |
|---|---:|---:|---|---|---|

Do not create a new common component when an existing component can be improved safely.

---

# 7. Design Philosophy

The UI should follow these principles.

## 7.1 Function First

The most important business action must be visually obvious.

Users should understand:

- where they are;
- what data they are looking at;
- what they can do next;
- which action is primary;
- which actions are secondary;
- what requires attention.

Do not let decorative UI compete with operational tasks.

## 7.2 Minimal but Not Empty

Minimal means:

- fewer unnecessary elements;
- clearer hierarchy;
- consistent spacing;
- restrained visual effects;
- fewer competing colors;
- fewer arbitrary card containers.

Minimal does NOT mean:

- removing important labels;
- hiding required information;
- making controls too small;
- sacrificing discoverability.

## 7.3 Information Density Appropriate to Context

Operational systems often require more information than consumer apps.

Desktop can be information-dense.

Mobile must prioritize:

- key data;
- primary action;
- readable hierarchy;
- progressive disclosure.

Do not force the same information density on both desktop and mobile.

## 7.4 Consistency Over Novelty

Use the same patterns for the same behavior.

Examples:

- same primary button style;
- same error treatment;
- same table header style;
- same filter pattern;
- same modal footer;
- same status badge logic.

Brand identity must come from systematic visual language, not random unique styling.

---

# 8. Responsive Breakpoint Strategy

Inspect the project's existing breakpoint system first.

Reuse existing breakpoints whenever possible.

Do not introduce a second responsive system unless required.

Define behavior for:

- Mobile;
- Tablet;
- Desktop;
- Large Desktop where relevant.

Do not only make components "shrink".

Responsive design must adapt structure.

Examples:

Desktop:

```text
Sidebar + Content
Table
Inline filters
Multi-column form
```

Mobile:

```text
Drawer navigation
Card/list representation
Collapsible filters
Single-column form
Sticky primary action when useful
```

---

# 9. Mobile-First Usability Rules

For mobile, review:

- touch target size;
- spacing between controls;
- readability;
- horizontal overflow;
- table behavior;
- action placement;
- modal usability;
- form width;
- keyboard obstruction;
- long labels;
- filter usability;
- navigation depth.

Avoid:

- tiny icon-only controls without labels where meaning is unclear;
- fixed desktop widths;
- unnecessary horizontal scrolling;
- multiple primary actions;
- desktop tables compressed into unreadable layouts.

---

# 10. Table Responsive Strategy

Tables require special handling.

For each table, determine the correct mobile strategy.

Possible approaches:

### Strategy A — Horizontal scroll

Use only when preserving column relationships is critical.

### Strategy B — Priority columns

Hide low-priority columns on smaller screens.

### Strategy C — Row cards

Transform each row into a compact card/list item.

### Strategy D — Expandable details

Show important columns first and expose secondary fields on demand.

Do not automatically convert every table into cards.

Choose based on the actual workflow.

Document the strategy for each important table.

---

# 11. Form Responsive Strategy

Desktop:

- use 2-column layout only when fields are logically related and readable;
- align related fields;
- keep labels consistent.

Mobile:

- default to one column;
- avoid cramped side-by-side controls;
- preserve logical field order;
- keep primary submit action easy to reach.

Do not reorder fields in a way that changes business meaning.

---

# 12. Modal / Dialog Responsive Strategy

Desktop:

- modal/dialog is acceptable for contained tasks.

Mobile:

consider:

- full-width dialog;
- bottom sheet;
- full-screen modal;
- drawer;

depending on task complexity.

Long forms should not be squeezed into small centered modals on mobile.

---

# 13. Navigation Strategy

Audit:

- sidebar;
- mobile navigation;
- active state;
- grouped items;
- icons;
- labels;
- collapsed state;
- permissions.

Desktop navigation should optimize scan speed.

Mobile navigation should optimize reachability and clarity.

Do not expose every secondary action in the first mobile navigation layer.

---

# 14. Visual Hierarchy

Each screen should have a clear hierarchy:

```text
Page title
↓
Context / summary
↓
Primary action
↓
Filters / search
↓
Main content
↓
Secondary actions
```

Avoid multiple elements competing as the primary focus.

Use size, weight, spacing, and contrast before using more colors.

---

# 15. Brand Identity

The product must develop a recognizable visual language.

Create brand identity through a small number of consistent characteristics.

Possible brand signatures:

- distinctive primary accent;
- specific radius system;
- specific button treatment;
- consistent card/header shape;
- signature icon style;
- typography hierarchy;
- status badge system;
- subtle surface treatment;
- consistent spacing rhythm.

Do not create brand identity through excessive gradients, shadows, or decorative graphics.

---

# 16. Brand Token Proposal

Audit current colors and propose a token system.

Example concept:

```text
brand-primary
brand-primary-hover
brand-primary-soft

surface-page
surface-card
surface-muted

text-primary
text-secondary
text-muted

border-default
border-strong

status-success
status-warning
status-danger
status-info
```

Use existing project tokens if they already exist.

Do not hard-code colors repeatedly in individual screens.

---

# 17. Color Rules

Prefer a restrained palette.

Recommended hierarchy:

- one primary brand color;
- neutral surfaces;
- semantic status colors;
- limited secondary accent.

Do not use brand color for every element.

Primary color should highlight:

- primary actions;
- active navigation;
- key focus states;
- selected states;
- limited brand accents.

---

# 18. Typography

Create a consistent type scale.

Audit:

- page titles;
- section titles;
- card titles;
- labels;
- body text;
- helper text;
- table headers;
- table cells;
- badges.

Avoid arbitrary font sizes screen by screen.

Prefer a small, reusable hierarchy.

Typography must remain readable on mobile.

---

# 19. Spacing System

Audit spacing duplication.

Prefer a predictable spacing rhythm.

For example:

```text
4
8
12
16
24
32
```

or the project's existing scale.

Do not introduce arbitrary values such as:

```text
13px
19px
27px
```

without a clear reason.

---

# 20. Radius and Border System

Use a consistent radius system.

Do not mix many unrelated values.

Example:

```text
sm
md
lg
```

Use borders to define structure before heavy shadows.

Operational systems should generally avoid excessive floating-card appearance.

---

# 21. Shadow Usage

Shadows should be subtle and purposeful.

Use them mainly for:

- overlays;
- menus;
- dialogs;
- elevated temporary surfaces.

Do not apply strong shadows to every card.

---

# 22. Button Hierarchy

Standardize buttons.

At minimum identify:

- Primary;
- Secondary;
- Tertiary/Ghost;
- Destructive;
- Icon button.

Each screen should normally have one clear primary action.

Do not use the same visual weight for:

- Save;
- Cancel;
- Delete;
- Secondary navigation.

---

# 23. Icon Strategy

Use one icon family where possible.

Audit:

- size;
- stroke;
- fill;
- alignment;
- icon-only controls.

Do not mix unrelated icon styles.

Icon-only buttons must have:

- tooltip or accessible label where needed;
- sufficient touch target;
- clear meaning.

---

# 24. Status Design

Create consistent treatment for statuses.

Examples:

- Active;
- Inactive;
- Draft;
- Confirmed;
- Cancelled;
- Expired;
- Near expiry;
- Warning;
- Error.

Do not rely only on color.

Use:

```text
color + text
```

and, where useful:

```text
color + icon + text
```

---

# 25. Loading, Empty, Error States

Every important data screen must account for:

- loading;
- empty;
- error;
- no search results;
- no permission where applicable.

Avoid blank areas.

Empty states should guide the user toward the next useful action.

---

# 26. Search and Filter UX

Audit all search/filter patterns.

Standardize:

- search field placement;
- filter grouping;
- reset behavior;
- apply behavior;
- Enter behavior;
- mobile collapse behavior;
- active filter indication.

Desktop may use inline filters.

Mobile should usually use:

- collapsible section;
- drawer;
- bottom sheet;

when filters are numerous.

---

# 27. Action Placement

Primary action placement should be predictable.

Examples:

Desktop:
top-right of page header or form footer.

Mobile:
full-width footer action or sticky action when appropriate.

Avoid moving the same action to unrelated locations on different screens.

---

# 28. Preserve Data Visibility

Do not hide critical operational information for the sake of minimalism.

Classify information:

### Primary
Must be immediately visible.

### Secondary
Visible but lower emphasis.

### Tertiary
Can be collapsed or moved to details.

This classification should be explicit in the plan.

---

# 29. Accessibility

Review:

- keyboard navigation;
- focus visibility;
- semantic controls;
- form labels;
- aria-invalid;
- aria-describedby;
- contrast;
- touch target size;
- modal focus behavior;
- readable status labels.

Minimal design must not reduce accessibility.

---

# 30. Avoid Over-Design

Do NOT introduce:

- excessive gradients;
- glassmorphism everywhere;
- strong shadows everywhere;
- unnecessary animation;
- decorative motion on operational workflows;
- too many accent colors;
- oversized whitespace that reduces productivity.

The interface should feel refined, not ornamental.

---

# 31. Motion Rules

Use motion only where it helps understanding.

Good uses:

- drawer open/close;
- modal transition;
- accordion expansion;
- state transition feedback.

Avoid slow animation on frequent operations.

Prefer short, subtle transitions.

Respect reduced-motion settings where supported.

---

# 32. Brand Signature Proposal

During the planning phase, propose 2–3 brand signature directions.

Each direction should define:

- primary color behavior;
- typography character;
- radius language;
- button identity;
- navigation identity;
- card/surface style;
- icon treatment.

Example:

## Direction A — Clinical Precision
Clean, structured, restrained, high readability.

## Direction B — Modern Operational
Compact, neutral, strong accent, productivity-first.

## Direction C — Friendly Professional
Softer surfaces and radius, but still operational.

Do not implement any direction before user approval.

---

# 33. Component Makeup Matrix

Create:

| Component | Current Issue | Desktop Proposal | Mobile Proposal | Brand Treatment | Risk |
|---|---|---|---|---|---|

Include at least:

- Button;
- Input;
- Select;
- DatePicker;
- Checkbox;
- Radio;
- FormField;
- Table;
- Modal;
- Card;
- Badge;
- Search;
- Filter;
- Pagination;
- Sidebar/navigation.

---

# 34. Screen Makeup Matrix

Create:

| Screen | Current Problem | Proposed Layout | Mobile Adaptation | Components Affected | Priority |
|---|---|---|---|---|---|

Do not redesign screens without understanding their actual tasks.

---

# 35. Design Token Plan

Propose reusable tokens for:

- colors;
- spacing;
- typography;
- radius;
- borders;
- shadows;
- control heights;
- icon sizes;
- breakpoints if needed.

Prefer existing Tailwind/theme variables.

Do not create duplicate token systems.

---

# 36. Common Component Plan

When repeated patterns are found, propose commonization.

Classify each component:

- MUST COMMONIZE;
- SHOULD COMMONIZE;
- KEEP DOMAIN-SPECIFIC;
- KEEP AS-IS.

Do not turn domain-specific business components into generic UI primitives.

Example:

```text
WarehouseSelect
    ↓
Common Select
```

is good.

Putting warehouse API logic inside generic `Select` is not.

---

# 37. Migration Strategy

Use phased migration.

Recommended:

## Phase 1 — Foundation

- design tokens;
- typography;
- spacing;
- primitive components;
- responsive utilities.

## Phase 2 — Pilot

Apply to 1–3 representative screens.

## Phase 3 — Core Workflows

Migrate the highest-traffic operational screens.

## Phase 4 — Secondary Screens

Migrate remaining screens.

## Phase 5 — Cleanup

Remove legacy components/styles only after confirming zero usage.

Avoid one large visual rewrite.

---

# 38. Choose Pilot Screens

Select pilot screens that:

- contain several component types;
- represent common application patterns;
- are important enough to validate the design;
- are not so critical that initial experimentation creates excessive risk.

Explain why each pilot is selected.

---

# 39. Backward Compatibility

Preserve behavior while visual components are migrated.

If a legacy component is heavily used:

prefer:

```text
create/improve common primitive
↓
adapt legacy wrapper
↓
migrate gradually
↓
remove legacy after zero usage
```

instead of a big-bang replacement.

---

# 40. Performance

UI cleanup must not cause:

- unnecessary re-renders;
- large new dependencies;
- excessive JS;
- repeated API calls;
- layout thrashing;
- unnecessary client-side transformations.

Do not install a UI framework solely to solve simple styling inconsistencies.

---

# 41. No New Dependency Without Need

Before proposing a new dependency:

1. inspect existing dependencies;
2. verify current tools cannot solve the problem;
3. evaluate bundle impact;
4. evaluate maintenance impact.

Prefer the project's current stack.

---

# 42. Testing Plan

Before implementation, produce a test plan.

For each common component, test relevant:

- render;
- interaction;
- disabled;
- readonly;
- error;
- loading;
- keyboard;
- responsive;
- accessibility;
- focus state.

For each migrated screen, test:

- desktop;
- mobile;
- primary user flow;
- validation;
- search/filter;
- modal/dialog;
- table behavior;
- navigation;
- API interaction;
- browser console;
- regression-sensitive behavior.

---

# 43. Viewport Verification

When browser/UI testing is available, verify at representative sizes.

Recommended minimum:

```text
Mobile narrow: ~360–390px
Mobile wide: ~414–430px
Tablet: ~768px
Desktop: ~1280px
Large desktop: ~1440px or wider when relevant
```

Use project/device requirements if they differ.

Do not claim responsive success from source-code inspection alone.

---

# 44. Visual Regression Checklist

Check:

- overflow;
- clipping;
- wrapping;
- alignment;
- spacing;
- unreadable text;
- broken modal;
- hidden actions;
- inaccessible controls;
- sticky element overlap;
- unexpected scrollbar;
- table overflow;
- keyboard obstruction on mobile;
- inconsistent component heights.

---

# 45. Functional Regression Checklist

After visual changes, verify:

- submit still works;
- validation still works;
- API payload unchanged unless intended;
- search works;
- filters work;
- pagination works;
- permissions remain correct;
- navigation works;
- data remains correct.

A prettier UI that breaks workflow is a failed refactor.

---

# 46. Required Planning Output

Before implementation, produce:

# Responsive Brand UI Audit

## 1. Current Frontend Architecture

## 2. Current Visual Language

## 3. Screen Inventory

## 4. Component Inventory

## 5. Desktop Issues

## 6. Mobile Issues

## 7. Design Inconsistencies

## 8. Information Hierarchy Problems

## 9. Proposed Brand Directions

Provide 2–3 directions.

## 10. Recommended Brand Direction

Explain why.

## 11. Proposed Design Tokens

## 12. Proposed Responsive Rules

## 13. Component Makeup Matrix

## 14. Screen Makeup Matrix

## 15. Common Component Plan

## 16. Pilot Screens

## 17. Detailed Migration Plan

## 18. File Change Plan

Format:

| Action | File | Purpose | Risk |
|---|---|---|---|

Do not modify files yet.

## 19. Test Plan

## 20. Risk Analysis

Format:

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|

## 21. Suggested MEMORY.md Updates

Do not modify `MEMORY.md` yet during planning.

## 22. Open Questions / Decisions Needed

## 23. Recommendation

---

# 47. Planning Phase Ending

End Stage 1 with exactly this intent:

```text
RESPONSIVE BRAND UI PLAN READY FOR REVIEW

No implementation has been performed.

Please review:
- brand direction;
- responsive strategy;
- component makeup;
- design tokens;
- pilot screens;
- migration plan;
- testing strategy.

I will wait for explicit approval before modifying the codebase.
```

Then STOP.

---

# 48. Implementation After Approval

After explicit approval:

1. Re-read `MEMORY.md`.
2. Re-read applicable rules.
3. Re-read the approved plan.
4. Implement phase-by-phase.
5. Do not deviate significantly from the approved design.
6. Run tests after each phase.
7. Verify actual desktop and mobile UI.
8. Fix defects discovered during testing.
9. Re-test.
10. Review final branch diff.
11. Update `MEMORY.md` with durable design conventions.
12. Provide a tested report.

---

# 49. Plan Deviation Rule

If implementation reveals that the approved plan is materially incorrect:

STOP the affected portion.

Report:

```text
PLAN DEVIATION REQUIRED
```

Include:

- what was discovered;
- why the approved plan is no longer appropriate;
- proposed adjustment;
- affected screens/components;
- risk;
- whether previous work remains valid.

Wait for approval when the change materially affects architecture, brand direction, or migration scope.

---

# 50. Code Style

During implementation:

- follow existing project architecture;
- use common components where approved;
- avoid duplicate styles;
- avoid inline magic values when tokens exist;
- keep comments in English;
- comments should explain WHY;
- functional comments should normally be no more than 3 lines;
- remove debug code;
- avoid unnecessary dependencies;
- keep domain logic outside generic UI primitives.

---

# 51. Final Verification Report

After implementation, provide:

## Implemented

## Brand System Applied

## Responsive Changes

## Components Updated

## Screens Updated

## Files Changed

## Automated Verification

## UI Verification

Use:

| # | Scenario | Viewport | Method | Expected | Actual | Status |
|---|---|---|---|---|---|---|

Status:

- PASS
- FAIL
- NOT TESTED
- BLOCKED

## Issues Found and Fixed

## Remaining Risks

## Memory Updated

## Merge Readiness

Do not claim "bug free".

Use:

```text
No defects were found in the tested scenarios.
```

when accurate.

---

# 52. Definition of Done

The UI makeover is complete only when all applicable items are satisfied:

- [ ] `MEMORY.md` was read.
- [ ] Applicable project rules were read.
- [ ] Existing architecture was inspected.
- [ ] Existing component usage was audited.
- [ ] Brand direction was approved.
- [ ] Responsive strategy was approved.
- [ ] Common component strategy was approved.
- [ ] Desktop layout works.
- [ ] Mobile layout works.
- [ ] No critical overflow remains.
- [ ] Main workflows remain functional.
- [ ] Form validation remains functional.
- [ ] Search/filter behavior remains functional.
- [ ] Table behavior remains usable.
- [ ] Modal/dialog behavior remains usable.
- [ ] Browser console was checked where possible.
- [ ] Network/API interactions were checked where applicable.
- [ ] Accessibility basics were checked.
- [ ] Relevant automated tests pass.
- [ ] Build/type-check/lint pass where applicable.
- [ ] UI was tested at representative viewports.
- [ ] Final branch diff was reviewed.
- [ ] No unnecessary visual complexity was introduced.
- [ ] Brand identity is consistent across migrated screens.
- [ ] Durable conventions were recorded in `MEMORY.md`.

---

# 53. Core Principle

Do not redesign for decoration.

Redesign to improve:

```text
clarity
↓
usability
↓
responsiveness
↓
consistency
↓
brand recognition
↓
maintainability
```

The final interface should feel like one product, not a collection of unrelated screens.

It should be visually recognizable without distracting users from their work.
