# Codebase Slimdown Plan

Audit-driven cleanup targeting dead code, redundant logic, and stale artifacts.  
Estimated net reduction: **~363 LOC** across 25+ files. Zero behavior changes.

## Execution Order

```
Phase 1: Dead code deletion (zero risk, no dependents)
Phase 2: Shared module creation (additive only, nothing breaks)
Phase 3: Inline dedup migration (swap inline defs → shared imports)
Phase 4: Pagination consolidation (adopt lib/paginate.ts in 7 routes)
Phase 5: Component dedup (DraggableTask unification)
Phase 6: Stale artifact cleanup (comments, dead types)
```

Each phase ends with: `tsc --noEmit` + `pnpm build` + `pnpm test`.

---

## Phase 1: Dead Code Deletion

**Risk: None. All targets have zero importers.**

### 1a. Delete `src/components/eisenhower-summary.tsx`

- **Blast radius:** Zero downstream dependencies
- **Evidence:** `grep -r "eisenhower-summary" src/` → no results
- **LOC removed:** 97

### 1b. Remove dead functions from `scripts/daemon/runs-registry.ts`

Delete lines 47–106 (3 functions + 1 interface):

| Export | Lines | Importers |
|---|---|---|
| `PrunableEntry` (interface) | 47–57 | Only `types.ts:190` → feeds dead `RespondRunEntry` |
| `pruneOldEntries` | 59–76 | Zero |
| `findEntryById` | 78–89 | Zero |
| `updateEntryById` | 91–106 | Zero |

- **Blast radius:** File has 13 dependents, but `recovery.ts` imports only `atomicWriteJson` + `readJsonFile`. No dependent uses these 4 exports.
- **LOC removed:** 60

### 1c. Remove dead types from `scripts/daemon/types.ts`

Delete lines 187–213:

```
RespondRunStatus (type)
PrunableEntry import
RespondRunEntry (interface)
RespondRunsFile (interface)
```

- **Evidence:** `grep -r "RespondRunEntry\|RespondRunsFile\|RespondRunStatus" scripts/` → only `types.ts` itself
- **LOC removed:** 26

### 1d. Remove `getConfigPath` from `scripts/daemon/config.ts`

Delete lines 170–172:

```ts
export function getConfigPath(workspaceId: string = "default"): string {
  return path.join(getWorkspaceDir(workspaceId), "daemon-config.json");
}
```

- **Evidence:** `grep -r "getConfigPath" scripts/` → only definition, zero importers
- **LOC removed:** 3

**Phase 1 total: -186 LOC**

---

## Phase 2: Create Shared Modules

**Risk: None. Additive only — new files, no existing code changes.**

### 2a. Create `src/lib/json-io.ts`

Canonical `readJSON` / `writeJSON` for API routes. Matches the most common variant (generic, returns `null` on error).

```ts
import { existsSync, readFileSync, writeFileSync } from "fs";

export function readJSON<T>(file: string): T | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJSON(file: string, data: unknown): void {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}
```

- **Source of truth:** `src/app/api/tasks/shared.ts` lines 1–14 (most widely used variant)
- **LOC added:** 14
- **Note:** `scripts/daemon/data-io.ts` stays separate — daemon uses different error handling and workspace-scoped paths. `scripts/daemon/runs-registry.ts` also stays — it has `atomicWriteJson` with rename-based safety. These are intentionally different contracts.

### 2b. Create `src/lib/process-utils.ts`

Canonical `isProcessAlive` with configurable zero-PID behavior.

```ts
/**
 * Check if a process is alive by PID.
 * @param assumeAliveIfZero - If true, pid <= 0 returns true (for just-spawned processes). Default: false.
 */
export function isProcessAlive(pid: number, assumeAliveIfZero = false): boolean {
  if (pid <= 0) return assumeAliveIfZero;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
```

- **Rationale for parameter:** 2 of 4 callsites use `pid <= 0 → true` (missions, projects/run — "just started, assume alive"). 2 use `pid <= 0 → false` (runs, daemon). Parameter preserves both semantics without divergence.
- **LOC added:** 10

**Phase 2 total: +24 LOC**

---

## Phase 3: Inline Dedup Migration

**Risk: Low. Swapping identical function bodies for imports. Type-check catches mismatches.**

### 3a. Migrate `readJSON`/`writeJSON` — 6 files

Remove inline definitions, add `import { readJSON, writeJSON } from "@/lib/json-io"`.

