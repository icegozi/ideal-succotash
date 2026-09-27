# UI map

## Shared shell

Responsive dashboard with a fixed desktop sidebar, compact mobile navigation, top search affordance, breadcrumb, page header, status badges, empty/loading/error states, and keyboard-visible focus styles.

## Implemented reference screens

### `/medicines`

- Title: Danh mục thuốc
- Purpose: Search and manage medicine catalog records.
- Filters: query (code/name/active ingredient), active state, controlled state.
- Sorting: code, name, minimum stock.
- Table: medicine code, name/strength, base unit, minimum stock, controlled state, active state, actions.
- Actions: create, view, edit. No hard delete.
- Pagination: server-side with bounded page size.
- Permission: `medicine.read`; create/update controls additionally require their respective permissions.

### `/medicines/new`

- Purpose: Create a catalog medicine.
- Fields: code, name, active ingredient, strength, dosage form, route, manufacturer, base unit, minimum stock, controlled flag, active flag.
- Validation: database-aligned length/required/non-negative rules; unique conflict handled on the server.
- Permission: `medicine.create`.

### `/medicines/[id]`

- Purpose: Show catalog details and the guaranteed base-unit conversion. Additional transaction-unit editing is planned with receiving/issuing.
- Actions: edit; return to list.
- Permission: `medicine.read`.

### `/medicines/[id]/edit`

- Purpose: Update editable catalog fields or deactivate a medicine.
- Validation: same as create; ID and base-unit guard errors returned as domain conflicts.
- Permission: `medicine.update`.

## Planned screens

| Route | Screen | Primary data/actions | Permission status |
| --- | --- | --- | --- |
| `/` | Dashboard | Stock KPIs and alert queues | `inventory.read` inferred |
| `/inventory` | Stock overview | Warehouse/medicine filters; physical/held/available totals | `inventory.read` inferred |
| `/inventory/batches/[id]` | Batch detail | FEFO position, balances, holds, recall, ledger | `inventory.read` inferred |
| `/receipts` | Receipts | Search/list/status | `receipt.read` inferred |
| `/receipts/new` | Receive stock | Package-backed receipt operation | `receipt.create` inferred |
| `/issues` | Issues | Search/list/status | `issue.read` inferred |
| `/issues/new` | FEFO issue | Proposal and atomic package-backed issue | `issue.create` inferred |
| `/stock-control/*` | Extended workflows | Count, transfer, returns, quarantine, recall, destruction, reversal | BUSINESS_DECISION_REQUIRED |
| `/reports/*` | Reports | Views and flashback packages | `report.read` inferred |

All inferred permission names are placeholders until the organization confirms its authorization model.

