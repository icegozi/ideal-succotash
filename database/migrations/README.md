# Oracle migrations

`migrate.sh` runs before the web service and stores applied versions in the
application schema table `SCHEMA_MIGRATIONS`.

Current ordered migrations:

1. `001` - `01_kho_duoc_oracle.sql`
2. `002` - `03_kho_nghiep_vu_nang_cao.sql`
3. `003` - `05_oracle_flashback_kho.sql`
4. `900` - optional local demo data from `02_demo_fefo.sql`

To add a forward migration, add its SQL file to the configured schema directory
and append one entry to the `migrations` array in `migrate.sh`. Never edit an
already applied file: its SHA-256 checksum is verified on every run.

Oracle DDL commits implicitly. A failed migration can therefore leave partial
objects even though its history row is not written. Make each forward script
restart-safe where possible, inspect the failure, and repair it with another
reviewed migration instead of deleting production data.

For a database that already contains the complete schema but has no history,
validate it and run exactly once with `MIGRATION_BASELINE_EXISTING=true`. The
runner refuses to baseline incomplete or invalid schemas.
