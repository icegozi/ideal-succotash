# SQL baseline directory

Before starting the full Docker Compose stack, copy the supplied Oracle files into this directory:

- `01_kho_duoc_oracle.sql`
- `03_kho_nghiep_vu_nang_cao.sql`
- `05_oracle_flashback_kho.sql`

Optional local demo data:

- `02_demo_fefo.sql`

Alternatively set `ORACLE_SCHEMA_DIR` in `.env` to an absolute host path containing those files. The SQL directory is mounted read-only into the one-shot `migrate` service. Applied versions and SHA-256 checksums are stored in `SCHEMA_MIGRATIONS`.

The destructive/integration scripts `04_test_kho_nang_cao.sql` and `06_demo_oracle_flashback.sql` are intentionally not run by Compose.
