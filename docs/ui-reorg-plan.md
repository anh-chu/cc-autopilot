# Mandio UI Reorganization Plan

Status: **complete** (2026-05-08)
Author: working session, 2026-05-08
Companion artifacts:
- `docs/ui-map.md` — current state inventory
- `docs/ui-proposal.html` — visual before/after

---

## Findings recap

Three audit passes produced a coherent set of fixes.

| # | Hurdle | Status |
|---|---|---|
| 1 | Naming fractured across nav / route / title | ✅ fixed — `/work`, `/brain`, `/crew`, `/ops` unified |
| 2 | "Map" exists in two places (Work tab + `/map` route) | ✅ fixed — `/map` → `/work` redirect |
| 3 | Same item visible in 3+ places (runs) | ✅ fixed — RunsFeed + `/api/runs` as single source |
| 4 | Task launch fragmented (5 entry points) | ✅ partial — runs now visible in one place; launch entry points unchanged |
| 5 | Logs / Ops mixed into user dashboard | ✅ fixed — Logs tab removed from Home, lives only in `/ops` |
| 6 | Skills / Plugins / Commands buried 3 levels deep | ⏸ deferred — Skills remain under `/crew`, Plugins/Commands consolidation not done |
| 7 | Documents init has 2 buttons, first-run guess | ⚠️ partial — empty state has 1 CTA, but footer still shows a second init button when tree is empty |
| 8 | Filters reinvented per page | ✅ fixed — shared `FilterBar` component wired into Work + Activity |
| 9 | Settings mixes global + workspace scope silently | ✅ fixed — `ScopeBadge`, section headings, `/settings/workspaces` split |
| 10 | Workspace creation in TopNav, deletion in Settings — asymmetric | ✅ fixed — `/settings/workspaces` has both New + Delete; TopNav shortcut kept |

---

## Phase statuses

### Phase 0 — Settings scope badges ✅
- `ScopeBadge` component, Global/Workspace section headings in `settings/page.tsx`
- Autopilot badged Workspace (matching storage intent)
- Commit: `95faeb1`

### Phase 1 — Renames & redirects ✅
- `/priority-matrix` → `/work`, `/documents` → `/brain`, `/map` → `/work`
- `/initiatives`, `/projects` → `/work`
- `/logs` → `/ops?tab=logs`, `/autopilot` → `/ops?tab=autopilot`
- Nav: Work / Brain / Crew / Ops. Breadcrumbs synced.
- Stale internal links fixed (search-dialog, layout-shell, keyboard-shortcuts)
- Commits: `86e247d`, `a8ec3db`, `0ec0acf`

### Phase 1.5a — Daemon API workspace context ✅
- `/api/daemon/route.ts` calls `applyWorkspaceContext()` in GET/POST/PUT
- POST run-command spawn passes `MANDIO_WORKSPACE_ID` in child env
- Commit: `f5ecffd`

### Phase 1.5b — `loadConfig()` env default ✅
- `loadConfig()` and `saveConfig()` default to `process.env.MANDIO_WORKSPACE_ID ?? "default"`
- Covers `runner.ts:91` and `run-task.ts` call sites
- Commit: `f5ecffd`

### Phase 1.5c — Multi-workspace orchestrator loop ✅
- `enumerateWorkspaces()` helper in `src/lib/scheduled-jobs.ts`
- `runWorkspaceTick()` per-workspace; reads daemon-config directly (no module-global race)
- Global concurrency cap via `MANDIO_GLOBAL_MAX_PARALLEL_AGENTS` env (default 10)
- Per-workspace cap from `maxParallelAgents` config
- `setConversationsWorkspace("default")` TODO resolved — now uses `wsId`
- Note: orchestrator lives in `scheduled-jobs.ts`, not `runner.ts` (original assumption corrected)
- Commit: `50049b3`

