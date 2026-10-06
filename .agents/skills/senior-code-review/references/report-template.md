# Report template

Use this structure every time. Keep the five numbered section titles exactly as written; translate the surrounding prose into the user's language. Issue IDs are `C#` (Critical), `I#` (Important), `M#` (Minor), `T#` (test), and patches are named after the issue they fix.

---

## Template

```markdown
# Code Review: `<branch>` → `<base>`

**Phạm vi:** <N> files thay đổi (+<add>/−<del>) · base `<base>@<sha7>` · head `<sha7>`<, + thay đổi chưa commit nếu có>
**Đã review kỹ:** <areas> · **Chỉ lướt:** <areas or "—">
**Tóm tắt:** <2–3 câu: thay đổi làm gì, rủi ro chính nằm ở đâu.>
**Kết luận:** 🔴 Không nên merge | 🟡 Merge sau khi sửa Critical + Important | 🟢 Có thể merge

## 1. Critical issues

### C1. <Tiêu đề ngắn, nêu hậu quả> — `path/to/file.ext:L<line>` `[category]`
**Vấn đề:** <điều gì sai, trong tình huống nào.>
**Hậu quả:** <người dùng / dữ liệu / hệ thống bị gì.>
**Bằng chứng:**
```<lang>
<đoạn code thực tế, 3–10 dòng, giữ nguyên>
```
**Fix:** → Patch C1

<lặp lại cho C2, C3…; nếu không có: "Không phát hiện.">

## 2. Important issues

### I1. <Tiêu đề> — `path:L<line>` `[category]`
**Vấn đề:** …
**Hậu quả:** …
**Bằng chứng:**
```<lang>
…
```
**Fix:** → Patch I1

<…>

**Cần xác nhận:** <câu hỏi mở cho tác giả, mỗi câu một dòng; bỏ qua nếu không có.>

## 3. Minor improvements

- **M1.** `path:L<line>` `[category]` — <một câu mô tả + gợi ý sửa.>
- **M2.** …
<"Không phát hiện." nếu không có.>

## 4. Test cases cần thêm

| # | File test | Test case | Input / Điều kiện | Kỳ vọng | Bảo vệ |
|---|-----------|-----------|-------------------|---------|--------|
| T1 | `test/.../x_test.dart` | <tên test ngắn> | <input cụ thể> | <kết quả mong đợi> | C1 |
| T2 | … | … | … | … | I2 / behaviour mới |

<Thêm một dòng ghi chú nếu đã chạy test/analyzer: "Đã chạy `flutter analyze`: 0 issues; `flutter test`: 42 passed." Nếu không chạy được, nói rõ lý do.>

## 5. Patch tối thiểu

### Patch C1 — <tiêu đề issue>
```diff
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@ -<start>,<len> +<start>,<len> @@
 <context line>
-<removed line>
+<added line>
 <context line>
```
<Một dòng giải thích nếu patch cần: "Chỉ chặn trường hợp X; fix triệt để cần Y (xem I3)."> 

### Patch I1 — <tiêu đề>
```diff
…
```

<Patch cho Minor chỉ khi fix ≤ 2 dòng.>
```

---

## Writing rules for the report

- **Evidence first.** Quote the actual lines. A reviewer who paraphrases code gets refuted; one who quotes it gets a fix.
- **Scenario, not adjective.** "Crash khi `items` rỗng vì `items.first`" beats "xử lý list chưa chắc chắn".
- **One issue, one entry.** If the same bug repeats in five places, list it once with all locations, one patch per location (or one patch if a shared helper fixes all).
- **Patch applies cleanly.** Copy the context lines from the real file; keep indentation; include the hunk header. Do not include unrelated lines in the diff.
- **No invented sections.** Empty category → "Không phát hiện." Do not downgrade a Critical to Important to look balanced, and do not promote a nit to Important to look thorough.
- **Numbers in the header are from the tool**, not estimated (`stats.txt` from the collector script).
- **Keep the summary honest about coverage.** If you skimmed tests or generated files, say so in "Chỉ lướt".
- **Language:** match the user's request language. Keep code, identifiers, file paths, commit hashes, and the five section titles unchanged.

---

## Filled example (abridged, Flutter)

# Code Review: `feature/points-history` → `develop`