| File | Remove lines | Functions removed | Notes |
|---|---|---|---|
| `src/app/api/daemon/route.ts` | 14–21 | `readJSON` (returns `unknown`) | Callsites need `as T` cast — verify existing casts suffice |
| `src/app/api/missions/route.ts` | 59–67 | `readJSON<T>` | Direct match |
| `src/app/api/brain-dump/automate/route.ts` | 9–16 | `readJSON<T>` | Direct match |
| `src/app/api/projects/[id]/stop/route.ts` | 6–17 | `readJSON<T>`, `writeJSON` | Direct match |
| `src/app/api/projects/[id]/run/route.ts` | 9–20 | `readJSON<T>`, `writeJSON` | Direct match |
| `src/app/api/tasks/[id]/comment/route.ts` | 10–17 | `readJSON<T>` | Direct match |

Also update `src/app/api/tasks/shared.ts`:
- Replace lines 1–14 with re-export: `export { readJSON, writeJSON } from "@/lib/json-io"`
- Keep `TaskEntry` and `RunEntry` interfaces (lines 16–46) unchanged

- **LOC removed:** ~55 (inline defs) + ~8 (shared.ts body)
- **LOC added:** 7 import lines + 1 re-export line
- **Net:** -55

### 3b. Migrate `isProcessAlive` — 4 files

Remove inline definitions, add `import { isProcessAlive } from "@/lib/process-utils"`.

| File | Remove lines | pid<=0 behavior | Migration |
|---|---|---|---|
| `src/app/api/runs/route.ts` | 6–14 | `false` (default) | `isProcessAlive(pid)` |
| `src/app/api/daemon/route.ts` | 23–30 | `false` (no guard) | `isProcessAlive(pid)` — rename from `isProcessRunning` at callsites |
| `src/app/api/missions/route.ts` | 69–77 | `true` | `isProcessAlive(pid, true)` |
| `src/app/api/projects/[id]/run/route.ts` | 66–74 | `true` | `isProcessAlive(pid, true)` |

- **LOC removed:** 35
- **LOC added:** 4 import lines
- **Net:** -31

### 3c. Dedup `getWorkspaceEnv` in `scripts/daemon/dispatcher.ts`

- Remove inline function at lines 14–23
- Add `import { getWorkspaceEnv } from "./workspace-env"` to existing imports
- `workspace-env.ts` is the canonical source (already imported by `run-task.ts`, `run-brain-dump-triage.ts`)

- **LOC removed:** 10
- **LOC added:** 1 import
- **Net:** -9

**Phase 3 total: -95 LOC**

---

## Phase 4: Pagination Consolidation

**Risk: Medium. Response shape must stay identical for frontend compatibility.**

### Pattern

All 7 routes currently do:

```ts
const limitParam = searchParams.get("limit");
const offsetParam = searchParams.get("offset");
const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : DEFAULT_LIMIT;
const offset = Math.max(0, parseInt(offsetParam ?? "0", 10));
items = items.slice(offset, offset + limit);
// ... then manually build meta: { filtered, returned, limit, offset }
// ... then set Cache-Control header inline
```

Replace with:

```ts
import { parsePaginationParams, paginateItems, CACHE_HEADERS } from "@/lib/paginate";
// ...
const { limit, offset } = parsePaginationParams(searchParams);
const result = paginateItems(items, { limit, offset }, total);
return NextResponse.json(
  { data: result.data, items: result.data, meta: result.meta },
  { headers: CACHE_HEADERS }
);
```

### Files

| Route file | Named key to preserve | Lines removed (approx) |
|---|---|---|
| `src/app/api/tasks/route.ts` | `tasks` | ~12 |
| `src/app/api/projects/route.ts` | `projects` | ~12 |
| `src/app/api/agents/route.ts` | `agents` | ~12 |
| `src/app/api/skills/route.ts` | `skills` | ~12 |
| `src/app/api/decisions/route.ts` | `decisions` | ~12 |
| `src/app/api/brain-dump/route.ts` | `entries` | ~12 |
| `src/app/api/initiatives/route.ts` | `initiatives` | ~12 |

Each route currently returns `{ data: [...], <name>: [...], meta: { filtered, returned, limit, offset } }`.  
Must preserve both `data` and the named key for backward compatibility.

- **LOC removed:** ~84 (7 × ~12)
- **LOC added:** ~21 (7 × 3 lines)
- **Net:** -63

**Acceptance:** All 7 routes return identical JSON structure. Frontend `use-data.ts` hooks parse without changes.

**Phase 4 total: -63 LOC**

---

## Phase 5: Component Dedup

**Risk: Low. DraggableTask in project-detail-page is simpler subset of DraggableTaskCard.**

### 5a. Replace `DraggableTask` with `DraggableTaskCard`

