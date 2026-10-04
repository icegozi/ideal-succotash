---
name: standard-demo-data-generator
description: Audits a project's schema and domain rules, then designs and generates realistic, deterministic, safe, reusable demo data for local, development, staging, QA, screenshots, demos, and automated testing without using real personal data or corrupting production data.
---

# Standard Demo Data Generator

## Purpose

Use this skill when the user wants to create high-quality demo/sample/seed data for a software project.

This skill is designed to work across many project types, including:

- ERP;
- CRM;
- inventory;
- hospital/medical management;
- e-commerce;
- logistics;
- HR;
- finance;
- education;
- SaaS;
- admin systems;
- workflow systems;
- booking systems;
- dashboards;
- internal business tools.

The goal is NOT to create random meaningless rows.

The goal is to create demo data that is:

- realistic;
- internally consistent;
- deterministic;
- easy to understand;
- representative of real workflows;
- safe to share;
- free of real personal data;
- reproducible;
- easy to reset;
- useful for UI demos;
- useful for QA;
- useful for screenshots;
- useful for feature testing;
- aligned with actual project constraints.

---

# 1. Mandatory Workflow

Before creating demo data:

1. Read `MEMORY.md`.
2. Read all applicable rules under `.agents/rules/`.
3. Inspect the project architecture.
4. Inspect database schema/migrations.
5. Inspect models/entities.
6. Inspect enums/status definitions.
7. Inspect validation rules.
8. Inspect foreign keys and unique constraints.
9. Inspect existing factories/seeders/fixtures.
10. Inspect existing demo/test data conventions.
11. Inspect important business workflows.
12. Inspect role/permission structure.
13. Inspect localization requirements.
14. Inspect date/time conventions.
15. Inspect money/quantity precision rules.

Do not generate data blindly from table names.

---

# 2. Safety First

Never create or modify demo data in a production environment unless the user explicitly requests it and the project has a verified safe workflow.

Before execution, verify the environment.

Examples:

```text
local
development
dev
test
testing
qa
staging
demo
```

If environment appears to be:

```text
production
prod
live
```

STOP.

Report:

```text
PRODUCTION SAFETY BLOCK

Demo data generation is blocked because the current environment appears to be production.
```

Do not attempt to bypass this protection.

---

# 3. Never Use Real Personal Data

Demo data must not include real:

- names tied to real people;
- phone numbers;
- email addresses;
- home addresses;
- patient identifiers;
- employee identifiers;
- account numbers;
- access tokens;
- credentials;
- health records;
- government IDs;
- payment card data.

Use synthetic data only.

Examples:

```text
Nguyễn Minh An
demo.patient001@example.test
0900000001
DEMO-PAT-0001
```

When email addresses are used, prefer safe reserved domains such as:

```text
example.com
example.org
example.net
example.test
```

Prefer `example.test` for clearly synthetic records.

---

# 4. Demo Data Must Be Domain-Aware

Do not generate generic lorem ipsum for business-critical data.

Demo records should reflect actual project behavior.

Examples:

Inventory project:

```text
Medicine
Warehouse
Batch
Stock receipt
Stock issue
Inventory balance
Movement history
```

CRM project:

```text
Company
Contact
Lead
Opportunity
Activity
Deal stage
```

E-commerce:

```text
Product
Category
Customer
Cart
Order
Payment
Shipment
```

HR:

```text
Department
Employee
Role
Attendance
Leave request
```

Generate relationships that make screens and workflows meaningful.

---

# 5. Build a Demo Data Model First

Before implementation, create a dependency graph.

Example:

```text
Roles
  ↓
Users
  ↓
Warehouses
  ↓
Medicines
  ↓
Batches
  ↓
Stock Receipts
  ↓
Inventory Balances
  ↓
Stock Issues
  ↓
Stock Movements
```

For every important entity, identify:

- parent dependencies;
- child dependencies;
- unique keys;
- required values;
- status values;
- date constraints;
- quantity constraints.

