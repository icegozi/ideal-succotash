# Stack-specific pitfalls

Read only the sections that match the files in the diff. These are the bugs that experienced reviewers in each stack look for first; they complement, not replace, `review-checklist.md`.

Contents:
1. Flutter / Dart
2. TypeScript / JavaScript (React, Node)
3. Native mobile (Kotlin / Swift) — mostly the platform side of Flutter plugins
4. Python
5. SQL & data

---

## 1. Flutter / Dart

### Lifecycle & async
- **`BuildContext` across an async gap**: any `context.`/`Navigator.of(context)`/`ScaffoldMessenger.of(context)`/`showDialog` after an `await` must be preceded by `if (!context.mounted) return;` (or `if (!mounted)` in a `State`). The analyzer flags `use_build_context_synchronously`; still verify manually in callbacks.
- **`setState()` after dispose**: a Future/Stream completing after the widget is gone. Check `mounted` or cancel the subscription in `dispose()`.
- **`dispose()` completeness**: every `TextEditingController`, `ScrollController`, `AnimationController`, `FocusNode`, `StreamSubscription`, `Timer`, `PageController` created in `initState`/field initializers must be disposed/cancelled. A controller created inside `build()` is a leak and a bug.
- **`initState` doing async work without guarding re-entry**; `didChangeDependencies` running more than once; `didUpdateWidget` not reacting to changed parameters (stale state when the parent passes a new ID).
- **Unawaited futures**: `_save();` in a tap handler where `_save` is async — errors vanish. Use `await` or `unawaited()` deliberately.
- **`Future.wait` with failing elements** leaves other results inaccessible; consider `eagerError`/individual handling.
- **Isolates / `compute`**: the callback must be a top-level or static function; arguments must be sendable; do not touch platform channels or plugins from the isolate.

### State management
- **BLoC/Cubit**: `emit` after `close()` throws — guard long-running handlers with `isClosed`; `emit` inside `on<Event>` handlers only (not in `.then` callbacks after the handler returned — use `await`). Event handlers that `await` without a transformer (`droppable`, `restartable`, `sequential`) will run concurrently on rapid events; is that intended? Equatable `props` missing a field means the UI will not rebuild when that field changes. `copyWith` with nullable fields cannot set a field back to `null` unless designed for it.
- **GetX**: `Get.find<T>()` before `Get.put`; controllers registered with `permanent: true` leaking across sessions; `.obs` lists mutated without `refresh()`/assignment; `Get.to` with `binding` vs manual `put` duplicates; `onClose` not cancelling workers/streams; `Worker` (`ever`, `debounce`) never disposed.
- **Provider/Riverpod**: reading a provider with `watch` inside callbacks; `ref` used after the widget/provider is disposed; `autoDispose` providers losing state on navigation when the author expected persistence.
- **Stale closure capture** in callbacks created in a previous build with old values.

### Widgets & rendering
- Expensive work in `build()` (formatters, parsing, sorting, `DateTime.now()`, `MediaQuery.of` deep in subtree causing rebuild storms).
- Missing `const` on static subtrees in hot lists; missing `Key`s on reorderable/conditional list items; `ListView(children: [...])` for large data instead of `.builder`; `shrinkWrap: true` + `NeverScrollableScrollPhysics` nested in a scroll view with hundreds of items.
- `Image.network` without `cacheWidth`/`cacheHeight` for thumbnails; `precacheImage` without `mounted` check.
- Text overflow for long Japanese/Vietnamese strings, missing `maxLines`/`overflow`, fixed heights that break with larger system font scale.
- `WillPopScope`/`PopScope` logic that swallows back navigation; dialogs that can be dismissed by tapping outside during a non-cancelable operation.

