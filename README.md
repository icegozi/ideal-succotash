# MedStock

Ứng dụng Next.js quản lý kho dược từ schema Oracle 19c+ có sẵn. Bản hiện tại hoàn thành module tham chiếu **Danh mục thuốc** với danh sách, tìm kiếm, lọc, phân trang, chi tiết, tạo, chỉnh sửa/deactivate, kiểm tra quyền ở server, validation Zod và lớp repository Oracle.

## Kiến trúc chính

- Next.js 16 App Router, React Server Components và Server Actions.
- `node-oracledb` thin mode; Prisma không được dùng vì Prisma không hỗ trợ Oracle.
- Luồng `UI → Action → permission → Zod → service → repository → Oracle`.
- Dữ liệu tồn kho chỉ được thay đổi qua các package PL/SQL hiện hữu; không DML trực tiếp vào số dư/ledger.
- Không hard-delete thuốc. Trạng thái `TRANG_THAI` được dùng để ngừng hoạt động.

Phân tích chi tiết nằm trong [`docs/`](docs/implementation-plan.md), bắt đầu từ [`database-analysis.md`](docs/database-analysis.md).

## Chạy local không dùng container

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Nếu chưa cấu hình Oracle, môi trường development tự dùng dữ liệu demo trong bộ nhớ. Để kết nối Oracle chạy trên máy local, giữ `ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1`; ứng dụng đọc mật khẩu từ `ORACLE_PASSWORD`, `ORACLE_APP_PASSWORD` hoặc `ORACLE_PASSWORD_FILE`.

## Docker Compose đầy đủ

Stack gồm bốn service theo chuỗi khởi động `oracle → migrate → schema-check → web`:

- `oracle`: Oracle Free 23.26.3, volume dữ liệu bền vững và healthcheck.
- `migrate`: job một lần, chạy SQL đúng thứ tự và lưu version/checksum vào `SCHEMA_MIGRATIONS`.
- `schema-check`: job một lần, xác minh bảng/view/package đều tồn tại và hợp lệ.
- `web`: Next.js standalone chạy non-root, filesystem chỉ đọc, healthcheck readiness và chỉ khởi động sau khi schema hợp lệ.

Chuẩn bị:

```powershell
Copy-Item .env.example .env
New-Item -ItemType Directory -Force .secrets
Set-Content -NoNewline .secrets/oracle_sys_password 'thay-mat-khau-system-manh'
Set-Content -NoNewline .secrets/oracle_app_password 'thay-mat-khau-app-manh'
```

Thay hai giá trị ví dụ bằng password mạnh của riêng bạn; các file này bị Git ignore và được mount vào `/run/secrets`. Sau đó chọn một trong hai cách cung cấp SQL:

1. Copy `01_kho_duoc_oracle.sql`, `03_kho_nghiep_vu_nang_cao.sql`, `05_oracle_flashback_kho.sql` vào `database/original/`.
2. Hoặc đặt `ORACLE_SCHEMA_DIR` thành đường dẫn tuyệt đối đến thư mục SQL, ví dụ `C:/Users/ADMIN/Downloads/thuoc`.

Khởi động:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f oracle migrate schema-check web
```

Ứng dụng: `http://localhost:3000`.

Hai connection Oracle được dùng theo vị trí chạy:

- Trong Docker: `oracle:1521/FREEPDB1` (service `migrate`, `schema-check`, `web`).
- Từ DBeaver/SQL Developer hoặc app chạy trên máy host: `localhost:1521/FREEPDB1`.

User là giá trị `ORACLE_USER` (mặc định `THUOC_APP`), password là nội dung file `ORACLE_APP_PASSWORD_FILE`. Oracle chỉ publish trên loopback nên không mở ra mạng LAN.

Kiểm tra sức khỏe:

```bash
curl http://localhost:3000/api/health/live
curl http://localhost:3000/api/health/ready
```

`/live` chỉ xác nhận process web đang chạy. `/ready` chỉ trả `200` khi Oracle kết nối được.

### Dữ liệu demo và volume

Đặt `LOAD_DEMO_DATA=true` để migration `900` chạy `02_demo_fefo.sql`. Những migration đã ghi nhận sẽ được bỏ qua ở lần chạy sau; file đã áp dụng bị thay đổi sẽ bị chặn do checksum không khớp. Có thể chủ động chạy lại job bằng:

```bash
docker compose run --rm migrate
```

Với database đã có đủ schema nhưng chưa có bảng lịch sử, kiểm tra schema rồi chỉ bật `MIGRATION_BASELINE_EXISTING=true` đúng một lần. Runner sẽ không baseline schema thiếu hoặc có object invalid.

Oracle tự commit nhiều câu lệnh DDL, nên migration lỗi có thể để lại object dở dang dù chưa ghi lịch sử. Hãy đọc log, sửa bằng migration tiến tới đã review; chỉ xóa volume local khi chắc chắn dữ liệu không cần giữ:

```bash
docker compose down
docker volume rm medstock_oracle_data
docker compose up --build -d
```

Lệnh xóa volume làm mất toàn bộ database local; không dùng với môi trường chứa dữ liệu cần giữ.

### Bảo mật container

- Password được cấp qua Compose secrets, không nằm trong environment của container web.
- Web chạy UID/GID `1001`, drop toàn bộ Linux capabilities và bật `no-new-privileges`.
- Web filesystem chỉ đọc; chỉ `/tmp` và `.next/cache` là `tmpfs` ghi được.
- Oracle nằm trên network backend nội bộ; chỉ migrate, schema-check và web truy cập được.
- Port web và Oracle mặc định chỉ bind `127.0.0.1`.

Oracle container trong Compose dành cho local development/integration test. Production nên dùng Oracle do DBA quản lý, backup/Flashback/retention riêng, và deploy web bằng cùng Docker image với `ORACLE_CONNECT_STRING` production.

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
docker compose --env-file .env.example config
```

## Công việc tiếp theo

1. Chốt identity provider, vai trò và maker/checker.
2. Thêm integration test trên schema Oracle dùng riêng cho test.
3. Hoàn thiện quản lý quy đổi đơn vị giao dịch.
4. Triển khai nhập kho và xuất FEFO bằng `PKG_KHO_DUOC`.
5. Triển khai kiểm kê, chuyển kho, trả hàng, biệt trữ, thu hồi, hủy và đảo bằng `PKG_KHO_NANG_CAO`.

Các câu hỏi nghiệp vụ chưa thể suy ra từ database được đánh dấu `BUSINESS_DECISION_REQUIRED` trong [`docs/business-rules.md`](docs/business-rules.md).