### Phase 1.5d — UI honesty + workspace tombstone ✅
- Workspace deletion writes `workspaces/<id>/disabled` tombstone before removing directory
- `enumerateWorkspaces()` and `runWorkspaceTick()` both check tombstone (enumeration + re-check at dispatch time)
- Poller overlap guard: `autopilotTickRunning` flag prevents concurrent ticks
- PID-zero handling consistent between global count and recovery
- `use-daemon.ts` confirmed correct — workspace context flows via `x-workspace-id` cookie automatically
- Commits: `0d67817`, `32b4a45`

### Phase 1.5e — Supervisor per-workspace children ⏸ deferred (YAGNI)
- Revisit only if per-workspace poller loops prove CPU-heavy or cause isolation failures
- Process supervision (systemd/PM2/launchd) is an ops concern, out of scope for app code

### Phase 2a — `/ops` shell ✅
- `src/app/ops/page.tsx` with Logs / Autopilot / Runs tabs
- Reuses `HomeLogs` and `AutopilotPage` components
- Commit: `f4a3cab`

### Phase 2b — Brain rename ✅
- `src/app/brain/page.tsx` created (parity with documents page)
- `src/app/documents/page.tsx` deleted
- BreadcrumbNav already labelled "Brain"
- Commits: `f4a3cab`, `fe94682`

### Phase 2c — Settings split ✅
- `src/app/settings/workspaces/page.tsx` — workspace registry
- `src/app/settings/workspaces/[id]/page.tsx` — per-workspace settings (General, Env Vars, Danger Zone)
- `/settings` now shows only global cards (Appearance) + Autopilot (workspace-scoped) + Manage workspaces link
- Commit: `526fdb1`

### Phase 2d — FilterBar component ✅
- `src/components/filter-bar.tsx` — controlled, accessible (`aria-label` on input and selects)
- Commit: `bd3c727`, `0ec0acf`

### Phase 2e — FilterBar wired ✅
- Work (priority-matrix): replaces inline Project + Assignee selects
- Activity feed (`home-activity.tsx`): replaces inline search + actor + event-type controls
- Commit: `267365a`

### Phase 2 — Tab consolidation ✅
- Logs tab removed from Home (`src/app/page.tsx`)
- Autopilot tab removed from Crew (`src/app/crew/page.tsx`)
- Automation card "View Details" link updated to `/ops?tab=autopilot`
- Commits: `ea6f7fc`, `fe94682`

### Phase 2 — Plugins/Commands consolidation ⏸ not done
- Change summary proposed `/ops/plugins`, `/ops/commands` and flattening `/crew/skills` sub-tabs
- Skills still under `/crew?tab=skills` with sub-tabs
- Plugins and Commands still under `/crew?tab=skills`
- Not a 404 risk; no user-facing regression. Deferred.

### Phase 3a — `/api/runs` workspace-scoped + filtering ✅
- `applyWorkspaceContext()` added
- `?taskId=`, `?agentId=`, `?status=` (comma-separated) filters
- `GET /api/runs/[id]` with liveness reconciliation (matches list route)
- Commits: `050602b`, `0ec0acf`

### Phase 3b — `/ops/runs` live feed ✅
- `src/components/runs-feed.tsx` — polls every 10s, status badges, links, FilterBar
- Wired into `/ops` Runs tab
- Commit: `bd8b0b1`

### Phase 3c+d — Runs sections on task + agent detail ✅
- Task detail: collapsible Runs card, fetches `/api/runs?taskId=`
- Agent detail: Runs section, fetches `/api/runs?agentId=`
- Both: `AbortController` on unmount, `res.ok` guard, `AbortError` silent swallow
- Commit: `84fa4d4`, `99fa8a1`

### Phase 3 — ChatSidebar RunStore consumer ⏸ deferred
- ChatSidebar shows conversations, not runs directly
- Connection (conversation → task → runs) requires a lookup layer not yet built
- Low priority: task detail Runs tab already covers the main use case

