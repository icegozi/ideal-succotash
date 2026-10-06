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

## 6. Identity & Authentication

- **Authentication Module**: Đã triển khai hoàn chỉnh module xác thực nội bộ (native session authentication) phù hợp Next.js 16 App Router.
- **Session Strategy**: HTTP-only cookie `medstock_session` (`SameSite=Lax`, `Secure` in production, TTL 24h hoặc 30 ngày với Remember Me).
- **Password Security**: Mã hóa mật khẩu chuẩn ngành bằng `node:crypto.scrypt` kết hợp 16-byte random salt và so sánh hằng định thời gian `crypto.timingSafeEqual` (chống hoàn toàn timing attacks).
- **Brute-force Protection**: `LoginRateLimiter` giới hạn tối đa 5 lần thử sai / phút theo IP/email.
- **Session Fixation Mitigation**: Sinh mới session ID 64 ký tự hex ngẫu nhiên (`crypto.randomBytes(32)`) mỗi khi đăng nhập thành công.
- **Database & Repositories**:
  - Migration Oracle: `database/migrations/010_auth_users.sql` tạo bảng `APP_USERS` và `APP_SESSIONS`.
  - `OracleUserRepository`: Thực thi SQL parameterized qua Oracle connection pool.
  - `InMemoryUserRepository`: Lưu trữ trong bộ nhớ phục vụ unit test và chế độ demo (có sẵn tài khoản `duocsi@medstock.local` / `Duocsi@123` và `admin@medstock.local` / `Admin@123`).
  - `HybridUserRepository`: Tự động nhận diện Oracle khả dụng hoặc dự phòng sang in-memory khi dev local không chạy container Oracle.
- **Phân quyền (RBAC)**: Map từ `UserRole` (`ADMIN`, `PHARMACIST`, `WAREHOUSE_STAFF`, `VIEWER`) sang tập quyền `Actor.permissions`.
- **Route Protection**: `middleware.ts` chuyển hướng Guest về `/login?returnUrl=...`, chuyển hướng Authenticated user khỏi `/login`, `/register` về `/`.

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
6. **DateInput Right-Aligned Icon**: `<DateInput>` được bọc trong `.date-input-wrapper` với icon `Calendar` đồng bộ lề phải (`right: 12px`) và indicator phủ bề mặt, giữ trải nghiệm đồng nhất với chevron mũi tên của `<Select>`.

### Quy tắc FEFO & Quản lý tồn kho

1. **FEFO sort order**: `expiryDate ASC` → `receivedAt ASC` → `batchId ASC`. Lô hết hạn sớm nhất phải xuất trước.
2. **Khóa lô không hợp lệ**: Lô có `expiryDate < today` (EXPIRED) hoặc trạng thái `QUARANTINE`, `BLOCKED`, `RECALLED` tuyệt đối không được đưa vào tồn khả dụng và không được xuất kho. Lô hết hạn vẫn được lưu để truy vết.
3. **Không để tồn âm & Race condition**: Xác nhận xuất kho phải tính toán lại FEFO tại backend và bảo vệ đồng thời (locking/mutex). Frontend preview chỉ là đề xuất.
4. **Bảo toàn giao dịch (Atomic transaction)**: Mọi thao tác xác nhận nhập/xuất phải cập nhật cả số dư tồn kho và ghi nhật ký sổ cái bất biến `GIAO_DICH_KHO` (`STOCK_IN`, `STOCK_OUT`, `STOCK_IN_REVERSAL`, `STOCK_OUT_REVERSAL`).
5. **Hủy phiếu nhập**: Tạo đảo kho `STOCK_IN_REVERSAL` và bắt buộc kiểm tra `tồn hiện tại >= số lượng nhập` của lô để tránh làm tồn kho âm khi một phần lô đã xuất.
6. **Near Expiry Config**: Cấu hình tập trung tại `lib/config/inventory.ts` (mặc định 90 ngày).
7. **Định nghĩa Hết Hạn & Cận Hạn ngày 0**: Lô có `expiryDate < today` mới tính là `EXPIRED`. Lô hết hạn vào chính ngày hôm nay (`expiryDate === today` hay `daysRemaining === 0`) vẫn có hiệu lực sử dụng/xuất kho đến hết ngày và được xếp vào mức `CRITICAL` (cận hạn khẩn cấp), không được khóa sớm hay coi là đã hết hạn.
8. **Bảo vệ quyền truy cập Dashboard (`/`)**: Mọi trang và dashboard hiển thị thông tin tồn kho, số lô, phiếu nhập/xuất bắt buộc phải gọi `await requirePermission(permissions.inventoryRead)` để xác thực session cookie từ DB/in-memory, không chỉ dựa vào middleware cookie check.
9. **Hiển thị số lượng biến động kho (`GIAO_DICH_KHO`)**: Khi hiển thị biến động kho xuất (`STOCK_OUT`), luôn chuẩn hóa độ lớn qua `Math.abs(quantity)` kèm tiền tố âm `−` để tránh lỗi hiển thị dấu trừ kép (`−−` hoặc `−-`) giữa môi trường in-memory demo và Oracle.

