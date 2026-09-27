# Feature map

```text
Access
├── Sign in (BUSINESS_DECISION_REQUIRED)
├── Sign out (BUSINESS_DECISION_REQUIRED)
└── Permission enforcement boundary

Dashboard
├── Available/physical stock summary
├── Expiry warnings
├── Minimum-stock warnings
└── Transfers in transit

Medicine catalog (reference module)
├── Medicine list, search, status/control filters, sorting, pagination
├── Medicine detail
├── Create medicine
├── Edit/deactivate medicine
└── Unit conversions (base factor implemented; transaction-unit editor planned)

Master data
├── Units
├── Warehouses
├── Departments
└── Suppliers

Inventory
├── Stock by warehouse/medicine
├── Batch/FEFO detail
├── Expiry and recall state
└── Ledger history

Receiving
├── Create receipt via PKG_KHO_DUOC
├── Receipt list
└── Receipt detail

Issuing
├── FEFO proposal
├── Post issue via PKG_KHO_DUOC
├── Issue list
└── Issue detail

Stock control
├── Stock count and adjustment
├── Transfer draft/dispatch/receipt
├── Department return
├── Supplier return
├── Quarantine/release
├── Recall/open/close
├── Destruction
└── Reversal

Reports and audit
├── Inventory valuation
├── Controlled-drug register
├── Count variance
├── In-transit transfers
├── Point-in-time balance
└── Row-version history
```

The medicine catalog is implemented first as the reference architecture. Stock mutation features are intentionally deferred until trusted identity and approval mapping are defined.