---

# 6. Data Categories

Classify demo data into:

## A. Reference / Master Data

Examples:

- roles;
- permissions;
- departments;
- categories;
- units;
- statuses;
- warehouses;
- countries;
- currencies.

Should normally be small and stable.

## B. Core Business Data

Examples:

- users;
- customers;
- medicines;
- products;
- suppliers;
- projects.

Should be realistic and reusable.

## C. Transaction Data

Examples:

- orders;
- invoices;
- stock receipts;
- stock issues;
- payments;
- activities;
- bookings.

Should represent real workflows.

## D. Edge-Case Data

Examples:

- empty;
- expired;
- near-expiry;
- inactive;
- cancelled;
- pending;
- failed;
- zero stock;
- large quantity;
- long name;
- unicode text;
- nullable fields.

Use edge cases intentionally.

Do not let edge-case data dominate the normal dataset.

---

# 7. Deterministic Data

Demo data should be reproducible.

Prefer:

- fixed random seed;
- deterministic sequences;
- stable codes;
- stable IDs when project conventions allow it;
- predictable record ordering.

Example:

```text
DEMO-USER-001
DEMO-USER-002
DEMO-USER-003
```

If using Faker or equivalent, seed it where supported.

Example concept:

```text
faker.seed(20261004)
```

Use the project's native mechanism.

Do not introduce a new data-generation library if the project already has one.

---

# 8. Idempotency

The demo generator should be safe to rerun.

Prefer one of these approaches:

### Strategy A — Upsert stable demo records

Use stable demo keys.

### Strategy B — Delete only tagged demo data, then recreate

Example marker:

```text
is_demo = true
```

or a stable prefix:

```text
DEMO-
```

### Strategy C — Reset dedicated local/test database

Only where the project explicitly supports it.

Do not run broad destructive deletes on shared environments.

Do not delete non-demo user data.

---

# 9. Demo Data Identification

Where practical, demo data should be easy to identify.

Possible approaches:

```text
is_demo = true
source = "demo"
code prefix = "DEMO-"
email domain = "@example.test"
```

Do not add a new database column solely for demo identification unless justified and approved.

Prefer existing metadata or safe stable conventions.

---

# 10. Realistic Distribution

Avoid generating every field with uniform random values.

Real data usually has distributions.

Examples:

Inventory:

- most batches available;
- some near expiry;
- a few expired;
- a few zero-stock;
- fewer blocked/quarantine records.

Orders:

- many completed;
- some pending;
- fewer cancelled;
- a small number failed.

Users:

- mostly active;
- a few inactive;
- different roles.

The distribution should help demo real UI states.

---

# 11. Data Volume Profiles

Provide configurable data profiles.

Recommended:

## SMALL

Fast local development.

Example:

```text
5–20 records per main entity
```

## STANDARD

Normal QA/demo.

Example:

```text
20–200 records per main entity
```

## LARGE

Performance/pagination testing.

Example:

```text
1,000+ records where appropriate
```

Do not create LARGE data by default.

The default should normally be `STANDARD` unless project constraints suggest otherwise.

---

# 12. Dates Must Be Meaningful

Avoid completely random dates.

Build data around current/project-relevant time windows.

Examples:

```text
past
today
near future
future
expired
near expiry
```

For date-only fields:

do not introduce timezone shifts.

For datetime fields:

follow project timezone conventions.

Avoid hard-coded dates that become useless quickly unless the scenario intentionally needs a fixed historical date.

---

# 13. Status Coverage

For each important status enum, determine whether demo data should cover it.

Example:

```text
DRAFT
CONFIRMED
CANCELLED
```

Create enough records so each important screen/filter has something to display.

Do not create invalid status transitions merely to show every enum.

Respect business-state transitions.

---

# 14. Role and Permission Coverage

When the application has RBAC, create demo users for meaningful role combinations.

Example:

```text
Demo Admin
Demo Manager
Demo Operator
Demo Viewer
```