**Phạm vi:** 9 files (+412/−58) · base `develop@3f9a1c2` · head `b71e0d4`, + 2 files chưa commit
**Đã review kỹ:** `PointsRepository`, `PointsHistoryCubit`, `points_history_page.dart` · **Chỉ lướt:** `*.g.dart`, l10n
**Tóm tắt:** Thêm màn lịch sử điểm với phân trang và pull-to-refresh, gọi API mới `/v2/points/history`. Rủi ro chính nằm ở xử lý response đồng thời (refresh chồng load-more) và model mới không tương thích payload cũ.
**Kết luận:** 🟡 Merge sau khi sửa C1, C2, I1–I3

## 1. Critical issues

### C1. Crash `fromJson` với payload server hiện tại — `lib/data/models/point_transaction.dart:L18` `[compat][null]`
**Vấn đề:** Field `merchantName` khai báo non-nullable và không có `defaultValue`, nhưng API v2 trên staging trả `"merchantName": null` cho giao dịch hệ thống (thưởng đăng ký).
**Hậu quả:** Toàn bộ danh sách lịch sử điểm không hiển thị (throw `type 'Null' is not a subtype of type 'String'`), Cubit rơi vào `PointsHistoryError`.
**Bằng chứng:**
```dart
@JsonKey(name: 'merchantName')
final String merchantName;
```
**Fix:** → Patch C1

### C2. Refresh và load-more chạy song song, trang cũ ghi đè trang mới — `lib/features/points/cubit/points_history_cubit.dart:L41` `[async]`
**Vấn đề:** `refresh()` reset `_page = 1` rồi `await` API; nếu `loadMore()` đang bay (trang 3) và trả về sau, `emit` ghép trang 3 vào list vừa reset → trùng/mất dữ liệu. Không có request token hoặc transformer.
**Hậu quả:** Người dùng kéo refresh khi đang cuộn thấy lịch sử sai thứ tự / trùng giao dịch.
**Bằng chứng:**
```dart
Future<void> refresh() async {
  _page = 1;
  final result = await _repo.fetchHistory(page: 1);
  emit(state.copyWith(items: result.items, hasMore: result.hasMore));
}
```
**Fix:** → Patch C2

## 2. Important issues

### I1. `context` dùng sau `await` không check `mounted` — `lib/features/points/view/points_history_page.dart:L87` `[async]`
**Vấn đề:** `await cubit.refresh()` rồi `ScaffoldMessenger.of(context).showSnackBar(...)`; người dùng back trong lúc refresh → `Looking up a deactivated widget's ancestor`.
**Hậu quả:** Exception trong release, báo về Crashlytics.
**Bằng chứng:**
```dart
await context.read<PointsHistoryCubit>().refresh();
ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã cập nhật')));
```
**Fix:** → Patch I1

### I2. Tạo `DateFormat` trong `build()` cho mỗi item — `lib/features/points/view/widgets/point_tile.dart:L22` `[perf]`
**Vấn đề:** `DateFormat('yyyy/MM/dd HH:mm')` khởi tạo lại trên mỗi rebuild của từng tile; với 200 item và scroll là hàng nghìn lần.
**Hậu quả:** Jank khi cuộn trên máy yếu.
**Bằng chứng:**
```dart
Text(DateFormat('yyyy/MM/dd HH:mm').format(tx.createdAt))
```
**Fix:** → Patch I2

### I3. Không có test cho Cubit mới — `test/` `[test]`
**Vấn đề:** `PointsHistoryCubit` (138 dòng, 3 luồng: load, loadMore, refresh) không có test nào; `PointsRepository` chỉ có test happy-path.
**Fix:** → mục 4 (T1–T4)

**Cần xác nhận:** API v2 có trả `hasMore` khi `items` rỗng không? Code đang coi thiếu field = `false`.

## 3. Minor improvements

- **M1.** `points_history_cubit.dart:L12` `[logic]` — `static const pageSize = 20` nhưng repo hard-code `limit: 25`; thống nhất một chỗ.
- **M2.** `points_repository.dart:L44` `[null]` — `response.data['items'] as List` nên là `(response.data['items'] as List?) ?? const []`.
- **M3.** `point_tile.dart:L35` — thiếu `maxLines`/`overflow` cho `merchantName` dài (tên cửa hàng tiếng Nhật thường > 20 ký tự).

