# Database analysis

## Scope and source

- Source: `C:\Users\ADMIN\Downloads\thuoc`
- Engine: Oracle Database 19c+
- Installation order: `01_kho_duoc_oracle.sql`, `03_kho_nghiep_vu_nang_cao.sql`, `05_oracle_flashback_kho.sql`
- Demo/test scripts: `02_demo_fefo.sql`, `04_test_kho_nang_cao.sql`, `06_demo_oracle_flashback.sql`
- The scripts expect a dedicated application schema and deliberately do not create users or grant system privileges.

The SQL is the authoritative data model. The application must not recreate or rename these database objects.

## Object inventory

### Tables

| Table | Purpose | Important constraints |
| --- | --- | --- |
| `DON_VI_TINH` | Unit-of-measure master | Unique `MA_DVT`; group is constrained; active flag is `Y/N`. |
| `KHO` | Warehouse master | Unique `MA_KHO`; active flag is `Y/N`. |
| `KHOA_PHONG` | Hospital department master | Unique `MA_KHOA_PHONG`; active flag is `Y/N`. |
| `NHA_CUNG_CAP` | Supplier master | Unique `MA_NCC`; active flag is `Y/N`. |
| `THUOC` | Medicine master | Unique `MA_THUOC`; mandatory base unit; non-negative minimum stock; controlled/active flags are `Y/N`. |
| `QUY_DOI_DVT_THUOC` | Per-medicine unit conversion | Composite PK `(THUOC_ID, DVT_ID)`; positive conversion factor; base unit must have factor 1. |
| `PHIEU_NHAP` | Receipt header | Unique document number; warehouse and supplier required; `DRAFT/POSTED/CANCELLED`. |
| `LO_THUOC` | Medicine batch | Unique `(THUOC_ID, SO_LO)`; expiry required; manufacture date cannot exceed expiry. |
| `CT_PHIEU_NHAP` | Receipt lines | Positive transaction/base quantity; non-negative price; converted quantity must equal rounded quantity × factor. |
| `TON_KHO_LO` | Current physical balance by warehouse and batch | Unique `(KHO_ID, LO_ID)`; balance cannot be negative. This is a projection, not an independent ledger. |
| `PHIEU_XUAT` | Issue header | Unique document number; warehouse and department required; `DRAFT/POSTED/CANCELLED`. |
| `CT_PHIEU_XUAT` | Issue lines | Positive transaction/base quantity and conversion factor. |
| `GIAO_DICH_KHO` | Append-only stock ledger | Signed non-zero quantity, non-negative resulting balance, strict source-document references, optional maker/checker approval. |
| `PHIEU_KHO_NC` | Extended stock document | Supports count, transfer, department return, supplier return, destruction, and reversal; status and reference combinations are constrained. |
| `CT_PHIEU_KHO_NC` | Extended document lines | Unique batch per document; non-negative amount/cost; stock-count fields must reconcile exactly. |
| `SU_KIEN_BIET_TRU_KHO` | Append-only quarantine/hold events | Positive amount; event type constrained; maker and approver must differ. |
| `THU_HOI_LO` | Batch recall | `ACTIVE/CLOSED`; one active recall per batch through a function-based unique index; maker/checker rules. |
| `SU_KIEN_THU_HOI_LO` | Append-only recall event log | `BAT_DAU/DONG`; maker and approver must differ. |

### Relationships

- A medicine belongs to one base unit and can expose multiple transaction units through `QUY_DOI_DVT_THUOC`.
- A medicine owns many batches; the composite foreign keys carry the medicine base unit into batches, balances, and document lines.
- A batch can have one balance row per warehouse.
- Receipt and issue headers own their detail lines; ledger rows reference the corresponding header and line.
- Extended documents optionally reference warehouse, destination warehouse, department, supplier, original ledger transaction, or original transfer according to document type.
- Quarantine and recall records refer to batches and, where applicable, extended documents.

### Sequences and identity

There are 18 explicit Oracle sequences. `BEFORE INSERT` triggers assign numeric IDs and generate document numbers. The application must omit generated IDs and must not emulate sequence values.

The baseline defines 32 triggers in total, covering identity generation, date normalization, immutability, controlled-drug approval, document state transitions, and master-data guards.

### Indexes

Indexes cover FEFO lookup, warehouse/date document lookup, warehouse/batch ledger history, extended-document references, quarantine history, and recall status. `UX_THU_HOI_LO_ACTIVE` enforces a single active recall per batch.

### Views

- `VW_TON_KHO_FEFO`: allocatable batch stock in FEFO order.
- `VW_CANH_BAO_HAN_DUNG`: expired and within-90-day expiry warning.
- `VW_TON_KHO_TONG_HOP`: physical, available, held, expired, and recalled balances by warehouse/medicine.
- `VW_SO_THUOC_KIEM_SOAT`: controlled-medicine ledger.
- `VW_BAO_CAO_GIA_TRI_TON`: physical/available valuation using moving average cost.
- `VW_BAO_CAO_KIEM_KE`: stock-count variance report.
- `VW_CHUYEN_KHO_DANG_VAN_CHUYEN`: sent, received, and in-transit transfer amounts.
- `VW_CANH_BAO_TON_TOI_THIEU`: available stock below the medicine minimum.

### Functions and packages

- Conversion/availability functions: `FN_QUY_DOI_CO_SO`, `FN_TON_BIET_TRU`, `FN_LO_DANG_THU_HOI`, `FN_GIA_VON_LO`, `FN_TON_KHO_KHA_DUNG`.
- `PKG_KHO_DUOC`: receipt, FEFO issue, and FEFO proposal.
- `PKG_KHO_NANG_CAO`: stock count, transfer, returns, quarantine, recall, destruction, cancellation, and reversal.
- `PKG_FLASHBACK_KHO`: point-in-time balance and row-version history.

### Trigger-enforced invariants

- IDs/document numbers are generated centrally.
- Posted receipt/issue documents and their lines cannot be altered incorrectly.
- Ledger, quarantine event, and recall event rows are append-only.
- A medicine base unit and controlled flag are guarded after dependent activity exists.
- Batch identity/dates are guarded after transactions exist.
- Controlled medicines require a distinct approver on stock ledger entries.
- Extended documents and recall records enforce valid state transitions.

### Seed/master data

`01_kho_duoc_oracle.sql` seeds 11 units: tablet, box, blister, vial, bottle, ampoule, sachet, tube, millilitre, milligram, and gram. Demo scripts add a warehouse, department, supplier, medicine, conversion, and FEFO transactions; they are not production seed data.

## Ambiguities and risks

- No user, role, permission, or session tables exist. Application identity and authorization are not defined by the database.
- `NGUOI_*` columns are audit strings supplied by the caller; the SQL cannot prove that the caller owns that identity.
- Deactivation/deletion policy for master data is not documented beyond `TRANG_THAI` flags. Hard delete is therefore not permitted by the application.
- The schema is Oracle-specific. Prisma does not support Oracle; using Prisma would require an unsupported provider or changing the database, neither of which is acceptable.
- The provided SQL has no migration history. It should be baselined as an existing schema, with future Oracle migration scripts tracked separately.
- Flashback retention and production FDA policy are DBA decisions.
- Financial valuation is explicitly advisory and requires accounting approval.

