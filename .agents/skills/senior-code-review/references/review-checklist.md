# Review checklist

Walk the diff once per category. For each item, the question is not "does the code look fine?" but "what input, timing, or environment makes this line wrong?" Record a finding only when you can point at the line and describe the failing scenario.

Tag each finding with the category code in brackets: `[logic]`, `[edge]`, `[null]`, `[async]`, `[security]`, `[perf]`, `[compat]`, `[test]`.

---

## 1. Logic bugs `[logic]`

- **Condition polarity and operators**: `!`, `&&` vs `||`, `<` vs `<=`, `==` vs `===`/`identical`, inverted early returns. Read every changed boolean expression out loud with concrete values.
- **Off-by-one**: loop bounds, `length - 1`, `substring`/`sublist` ends, pagination (`page * size` vs `(page - 1) * size`), inclusive/exclusive date ranges.
- **Wrong variable**: copy-paste blocks where the second copy still references the first variable (`startDate` used twice, `itemA.price` in the `itemB` branch).
- **Switch/when/if-else chains**: missing branch for a new enum value, fallthrough, `default` that silently swallows a new case. When an enum gains a value, grep every `switch` on it.
- **State transitions**: can the code reach a state it never handles (loading → error → retry → success with stale data)? Draw the state machine if the change touches one.
- **Unit and type confusion**: seconds vs milliseconds, cents vs currency units, points vs yen, local vs UTC, `int` division truncation, `double` equality, string vs number IDs.
- **Mutation of shared data**: sorting/filtering a list in place that another part of the code still holds; mutating a model that is also a cache key or a `const`.
- **Early return skips cleanup**: a new `return`/`throw` added before `finally`-style code (unlock, close, setState(loading=false), analytics event).
- **Floating assumptions**: comments or variable names promise something the code no longer enforces after the change.

## 2. Edge cases `[edge]`

Try these inputs against every changed function, mentally or with a quick script:

- empty collection / empty string / whitespace-only string
- single element (loops that assume ≥ 2, "first vs last" logic)
- very large input (10k items in a list view, 5 MB JSON, 2000-char search term)
- zero, negative, `NaN`, `Infinity`, max int, decimal where int expected
- duplicates in a list that is later keyed by value
- Unicode: emoji, combining characters, full-width digits (Japanese input!), RTL; `length` vs grapheme count; `toUpperCase` on non-ASCII
- dates: leap day, DST shift, month boundaries, year end, timezone of the device vs server, `DateTime.now()` inside a loop
- network: timeout, 5xx, 429, slow response arriving after the user navigated away, response with missing/extra fields, HTML error page where JSON was expected
- user actions: double tap, back button mid-operation, rotation / app backgrounded mid-request, offline then online, logged out while a request is in flight
- permissions denied (camera, location, notifications) and the "ask again" path
- first launch (no cache, no stored token, migration from a version that never had this key)

## 3. Null / undefined `[null]`

- Every `!` (Dart), `!.` (TS non-null assertion), `as`/forced cast, `unwrap()`/`!!`: is the value provably non-null on **all** paths, including error and cancelled paths? Who guarantees it?
- Optional chaining that hides a real bug: `user?.id ?? ''` sending an empty ID to the backend instead of failing loudly.
- JSON parsing: fields assumed present/typed (`json['count'] as int` when the server sends `"12"` or `null`); nested access `a.b.c` where any level may be missing; lists that may be `null` instead of `[]`.
- Map lookups: `map[key]` returning null, `firstWhere` without `orElse`, `list.first`/`last`/`[0]` on possibly empty lists, `indexOf == -1` used as an index.
- Late initialization: `late` fields / `lateinit` / fields set in `init()` read before init on a reused instance or a rebuilt widget.
- Default parameters that changed meaning: `null` now treated as "unset" vs previously "explicitly false".
- Return paths: functions that return a value on the happy path but fall off the end (`undefined`) or return `null` on an error branch that callers do not check.
- Nullable → non-nullable migrations: did a model field become required while old stored/cached data still lacks it?

## 4. Async / concurrency `[async]`

- **Missing `await`**: a `Future`/`Promise` created and dropped, so errors are unhandled and ordering is not what the author thinks. Look for `async` functions called without `await` and without `unawaited(...)`/`void` intent.
- **Use after dispose/unmount**: `setState`, `emit`, state updates, navigation, or `context` use after an `await` without checking `mounted`/`isClosed`/an abort flag. Classic Flutter and React bug.
- **Race between two in-flight requests**: typing in a search box, pull-to-refresh twice, two tabs loading the same resource — does the older response overwrite the newer one? Is there a request token / cancel / `switchMap`-style guard?
- **Double submission**: button not disabled during the request; `isLoading` set after the first `await` instead of before it.
- **Check-then-act**: `if (!cache.contains(k)) cache[k] = compute()` with concurrent callers; `if (token.isExpired) refresh()` called from several requests at once (refresh storm) — needs a single shared in-flight future / mutex.
- **Streams/listeners/timers**: every `listen`, `addListener`, `Timer.periodic`, `setInterval`, socket handler, `AppLifecycle` observer — where is the cancel/removal? Is it registered once per instance or once per rebuild/render?
- **Error handling in async code**: `try/catch` around `await`? `.catchError` present but swallowing? `Future.wait` failing fast and leaving partial state? `Promise.all` vs `allSettled`?
- **Ordering assumptions**: code that assumes events arrive in order (socket messages, SignalR reconnect replay, push notifications) or that `initState` completes before the first frame.
- **Shared mutable state across isolates/workers/threads**: data sent to an isolate and then mutated; main-thread-only APIs called from a background callback (platform channels must be called on the platform thread).
- **Cancellation**: long operations (uploads, downloads, polling) with no way to cancel when the screen is popped or the user logs out.
- **Deadlocks / re-entrancy**: a lock or `synchronized` block that awaits something which needs the same lock; a listener that triggers the emitter.