## 4. Test cases cần thêm

| # | File test | Test case | Input / Điều kiện | Kỳ vọng | Bảo vệ |
|---|-----------|-----------|-------------------|---------|--------|
| T1 | `test/data/models/point_transaction_test.dart` | fromJson với `merchantName: null` | JSON thiếu/null merchantName | Parse thành công, `merchantName == ''` | C1 |
| T2 | `test/features/points/cubit/points_history_cubit_test.dart` | refresh khi loadMore đang chạy | Mock repo: page 3 trả về sau page 1 | State cuối chỉ chứa page 1, không trùng | C2 |
| T3 | cùng file | loadMore khi `hasMore == false` | state.hasMore=false | Không gọi repo | behaviour mới |
| T4 | cùng file | lỗi mạng ở loadMore | repo throw DioException | Giữ items cũ, `errorMessage` set, không mất list | I3 |
| T5 | `test/features/points/view/points_history_page_test.dart` | back trong lúc refresh | pump, trigger refresh, pop trước khi Future xong | Không throw | I1 |

Đã chạy `flutter analyze`: 1 warning (`use_build_context_synchronously` tại I1). `flutter test`: 118 passed.

## 5. Patch tối thiểu

### Patch C1 — merchantName nullable-safe
```diff
--- a/lib/data/models/point_transaction.dart
+++ b/lib/data/models/point_transaction.dart
@@ -16,7 +16,7 @@ class PointTransaction {
   @JsonKey(name: 'points')
   final int points;
-  @JsonKey(name: 'merchantName')
+  @JsonKey(name: 'merchantName', defaultValue: '')
   final String merchantName;
   @JsonKey(name: 'createdAt')
   final DateTime createdAt;
```
Chạy lại `build_runner` để cập nhật `.g.dart`.

### Patch C2 — bỏ qua response của request cũ
```diff
--- a/lib/features/points/cubit/points_history_cubit.dart
+++ b/lib/features/points/cubit/points_history_cubit.dart
@@ -20,6 +20,7 @@ class PointsHistoryCubit extends Cubit<PointsHistoryState> {
   final PointsRepository _repo;
   int _page = 1;
+  int _requestId = 0;
 
@@ -38,9 +39,11 @@ class PointsHistoryCubit extends Cubit<PointsHistoryState> {
   Future<void> refresh() async {
     _page = 1;
+    final id = ++_requestId;
     final result = await _repo.fetchHistory(page: 1);
+    if (isClosed || id != _requestId) return;
     emit(state.copyWith(items: result.items, hasMore: result.hasMore));
   }
 
@@ -50,8 +53,10 @@ class PointsHistoryCubit extends Cubit<PointsHistoryState> {
   Future<void> loadMore() async {
     if (!state.hasMore || state.isLoadingMore) return;
+    final id = ++_requestId;
     emit(state.copyWith(isLoadingMore: true));
     final result = await _repo.fetchHistory(page: _page + 1);
+    if (isClosed || id != _requestId) return;
     _page += 1;
```
Fix tối thiểu bằng request token; nếu chuyển sang `Bloc` có thể dùng `restartable()` transformer.

### Patch I1 — check mounted
```diff
--- a/lib/features/points/view/points_history_page.dart
+++ b/lib/features/points/view/points_history_page.dart
@@ -85,6 +85,7 @@ class _PointsHistoryPageState extends State<PointsHistoryPage> {
     await context.read<PointsHistoryCubit>().refresh();
+    if (!mounted) return;
     ScaffoldMessenger.of(context).showSnackBar(
```

### Patch I2 — hoist DateFormat
```diff
--- a/lib/features/points/view/widgets/point_tile.dart
+++ b/lib/features/points/view/widgets/point_tile.dart
@@ -8,6 +8,8 @@ import 'package:intl/intl.dart';
 
+final _dateFormat = DateFormat('yyyy/MM/dd HH:mm');
+
 class PointTile extends StatelessWidget {
@@ -20,7 +22,7 @@ class PointTile extends StatelessWidget {
-          Text(DateFormat('yyyy/MM/dd HH:mm').format(tx.createdAt)),
+          Text(_dateFormat.format(tx.createdAt)),
```
