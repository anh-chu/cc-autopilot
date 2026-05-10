# TODO

Deferred follow-ups from the conversation unification effort. None block normal operation.

## Conversation system

### 1. Cross-process file locking (data integrity)

**Severity:** Medium (matches existing project norms — same pattern used for `tasks.json`, `decisions.json`, `active-runs.json`, etc.)

**Problem:** `src/lib/conversations.ts` uses `async-mutex` `Mutex` for synchronizing writes to `conversations.json`, `events.jsonl`, `turns.jsonl`, and `seq.txt`. These mutexes are process-local. The Next.js API routes and the daemon (`scripts/daemon/run-task.ts`) are separate processes, so concurrent writes from both are not actually synchronized.

**Real-world risk:** Small for single-user personal use. Daemon writes per-task; API routes write on user actions. Collision window is narrow but non-zero.

**Files:** `src/lib/conversations.ts:75-89,129-137,369-380` (and the same pattern in `src/lib/data.ts`)

**Fix when scaling:** Use `proper-lockfile` (already a transitive dep) or `flock`-based file locking for cross-process coordination. Apply consistently across all workspace JSON files, not just conversation files.

---

### 5. Stale refresh dispatch after conversationId change

**Severity:** Low (race only visible on fast navigation between conversations)

**Problem:** `src/hooks/use-conversation-stream.ts` `init()` calls `await refresh()` before `connectSSE()`. If `conversationId` changes while `refresh()` is in-flight, the response resolves and dispatches state for the old conversation into the now-switched hook instance. The `aborted` flag guards the SSE connect but not the dispatch inside `refresh`.

**Files:** `src/hooks/use-conversation-stream.ts` (`init` function, `refresh` useCallback)

**Fix:** Pass an `AbortSignal` or generation counter into `refresh`. Inside `refresh`, skip `dispatch` if the signal is aborted or if `conversationIdRef.current` no longer matches the id that started the fetch.

---

## Tests

### Prune low-value tests (remaining candidates)

Remaining after initial prune. Do not prune blindly while behavior is still settling.

1. `__tests__/validations.test.ts` (~86 tests) — many one-field schema permutation tests; keep representative valid/invalid cases per schema, remove exact boundary duplicates unless they caught past bugs
2. `__tests__/conversations.test.ts` (~46 tests) — merge create/list/update/delete into fewer end-to-end persistence tests; keep concurrency, seq durability, stale-run reaper, and idempotency tests
3. `__tests__/api-conversations-flow.test.ts` (~38 tests) — table-drive duplicate terminal-state variants; keep idempotency, running-conflict, SSE replay/live/dedup, and cancel-publishes-event tests
4. `__tests__/use-conversation-stream.test.ts` (~31 tests) — merge simple lifecycle state tests into one table-driven test; keep turn lifecycle, tool buffering, dedup/reconnect, and bug-regression tests
