# Implementation plan

## Database

Treat the supplied Oracle 19c scripts as an installed baseline. Do not replay them from the application or create destructive migrations.

## Domains

Catalog, organization masters, batch inventory, receiving, issuing, ledger, stock control, quality/recall, reporting, and external identity.

## Business rules

Implement database-confirmed catalog validation now. Preserve package-only stock writes, FEFO, append-only audit, and maker/checker rules in later modules.

## Unknowns

Identity provider, roles, approval assignments, deactivation policy, timezone, Oracle deployment, flashback retention, and accounting acceptance are open decisions.

## Screens and routes

Build the shell and complete `/medicines`, `/medicines/new`, `/medicines/[id]`, and `/medicines/[id]/edit`. Provide a dashboard overview that clearly labels unavailable integrations.

## Architecture

Feature folders with component/action/schema/service/repository separation; direct Oracle access is server-only and isolated. Server Components read; Server Actions mutate and revalidate.

## Implementation order

1. Documentation and architecture decisions.
2. Oracle connection adapter and structured errors.
3. Shared shell/UI primitives.
4. Medicine repository, service, validation, permissions.
5. Medicine list/detail/create/edit routes with states.
6. Unit/service tests.
7. Environment, Docker, and operator documentation.
8. Lint, typecheck, test, and production build.
9. Continue with package-backed receiving only after identity/approval decisions.

## Risks

- No live Oracle connection is available during build verification.
- Native-driver/container deployment must match the selected Oracle connection mode.
- Production authentication is not yet specified.
- Oracle identifiers and numeric/date conversion require careful adapter tests.
- Existing PL/SQL integration requires a disposable Oracle test schema and cannot be proven by unit tests alone.

