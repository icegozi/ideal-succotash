# MedStock — Project Memory

> File này giúp AI assistant và developer nắm nhanh toàn bộ context dự án.
> Cập nhật lần cuối: 2026-10-04.

---

## 1. Tổng quan dự án

**MedStock** là ứng dụng quản lý kho dược (pharmaceutical inventory management) cho bệnh viện, xây dựng trên schema Oracle 19c+ có sẵn.

- **Ngôn ngữ giao diện**: Tiếng Việt.
- **Mục tiêu**: Quản lý danh mục thuốc, nhập kho, xuất kho FEFO, kiểm kê, chuyển kho, biệt trữ, thu hồi, hủy, báo cáo.
- **Trạng thái hiện tại**: Module tham chiếu **Danh mục thuốc** hoàn thành. Các module stock mutation đang chờ quyết định identity/approval.

---

## 2. Tech Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router) | React Server Components + Server Actions |
| Language | **TypeScript** (strict mode) | |
| UI | **React 19**, Tailwind CSS 4, Lucide icons | |
| Forms | **React Hook Form** 7 + **@hookform/resolvers** | Zod resolver |
| Validation | **Zod 4** | Server + client |
| Database | **Oracle 19c+** via `node-oracledb` 7 (thin mode) | **Không dùng Prisma** (Prisma không hỗ trợ Oracle) |
| Testing | **Vitest 5** | Unit tests |
| Linting | **ESLint 9** + `eslint-config-next` | |
| Container | **Docker Compose** (Oracle Free 23 + migrate + schema-check + web) | |

---

## 3. Kiến trúc & Request Flow

```
Server Component / Client Form
        ↓
Server Action (app/medicines/... hoặc modules/.../actions/)
        ↓
Permission boundary (lib/auth/permissions.ts)
        ↓
Zod schema (modules/.../schemas/)
        ↓
Domain service (modules/.../services/)
        ↓
Repository interface (modules/.../repositories/medicine.repository.ts)
        ↓
Oracle repository (modules/.../repositories/oracle-medicine.repository.ts)
        ↓
Oracle schema (node-oracledb → connection pool)
```

### Quy tắc quan trọng

- **Không hard-delete** master data. Dùng `TRANG_THAI = 'N'` để deactivate.
- **Stock mutations phải gọi PL/SQL packages** (`PKG_KHO_DUOC`, `PKG_KHO_NANG_CAO`). Không DML trực tiếp vào balance/ledger.
- **React components không bao giờ import `oracledb`** hoặc chạy SQL.
- Connection: acquire per-operation từ process-level pool, luôn close trong `finally`.
- Bind variables, allow-listed sorting, bounded pagination, explicit column lists.

---

## 4. Cấu trúc thư mục

```
icegozi_medstock/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard "/"
│   ├── globals.css               # Global styles (Tailwind)
│   ├── api/health/               # /api/health/live, /api/health/ready
│   └── medicines/                # Medicine CRUD pages
│       ├── page.tsx              # List: /medicines
│       ├── loading.tsx           # Loading state
│       ├── error.tsx             # Error boundary
│       ├── new/                  # Create: /medicines/new
│       └── [id]/                 # Detail & edit
│           ├── page.tsx          # Detail: /medicines/[id]
│           ├── not-found.tsx     # 404
│           └── edit/             # Edit: /medicines/[id]/edit
│
├── modules/                      # Feature modules (domain-driven)
│   └── medicines/
│       ├── actions/              # Server Actions
│       │   └── medicine.actions.ts
│       ├── components/           # Client Components
│       │   └── MedicineForm.tsx
│       ├── repositories/         # Data access
│       │   ├── medicine.repository.ts        # Interface/contract
│       │   ├── oracle-medicine.repository.ts  # Oracle implementation
│       │   ├── in-memory-medicine.repository.ts  # Test/demo implementation
│       │   └── index.ts                       # Factory (chọn Oracle hoặc in-memory)
│       ├── schemas/
│       │   └── medicine.schema.ts  # Zod validation schemas
│       ├── services/
│       │   ├── medicine.service.ts  # Business logic
│       │   └── index.ts
│       └── types/
│           └── medicine.types.ts   # TypeScript types/interfaces
│
├── components/shared/            # Shared UI components
│   ├── AppShell.tsx              # Layout shell (sidebar + content)
│   ├── SidebarNav.tsx            # Sidebar navigation
│   ├── PageHeader.tsx            # Page header with breadcrumb
│   └── StatusBadge.tsx           # Y/N status badge
│
├── lib/                          # Shared libraries
│   ├── auth/permissions.ts       # Permission checking
│   ├── db/oracle.ts              # Oracle connection pool
│   └── errors/app-error.ts      # Structured error types
│
├── database/                     # Database scripts
│   ├── original/                 # Source Oracle SQL files
│   ├── migrations/               # Versioned migration scripts
│   ├── docker-init/              # Docker Oracle init
│   └── docker-check/             # Schema validation
│
├── tests/unit/                   # Unit tests
│   └── medicine.service.test.ts
│
├── docs/                         # Project documentation
│   ├── architecture.md
│   ├── database-analysis.md
│   ├── domain-map.md
│   ├── feature-map.md
│   ├── business-rules.md
│   ├── decisions.md
│   ├── implementation-plan.md
│   └── ui-map.md
│
├── docker-compose.yml
├── Dockerfile
├── .env / .env.example
└── .secrets/                     # Docker secrets (git-ignored)
```

