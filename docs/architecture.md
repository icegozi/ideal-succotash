# Architecture

## Runtime

- Next.js 16 App Router and TypeScript strict mode.
- React Server Components for data-loading pages.
- Client Components only for interactive forms and navigation.
- Server Actions for same-application mutations.
- Zod for server-side and client-side validation.
- `node-oracledb` thin mode for Oracle 19c+ access.
- Vitest for domain/service tests.

## Why Prisma is not used

The existing database is Oracle. Prisma has no Oracle provider, so a Prisma schema could not faithfully introspect or operate this database. Re-platforming the database would violate the requirement to preserve the existing schema, packages, triggers, sequences, and flashback behavior. A narrow Oracle adapter is used instead.

## Request flow

```text
Server Component / Client form
           ↓
Server Action
           ↓
Permission boundary
           ↓
Zod schema
           ↓
Domain service
           ↓
Repository interface
           ↓
Oracle repository (SQL or PL/SQL package)
           ↓
Oracle schema
```

The service depends on a repository contract. Unit tests use an in-memory implementation; production uses Oracle. React components never import `oracledb` or execute SQL.

## Data-access rules

- Catalog queries use bind variables, allow-listed sorting, bounded pagination, and explicit column lists.
- Stock mutations must call the existing packages, never issue ad-hoc balance/ledger DML.
- Connections are acquired per operation from a process-level pool and always closed in `finally`.
- Expected Oracle constraint/package failures map to structured application errors; raw SQL and credentials never reach the browser.
- Numeric Oracle values that exceed safe JavaScript precision must be handled deliberately before adding those flows. Current IDs fit the database's `NUMBER(10)` constraint.

## Schema and migration strategy

```text
Existing Oracle SQL → DBA-installed baseline → application adapter → future numbered Oracle migrations
```

The supplied scripts are the baseline. The app does not manufacture historical migrations. Future changes belong in reviewed, forward-only Oracle scripts and must include compatibility/rollback notes. Production schema changes are never run automatically by the web process.

## Identity boundary

No identity schema or provider was supplied. The initial code isolates permission checks behind one server-only module. Local development may use explicitly configured permissions; production must fail closed until a trusted session adapter is implemented. Audit names must come from that trusted session, never from form fields.

