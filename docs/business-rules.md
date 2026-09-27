# Business rules

## Confirmed rules

- Codes for units, warehouses, departments, suppliers, and medicines are required and unique.
- Master records use `Y/N` active state; hard deletion is not represented.
- Every medicine has exactly one required base unit. Per-medicine conversion factors are positive; the base-unit conversion factor is exactly 1.
- Minimum stock cannot be negative. Controlled medicine is a `Y/N` attribute.
- A batch is unique by medicine and batch number. Expiry is required; manufacture date cannot be after expiry.
- Inventory is stored in the medicine base unit and cannot be negative.
- Receipt/issue quantities are positive. Receipt price/amount cannot be negative.
- Posted stock changes are represented both in the current balance and in an append-only ledger.
- FEFO excludes batches expired before today, exhausted/fully held batches, and batches under an active recall. Ties sort by expiry, first receipt date, batch number, then ID.
- A receipt/issue operation does not commit inside the package; the caller commits the complete business transaction or rolls it back.
- Controlled-medicine stock movements require a distinct maker and approver.
- Extended workflows use explicit states. Posted records are not deleted; corrections use reversals.
- Holds do not change physical stock. Available stock is physical stock minus hold, floored at zero, unless expired or recalled (then zero).
- A batch can have at most one active recall. Starting and closing recalls require distinct maker/checker identities.
- A transfer can be received in parts. In-transit quantity is sent minus received.
- Supplier/department returns cannot exceed the remaining returnable quantity from the original transaction.
- Flashback queries are read-only and may fail when Oracle undo history is no longer available.

## Reasonable assumptions

- The Vietnamese labels and hospital workflow described in the supplied README are the intended product language and context.
- `TRANG_THAI = 'N'` is the safest replacement for deleting master data.
- Medicine list search should cover code, name, and active ingredient.
- Catalog maintenance may write directly to catalog tables because stock-changing operations are the objects explicitly restricted to packages; database constraints/triggers remain authoritative.
- An existing Oracle schema will be provisioned outside the app. The app owns no destructive schema bootstrap.

## Open questions / TODO

- `BUSINESS_DECISION_REQUIRED`: Which identity provider authenticates users?
- `BUSINESS_DECISION_REQUIRED`: What roles and permission assignments are required?
- `BUSINESS_DECISION_REQUIRED`: Who can approve controlled-drug movements, recalls, holds, destruction, and reversals?
- `BUSINESS_DECISION_REQUIRED`: Can a medicine be deactivated when stock exists or documents reference it?
- `BUSINESS_DECISION_REQUIRED`: Which catalog fields are mandatory beyond the database constraints?
- `BUSINESS_DECISION_REQUIRED`: Is medicine code case-sensitive from a business perspective?
- `BUSINESS_DECISION_REQUIRED`: Which timezone defines “today” for FEFO and expiry warnings?
- `BUSINESS_DECISION_REQUIRED`: Which Oracle edition/hosting model and connection strategy will production use?
- `BUSINESS_DECISION_REQUIRED`: What retention/FDA policy is required for flashback history?
- `BUSINESS_DECISION_REQUIRED`: Has accounting approved the moving-average valuation report?

Until these decisions are made, the application does not hard-delete master data and does not expose stock mutations outside the existing PL/SQL packages.