---

## 5. Database Schema (Oracle)

### Bảng chính

| Bảng | Mục đích |
|------|----------|
| `DON_VI_TINH` | Đơn vị tính (viên, hộp, vỉ, lọ...) |
| `KHO` | Kho (warehouse) |
| `KHOA_PHONG` | Khoa phòng (department) |
| `NHA_CUNG_CAP` | Nhà cung cấp (supplier) |
| `THUOC` | Thuốc (medicine master) |
| `QUY_DOI_DVT_THUOC` | Quy đổi đơn vị tính theo thuốc |
| `LO_THUOC` | Lô thuốc (batch) |
| `TON_KHO_LO` | Tồn kho theo lô/kho |
| `PHIEU_NHAP` / `CT_PHIEU_NHAP` | Phiếu nhập + chi tiết |
| `PHIEU_XUAT` / `CT_PHIEU_XUAT` | Phiếu xuất + chi tiết |
| `GIAO_DICH_KHO` | Giao dịch kho (ledger, append-only) |
| `PHIEU_KHO_NC` / `CT_PHIEU_KHO_NC` | Phiếu kho nâng cao (kiểm kê, chuyển, trả...) |
| `SU_KIEN_BIET_TRU_KHO` | Sự kiện biệt trữ (quarantine) |
| `THU_HOI_LO` / `SU_KIEN_THU_HOI_LO` | Thu hồi lô + sự kiện |

### PL/SQL Packages

| Package | Chức năng |
|---------|-----------|
| `PKG_KHO_DUOC` | Nhập kho, xuất FEFO, đề xuất FEFO |
| `PKG_KHO_NANG_CAO` | Kiểm kê, chuyển kho, trả hàng, biệt trữ, thu hồi, hủy, đảo |
| `PKG_FLASHBACK_KHO` | Tra cứu tồn kho tại thời điểm, lịch sử row-version |

### Views quan trọng

- `VW_TON_KHO_FEFO` — Tồn kho FEFO order
- `VW_CANH_BAO_HAN_DUNG` — Cảnh báo hạn dùng
- `VW_TON_KHO_TONG_HOP` — Tồn kho tổng hợp
- `VW_SO_THUOC_KIEM_SOAT` — Sổ thuốc kiểm soát
- `VW_BAO_CAO_GIA_TRI_TON` — Báo cáo giá trị tồn
- `VW_BAO_CAO_KIEM_KE` — Báo cáo kiểm kê
- `VW_CHUYEN_KHO_DANG_VAN_CHUYEN` — Chuyển kho đang vận chuyển
- `VW_CANH_BAO_TON_TOI_THIEU` — Cảnh báo tồn tối thiểu

### Trigger rules

- ID/số chứng từ sinh tự động bởi trigger.
- Phiếu nhập/xuất đã POSTED → không sửa.
- Ledger, sự kiện biệt trữ/thu hồi → append-only.
- Thuốc kiểm soát → maker ≠ approver.

---

## 6. Identity & Permissions

- **Chưa có identity provider**. Schema Oracle không có bảng user/role.
- Development: `DEV_AUTH_BYPASS=true` → 3 quyền medicine auto-grant.
- Production: **fail closed** cho đến khi có session adapter.
- Quyền hiện tại: `medicine.read`, `medicine.create`, `medicine.update`.
- Quyền dự kiến: `inventory.read`, `receipt.read/create`, `issue.read/create`, `report.read`.

