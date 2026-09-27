# Architecture decisions

## Preserve Oracle and use node-oracledb

### Context

The source schema relies on Oracle sequences, compound constraints, PL/SQL packages, triggers, function-based indexes, and flashback queries.

### Options

- Rebuild on a Prisma-supported database.
- Use an unofficial adapter.
- Preserve Oracle and use Oracle's supported Node.js driver.

### Chosen approach

Use `node-oracledb` behind repository interfaces.

### Reason

It preserves database semantics and allows package calls without unsupported translation.

### Consequences

Prisma migrations/client are not available. SQL must stay small, parameterized, tested, and isolated in repositories.

## Do not expose destructive catalog deletion

### Context

Master tables have active flags and are referenced extensively, but deletion rules are not documented.

### Options

- Hard delete.
- Deactivate.
- No lifecycle action.

### Chosen approach

Support status editing/deactivation; do not implement hard delete.

### Reason

This is the least destructive behavior and aligns with the schema.

### Consequences

The organization must confirm whether additional deactivation guards are required.

## Keep stock writes package-only

### Context

The PL/SQL packages coordinate row locking, balance changes, ledger entries, approval checks, and rollback behavior.

### Chosen approach

All future stock writes call those packages in one transaction.

### Reason

Direct DML could corrupt balance/ledger consistency or bypass FEFO and approval rules.

### Consequences

Integration tests require a disposable Oracle test schema.

## Defer production authentication choice

### Context

There are no user/role tables and no requested identity provider.

### Chosen approach

Create a fail-closed permission boundary and mark provider/role mapping as `BUSINESS_DECISION_REQUIRED`.

### Reason

Inventing privileged users or trusting client-supplied audit names would be unsafe.

### Consequences

Local demo permissions can be configured explicitly, but production mutations remain blocked until a trusted session adapter is supplied.