**File:** `src/components/project-detail-page.tsx`

- Remove `DraggableTask` function (lines 40–97, 57 lines)
- Add `import { DraggableTaskCard } from "./board-view"` (already exports it)
- Update JSX usage: `<DraggableTask` → `<DraggableTaskCard`
- Missing props (`project`, `isSelected`, `onToggleSelect`) are all optional in `DraggableTaskCard` — passing `undefined` is fine

**Prop mapping:**

| DraggableTask prop | DraggableTaskCard prop | Status |
|---|---|---|
| `task` | `task` | Same |
| `onClick` | `onClick` | Same |
| `isRunning` | `isRunning` | Same |
| `onRun` | `onRun` | Same |
| `pendingDecisionTaskIds` | `pendingDecisionTaskIds` | Same |
| `onStatusChange` | `onStatusChange` | Same |
| `onDuplicate` | `onDuplicate` | Same |
| `onDelete` | `onDelete` | Same |
| — | `project` | Optional, pass undefined |
| — | `isSelected` | Optional, pass undefined |
| — | `onToggleSelect` | Optional, pass undefined |

**Behavior delta:** DraggableTaskCard has click-vs-drag discrimination logic (mouseDown timer). DraggableTask does raw pointer passthrough. Net effect: project board gets better click/drag UX. This is an improvement, not regression.

- **LOC removed:** 57
- **LOC added:** 1 import + 1 rename
- **Net:** -55

**Phase 5 total: -55 LOC**

---

## Phase 6: Stale Artifact Cleanup

**Risk: None. Comments and dead references only.**

### 6a. Fix stale comment in `scripts/daemon/runs-registry.ts`

Lines 3–5 reference `respond-runs.ts` which was deleted in commit `f40f412` (Apr 25).

Change:
```
 * Provides generic read/write/prune utilities used by respond-runs.ts, recovery.ts,
 * and any future module that manages a JSON file containing an array of run/session entries.
```

To:
```
 * Provides generic read/write utilities used by recovery.ts
 * and any future module that manages a JSON file containing an array of run/session entries.
```

### 6b. Remove stale `DEFAULT_LIMIT` import

After Phase 4, check if any route files still import `DEFAULT_LIMIT` from `@/lib/validations`. Routes migrated to `parsePaginationParams` no longer need it.

### 6c. Remove unused `fs` imports

After Phase 3 removes inline `readJSON`/`writeJSON`, several route files may have orphaned `import { existsSync, readFileSync } from "fs"` if those were the only fs consumers. Remove them.

**Phase 6 total: ~-12 LOC**

---

## Summary

| Phase | Description | LOC change | Risk |
|---|---|---|---|
| 1 | Dead code deletion | **-186** | None |
| 2 | Create shared modules | **+24** | None |
| 3 | Inline dedup migration | **-95** | Low |
| 4 | Pagination consolidation | **-63** | Medium |
| 5 | Component dedup | **-55** | Low |
| 6 | Stale artifacts | **-12** | None |
| **Total** | | **~-387 LOC** | |

## Not In Scope

These were evaluated and intentionally excluded:

- **`scripts/daemon/data-io.ts`** — Different contract (workspace-scoped). Not redundant with `json-io.ts`.
- **`scripts/daemon/prompt-builder.ts` `readJSON`** — Throwing variant, intentional for daemon scripts that must have files present.
- **`scripts/generate-context.ts`** — Async `readFile`, different from sync `readJSON`. Not redundant.
- **`security.ts` → `validatePathWithinWorkspace`** — Defensive code with full test coverage. Keep for future path-traversal protection.
- **`security.ts` → `escapeFenceContent`** — Called by `fenceTaskData`, which is imported by 2 daemon scripts. Not dead.
- **`lib/paginate.ts` expansion** — Already sufficient. No API changes needed.
- **Hooks** — All 19 hooks actively used, no duplication.
- **UI primitives (shadcn)** — Third-party wrappers, all heavily imported. Intentionally excluded from wiki.

## Verification

After each phase:
```bash
npx tsc --noEmit          # Type safety
pnpm build                # Next.js build
pnpm test                 # Vitest suite
```

After all phases:
```bash
# Confirm no orphaned readJSON/writeJSON/isProcessAlive
grep -rn "^function readJSON\|^function writeJSON\|^function isProcessAlive\|^function isProcessRunning" src/app/
# Confirm no manual pagination left
grep -rn "limitParam\|offsetParam" src/app/api/ | grep -v node_modules | grep -v paginate
# Confirm eisenhower-summary gone
find src/ -name "eisenhower-summary*"
```