Do not grant every permission to every user.

Demo accounts should demonstrate authorization differences where useful.

Never use production passwords.

If login credentials are needed for local demo users, use clearly synthetic credentials and document them only in safe development documentation, never in public code if project policy forbids it.

---

# 15. Referential Integrity

All demo relationships must be valid.

Check:

- foreign keys;
- parent existence;
- polymorphic references;
- pivot/junction tables;
- unique constraints;
- one-to-one constraints;
- required ownership.

Never create orphan records.

---

# 16. Unique Constraints

Inspect actual unique constraints before generating data.

Examples:

```text
email
username
code
invoice_code
lot_number + medicine_id
slug
external_id
```

Use deterministic unique values.

Do not rely on random chance to avoid duplicates.

---

# 17. Business Constraint Validation

Respect project-specific rules.

Examples:

```text
quantity > 0
start_date <= end_date
manufacturing_date <= expiry_date
paid_amount <= total_amount
available_quantity >= 0
email unique
code format valid
```

Demo data must pass the same validation as real data unless the purpose is explicitly to demonstrate an invalid state.

---

# 18. Transaction Consistency

If the domain uses transaction history or ledgers, demo data must not bypass consistency rules.

For example, inventory should not simply set:

```text
inventory_balance = 100
```

when the project requires stock movements.

Prefer creating:

```text
Stock receipt +100
↓
Stock movement +100
↓
Inventory balance = 100
```

unless project architecture explicitly treats balance as independent seed data.

---

# 19. Derived Fields

Do not independently randomize derived fields.

Examples:

```text
total = sum(items)
available = on_hand - reserved
age = derived from date_of_birth
invoice_balance = total - paid
```

Calculate derived values from source fields.

This prevents impossible demo records.

---

# 20. Money

For monetary projects:

- respect currency;
- respect decimal precision;
- avoid floating-point errors;
- use realistic amounts;
- calculate totals from line items;
- keep tax/discount math consistent.

Do not generate arbitrary totals unrelated to detail rows.

---

# 21. Quantities and Units

Respect:

- integer vs decimal quantity;
- unit conversion;
- minimum quantity;
- package size;
- precision.

Do not generate fractional values for fields that are operationally integer-only.

---

# 22. Text Quality

Synthetic text should still look intentional.

Avoid excessive:

```text
Lorem ipsum
Test test
abc
foo
bar
```

Prefer domain-relevant content.

Examples:

```text
Routine monthly inventory receipt
Internal medicine department
Demo supplier for QA environment
```

Keep text concise.

---

# 23. Localization

Inspect the application's locale.

If the project is Vietnamese:

use realistic Vietnamese synthetic names and labels where appropriate.

If Japanese:

use appropriate Japanese demo values.

If multilingual:

create records that exercise the supported languages.

Do not create mojibake or invalid encoding.

Use UTF-8.

---

# 24. Search and Filter Coverage

Demo data should make search/filter screens useful.

Create variation in fields commonly used for:

- search;
- status filter;
- date filter;
- category filter;
- role filter;
- warehouse filter;
- sort.

Do not make all demo records nearly identical.

---

# 25. Pagination Coverage

For list screens with pagination, ensure `STANDARD` profile has enough rows to demonstrate multiple pages when reasonable.

Example:

If page size is 20:

create at least 25–50 representative records for a core list.

Do not create hundreds of records solely to test pagination if a smaller amount is enough.

---

# 26. Empty-State Support

A global demo dataset cannot naturally make every page empty.

If the user needs empty-state screenshots/tests, provide a separate scenario or profile.

Example:

```text
DEMO_PROFILE=empty
```

or scenario-specific generators.

Do not destroy normal demo data just to create an empty screen.

---

# 27. Scenario-Based Demo Data

Prefer named scenarios for complex projects.

Examples:

```text
normal
empty
near-expiry
expired
low-stock
overdue
cancelled
permission-limited
high-volume
```

