---
name: database-to-nextjs-app
description: >
  Analyze an existing SQL database and turn it into a maintainable,
  production-oriented fullstack Next.js application. Use this skill when
  the project starts from SQL/database schema and needs application modules,
  UI screens, Prisma schema, migrations, backend services, CRUD flows,
  authentication, permissions, validation, tests, Docker, and documentation.
---

# Database to Next.js App

## Purpose

Build or extend a production-ready Next.js application starting primarily
from an existing SQL database.

The SQL/database is the initial source of truth for the data model.

Do NOT blindly generate CRUD for every table.

First understand the database, infer domains and application workflows,
identify uncertainty, design the application architecture, then implement.

## Core principles

1. Database structure is not equivalent to complete business requirements.
2. Never invent important business rules without evidence.
3. Separate:
   - confirmed facts
   - reasonable assumptions
   - unresolved business decisions
4. Prefer feature/domain-based architecture over global technical folders.
5. Keep UI, business logic, validation, and database access separated.
6. Avoid direct Prisma/database access inside React components.
7. Avoid large generic service/controller folders.
8. Keep code readable and maintainable by another developer.
9. Reuse components only when there is meaningful shared behavior.
10. Do not over-engineer simple CRUD features.

## Default technology stack

Unless the repository specifies otherwise, prefer:

- Next.js latest stable
- TypeScript
- App Router
- React Server Components
- Server Actions where appropriate
- Route Handlers for APIs/integrations
- Prisma ORM
- PostgreSQL or MySQL according to existing SQL
- Zod
- React Hook Form
- Tailwind CSS
- shadcn/ui
- TanStack Table
- TanStack Query only when client-side caching is justified
- Better Auth or Auth.js
- Vitest
- Playwright
- Docker
- Docker Compose

Do not replace an existing technology without a clear reason.

# Workflow

Always follow these phases.

## Phase 1 — Repository and SQL discovery

Inspect:

- repository structure
- SQL files
- CREATE TABLE statements
- ALTER TABLE statements
- primary keys
- foreign keys
- unique constraints
- indexes
- enums
- defaults
- nullable fields
- timestamps
- soft-delete columns
- audit fields
- seed/master data
- views
- stored procedures
- triggers

Never modify files during this phase.

Produce:

`docs/database-analysis.md`

Include:

- table list
- purpose of each table
- important columns
- relationships
- constraints
- suspicious or ambiguous structures

## Phase 2 — Domain discovery

Group database tables into business domains.

Example:

```text
users
roles
permissions
user_roles
        ↓
Identity / Access

medicines
medicine_categories
manufacturers
        ↓
Medicine

warehouses
stocks
stock_movements
        ↓
Inventory
```

Create:

`docs/domain-map.md`

For each domain define:

- domain name
- related tables
- probable purpose
- dependencies
- probable screens
- confidence level

Confidence must be one of:

```text
CONFIRMED
INFERRED
UNKNOWN
```

Never hide uncertainty.

## Phase 3 — Business rule extraction

Extract rules that can be proven from the database.

Examples:

```text
email UNIQUE NOT NULL
→ email must be unique and required

status ENUM('ACTIVE', 'INACTIVE')
→ only two status values are allowed

FOREIGN KEY medicine_id
→ entity depends on medicine
```

Do NOT infer rules such as:

```text
"Only managers can delete medicine"
```

unless supported by:

- existing source code
- permission tables
- documentation
- user instruction

Create:

`docs/business-rules.md`

Separate sections:

```text
Confirmed Rules

Reasonable Assumptions

Open Questions / TODO
```

## Phase 4 — Application feature map

Derive application features from domains.

Create:

`docs/feature-map.md`

Example:

```text
Authentication
├── Login
├── Logout
├── Forgot Password
└── Reset Password

User Management
├── User List
├── Create User
├── Edit User
├── User Detail
└── Role Assignment

Medicine
├── Medicine List
├── Create Medicine
├── Edit Medicine
├── Medicine Detail
└── Category Management

Inventory
├── Stock Overview
├── Stock History
├── Stock In
└── Stock Out
```

Do not expose internal junction/master tables directly unless useful.

## Phase 5 — UI planning

When no UI exists, design an admin/dashboard interface.

Default layout:

```text
┌──────────────────────────────────────────────┐
│ Logo        Global Search         User Menu │
├──────────────┬───────────────────────────────┤
│ Sidebar      │                               │
│              │        Page Content           │
│ Dashboard    │                               │
│ Domain A     │                               │
│ Domain B     │                               │
│ Settings     │                               │
└──────────────┴───────────────────────────────┘
```

Use consistent UI patterns:

- PageHeader
- Breadcrumb
- DataTable
- FilterBar
- SearchInput
- Pagination
- Form
- ConfirmationDialog
- EmptyState
- LoadingState
- ErrorState
- Toast

Prefer shadcn/ui components.

Create:

`docs/ui-map.md`

