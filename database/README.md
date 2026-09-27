# Oracle baseline và migration

Nguồn Oracle 19c+ ban đầu được cung cấp tại:

`C:\Users\ADMIN\Downloads\thuoc`

Thứ tự baseline bắt buộc:

1. `01_kho_duoc_oracle.sql`
2. `03_kho_nghiep_vu_nang_cao.sql`
3. `05_oracle_flashback_kho.sql`

## Khi dùng Docker Compose

Đặt các file trên trong `database/original/`, hoặc cấu hình `ORACLE_SCHEMA_DIR` trỏ đến thư mục nguồn. Service `migrate` chạy `database/migrations/migrate.sh` sau khi Oracle healthy để:

1. Kiểm tra đủ file bắt buộc.
2. Cấp các schema privilege tối thiểu cho application user.
3. Tạo bảng lịch sử `SCHEMA_MIGRATIONS`, rồi chạy các file chưa áp dụng theo đúng thứ tự.
4. Tùy chọn chạy `02_demo_fefo.sql` khi `LOAD_DEMO_DATA=true`.
5. Kiểm tra SHA-256 của migration đã áp dụng và dừng nếu còn Oracle object không hợp lệ.

`database/docker-check/check-schema.sh` chạy trong service `schema-check` sau khi Oracle healthy. Web chỉ khởi động khi job này xác nhận các bảng, view và package lõi đều hợp lệ.

Các script `04_test_kho_nang_cao.sql` và `06_demo_oracle_flashback.sql` không được Compose tự động chạy vì chúng chỉ phù hợp với schema test dùng riêng.

Migration job chạy lại an toàn ở mỗi lần `docker compose up`: version đã có và đúng checksum sẽ được bỏ qua. Oracle DDL có implicit commit, vì vậy không tự động xóa/recreate volume khi có lỗi; thao tác đó làm mất dữ liệu.