### Design System & Responsive UI ("Clinical Precision 3D" Architecture)

1. **Brand Identity**: Phong cách Y tế Chính xác 3D (Clinical Precision 3D) với tone màu chủ đạo Medical Emerald (`--brand-primary`: #059669, hover #047857, active #065f46, soft #ecfdf5, border #a7f3d0), sidebar Deep Hospital Slate (`#0f172a`), Bio-Teal Accent (`#0d9488`), text chính Slate 900 (`#0f172a`), và canvas siêu sạch (`#f8fafc`).
2. **3D Elevation & Subtle Depth Architecture**:
   - **Elevation 1 (`--shadow-elevation-1`)**: Base Card, `.panel`, `.metric-card` với 1px top micro-highlight (`inset 0 1px 0 rgba(255,255,255,0.8)`).
   - **Elevation 2 (`--shadow-elevation-2`)**: Hover card (`.panel-interactive:hover`), hover button.
   - **Elevation 3 (`--shadow-elevation-3`)**: Dropdowns, popovers, floating bulk action bar, toasts.
   - **Elevation 4 (`--shadow-elevation-4`)**: Modals, slide-over drawer chi tiết.
   - **Form Input Depth (`--shadow-input-inset`)**: Ô input, select, date-input có bóng dập chìm nhẹ 1px tạo cảm giác xúc giác cơ học.
3. **Geometry & Bo góc chuẩn mực**:
   - **Controls (Button, Input, Select, DateInput, SearchInput)**: Bo góc 8px (`--radius-md`), chiều cao 40px trên desktop và 44px trên mobile, focus ring 2 tầng (`box-shadow: 0 0 0 3px var(--brand-primary-ring)`).
   - **Badges & StatusBadges**: Chuẩn hóa dạng Thẻ Kỹ thuật bo góc 6px (`--radius-sm`), padding `2.5px 8px`, font 11px/600 uppercase tracking 0.02em (gồm `.badge-critical`, `.fefo-badge-priority`, `.fefo-badge-override`, `.controlled-drug-badge`).
   - **Cards & Panels (`.panel`, `.form-section`, `.detail-card`, `.data-card`)**: Bo góc 12px (`--radius-lg`), viền mảnh 1px (`#e2e8f0`), shadow đa tầng siêu mịn.
   - **Hero Banner**: Bo góc 16px (`--radius-xl`), dải gradient Emerald sang trọng (`#064e3b` sang `#059669` sang `#0d9488`).
4. **Branded Controls & Xúc giác**:
   - `Button`: Hỗ trợ đầy đủ variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), hiệu ứng phản hồi xúc giác `:active:not(:disabled) { transform: scale(0.98); }`, touch target tối thiểu 44px trên mobile. Nút primary có inset highlight mép trên.
   - `Checkbox`: Tùy biến ô vuông 18px bo 4px, đồng bộ màu thương hiệu `accent-color: var(--brand-primary)`, touch area ngón tay chuẩn mobile.
   - `Select`: Tích hợp custom chevron SVG tinh tế, loại bỏ mũi tên đen/xám mặc định của hệ điều hành.
5. **Mobile Navigation**: Màn hình di động (< 780px) dùng `MobileNavDrawer` trên nền Deep Slate (`#0f172a`), backdrop làm mờ `rgba(15, 23, 42, 0.65)`, hỗ trợ phím ESC, click backdrop, giữ kết nối trạng thái Oracle rõ ràng. Topbar hiển thị icon hamburger menu gọn gàng.
6. **Dual View Table/Card Pattern**: Với các màn hình danh sách nhiều cột (/inventory, /medicines, /stock-in, /stock-out, /inventory/[id]), sử dụng pattern Dual View:
   - Desktop (>= 780px): Bảng compact chuẩn nghiệp vụ (`.desktop-table-view`), header Slate 100 chữ đậm 11px, số liệu canh phải `tabular-nums` (`.cell-numeric`), số lô monospace (`.cell-batch`).
   - Mobile (< 780px): Chuyển sang danh sách thẻ (`.mobile-card-view` + `.data-card-list`), ưu tiên hiển thị nổi bật số lượng tồn khả dụng, hạn sử dụng và badge cảnh báo.