### Phase 3 — Home Automation card ✅ (effectively)
- Card reads `daemonStatus.activeSessions` from `/api/daemon`
- `/api/daemon` now calls `applyWorkspaceContext()` so data is workspace-scoped
- No migration to raw `/api/runs` needed — current approach is correct

---

## Reviewer findings and fixes (post-implementation)

A full reviewer pass ran against all 21 commits. All bugs fixed:

| Finding | Severity | Commit |
|---|---|---|
| `/logs` redirect pointed to removed Home tab | Bug | `5347c46` |
| `/tasks` breadcrumb linked to non-existent page | Bug | `5347c46` |
| Tombstone only checked at enumeration, not dispatch | Bug | `5347c46` |
| Poller overlap — concurrent ticks possible | Bug | `32b4a45` |
| PID-zero inconsistent between count and recovery | Bug | `32b4a45` |
| Task/project run+stop APIs not workspace-scoped | Bug | `99fa8a1` |
| Runs fetch: no `res.ok`, no abort on unmount | Risk | `99fa8a1` |
| Stale internal nav links (search, shortcuts, layout) | Minor | `0ec0acf` |
| FilterBar missing `aria-label` | Minor | `0ec0acf` |
| `/api/runs/[id]` missing liveness reconciliation | Minor | `0ec0acf` |

---

## Known remainders

### Must fix (small)
- **Brain page dual-init button** (hurdle #7): `src/app/brain/page.tsx` footer shows a second "Initialize Wiki Plugin" button when the tree is empty. Empty state already has one primary CTA. Footer init button should be hidden when `!wikiInitialized` (show "Check for Updates" only after init).

### Deferred work
- **Plugins/Commands consolidation**: move to `/ops/plugins`, `/ops/commands`, flatten `/crew/skills` sub-tabs
- **ChatSidebar runs**: wire sidebar conversation view to show associated runs
- **Smoke test**: `__tests__/daemon-multi-workspace.test.ts` — verify workspace A poll toggle doesn't affect workspace B
- **`/work/tasks/[id]`** sub-routes: proposal was to nest task/project/initiative detail under `/work`, not implemented, not a regression

### Architectural concern (separate track)
- **`_currentWorkspaceId` module-global** in `src/lib/data.ts:54-59` is a concurrent-request race even for routes that call `applyWorkspaceContext()`. Long-term fix: pass `workspaceId` explicitly into data functions, or use `AsyncLocalStorage`. Tracked but out of scope for this reorganization.

---

## Open decisions — resolved

| # | Decision | Resolution |
|---|---|---|
| 1 | Brain vs Wiki vs Documents | **Brain** — breadcrumb already said it, route matched |
| 2 | `/ops` access — gated or always visible | **Always visible** — no developer mode toggle |
| 3 | TopNav "+ New workspace" shortcut | **Kept** — also available in `/settings/workspaces` for symmetry |
| 4 | Skills location | **`/crew/skills`** — user-facing config, not operator tooling |

---

## Proposed sitemap — final state

```
/ (Home)
├── Overview
├── Inbox            (brain dumps)
└── Activity         (user events only)

/work                (was /priority-matrix)
├── Matrix · Board · Map · List
└── (tasks/projects/initiatives detail still at own routes)

/brain               (was /documents)
└── tree + viewer

/crew
├── /crew (list)
├── /crew/[id]
└── /crew?tab=skills (Skills/Plugins/Commands — consolidation deferred)

/ops
├── Runs             (RunsFeed, workspace-scoped)
├── Logs             (HomeLogs)
└── Autopilot        (AutopilotPage, scheduler + commands)

/settings
├── Appearance       (global)
└── Autopilot        (workspace-scoped, active workspace)

/settings/workspaces
├── (list + New workspace)
└── [id]
    ├── General      (name, color)
    ├── Environment  (env vars)
    └── Danger zone  (delete)
```
