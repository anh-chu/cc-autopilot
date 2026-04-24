# Route

> **Navigation aid.** Route list and file locations extracted via AST. Read the source files listed below before implementing or modifying this subsystem.

The Route subsystem handles **100 routes** and touches: cache, auth, queue, ai.

## Routes

- `GET` `/api/activity-log` → out: { data, events, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/activity-log/route.ts`
- `POST` `/api/activity-log` → out: { data, events, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/activity-log/route.ts`
- `DELETE` `/api/activity-log` → out: { data, events, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/activity-log/route.ts`
- `GET` `/api/agents` → out: { data, agents, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/agents/route.ts`
- `POST` `/api/agents` → out: { data, agents, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/agents/route.ts`
- `PUT` `/api/agents` → out: { data, agents, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/agents/route.ts`
- `DELETE` `/api/agents` → out: { data, agents, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/agents/route.ts`
- `POST` `/api/brain-dump/automate` → out: { error }
  `src/app/api/brain-dump/automate/route.ts`
- `GET` `/api/brain-dump` → out: { data, entries, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/brain-dump/route.ts`
- `POST` `/api/brain-dump` → out: { data, entries, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/brain-dump/route.ts`
- `PUT` `/api/brain-dump` → out: { data, entries, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/brain-dump/route.ts`
- `DELETE` `/api/brain-dump` → out: { data, entries, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/brain-dump/route.ts`
- `GET` `/api/checkpoints/export` → out: { error }
  `src/app/api/checkpoints/export/route.ts`
- `POST` `/api/checkpoints/import` → out: { error }
  `src/app/api/checkpoints/import/route.ts`
- `POST` `/api/checkpoints/load` → out: { error }
  `src/app/api/checkpoints/load/route.ts`
- `POST` `/api/checkpoints/new` → out: { ok }
  `src/app/api/checkpoints/new/route.ts`
- `GET` `/api/checkpoints` → out: { error, details }
  `src/app/api/checkpoints/route.ts`
- `POST` `/api/checkpoints` → out: { error, details }
  `src/app/api/checkpoints/route.ts`
- `DELETE` `/api/checkpoints` → out: { error, details }
  `src/app/api/checkpoints/route.ts`
- `GET` `/api/daemon` → out: { status, config, isRunning } [auth]
  `src/app/api/daemon/route.ts`
- `POST` `/api/daemon` → out: { status, config, isRunning } [auth]
  `src/app/api/daemon/route.ts`
- `PUT` `/api/daemon` → out: { status, config, isRunning } [auth]
  `src/app/api/daemon/route.ts`
- `GET` `/api/dashboard` [cache]
  `src/app/api/dashboard/route.ts`
- `GET` `/api/decisions` → out: { data, decisions, meta, filtered, returned, limit, offset } [cache, queue]
  `src/app/api/decisions/route.ts`
- `POST` `/api/decisions` → out: { data, decisions, meta, filtered, returned, limit, offset } [cache, queue]
  `src/app/api/decisions/route.ts`
- `PUT` `/api/decisions` → out: { data, decisions, meta, filtered, returned, limit, offset } [cache, queue]
  `src/app/api/decisions/route.ts`
- `DELETE` `/api/decisions` → out: { data, decisions, meta, filtered, returned, limit, offset } [cache, queue]
  `src/app/api/decisions/route.ts`
- `POST` `/api/emergency-stop` → out: { ok, results }
  `src/app/api/emergency-stop/route.ts`
- `GET` `/api/goals` → out: { data, goals, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/goals/route.ts`
- `POST` `/api/goals` → out: { data, goals, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/goals/route.ts`
- `PUT` `/api/goals` → out: { data, goals, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/goals/route.ts`
- `DELETE` `/api/goals` → out: { data, goals, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/goals/route.ts`
- `POST` `/api/inbox/respond` → out: { error }
  `src/app/api/inbox/respond/route.ts`
- `GET` `/api/inbox/respond/status` → out: { runs }
  `src/app/api/inbox/respond/status/route.ts`
- `POST` `/api/inbox/respond/stop` → out: { error }
  `src/app/api/inbox/respond/stop/route.ts`
- `GET` `/api/inbox` → out: { data, messages, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/inbox/route.ts`
- `POST` `/api/inbox` → out: { data, messages, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/inbox/route.ts`
- `PUT` `/api/inbox` → out: { data, messages, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/inbox/route.ts`
- `DELETE` `/api/inbox` → out: { data, messages, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/inbox/route.ts`
- `GET` `/api/initiatives` → out: { data, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/initiatives/route.ts`
- `POST` `/api/initiatives` → out: { data, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/initiatives/route.ts`
- `PUT` `/api/initiatives` → out: { data, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/initiatives/route.ts`
- `DELETE` `/api/initiatives` → out: { data, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/initiatives/route.ts`
- `GET` `/api/logs/app` → out: { lines, error }
  `src/app/api/logs/app/route.ts`
- `GET` `/api/logs/daemon` → out: { lines, error }
  `src/app/api/logs/daemon/route.ts`
- `GET` `/api/logs/stream` [cache, queue]
  `src/app/api/logs/stream/route.ts`
- `GET` `/api/missions` → out: { missions }
  `src/app/api/missions/route.ts`
- `POST` `/api/projects/[id]/run` params(id) → out: { error, missionId } [queue]
  `src/app/api/projects/[id]/run/route.ts`
- `POST` `/api/projects/[id]/stop` params(id) → out: { error }
  `src/app/api/projects/[id]/stop/route.ts`
- `GET` `/api/projects` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/projects/route.ts`
- `POST` `/api/projects` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/projects/route.ts`
- `PUT` `/api/projects` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/projects/route.ts`
- `DELETE` `/api/projects` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/projects/route.ts`
- `GET` `/api/runs`
  `src/app/api/runs/route.ts`
- `GET` `/api/runs/stream` [cache, queue]
  `src/app/api/runs/stream/route.ts`
- `GET` `/api/server-status` → out: { mode, uptimeSeconds, pid }
  `src/app/api/server-status/route.ts`
- `GET` `/api/sidebar` → out: { tasks, unreadInbox, pendingDecisions, agents } [cache]
  `src/app/api/sidebar/route.ts`
- `GET` `/api/skills` → out: { data, skills, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/skills/route.ts`
- `POST` `/api/skills` → out: { data, skills, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/skills/route.ts`
- `PUT` `/api/skills` → out: { data, skills, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/skills/route.ts`
- `DELETE` `/api/skills` → out: { data, skills, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/skills/route.ts`
- `POST` `/api/sync` → out: { ok, message } [ai]
  `src/app/api/sync/route.ts`
- `POST` `/api/tasks/[id]/comment` params(id) → out: { error } [auth, upload]
  `src/app/api/tasks/[id]/comment/route.ts`
- `DELETE` `/api/tasks/[id]/comment` params(id) → out: { error } [auth, upload]
  `src/app/api/tasks/[id]/comment/route.ts`
- `POST` `/api/tasks/[id]/run` params(id) → out: { error }
  `src/app/api/tasks/[id]/run/route.ts`
- `POST` `/api/tasks/[id]/stop` params(id) → out: { error }
  `src/app/api/tasks/[id]/stop/route.ts`
- `GET` `/api/tasks/archive` → out: { data, tasks, archived, meta, filtered }
  `src/app/api/tasks/archive/route.ts`
- `POST` `/api/tasks/archive` → out: { data, tasks, archived, meta, filtered }
  `src/app/api/tasks/archive/route.ts`
- `PUT` `/api/tasks/bulk` → out: { error }
  `src/app/api/tasks/bulk/route.ts`
- `DELETE` `/api/tasks/bulk` → out: { error }
  `src/app/api/tasks/bulk/route.ts`
- `GET` `/api/tasks` → out: { data, tasks, meta } [cache]
  `src/app/api/tasks/route.ts`
- `POST` `/api/tasks` → out: { data, tasks, meta } [cache]
  `src/app/api/tasks/route.ts`
- `PUT` `/api/tasks` → out: { data, tasks, meta } [cache]
  `src/app/api/tasks/route.ts`
- `DELETE` `/api/tasks` → out: { data, tasks, meta } [cache]
  `src/app/api/tasks/route.ts`
- `POST` `/api/upload` → out: { error } [upload]
  `src/app/api/upload/route.ts`
- `POST` `/api/ventures/[id]/run` params(id) → out: { error, missionId } [queue]
  `src/app/api/ventures/[id]/run/route.ts`
- `POST` `/api/ventures/[id]/stop` params(id) → out: { error }
  `src/app/api/ventures/[id]/stop/route.ts`
- `GET` `/api/ventures` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/ventures/route.ts`
- `POST` `/api/ventures` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/ventures/route.ts`
- `PUT` `/api/ventures` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/ventures/route.ts`
- `DELETE` `/api/ventures` → out: { data, projects, meta, filtered, returned, limit, offset } [cache]
  `src/app/api/ventures/route.ts`
- `GET` `/api/wiki/content` → out: { error }
  `src/app/api/wiki/content/route.ts`
- `PUT` `/api/wiki/content` → out: { error }
  `src/app/api/wiki/content/route.ts`
- `GET` `/api/wiki/file` → out: { error } [cache]
  `src/app/api/wiki/file/route.ts`
- `POST` `/api/wiki/folder` → out: { error }
  `src/app/api/wiki/folder/route.ts`
- `POST` `/api/wiki/generate` → out: { runId, pid, workspaceId, startedAt }
  `src/app/api/wiki/generate/route.ts`
- `POST` `/api/wiki/init` → out: { error }
  `src/app/api/wiki/init/route.ts`
- `POST` `/api/wiki/move` → out: { error }
  `src/app/api/wiki/move/route.ts`
- `GET` `/api/wiki/prompt` → out: { content, isDefault }
  `src/app/api/wiki/prompt/route.ts`
- `PUT` `/api/wiki/prompt` → out: { content, isDefault }
  `src/app/api/wiki/prompt/route.ts`
- `GET` `/api/wiki` → out: { error }
  `src/app/api/wiki/route.ts`
- `DELETE` `/api/wiki` → out: { error }
  `src/app/api/wiki/route.ts`
- `GET` `/api/wiki/run-stream` → out: { error }
  `src/app/api/wiki/run-stream/route.ts`
- `GET` `/api/wiki/runs` → out: { runs }
  `src/app/api/wiki/runs/route.ts`
- `POST` `/api/wiki/upload` → out: { error }
  `src/app/api/wiki/upload/route.ts`
- `GET` `/api/workspaces` → out: { error }
  `src/app/api/workspaces/route.ts`
- `POST` `/api/workspaces` → out: { error }
  `src/app/api/workspaces/route.ts`
- `PUT` `/api/workspaces` → out: { error }
  `src/app/api/workspaces/route.ts`
- `DELETE` `/api/workspaces` → out: { error }
  `src/app/api/workspaces/route.ts`
- `GET` `/uploads/[filename]` params(filename) → out: { error } [cache, upload]
  `src/app/uploads/[filename]/route.ts`

## Source Files

Read these before implementing or modifying this subsystem:
- `src/app/api/activity-log/route.ts`
- `src/app/api/agents/route.ts`
- `src/app/api/brain-dump/automate/route.ts`
- `src/app/api/brain-dump/route.ts`
- `src/app/api/checkpoints/export/route.ts`
- `src/app/api/checkpoints/import/route.ts`
- `src/app/api/checkpoints/load/route.ts`
- `src/app/api/checkpoints/new/route.ts`
- `src/app/api/checkpoints/route.ts`
- `src/app/api/daemon/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/emergency-stop/route.ts`
- `src/app/api/goals/route.ts`
- `src/app/api/inbox/respond/route.ts`
- `src/app/api/inbox/respond/status/route.ts`
- `src/app/api/inbox/respond/stop/route.ts`
- `src/app/api/inbox/route.ts`
- `src/app/api/initiatives/route.ts`
- `src/app/api/logs/app/route.ts`
- `src/app/api/logs/daemon/route.ts`
- `src/app/api/logs/stream/route.ts`
- `src/app/api/missions/route.ts`
- `src/app/api/projects/[id]/run/route.ts`
- `src/app/api/projects/[id]/stop/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/runs/route.ts`
- `src/app/api/runs/stream/route.ts`
- `src/app/api/server-status/route.ts`
- `src/app/api/sidebar/route.ts`
- `src/app/api/skills/route.ts`
- `src/app/api/sync/route.ts`
- `src/app/api/tasks/[id]/comment/route.ts`
- `src/app/api/tasks/[id]/run/route.ts`
- `src/app/api/tasks/[id]/stop/route.ts`
- `src/app/api/tasks/archive/route.ts`
- `src/app/api/tasks/bulk/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/ventures/[id]/run/route.ts`
- `src/app/api/ventures/[id]/stop/route.ts`
- `src/app/api/ventures/route.ts`
- `src/app/api/wiki/content/route.ts`
- `src/app/api/wiki/file/route.ts`
- `src/app/api/wiki/folder/route.ts`
- `src/app/api/wiki/generate/route.ts`
- `src/app/api/wiki/init/route.ts`
- `src/app/api/wiki/move/route.ts`
- `src/app/api/wiki/prompt/route.ts`
- `src/app/api/wiki/route.ts`
- `src/app/api/wiki/run-stream/route.ts`
- `src/app/api/wiki/runs/route.ts`
- `src/app/api/wiki/upload/route.ts`
- `src/app/api/workspaces/route.ts`
- `src/app/uploads/[filename]/route.ts`

---
_Back to [overview.md](./overview.md)_