Each scenario should have a clear purpose.

Do not create dozens of scenarios without actual use.

---

# 28. Demo Data Profiles

Recommended design:

```text
small
standard
large
```

Optionally combine with scenarios:

```text
standard + normal
standard + edge-cases
large + pagination
```

Keep the interface simple.

---

# 29. Existing Seeders First

Before creating a new seeding architecture, inspect:

- seeders;
- factories;
- fixtures;
- test builders;
- mock files;
- migration seeds;
- commands/scripts.

Reuse project-native patterns.

Examples:

Laravel:

```text
Factory
Seeder
Artisan command
```

Django:

```text
fixtures
management command
factory_boy if already used
```

Rails:

```text
db/seeds.rb
FactoryBot if already used
```

Node/Prisma:

```text
prisma/seed
factory utilities
```

Do not force one framework's approach into another project.

---

# 30. Separation Between Demo and Test Fixtures

Demo data and automated test fixtures serve different purposes.

Demo data:

- readable;
- realistic;
- broad;
- persistent during development/demo sessions.

Test fixtures:

- minimal;
- isolated;
- targeted;
- reset between tests.

Do not couple every automated test to a giant demo seed.

Reuse factories/builders where appropriate, but keep purposes separate.

---

# 31. Demo Data Reset

Provide a safe reset strategy when the project supports it.

Example concept:

```text
demo:seed
demo:reset
```

or equivalent project-native commands.

`demo:reset` must remove only demo-owned data unless the project is using an isolated disposable database.

Never silently truncate shared tables.

---

# 32. Performance

Large demo data generation should be efficient.

Avoid:

- one DB query per row where bulk methods exist;
- N+1 seed logic;
- repeated lookups;
- expensive API calls;
- external network calls.

Use:

- batch insert;
- cached lookup maps;
- transactions where appropriate;
- bulk factory generation.

But preserve business integrity.

---

# 33. No External Network Dependency

Demo data generation should normally work offline.

Do not depend on:

- external public APIs;
- production services;
- live payment gateways;
- third-party customer data.

If images are needed, prefer:

- local placeholder assets;
- generated placeholders;
- project-bundled assets.

---

# 34. File and Image Demo Data

If the project handles uploads:

- use safe local demo files;
- keep file size reasonable;
- include representative formats;
- avoid copyrighted/proprietary user files;
- never include secrets.

Do not generate huge binary fixtures unless necessary.

---

# 35. Credentials and Secrets

Never seed:

- real API keys;
- real OAuth tokens;
- real payment credentials;
- real cloud credentials.

If a field requires a secret-like value, use a clearly synthetic placeholder and ensure the application does not mistake it for a production credential.

---

# 36. Audit Existing Data Before Seeding

If the database is not known to be disposable:

inspect whether data already exists.

Do not overwrite real/local developer data blindly.

Choose a safe strategy:

- upsert demo records;
- namespace demo records;
- ask for approval before destructive reset.

---

# 37. Approval Gate for New Demo Architecture

If the project has no existing demo-data architecture and the implementation would introduce:

- new commands;
- new seed hierarchy;
- new environment variables;
- new schema fields;
- destructive reset behavior;
- major fixture conventions;

first produce a plan and STOP.

Wait for user approval before implementation.

For small additions following an established seeder/factory pattern, follow existing project workflow rules.

---

# 38. Planning Output

When planning is required, provide:

# Demo Data Audit & Plan

## 1. Current Data Architecture

## 2. Existing Seeders / Factories / Fixtures

## 3. Domain Dependency Graph

## 4. Constraints Discovered

## 5. Proposed Demo Entities

Use:

| Entity | Count | Purpose | Dependencies | Important Variants |
|---|---:|---|---|---|

## 6. Proposed Demo Profiles

## 7. Proposed Scenarios

## 8. Referential Integrity Strategy

## 9. Idempotency Strategy

## 10. Reset Strategy

## 11. Safety Controls

## 12. File Change Plan

Use:

| Action | File | Purpose | Risk |
|---|---|---|---|

## 13. Validation / Test Plan

## 14. Open Questions

## 15. Recommendation

Then wait for approval when required.

---

# 39. Naming Conventions

Prefer clear demo identifiers.

Examples:

```text
DEMO-001
DEMO-WH-001
DEMO-ORDER-001
DEMO-PATIENT-001
```

Emails:

```text
demo.user001@example.test
```

Avoid identifiers that could be confused with real production codes if that creates risk.

---

# 40. Recommended Demo Personas

Where users/personas are useful, create a small understandable set.

Example:

```text
Demo Admin
Demo Manager
Demo Operator
Demo Viewer
```

Do not generate 100 random user names unless the feature requires high volume.

---

# 41. UI-Friendly Data

Demo data should intentionally support meaningful UI.

Include:

- short names;
- medium names;
- occasional long names;
- empty optional values;
- representative badges/statuses;
- enough records for pagination;
- representative dates;
- meaningful amounts/quantities.

Avoid creating only ideal "perfect" values.

---

# 42. Edge-Case Coverage

Include important edge cases without making the normal demo confusing.

Potential edge cases:

- zero;
- minimum value;
- maximum valid value;
- nullable field;
- inactive;
- archived;
- cancelled;
- failed;
- expired;
- near expiry;
- long string;
- unicode;
- multiple related children;
- no related children.

Only include edge cases relevant to the project.

---

# 43. Demo Data Matrix

Before final implementation, define:

| Scenario | Entity | Data State | Expected UI/Behavior |
|---|---|---|---|

Example:

| Near expiry | Medicine Batch | expires in 30 days | Warning badge |
| Out of stock | Inventory | quantity = 0 | Out-of-stock state |
| Cancelled | Order | CANCELLED | Cancelled badge |

This makes demo data intentional and testable.

---

# 44. Validation After Generation

After demo generation, verify:

- record counts;
- foreign keys;
- unique constraints;
- required fields;
- status validity;
- derived totals;
- quantity integrity;
- date constraints;
- key screens load.

Do not assume seeding success because the script exited with code 0.

---

# 45. UI Verification

When browser/UI capability is available:

open representative screens after seeding.

Check:

- lists show useful records;
- filters have multiple values;
- status badges appear;
- pagination works;
- detail screens open;
- no broken relationships;
- no obvious placeholder garbage;
- no rendering errors.

Demo data quality is partly judged by the UI it produces.

---

# 46. API Verification

For API-driven projects, verify representative endpoints.

Check:

- list;
- detail;
- filter;
- pagination;
- related data.

Do not require full API regression solely for seeding, but verify critical paths.

---

# 47. Database Verification Table

After implementation, provide a tested table.

Example:

| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Demo users | 4 | 4 | PASS |
| 2 | Unique emails | No duplicates | No duplicates | PASS |
| 3 | Orphan rows | 0 | 0 | PASS |
| 4 | Invalid quantities | 0 | 0 | PASS |
| 5 | Demo reset | Removes demo data only | Verified | PASS |

Allowed status:

```text
PASS
FAIL
NOT TESTED
BLOCKED
```

Never fabricate results.

---

# 48. Test Rerun / Idempotency

Run demo generation more than once when practical.

Verify:

- no duplicate unique-key failures;
- no exponential duplication;
- stable expected counts where designed;
- reset/reseed works.

Idempotency is a required quality attribute for reusable demo data.

---

# 49. Demo Data Documentation

Document:

- how to generate;
- available profiles;
- available scenarios;
- how to reset;
- safety limitations;
- demo login accounts when appropriate;
- expected approximate record counts.

Keep documentation concise.

Prefer project-standard README/docs location.

---

# 50. Environment Configuration

If profiles need configuration, prefer simple options.

Example concept:

```text
DEMO_DATA_PROFILE=standard
DEMO_DATA_SCENARIO=normal
```

or command options:

```text
--profile=standard
--scenario=edge-cases
```

Do not introduce environment variables when command arguments or existing config is more appropriate.

Follow project conventions.

---

# 51. Reusable Architecture Principles

A reusable demo-data system should separate:

```text
data generation
↓
domain scenario composition
↓
database persistence
```

when the project complexity justifies it.

But do not overengineer small projects.

For a simple project, a clear seeder may be enough.

---

# 52. Framework Neutrality

This skill must adapt to the project.

Do not assume:

- Laravel;
- Django;
- Rails;
- Prisma;
- Sequelize;
- TypeORM;
- Spring;
- .NET;
- Firebase.

First detect the stack.

Then use the native implementation style.

---

# 53. Minimal Patch Principle

When adding demo data to an existing project:

- reuse existing factories;
- reuse existing seeders;
- reuse enums;
- reuse helpers;
- avoid unrelated refactoring;
- avoid schema changes unless necessary;
- avoid new dependencies unless justified.

Make the smallest safe change.

---

# 54. Comments

Source-code comments must follow project coding rules.

Default:

- English only;
- explain WHY;
- normally no more than 3 lines;
- no obvious comments;
- no commented-out code.

---

# 55. Memory Update

After implementation, update `MEMORY.md` when durable knowledge is discovered.

Examples:

```text
Demo data uses prefix DEMO-
Default demo profile is standard.
Demo emails use @example.test.
Demo seeding must never run in production.
```

Do not store:

- passwords;
- secrets;
- temporary record counts;
- one-off random values.

---

# 56. Final Implementation Report

After implementing demo data, provide:

## Implemented

## Demo Profiles

## Demo Scenarios

## Entities Generated

Use:

| Entity | Count | Key Variants |
|---|---:|---|

## Files Changed

## Safety Controls

## Validation Performed

## UI Verification

## Tested Scenarios

Use:

| # | Scenario | Method | Expected | Actual | Status |
|---|---|---|---|---|---|

## Idempotency Check

## Reset Check

## Known Limitations

## Memory Updated

Do not claim complete verification when relevant checks were not run.

---

# 57. Definition of Done

Demo data generation is DONE only when all applicable items are satisfied:

- [ ] `MEMORY.md` was read.
- [ ] Applicable project rules were read.
- [ ] Schema/migrations were inspected.
- [ ] Models/entities were inspected.
- [ ] Existing factories/seeders were inspected.
- [ ] Business constraints were identified.
- [ ] Foreign-key dependencies were identified.
- [ ] Unique constraints were identified.
- [ ] Production environment is protected.
- [ ] No real personal data is used.
- [ ] No real secrets are used.
- [ ] Demo values are domain-relevant.
- [ ] Key statuses are represented.
- [ ] Important UI filters have useful variation.
- [ ] Demo records are reproducible.
- [ ] Demo generation is idempotent where applicable.
- [ ] Reset behavior is safe.
- [ ] Referential integrity is valid.
- [ ] Derived values are consistent.
- [ ] Relevant validation passes.
- [ ] Representative screens/API paths were checked when possible.
- [ ] Rerunning generation does not create unintended duplicates.
- [ ] Documentation is provided.
- [ ] Durable conventions are written to `MEMORY.md`.

---

# 58. Core Principle

Demo data is part of the product-development experience.

Good demo data should make the application immediately understandable.

It should help developers, testers, reviewers, stakeholders, and users see realistic behavior without exposing real data.

The required mindset is:

```text
UNDERSTAND DOMAIN
↓
UNDERSTAND CONSTRAINTS
↓
DESIGN SCENARIOS
↓
GENERATE DETERMINISTIC DATA
↓
PRESERVE RELATIONSHIPS
↓
VERIFY BUSINESS CONSISTENCY
↓
VERIFY UI / API
↓
MAKE RESET SAFE
↓
DOCUMENT USAGE
```

Do not optimize for the number of generated rows.

Optimize for useful, believable, safe scenarios.