## 5. Security `[security]`

- **Secrets**: API keys, tokens, passwords, signing keys, `.env`, service-account JSON added to the repo or baked into client code. Client-side "secrets" are public.
- **Injection**: string-built SQL/NoSQL queries, shell commands, `eval`, dynamic imports, HTML set from user data (`innerHTML`, `dangerouslySetInnerHTML`, `Html(data:)`), format strings, deep-link / URL parameters used unvalidated.
- **AuthN/AuthZ**: a new endpoint or screen that skips the auth check, trusts a client-supplied user ID/role/price/points, or relies on UI hiding instead of server enforcement. Points/coupons/rewards logic must be validated server-side.
- **Token handling**: tokens logged, stored in plain `SharedPreferences`/`localStorage` instead of secure storage, sent over HTTP, included in URLs, kept after logout.
- **Logging of PII**: emails, phone numbers, addresses, card fragments, full request bodies in logs or crash reports.
- **Input validation moved or removed**: length limits, allow-lists, file-type checks, size limits.
- **Crypto misuse**: home-made hashing, MD5/SHA1 for passwords, fixed IVs, `Random()` instead of a secure RNG for tokens.
- **Transport & platform**: certificate validation disabled "for testing", `usesCleartextTraffic`, `NSAllowsArbitraryLoads`, overly broad WebView JS bridges, exported Android components, deep links without origin checks.
- **Dependency changes**: new packages — are they maintained, is the version pinned, do they pull native code? Lockfile diffs that silently bump a transitive dependency with a known CVE.
- **Data exposure**: debug screens, verbose error messages with stack traces or SQL shown to users, test accounts/backdoors.
- **Mass assignment / over-posting**: models deserialized straight from request bodies with no field allow-list.

## 6. Performance `[perf]`

- **Work on every rebuild/render**: object construction, JSON parsing, sorting, filtering, regex compile, `DateFormat`/`NumberFormat` creation inside `build()`/render/`useEffect` without deps.
- **N+1**: a loop that awaits a network/DB call per item; nested loops over large lists (`O(n²)` `contains` on a list — use a set/map).
- **Unbounded growth**: caches, lists, listeners, subscriptions that are added but never trimmed/cancelled; images kept at full resolution.
- **Lists**: non-lazy builders for large data (`Column` of 1000 children instead of `ListView.builder`; rendering all rows instead of virtualizing), missing keys causing full re-renders, `shrinkWrap: true` inside scroll views.
- **Blocking the UI thread**: synchronous file IO, heavy JSON decode, image processing, crypto, large `compute` outside an isolate/worker.
- **Network**: missing pagination, fetching whole collections to show counts, no caching headers, polling where a push/socket exists, retrying without backoff.
- **Database**: missing index for a new query, `SELECT *` into a model that only needs two columns, queries in a transaction that could be batched, migrations that rewrite large tables on startup.
- **Memory**: large base64 strings held in state, streams buffered into memory, images decoded at full size, closures capturing big objects.
- **Startup**: new work added to app start / `main()` / first screen that could be deferred.
- **Regression signal**: a change that moves from lazy to eager, from cached to recomputed, from indexed to scanned, from `const` to non-const widgets in hot paths.

## 7. Backward compatibility `[compat]`

- **Persisted data**: renamed/removed/retyped fields in models that are stored locally (SharedPreferences, Hive, SQLite, Realm, localStorage, files) or in a server DB — is there a migration? What happens to users upgrading from the previous version with old data on disk?
- **Serialization**: JSON key renames, enum value renames, changed date formats; `fromJson` that now throws on data the old server/app still produces. Server and app release trains rarely align — the new app must tolerate the old server response and vice versa.
- **API contracts**: changed request/response shapes, removed endpoints, changed status codes, new required parameters. Who else consumes this API (web, iOS, Android, partner)?
- **Public interfaces in shared code**: changed function signatures, removed exports, default-parameter changes in a package/module used by other teams or apps.
- **Deep links / routes / notification payloads**: renamed route names or parameters break links already out in the wild (emails, QR codes, push campaigns).
- **Feature flags & config**: new config keys with no default — what does the app do when the remote config/env var is missing?
- **Platform minimums**: raised `minSdkVersion`/iOS deployment target/Node version/package constraint; dropped platform support.
- **Behavioural changes without a flag**: a changed default (sort order, timezone, rounding, currency formatting) that existing users or downstream reports depend on.
- **Analytics/event names**: renamed events or parameters break dashboards silently.
- **Database migrations**: destructive steps (drop/rename column) without a rollback path; migration order; running on a large table.

## 8. Tests `[test]`

- For each changed behaviour: is there a test that would fail if the change were reverted? If not, that is a missing test (section 4 of the report).
- Changed code with tests that were **edited to pass** — check whether the test was weakened (assertion removed, expected value changed to match a bug, `skip` added).
- Tests that only cover the happy path when the change added error branches, nulls, or concurrency.
- Flaky patterns introduced: real timers/`sleep`, real network, dependence on wall-clock time, shared mutable fixtures, order-dependent tests.
- Mocks that no longer match the real contract after the change (mock returns the old shape).
- Missing test levels: a pure function with no unit test; a BLoC/reducer with no state-sequence test; a widget/component with user interaction and no widget test; an API change with no contract/integration test.
- Snapshot/golden tests updated wholesale without reviewing the diff of the snapshot.

When writing section 4, make each test case concrete enough to implement: file, scenario, inputs, expected result, and which issue or behaviour it protects.
