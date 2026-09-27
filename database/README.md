# Oracle baseline

The authoritative Oracle 19c+ scripts were supplied outside this repository at:

`C:\Users\ADMIN\Downloads\thuoc`

Install them with SQL Developer **Run Script (F5)** in this order:

1. `01_kho_duoc_oracle.sql`
2. `03_kho_nghiep_vu_nang_cao.sql`
3. `05_oracle_flashback_kho.sql`

The `02`, `04`, and `06` scripts are demo/test utilities and should only run in a disposable test schema. The application never runs baseline or destructive schema SQL automatically.

For a durable handoff, copy the source scripts into a controlled database repository or `database/original/` after confirming their ownership and release process.