For every screen describe:

- route
- title
- purpose
- fields
- filters
- actions
- table columns
- validation
- permission requirements

## Phase 6 — Architecture

Prefer feature/domain-oriented architecture.

Default structure:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/
│   ├── users/
│   │   ├── components/
│   │   ├── actions/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── queries/
│   │   ├── types/
│   │   └── constants.ts
│   │
│   └── <domain>/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── permissions/
│   ├── logger/
│   └── utils/
│
├── config/
├── hooks/
└── types/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

database/
├── original/
└── docs/

tests/
├── unit/
├── integration/
└── e2e/

docs/
```

# Backend architecture

Use this flow:

```text
UI
 ↓
Server Action / Route Handler
 ↓
Validation
 ↓
Service
 ↓
Repository
 ↓
Prisma
 ↓
Database
```

Example:

```text
CreateMedicineForm

→ createMedicineAction()

→ createMedicineSchema.parse()

→ MedicineService.create()

→ MedicineRepository.create()

→ prisma.medicine.create()
```

Responsibilities:

## Components

Responsible for:

- rendering
- interaction
- local UI state

Must NOT contain database logic.

## Actions

Responsible for:

- receiving application input
- authentication check
- permission check
- validation
- calling service
- revalidation/redirect

## Schema

Responsible for:

- Zod validation
- form validation
- API validation

## Service

Responsible for:

- business rules
- transactions
- orchestration

## Repository

Responsible for:

- Prisma queries
- database persistence
- query composition

# Repository pattern rule

Do not create repositories for trivial one-line queries unless the module
benefits from separation.

Use repository abstraction when:

- queries are reused
- joins are complex
- transactions exist
- business logic must remain persistence-independent

Avoid architecture ceremony without benefit.

# Database migration strategy

When SQL/database already exists:

DO NOT recreate fake historical migrations unless explicitly requested.

Preferred strategy:

```text
Existing SQL
     ↓
Existing Database
     ↓
Prisma introspection/manual mapping
     ↓
Baseline
     ↓
Future migrations
```

Preserve:

- table names
- column names
- data types
- indexes
- unique constraints
- foreign keys

Use Prisma mapping where required:

```prisma
@@map("EXISTING_TABLE")
@map("EXISTING_COLUMN")
```

Do not rename database objects simply to make Prisma prettier unless approved.

# Prisma rules

Check carefully:

- composite primary keys
- composite unique keys
- decimal precision
- unsigned integers
- datetime precision
- nullable columns
- default values
- enums
- cascade behavior
- database-specific types

Never silently change semantics.

# CRUD design

For each entity decide whether it actually requires:

```text
List
Create
Detail
Edit
Delete
```

Deletion should be classified as:

```text
Hard Delete
Soft Delete
Deactivate
Not Allowed
UNKNOWN
```

Do not automatically implement delete.

# List screen standard

Default list page:

```text
Page title

[Search................] [Filters] [+ Create]

┌───────────────────────────────────────────────┐
│ Column │ Column │ Status │ Updated │ Actions │
├───────────────────────────────────────────────┤
│ ...                                           │
└───────────────────────────────────────────────┘

          Previous  1  2  3  Next
```

Support when appropriate:

- server-side pagination
- sorting
- filtering
- search
- column visibility
- empty state
- loading state

Avoid loading entire large tables into the browser.

# Forms

Use:

```text
React Hook Form
+
Zod
```

Validation must exist on the server even if client validation exists.

Form layers:

```text
Database constraints
        ↓
Zod domain schema
        ↓
Server validation
        ↓
Client UX validation
```

Never trust browser input.

# Authentication

If authentication tables exist, inspect them before choosing an auth library.

Otherwise default to:

Better Auth or Auth.js.

Required considerations:

- password hashing
- session security
- CSRF
- secure cookies
- password reset
- account status

Never store plaintext passwords.

# RBAC

If role/permission structures exist:

derive authorization from them.

Typical model:

```text
User
 ↓
Role
 ↓
Permission
```

Permission naming convention:

```text
medicine.read
medicine.create
medicine.update
medicine.delete