### Data, models, storage
- `json_serializable`/`freezed` models: regenerated `.g.dart`/`.freezed.dart` not committed, or committed without the source change (mismatch). New non-nullable field without `@JsonKey(defaultValue:)` → `fromJson` throws on old server payloads.
- `SharedPreferences` keys renamed without migration; sensitive data in `SharedPreferences` instead of `flutter_secure_storage`.
- `Hive`/`Isar`/`sqflite` schema changes: new fields on a stored type without a default or a migration; `typeId` collisions; opening boxes multiple times.
- `DateTime.parse` of server strings without timezone info; `toLocal()`/`toUtc()` applied twice; comparing `DateTime` objects with different `isUtc`.
- `intl` formatting with the device locale when the business wants a fixed locale (e.g., yen formatting must not depend on the phone's language).

### Networking & realtime
- `dio`/`http` interceptors: token refresh race (several 401s → several refreshes → one wins, others get a revoked token). Need a single shared refresh future and a retry of the queued requests.
- Response parsing assuming 200 with JSON; HTML maintenance pages; `data` typed `dynamic` and cast too late.
- Timeouts not set; retries without backoff; no cancellation (`CancelToken`) when the screen is popped.
- **SignalR / WebSocket**: reconnection handler re-registering listeners (duplicate events after each reconnect); messages arriving after the screen is disposed; `onclose` without resubscribing to groups; sending while the connection is in `Reconnecting`; auth token in the negotiate URL exposed in logs.
- Push notification / deep-link payload parsing with required fields, `null` when launched from a terminated state, and the "cold start" path tested only warm.

### Platform channels & plugins
- **`MethodChannel`**: method name typos between Dart and native (string-typed contract — grep both sides); argument map types (`Map<Object?, Object?>` vs `Map<String, dynamic>` — cast with `Map<String, dynamic>.from`); `invokeMethod` throwing `MissingPluginException` on a platform that lacks the implementation (web, desktop, tests); native results delivered off the main thread; unhandled `PlatformException` with native error codes.
- **`EventChannel`**: `onCancel` not stopping native work; multiple listeners when the stream is single-subscription.
- iOS vs Android divergence in permissions, file paths, background execution limits.

### In-App Purchase
- Purchase stream (`purchaseStream`) listened to once, early (before any UI), and never cancelled per screen; pending purchases from a previous session processed on startup.
- Receipt / purchase token verified **server-side** before granting entitlement; client-side "purchased" flags are trivially spoofable.
- `completePurchase` / `finishTransaction` always called after successful verification — missing it causes repeated delivery or stuck transactions.
- Restore flow, cancelled flow, `pending` (parental approval / slow card), already-owned errors, and sandbox vs production receipts all handled.
- Product IDs and price strings come from the store, not hardcoded; currency formatting uses `rawPrice`/`currencyCode`, never parsed from the display string.

### Testing in Flutter
- `pumpAndSettle` hanging on infinite animations/timers; `pump` durations matching debounces; `FakeAsync` for timers.
- `blocTest` sequences asserting `expect: [..]` exactly — new intermediate states break them silently; `seed` vs initial state.
- Golden tests updated with `--update-goldens` without reviewing visual diffs.
- Mocked `MethodChannel` handlers (`TestDefaultBinaryMessengerBinding`) matching the real method names.

---

## 2. TypeScript / JavaScript (React, Node)

### Language-level
- `==` vs `===`; truthiness traps (`0`, `''`, `NaN` treated as "missing"); `||` default where `??` was meant.
- `any`, `as` casts, non-null `!` that launder a real `undefined`; `Record<string, T>` indexing returns `T` not `T | undefined` unless `noUncheckedIndexedAccess`.
- Array mutation (`sort`, `splice`, `reverse`) on props/state; object spread shallow copies nested state.
- `parseInt` without radix; `Number('')` is `0`; `JSON.parse` on untrusted input without try/catch; `Date` parsing of non-ISO strings is implementation-defined.
- Optional chaining masking real bugs (`res?.data?.items ?? []` hiding a 500).

### Async
- Missing `await` / floating promises (`no-floating-promises`); `forEach(async …)` does not wait; `Promise.all` fail-fast vs `allSettled`.
- `useEffect` async: setting state after unmount (use an `ignore`/`AbortController` flag), missing/incorrect dependency arrays, effects running twice in StrictMode and double-subscribing.
- Fetch races on fast input: cancel the previous request (`AbortController`) or ignore stale responses by sequence number.
- Event listeners / intervals / sockets added in effects without cleanup.
- Node: unhandled rejection in request handlers (Express < 5 needs explicit `next(err)`); blocking the event loop with sync IO/crypto/JSON on big payloads.

### React specifics
- State updates relying on current state without the functional form (`setCount(count + 1)` in a loop/closure).
- Stale closures in handlers/timers; `useCallback`/`useMemo` with wrong deps; new object/array/function literals passed as props defeating memoization.
- Keys: index as key on reorderable lists; duplicate keys.
- Derived state copied into `useState` and never resynced when props change.
- Conditional hooks; hooks after early return.
- `dangerouslySetInnerHTML`, `href={userInput}` (`javascript:` URLs), `target="_blank"` without `rel="noopener"`.
- Forms: uncontrolled→controlled switches, missing `preventDefault`, double submit.
- Large lists without virtualization; expensive work in render; context value objects recreated every render.

### Node / backend
- Input validation at the boundary (zod/joi/etc.) — new fields accepted without validation; mass assignment into ORM models.
- SQL/NoSQL built by string concatenation / `$where`; path traversal in file APIs; `child_process` with user input.
- Auth middleware missing on new routes; authorization checked by client-sent IDs; JWT `alg` not pinned; secrets from `process.env` with fallbacks to hardcoded values.
- Error responses leaking stack traces; `console.log` of request bodies/tokens.
- Pagination missing; N+1 via ORM lazy relations; missing DB index for a new `where`/`orderBy`.
- Transactions not used for multi-step writes; idempotency for payment/webhook handlers; webhook signature verification.
- Env/config: new env var with no default and no startup check; `NODE_ENV`-dependent behaviour.

### Tests
- `jest.useFakeTimers` not advanced; `await act(...)`; mocks not reset between tests (`resetMocks`); snapshot tests updated with `-u` wholesale; tests asserting implementation (mock call counts) instead of behaviour.

---

## 3. Native mobile (Kotlin / Swift)

Mostly relevant when the diff includes the Android/iOS side of a Flutter plugin or `MethodChannel` handler.

- **Threading**: `MethodChannel.Result` must be called on the main thread (Android) / `FlutterResult` on main (iOS); callbacks from background executors/`DispatchQueue.global` posting back incorrectly; `result` called twice or never (every branch must call `success`/`error`/`notImplemented` exactly once).
- **Lifecycle**: `Activity`/`Context` captured in a long-lived object (leak); `ActivityResultLauncher` registered after `onCreate`; plugin not handling `onDetachedFromActivity`; iOS `UIViewController` deallocated while a delegate callback is pending (`weak self`).
- **Nullability**: Kotlin platform types from Java APIs (`!`) crashing with NPE; Swift force unwraps `!` on optionals from `arguments as? [String: Any]`; `Intent` extras assumed present.
- **Permissions**: runtime permission result codes; iOS `Info.plist` usage-description keys missing → crash on request; Android 13+ notification permission; scoped storage on Android 10+/`MANAGE_EXTERNAL_STORAGE` rejections.
- **Background limits**: work started in `onPause`/background that the OS kills; `URLSession` background config; WorkManager constraints.
- **Security**: exported `Activity`/`Service`/`BroadcastReceiver` in the manifest; `WebView.addJavascriptInterface`; `allowBackup`; keychain accessibility class; logging tokens with `Log.d`/`print`.
- **Serialization across the channel**: `Long` vs `Int` (Dart `int` ↔ Kotlin `Long` for large values), `Double` precision, `Map` key types, `Uint8List` ↔ `ByteArray`/`FlutterStandardTypedData`.
- **Gradle/Pods**: version bumps that raise `minSdk`/deployment target; transitive conflicts; `-keep` ProGuard/R8 rules missing for reflection-based libraries (crashes only in release).

---

## 4. Python

- Mutable default arguments (`def f(x, items=[])`); late-binding closures in loops; `is` vs `==`; integer/float division; `dict`/`set` iteration while mutating.
- `None` handling: `if not value` treating `0`/`''`/`[]` as missing; `dict.get()` chains hiding KeyErrors that were meaningful; `Optional` return types not checked by callers.
- Exceptions: bare `except:`/`except Exception: pass`; catching too broadly around code that should fail; re-raising with `raise e` losing the traceback (`raise` alone); custom exceptions not inheriting properly.
- Async: forgetting `await` on coroutines (`RuntimeWarning: coroutine was never awaited`); blocking calls (`requests`, `time.sleep`, sync DB driver) inside `async def`; `asyncio.gather` without `return_exceptions`; shared state across tasks without locks; `asyncio.create_task` results dropped (garbage-collected tasks).
- Threads/processes: GIL assumptions; `multiprocessing` with non-picklable args; thread-unsafe globals in web workers.
- Security: `eval`/`exec`/`pickle.loads`/`yaml.load` (use `safe_load`) on untrusted data; `subprocess` with `shell=True` and user input; SQL via f-strings; path joins with user input; `verify=False`; secrets in code; `random` for tokens (use `secrets`).
- Performance: list `in` checks inside loops; building strings with `+=` in big loops; loading whole files/results into memory; N+1 ORM queries (missing `select_related`/`joinedload`); regex compiled per call.
- Typing & compat: new required dataclass/Pydantic fields breaking old payloads; `datetime.utcnow()` naive datetimes vs aware; timezone handling; Python version features (match, `|` unions) vs the deployment runtime; f-strings in log calls (use lazy `%s`).
- Tests: `pytest` fixtures with shared mutable state; `freezegun`/`time-machine` for time; mocks patched at the wrong import path; missing tests for exception branches.

---

## 5. SQL & data

- Migrations: destructive changes (drop/rename column, type change) with no backfill/rollback; adding `NOT NULL` without a default to a populated table; large-table rewrites without batching; migration not idempotent; ORM model changed without a migration or vice versa.
- Transactions: multi-step writes without a transaction; transaction held across network calls; isolation level assumptions; retry on deadlock.
- Concurrency: read-modify-write on balances/points/stock without `SELECT … FOR UPDATE`, optimistic version columns, or atomic `UPDATE … SET x = x - ?` with a `WHERE x >= ?` guard; unique constraints instead of application-level "check then insert".
- Indexes: new query predicates/sorts with no index; functions on indexed columns in `WHERE` (`LOWER(email)`), leading wildcards, implicit casts defeating indexes.
- Correctness: `NULL` in comparisons (`!= 'x'` excludes NULLs; `NOT IN (subquery with NULL)` returns nothing); `LEFT JOIN` + `WHERE` on the right table turning into an inner join; `GROUP BY` with non-aggregated columns; duplicates from one-to-many joins inflating sums; date range boundaries (`< next_day` vs `<= day 23:59:59`); timezone of `NOW()` on the server.
- Money/points: `FLOAT`/`DOUBLE` for currency (use `DECIMAL`/integer minor units); rounding mode; currency mixing.
- Injection: query strings built from input, dynamic `ORDER BY` column names without an allow-list.
- Performance: `SELECT *`, missing `LIMIT`, `OFFSET` pagination on big tables (use keyset), `COUNT(*)` on each page load, N+1 from the application.
- Compat: changed column semantics consumed by reports/BI; enum values stored as ints with renumbering; soft-delete flags ignored by a new query.