---

## 7. Convention khi viết code

### Module mới

1. Tạo folder trong `modules/<tên>/` với cấu trúc: `actions/`, `components/`, `repositories/`, `schemas/`, `services/`, `types/`.
2. Repository interface → Oracle implementation + in-memory cho test.
3. Service nhận repository qua constructor/factory.
4. Server Action gọi: permission check → Zod validate → service method.
5. Page (RSC) gọi service để fetch, render UI.

### Naming

- File: `kebab-case` (vd: `medicine.service.ts`).
- Type/Interface: `PascalCase`.
- Oracle column → TypeScript property: snake_case → camelCase (map trong repository).
- Biến flag Y/N trong Oracle → boolean trong TypeScript.

### Error handling

- Dùng `AppError` từ `lib/errors/app-error.ts`.
- Oracle constraint errors → map sang structured domain errors.
- Không bao giờ expose raw SQL hoặc credentials ra browser.

### Testing

- Unit test trong `tests/unit/`.
- Test service với in-memory repository.
- Chạy: `npm run test`.

### Common Form Components (`components/shared/form/`)

1. **Vị trí tập trung**: Đặt toàn bộ UI form primitives tại `components/shared/form/` (barrel export qua `index.ts`).
2. **Composition Pattern**: Dùng `<FormField label="..." required error={...}><Input {...register(...)} /></FormField>`.
3. **React Hook Form Native Compatibility**: Mọi control (`Input`, `Select`, `Textarea`, `DateInput`, `SearchInput`, `Checkbox`) đều dùng `forwardRef`, tương thích 100% với `register()`.
4. **Table Cell Form Controls**: Trong các bảng dữ liệu động (table rows của phiếu nhập), dùng trực tiếp control có `hasError`, không bọc trong `FormField` (đã có tiêu đề `<th>`).
5. **Filter Form Controls**: Dùng `SearchInput` và `Select` cho các filter bar submit bằng native GET request.

### Quy tắc FEFO & Quản lý tồn kho

1. **FEFO sort order**: `expiryDate ASC` → `receivedAt ASC` → `batchId ASC`. Lô hết hạn sớm nhất phải xuất trước.
2. **Khóa lô không hợp lệ**: Lô có `expiryDate < today` (EXPIRED) hoặc trạng thái `QUARANTINE`, `BLOCKED`, `RECALLED` tuyệt đối không được đưa vào tồn khả dụng và không được xuất kho. Lô hết hạn vẫn được lưu để truy vết.
3. **Không để tồn âm & Race condition**: Xác nhận xuất kho phải tính toán lại FEFO tại backend và bảo vệ đồng thời (locking/mutex). Frontend preview chỉ là đề xuất.
4. **Bảo toàn giao dịch (Atomic transaction)**: Mọi thao tác xác nhận nhập/xuất phải cập nhật cả số dư tồn kho và ghi nhật ký sổ cái bất biến `GIAO_DICH_KHO` (`STOCK_IN`, `STOCK_OUT`, `STOCK_IN_REVERSAL`, `STOCK_OUT_REVERSAL`).
5. **Hủy phiếu nhập**: Tạo đảo kho `STOCK_IN_REVERSAL` và bắt buộc kiểm tra `tồn hiện tại >= số lượng nhập` của lô để tránh làm tồn kho âm khi một phần lô đã xuất.
6. **Near Expiry Config**: Cấu hình tập trung tại `lib/config/inventory.ts` (mặc định 90 ngày).

### Design System & Responsive UI ("Clinical Precision" Theme)

