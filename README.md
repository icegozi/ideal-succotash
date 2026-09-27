# MedStock

Ứng dụng Next.js quản lý kho dược từ schema Oracle 19c+ có sẵn. Bản hiện tại hoàn thành module tham chiếu **Danh mục thuốc** với danh sách, tìm kiếm, lọc, phân trang, chi tiết, tạo, chỉnh sửa/deactivate, kiểm tra quyền ở server, validation Zod và lớp repository Oracle.

## Kiến trúc chính

- Next.js 16 App Router, React Server Components và Server Actions.
- `node-oracledb` thin mode; Prisma không được dùng vì Prisma không hỗ trợ Oracle.
- Luồng `UI → Action → permission → Zod → service → repository → Oracle`.
- Dữ liệu tồn kho chỉ được thay đổi qua các package PL/SQL hiện hữu; không DML trực tiếp vào số dư/ledger.
- Không hard-delete thuốc. Trạng thái `TRANG_THAI` được dùng để ngừng hoạt động.

Phân tích chi tiết nằm trong [`docs/`](docs/implementation-plan.md), bắt đầu từ [`database-analysis.md`](docs/database-analysis.md).

## Chạy local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Nếu chưa cấu hình Oracle, môi trường development tự dùng dữ liệu demo trong bộ nhớ để xem đầy đủ UI và luồng CRUD. Dữ liệu demo sẽ mất khi process khởi động lại.

Để kết nối schema thật, đặt:

```env
ORACLE_USER=THUOC_APP
ORACLE_PASSWORD=...
ORACLE_CONNECT_STRING=host:1521/service_name
ORACLE_POOL_MAX=8
```

Node-oracledb chạy thin mode nên không cần Oracle Instant Client cho các kết nối thông thường.

## Identity và phân quyền

Schema không có user/role/permission. Development dùng `DEV_AUTH_BYPASS=true` với ba quyền medicine để kiểm thử. Production luôn fail closed vì chưa có session adapter tin cậy. Trước khi triển khai production cần chọn identity provider và ánh xạ quyền:

- `medicine.read`
- `medicine.create`
- `medicine.update`

Không lấy tên người lập/duyệt từ form hoặc client.

## Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Docker

```bash
docker compose up --build
```

Container ứng dụng kết nối đến Oracle do DBA quản lý. Database không được tự tạo trong Compose vì schema phụ thuộc package, Flashback, quyền và retention do DBA kiểm soát. Xem [`database/README.md`](database/README.md) để cài baseline.

## Công việc tiếp theo

1. Chốt identity provider, vai trò và maker/checker.
2. Thêm integration test trên schema Oracle dùng riêng cho test.
3. Hoàn thiện quản lý quy đổi đơn vị giao dịch.
4. Triển khai nhập kho và xuất FEFO bằng `PKG_KHO_DUOC`.
5. Triển khai kiểm kê, chuyển kho, trả hàng, biệt trữ, thu hồi, hủy và đảo bằng `PKG_KHO_NANG_CAO`.

Các câu hỏi nghiệp vụ chưa thể suy ra từ database được đánh dấu `BUSINESS_DECISION_REQUIRED` trong [`docs/business-rules.md`](docs/business-rules.md).
