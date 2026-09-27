# Domain map

| Domain | Tables/views | Purpose and dependencies | Probable screens | Confidence |
| --- | --- | --- | --- | --- |
| Medicine catalog | `THUOC`, `DON_VI_TINH`, `QUY_DOI_DVT_THUOC` | Maintain medicine identity, clinical descriptors, base unit, controlled flag, reorder threshold, and unit conversions. | Medicine list/detail/create/edit; unit conversion editor. | CONFIRMED |
| Organization masters | `KHO`, `KHOA_PHONG`, `NHA_CUNG_CAP` | Warehouses, receiving departments, and suppliers used by stock documents. | Warehouse, department, and supplier maintenance. | CONFIRMED |
| Batch inventory | `LO_THUOC`, `TON_KHO_LO`, FEFO/summary/warning views | Physical and allocatable stock by batch and warehouse; depends on medicine and organization masters. | Stock overview, batch detail, expiry alerts, minimum-stock alerts. | CONFIRMED |
| Receiving | `PHIEU_NHAP`, `CT_PHIEU_NHAP`, `PKG_KHO_DUOC` | Receives supplier stock, creates batches/balances, and posts ledger entries. | New receipt, receipt list/detail. | CONFIRMED |
| Issuing | `PHIEU_XUAT`, `CT_PHIEU_XUAT`, `PKG_KHO_DUOC` | Issues medicine to departments using FEFO and posts ledger entries. | FEFO proposal, new issue, issue list/detail. | CONFIRMED |
| Stock ledger | `GIAO_DICH_KHO`, `VW_SO_THUOC_KIEM_SOAT` | Immutable audit trail for every physical balance change. | Transaction history, controlled-drug register. | CONFIRMED |
| Stock control | `PHIEU_KHO_NC`, `CT_PHIEU_KHO_NC`, `PKG_KHO_NANG_CAO` | Stock count, transfers, returns, destruction, cancellation, and reversals. | Workflow-specific documents and approval queues. | CONFIRMED |
| Quality and recall | `SU_KIEN_BIET_TRU_KHO`, `THU_HOI_LO`, `SU_KIEN_THU_HOI_LO` | Hold/release quantities and globally block recalled batches. | Quarantine, recall, destruction, event history. | CONFIRMED |
| Reporting and audit | Reporting views, `PKG_FLASHBACK_KHO` | Valuation, historical balance, inventory variance, transfer transit, and alerts. | Dashboard, reports, point-in-time lookup. | CONFIRMED |
| Identity and access | No supporting tables | Authenticate people and map them to application permissions; must supply trusted audit identities. | Login, access-denied, user/role administration. | UNKNOWN |

## Dependency flow

```text
Identity provider (external / undecided)
        |
Master data -> Medicine catalog -> Batches -> Inventory balance
        |                              |             |
        +--------> Stock documents ----+-------> Immutable ledger
                                                   |
                              Quality / recall ----+
                                                   |
                                                Reports
```