1. **Brand Identity**: Phong cách Y tế Chính xác (Clinical Precision) với tone màu chủ đạo Teal y tế (`--brand-primary`: #0d9488), slate dark text (`#0f172a`), và nền Slate siêu nhẹ (`#f8fafc`).
2. **Mobile Navigation**: Màn hình di động (< 780px) dùng `MobileNavDrawer` có backdrop làm mờ, hỗ trợ đóng bằng phím ESC, swipe/click backdrop, giữ kết nối trạng thái Oracle rõ ràng. Topbar hiển thị icon hamburger menu gọn gàng.
3. **Dual View Table/Card Pattern**: Với các màn hình danh sách nhiều cột (/inventory, /medicines, /stock-in, /stock-out, /inventory/[id]), sử dụng pattern Dual View:
   - Desktop (>= 780px): Bảng compact chuẩn nghiệp vụ (`.desktop-table-view`).
   - Mobile (< 780px): Chuyển sang danh sách thẻ (`.mobile-card-view` + `.data-card-list`), ưu tiên hiển thị nổi bật số lượng tồn khả dụng, hạn sử dụng và badge cảnh báo.
4. **Responsive Form Table (Dynamic Rows)**: Không tạo 2 bộ inputs độc lập giữa mobile và desktop vì sẽ gây xung đột đăng ký `useFieldArray` trong React Hook Form. Thay vào đó dùng `.responsive-item-table`:
   - Trên mobile, `tr` chuyển thành card block có border và padding.
   - Các `td` chuyển thành hàng dạng flex với `.item-cell-label` hiển thị nhãn tương ứng (tên thuốc, số lô, số lượng, đơn giá...).
5. **Standardized Primitives**:
   - `Button`: Hỗ trợ đầy đủ variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), loading spinner tích hợp, và touch target tối thiểu 44px trên mobile.
   - `Badge` / `StatusBadge`: Chuẩn hóa dạng pill, có chấm màu tròn chỉ định trạng thái (success, warning, danger, neutral, brand, info).


---

## 8. Scripts & Commands

```bash
npm run dev          # Chạy dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest
```

### Docker

```bash
docker compose up --build -d    # Start stack
docker compose ps               # Check status
docker compose logs -f           # Xem logs
docker compose run --rm migrate  # Chạy lại migration
```

### Health checks

- `GET /api/health/live` — process alive
- `GET /api/health/ready` — Oracle connected

---

## 9. Environment Variables

Xem `.env.example`. Key variables:

- `ORACLE_CONNECT_STRING` — Connection string (vd: `localhost:1521/FREEPDB1`)
- `ORACLE_USER` — User (mặc định `THUOC_APP`)
- `ORACLE_PASSWORD` / `ORACLE_PASSWORD_FILE` — Password
- `DEV_AUTH_BYPASS` — Bỏ qua auth check cho dev (`true/false`)
- `LOAD_DEMO_DATA` — Load demo data (`true/false`)

---

## 10. Tiến độ & Công việc tiếp theo

### ✅ Đã hoàn thành

- [x] Documentation & architecture decisions
- [x] Oracle connection adapter + structured errors
- [x] Shared shell/UI primitives (AppShell, SidebarNav, PageHeader, StatusBadge)
- [x] Medicine module: repository, service, validation, permissions
- [x] Medicine CRUD pages: list, detail, create, edit
- [x] Unit tests cho medicine service
- [x] Docker Compose stack (oracle, migrate, schema-check, web)
- [x] Health check endpoints
- [x] In-memory demo mode (không cần Oracle để dev)
- [x] **Tồn kho module** (/inventory, /inventory/[id], /inventory/batches/[id]): tổng quan, theo lô, truy vết, cảnh báo hạn dùng
- [x] **Nhập kho module** (/stock-in, /stock-in/new, /stock-in/[id]): tạo phiếu nhập đa mặt hàng, xác nhận atomic, hủy có bảo vệ tồn âm
- [x] **Xuất kho FEFO module** (/stock-out, /stock-out/new, /stock-out/[id]): đề xuất FEFO trực tiếp, ghi đè có lý do, kiểm soát đồng thời chống race condition
- [x] Unit tests cho FEFO & Inventory (11 test cases bao quát toàn bộ kịch bản nghiệp vụ)
- [x] **Common Form Components & Audit**: Chuẩn hóa toàn bộ UI form controls (`FormField`, `Input`, `Textarea`, `Select`, `DateInput`, `SearchInput`, `Checkbox`, `FormSection`) và migrate 100% form nghiệp vụ và filter bars
- [x] **Responsive Brand UI Makeup ("Clinical Precision")**: Toàn diện hệ thống design tokens, mobile drawer navigation, dual-view (desktop table + mobile card), responsive item table cho form nhập/xuất, chuẩn hóa 100% buttons/badges, pass responsive tests cho cả mobile (< 780px) và desktop.

### 🔲 Chưa làm