7. **Responsive Form Table (Dynamic Rows)**: Trong các bảng động của phiếu nhập/xuất, dùng `.responsive-item-table` chuyển thành từng khối card có `.item-cell-label` trên mobile, không nhân đôi input để bảo vệ React Hook Form registration.

### Centralized Message Management (`constants/messages.ts` & `lib/message.ts`)

1. **Vị trí tập trung**: Toàn bộ message hiển thị người dùng (thành công, lỗi, cảnh báo, thông báo, xác nhận, validation) được định nghĩa tại `constants/messages.ts` (re-export qua `src/constants/messages.ts`).
2. **Cấu trúc nhóm domain**: `COMMON_MESSAGES`, `AUTH_MESSAGES`, `VALIDATION_MESSAGES`, `MEDICINE_MESSAGES`, `INVENTORY_MESSAGES`, `HTTP_ERROR_MESSAGES`, `CRUD_MESSAGES`, `FILE_MESSAGES`, `CONFIRM_MESSAGES`, `ENTITY_MESSAGES`.
3. **Quy tắc Message**: Ngắn gọn, chuẩn xác, nhất quán. Tuyệt đối không hard-code string trong Zod schemas, Server Actions, services, hoặc Client Components.
4. **Tham số động**: Dùng hàm có type an toàn (vd: `AUTH_MESSAGES.LOGIN.RATE_LIMITED(seconds: number)` hoặc `VALIDATION_MESSAGES.TEXT.MAX_LENGTH(max: number)`).
5. **Error Resolution Helper**: Dùng `getErrorMessage(error: unknown)` từ `lib/message.ts` để trích xuất thông báo thân thiện từ `AppError`, `ZodError`, HTTP response, Axios, Fetch, Network, hoặc Exception.
6. **Sẵn sàng cho i18n**: Cấu trúc phân cấp chuẩn, sẵn sàng kết nối với `next-intl` hoặc `i18next` khi mở rộng đa ngôn ngữ.

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
- [x] **Authentication Module**: Triển khai hoàn chỉnh Đăng nhập (/login), Đăng ký (/register), Đăng xuất, Session HTTP-only, Zod validation, Chống Brute-force & Session Fixation, Responsive UI, Automated unit tests (32/32 tests pass).
- [x] **Clinical Components Suite ("Clinical Precision 3D")**: Xây dựng trọn bộ component lâm sàng đặc thù tại `components/shared/clinical/` (`ExpiryThresholdMeter` đo hạn dùng đa tầng, `StockLevelGauge` so sánh tồn kho vs Min/Max, `FefoAllocationCard` đề xuất xuất kho FEFO tự động có kiểm soát ghi đè lâm sàng) kèm bộ unit test kiểm thử tự động (39/39 tests pass).
- [x] **Command Dashboard Modernization (`/`)**: Nâng cấp toàn diện Bàn làm việc Chỉ huy Tổng quan với 4 Stats Widgets nổi khối 3D (`--shadow-elevation-1..2`), hàng chờ xử lý thuốc cận hạn (`ExpiryThresholdMeter`), sổ cái biến động kho gần nhất (`GIAO_DICH_KHO`), và quy tắc cốt lõi FEFO.
- [x] **FEFO Stock Issue Modernization (`/stock-out/new`)**: Tích hợp hoàn chỉnh `FefoAllocationCard` vào màn hình tạo phiếu xuất kho, thay thế preview đơn sơ bằng thẻ cấp phát FEFO lâm sàng chuyên dụng tích hợp `ExpiryThresholdMeter`, gắn huy hiệu ưu tiên FEFO #1, cảnh báo thiếu hụt tức thời, và cung cấp nút bật/tắt ghi đè lô thủ công kèm bắt buộc nhập lý do lâm sàng đồng bộ vào React Hook Form (40/40 tests pass).
- [x] **Centralized Message Management (`constants/messages.ts` & `lib/message.ts`)**: Chuẩn hóa toàn bộ message hiển thị người dùng (thành công, lỗi, xác nhận, cảnh báo, thông báo, validation, HTTP status mapping, dynamic parameters) vào một nơi quản lý tập trung theo domain (`COMMON`, `AUTH`, `VALIDATION`, `MEDICINE`, `INVENTORY`, `HTTP_ERROR`, `ENTITY`, `CONFIRM`). Toàn bộ Zod schemas, Server Actions, services, và components đã chuyển sang dùng hằng số tập trung, hỗ trợ i18n trong tương lai.

### 🔲 Chưa làm

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