inventory.read
inventory.adjust
```

Enforce permissions server-side.

UI hiding alone is NOT authorization.

# Error handling

Use structured errors.

Example categories:

```text
VALIDATION_ERROR
NOT_FOUND
UNAUTHORIZED
FORBIDDEN
CONFLICT
DATABASE_ERROR
INTERNAL_ERROR
```

Never expose:

- stack traces
- SQL queries
- database credentials
- internal implementation details

to end users.

# Logging

Log meaningful events:

- login failures
- important mutations
- permission failures
- integration errors
- unexpected server failures

Do not log:

- passwords
- access tokens
- sensitive personal information unnecessarily

# Transactions

Use database transactions when several operations must succeed or fail together.

Example:

```text
Create order
+
Create order items
+
Update stock
```

must be atomic.

# Testing

Prioritize tests for:

1. business rules
2. permission logic
3. validation
4. transactions
5. critical CRUD
6. authentication
7. important end-to-end flows

Recommended:

```text
Vitest
Playwright
```

Avoid meaningless tests that only verify framework behavior.

# Docker

Provide:

```text
Dockerfile
docker-compose.yml
.env.example
```

Typical services:

```text
app
database
```

Optional:

```text
redis
mailpit
```

Do not commit secrets.

# Environment variables

Create `.env.example`.

Example:

```env
DATABASE_URL=
AUTH_SECRET=
APP_URL=
```

Never place real credentials in source files.

# Implementation strategy

Do NOT implement the entire application in one pass.

Use incremental modules.

Recommended order:

```text
01 Database analysis
02 Prisma
03 Base architecture
04 Authentication
05 Authorization
06 Shared UI
07 First core domain
08 Remaining domains
09 Dashboard
10 Tests
11 Docker
12 Documentation
```

Complete and verify one module before copying its pattern.

# First module rule

Choose one representative domain and build it completely first.

It should include:

```text
List
Search
Filter
Pagination
Create
Edit
Detail
Validation
Permissions
Error handling
Tests
```

Use this as the reference architecture for later modules.

# Before modifying code

Always inspect:

- existing conventions
- package.json
- tsconfig
- eslint config
- existing database layer
- existing UI libraries
- authentication
- folder structure

Do not introduce duplicate libraries solving the same problem.

# Before creating a dependency

Ask:

```text
Can this be solved cleanly with an existing dependency?
```

Do not add packages unnecessarily.

# Code quality

Prefer:

```ts
createMedicine()
```

over:

```ts
handleCreateMedicineDataProcess()
```

Prefer small functions with clear responsibilities.

Avoid:

- huge components
- huge services
- duplicated validation
- duplicated SQL/query logic
- magic strings
- `any`
- unnecessary abstractions

# TypeScript rules

Use strict typing.

Avoid:

```ts
any
```

Prefer:

```ts
unknown
```

when the type is genuinely unknown.

Derive types from:

- Prisma
- Zod

where practical instead of defining duplicate models.

# Naming conventions

Files:

```text
medicine.service.ts
medicine.repository.ts
medicine.schema.ts
medicine.types.ts
medicine.actions.ts
```

Components:

```text
MedicineTable.tsx
MedicineForm.tsx
MedicineFilters.tsx
```

Functions:

```text
getMedicines
getMedicineById
createMedicine
updateMedicine
```

# UI quality

Generated UI should be:

- responsive
- keyboard accessible
- visually consistent
- usable at desktop widths
- functional on mobile where reasonable

Always implement:

- loading feedback
- empty state
- validation errors
- confirmation for destructive actions

Do not fill pages with unnecessary decorative elements.

# Documentation

Maintain:

```text
README.md

docs/
├── database-analysis.md
├── domain-map.md
├── business-rules.md
├── feature-map.md
├── ui-map.md
├── architecture.md
└── decisions.md
```

Record important architecture decisions in:

`docs/decisions.md`

Format:

```md
## Decision

### Context

### Options

### Chosen approach

### Reason

### Consequences
```

# Required planning before implementation

Before writing application code, produce a plan containing:

```text
Database
Domains
Business rules
Unknowns
Screens
Routes
Architecture
Implementation order
Risks
```

Do not start mass-generating code before this analysis is complete.

# Unknown requirements

When business behavior cannot be determined from available evidence:

Do not invent it.

Mark it:

```text
BUSINESS_DECISION_REQUIRED
```

If implementation can safely continue, choose the least destructive behavior.

Examples:

```text
Delete behavior unknown
→ disable delete implementation

Unknown default role
→ do not auto-assign privileged role
```

# Safety for existing data

Before destructive schema operations:

Check for:

- dropped columns
- renamed columns
- changed types
- removed indexes
- foreign-key changes

Never run destructive database operations automatically against production.

# Deliverable definition

A module is complete only when all applicable items exist:

```text
Route
UI
Validation
Server action/API
Service
Repository/query
Database integration
Error handling
Authorization
Loading state
Empty state
Tests
```

# Final verification

Before considering work complete, run where available:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If Playwright exists:

```bash
npm run test:e2e
```

Fix errors caused by the implementation.

Do not claim successful verification if commands were not executed.

# Expected behavior when invoked

When given one or more SQL files:

1. Analyze them.
2. Do not immediately generate the full application.
3. Produce the database and domain analysis.
4. Create the feature and UI map.
5. Propose the source architecture.
6. Identify unresolved business decisions.
7. Establish Prisma/baseline migration strategy.
8. Create the project skeleton.
9. Implement one representative module completely.
10. Validate the architecture.
11. Continue module by module.

The final objective is not merely:

"Make the application work."

The objective is:

"Create a Next.js application that works, reflects the existing database,
is understandable by another developer, and can continue growing without
the architecture collapsing."