- [ ] **Chốt identity provider** → vai trò, maker/checker
- [ ] Master data modules: Đơn vị tính, Kho, Khoa phòng, Nhà cung cấp
- [ ] Quản lý quy đổi đơn vị giao dịch
- [ ] Stock control: kiểm kê, chuyển kho, trả hàng, biệt trữ, thu hồi, hủy, đảo (`PKG_KHO_NANG_CAO`)
- [ ] Reports: valuation, controlled-drug register, variance
- [ ] Integration tests trên Oracle schema

### ⚠️ BUSINESS_DECISION_REQUIRED

- Identity provider nào?
- Roles và permission assignments?
- Ai approve thuốc kiểm soát, thu hồi, biệt trữ, hủy?
- Thuốc deactivate khi còn tồn kho?
- Timezone cho FEFO/expiry?
- Oracle hosting model cho production?
- Flashback retention policy?
- Accounting approve valuation report?

---

## 11. Gotchas & Lưu ý

1. **Prisma không dùng được** — Oracle không được hỗ trợ. Mọi data access qua `node-oracledb` thin mode.
2. **PL/SQL packages commit behavior** — Packages KHÔNG commit bên trong. Caller phải commit/rollback toàn bộ transaction.
3. **Oracle numeric precision** — `NUMBER(10)` IDs hiện tại fit JavaScript safe integer. Cẩn thận nếu mở rộng.
4. **Trigger-generated IDs** — App KHÔNG được tự generate ID. Omit ID khi INSERT, trigger sẽ gán.
5. **Demo mode** — Không có Oracle → tự dùng in-memory repository. Kiểm tra `repositories/index.ts` factory.
6. **Docker secrets** — Password qua file mount `/run/secrets`, không qua env var trong container web.
7. **Schema migrations** — Checksum-based, forward-only. Đã apply → không sửa file gốc.
8. **Schema Table Pitfalls (`TON_KHO_LO` & `LO_THUOC`)** — Bảng `TON_KHO_LO` chỉ lưu số dư tồn theo kho và lô `(KHO_ID, LO_ID, SO_LUONG_TON, NGAY_NHAP_DAU)` với PK `TON_KHO_LO_ID`. Bảng này **KHÔNG** chứa cột `THUOC_ID` hay `TON_ID`. Mọi truy vấn thuốc từ `TON_KHO_LO` bắt buộc phải join `LO_THUOC` qua `LO_ID` (`JOIN LO_THUOC l ON l.LO_ID = tk.LO_ID`) rồi mới truy xuất `l.THUOC_ID`.
9. **Cột Hạn Sử Dụng (`LO_THUOC`)** — Bảng `LO_THUOC` dùng tên cột là `HAN_SU_DUNG` (không phải `HAN_DUNG`). Không có cột `TRANG_THAI` trên `LO_THUOC` (trạng thái hết hạn suy ra từ `HAN_SU_DUNG < TRUNC(SYSDATE)`).
10. **Tên cột Phiếu Nhập / Phiếu Xuất** —
    - `PHIEU_NHAP`: dùng `SO_PHIEU`, `NGUOI_NHAP` (không có `SO_PHIEU_NHAP`, `SO_CHUNG_TU`, `NGUOI_TAO`).
    - `CT_PHIEU_NHAP`: dùng `SO_LUONG_NHAP`, `DON_GIA`, `THANH_TIEN`, `LO_ID` (không có `THUOC_ID` trực tiếp).
    - `PHIEU_XUAT`: dùng `SO_PHIEU`, `NGUOI_XUAT` (không có `SO_PHIEU_XUAT`, `NGUOI_TAO`).
    - `CT_PHIEU_XUAT`: dùng `SO_LUONG_XUAT`, `LO_ID` (không có `THUOC_ID` trực tiếp).
    - `GIAO_DICH_KHO`: PK là `GIAO_DICH_KHO_ID`, các cột: `LOAI_GIAO_DICH`, `SO_LUONG_THAY_DOI`, `SO_DU_SAU`.
11. **Tận dụng Oracle Views có sẵn** — Hệ thống có sẵn view `VW_TON_KHO_FEFO`, `VW_TON_KHO_TONG_HOP`, `VW_CANH_BAO_HAN_DUNG`, `VW_CANH_BAO_TON_TOI_THIEU`, `VW_SO_THUOC_KIEM_SOAT` đã tính toán sẵn điều kiện biệt trữ, thu hồi, và sắp xếp theo `THU_TU_FEFO`.

