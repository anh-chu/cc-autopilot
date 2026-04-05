<p align="center">
  <img src="https://img.shields.io/badge/version-0.11-blue" alt="Version" />&nbsp;
  <img src="https://img.shields.io/github/license/MeisnerDan/mission-control" alt="License" />
</p>

<p align="center">
  <img src="mission-control/docs/rocket.svg" alt="Task Control Rocket" width="80" />
</p>

<h1 align="center">Task Control</h1>

<p align="center">
  <strong>Orchestrate AI agents. Ship what matters.</strong><br/>
  Open-source task orchestration hub for humans who delegate work to AI agents.<br/>
  <em>Forked from <a href="https://github.com/MeisnerDan/mission-control">Mission Control</a> with real-time streaming, multi-CLI support, and a general-purpose rebrand.</em>
</p>

<p align="center"><img src="mission-control/docs/demo.gif" alt="Task Control Demo" width="800" /></p>

<div align="center">
<br/>

**Capture** &middot; &middot; &middot; **Prioritize** &middot; &middot; &middot; **Delegate** &middot; &middot; &middot; **Execute** &middot; &middot; &middot; **Review**

You capture an idea. Agents research, build, and deliver.<br/>
You review their work and make the decisions that matter.<br/><br/>
**They write the code, post the updates, call the APIs,<br/>and keep things running.**<br/>
You stay in control without micromanaging.

<br/>
</div>

---

## What's New in This Fork

This fork adds three major features on top of the original Mission Control:

### 1. Real-Time Agent Streaming

See what your agents are doing **live**, not after the fact.

- **Live Console** -- expand any active session on the Automation page to watch agent output stream in real time (tool calls, responses, progress)
- **Server-Sent Events** -- `GET /api/runs/stream?runId=X` tails the agent's `.jsonl` stream file and pushes events to the browser
- **Stream-JSON output** -- the daemon now uses `--output-format stream-json` instead of `json`, writing each event to `data/agent-streams/<runId>.jsonl`
- **Auto-cleanup** -- stream files are pruned when completed runs expire (>1hr old)

### 2. @-Mention Agents in Comments

Tag any agent directly in a task comment to get their input.

- Type `@` in the comment box to see an autocomplete dropdown of available agents
- The mentioned agent receives the comment, reads the full task context, and responds with a new comment
- Works on **completed tasks** too -- if the agent determines rework is needed, it automatically reopens the task
- Agent responses appear inline in the comment thread with distinct styling (blue border + icon)
- Each mention spawns an independent agent session with live streaming support

### 3. Codex CLI Support (Optional)

Run agents on either **Claude Code** or **OpenAI Codex CLI**.

- Each agent has a `backend` field (`"claude"` or `"codex"`) configurable from the Agents UI
- The daemon auto-detects the correct binary (`claude` or `codex`) and spawns with appropriate flags
- Codex output is normalized to the same JSONL stream format for consistent live console display

### 4. General-Purpose Rebrand

Renamed from founder/startup-specific terminology to general-purpose labels:

| Before | After |
|--------|-------|
| Mission Control | Task Control |
| Command Center | Dashboard |
| Ventures | Projects |
| Brain Dump | Quick Capture |
| Autopilot | Automation |
| Crew | Agents |
| Field Ops | Integrations |
| Comms | Messages |

All route paths (`/ventures`, `/brain-dump`, etc.) are preserved for backwards compatibility.

---

## Why This Exists

AI agents are the greatest force multiplier you've ever had. But unleashing them without structure isn't leverage -- it's a liability. Credentials leak. Agents operate as black boxes. Nobody can tell you what's running, whether it finished, or if it went off the rails three hours ago.

**Task Control is the fenced playground where your AI agents can run wild -- but safely.** Agents get roles, inboxes, and reporting protocols. You capture ideas, agents research and execute, and Integrations launches actions into the world -- with approval workflows and spend limits at every step. You stay in control without micromanaging.

<table>
<tr>
<td align="center" width="25%">

**Prioritize**

Eisenhower matrix tells you what matters. Drag-and-drop tasks between Do, Schedule, Delegate, and Eliminate.

</td>
<td align="center" width="25%">

**Delegate**

Assign tasks to AI agents. They pick up work, execute, and post completion reports to your inbox.

</td>
<td align="center" width="25%">

**Supervise**

Dashboard, inbox, decisions queue. See every agent's workload, read their reports, answer their questions -- with live streaming.

</td>
<td align="center" width="25%">

**Execute**

Agents don't just manage tasks -- they execute real-world actions. Post to X, send ETH, call APIs. With approval workflows and spend limits.

</td>
</tr>
</table>

> **How is this different from Linear, Asana, or Notion?** Those tools were built for humans typing into forms. Task Control was built **agent-first** -- for a world where AI agents do the work and humans make the decisions. Agents read and write tasks through a token-optimized API, report progress to your inbox, and escalate when they need judgment. It runs locally -- no cloud dependency, no API keys leaked to third parties, no vendor lock-in.

---

## Features

### Core
- **Eisenhower Matrix** -- Prioritize by importance and urgency with drag-and-drop between quadrants
- **Kanban Board** -- Track work through Not Started, In Progress, and Done columns
- **Goal Hierarchy** -- Long-term goals with milestone tracking, progress bars, and linked tasks
- **Quick Capture** -- Capture ideas instantly, triage into tasks later
- **Agent Registry** -- 6 built-in agents + create unlimited custom agents with unique instructions
- **Skills Library** -- Define reusable knowledge modules and inject them into agent prompts
- **Multi-Agent Tasks** -- Assign a lead agent + collaborators for team-based work

### Agent Execution
- **Real-Time Streaming** -- Live console shows agent tool calls, responses, and progress as they happen
- **@-Mention in Comments** -- Tag agents in task comments to get their input; agents can reply or reopen tasks
- **Multi-CLI Backend** -- Run agents on Claude Code or OpenAI Codex CLI (per-agent configurable)
- **One-Click Execution** -- Press play on any task card to spawn an agent session
- **Autonomous Daemon** -- Background process that polls tasks, spawns sessions, enforces concurrency, with real-time dashboard
- **Session Resilience** -- Agents that timeout or hit max turns auto-spawn continuation sessions
- **Continuous Missions** -- Run an entire project with one click; tasks auto-dispatch as others complete
- **Loop Detection** -- Auto-detects agents stuck in failure loops; escalates after 3 attempts

### Monitoring & Safety
- **Cost & Usage Tracking** -- Full token usage (input, output, cache) from every session
- **Live Session Console** -- Expandable live output view for each active session on the Automation page
- **SSE Stream API** -- `GET /api/runs/stream?runId=X` for programmatic access to live agent output
- **Failure Logging** -- Failed tasks generate events with error details, posted to inbox
- **Token-Optimized API** -- Filtered queries, sparse field selection, 92% context compression
- **193 Automated Tests** -- Vitest suite covering validation, data layer, daemon, agent flow, and security

### Integrations (Field Ops)
- **64-Service Catalog** -- Pre-configured services across 16 categories
- **3 Working Adapters** -- X, Ethereum (+ MetaMask wallet signing), Reddit
- **Encrypted Vault** -- AES-256-GCM encryption with scrypt key derivation
- **Financial Safety Controls** -- Per-service + global spend limits, circuit breaker
- **Approval Workflows** -- Risk classification + approval queue for high-risk actions
- **Emergency Stop** -- Kill switch that halts daemon, pauses missions, and locks the vault

---

## Quick Start

### Prerequisites

| Requirement | Why | Install |
|-------------|-----|---------|
| [Node.js](https://nodejs.org) v20+ | Runtime | [nodejs.org](https://nodejs.org) |
| [pnpm](https://pnpm.io) v9+ | Package manager | `npm install -g pnpm` |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) *(recommended)* | Agent execution | `npm install -g @anthropic-ai/claude-code` |
| [Codex CLI](https://github.com/openai/codex) *(optional)* | Alternative agent backend | `npm install -g @openai/codex` |

> The web UI works standalone for task management. Claude Code or Codex CLI is needed to **execute** tasks via agents.

### Install & Run

```bash
git clone https://github.com/anh-chu/claude-mission-control.git
cd claude-mission-control/mission-control
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Load Demo Data"** to explore with sample tasks, agents, and messages.

### What to Try First

1. **Explore the dashboard** -- task counts, agent workloads, recent activity
2. **Drag tasks** on the Priority Matrix between Do, Schedule, Delegate, and Eliminate
3. **Click a task card** to open the detail panel -- edit, add subtasks, or `@mention` an agent in comments
4. **Press the Launch button** on a task assigned to an agent -- watch the live console on the Automation page
5. **Open Claude Code** in this workspace and run `/daily-plan`

---

## How It Works

Task Control stores all data in local JSON files. No database, no cloud dependency. AI agents interact by reading and writing these files -- the same source of truth the web UI uses.

### The Agent Loop

```
1. You create a task          -->  Assign to an agent role (e.g., Researcher)
2. Press play (or daemon)     -->  Spawns a CLI session with agent persona
3. Agent executes             -->  Does the work, streams output live
4. Task Control completes     -->  Auto-marks done, posts report, logs activity
5. You review                 -->  Read reports in inbox, @mention agents for follow-up
```

Multiple agents can work in parallel. **Continuous missions** run all tasks in a project until done, auto-dispatching as dependencies resolve. The **daemon** (`pnpm daemon:start`) adds 24/7 background automation.

### @-Mention Flow

```
1. You comment "@researcher check the API docs"
2. Task Control parses the mention, validates the agent exists
3. Spawns a dedicated agent session with task context + your comment
4. Agent reads the task, your comment, and responds
5. Response appears as a new comment (with live streaming)
6. If the agent did work on a "done" task, it reopens automatically
```

---

## Agent API

Every endpoint is designed for minimal token consumption.

```bash
# Get only your in-progress tasks (~50 tokens vs ~5,400 for everything)
GET /api/tasks?assignedTo=developer&kanban=in-progress&fields=id,title,kanban

# Eisenhower DO quadrant only
GET /api/tasks?quadrant=do

# Live agent stream (Server-Sent Events)
GET /api/runs/stream?runId=run_123

# Post a comment with @-mention (spawns agent handler)
POST /api/tasks/:id/comment  { "content": "@researcher check this", "author": "me" }

# Run a single task
POST /api/tasks/:id/run

# Run all eligible tasks in a project
POST /api/projects/:id/run

# Stop a running task or project
POST /api/tasks/:id/stop
POST /api/projects/:id/stop
```

### Integrations API
```bash
POST /api/field-ops/execute          # Execute a field task
POST /api/field-ops/vault/setup      # Initialize encrypted vault
GET  /api/field-ops/catalog          # Browse 64-service catalog
POST /api/field-ops/batch            # Bulk approve/reject up to 50 tasks
```

All write endpoints use **Zod validation** and **async-mutex locking** for concurrent safety.

---

## Built-In Agents

| Role | Handles | Backend |
|------|---------|---------|
| **Me** | Decisions, approvals, creative direction | -- |
| **Researcher** | Market research, competitive analysis, evaluation | Claude / Codex |
| **Developer** | Code, bug fixes, testing, deployment | Claude / Codex |
| **Marketer** | Copy, growth strategy, content, SEO | Claude / Codex |
| **Business Analyst** | Strategy, planning, prioritization, financials | Claude / Codex |
| **Tester** | QA testing, bug reporting, performance analysis | Claude / Codex |
| **+ Custom** | Anything you define | Claude / Codex |

Each agent's backend (Claude Code or Codex CLI) is configurable from the Agents page.

---

## Architecture

```
mission-control/                 Next.js 15 web app
mission-control/data/            JSON data files (shared source of truth)
  tasks.json                     Tasks with Eisenhower + Kanban + agent assignment
  agents.json                    Agent registry (profiles, instructions, backend)
  agent-streams/                 Live JSONL stream files per active run
  goals.json                     Long-term goals and milestones
  projects.json                  Projects with team members
  inbox.json                     Agent <-> human messages
  decisions.json                 Pending decisions requiring human judgment
  activity-log.json              Timestamped event log
  ai-context.md                  Generated ~650-token workspace snapshot
  daemon-config.json             Daemon config (schedule, concurrency)
  active-runs.json               Live execution tracking (status, PIDs, streams)
  field-ops/                     Integrations data (services, vault, safety)
mission-control/scripts/daemon/  Agent daemon + execution scripts
  runner.ts                      CLI runner (Claude Code + Codex CLI)
  run-task.ts                    Task execution with streaming
  run-task-comment.ts            @-mention comment handler
mission-control/src/             Next.js app source
  components/agent-console.tsx   Live streaming console component
  components/mention-textarea.tsx @-mention autocomplete + highlighting
  hooks/use-agent-stream.ts      SSE hook for live agent output
  app/api/runs/stream/           SSE endpoint for agent streaming
  app/api/tasks/[id]/comment/    Comment + @-mention API
```

### Design Decisions

- **Local-first** -- No database, no cloud, no API keys. Plain JSON files on your machine.
- **Multi-CLI** -- Claude Code and Codex CLI as interchangeable agent backends.
- **Stream-first** -- All agent output is captured as JSONL and available via SSE for live monitoring.
- **Zod + Mutex** -- All API writes validated and serialized for concurrent multi-agent safety.
- **Defense in Depth** -- Encrypted vault, spend limits, autonomy levels, approval workflows, and master-password-protected safety controls.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| Validation | [Zod](https://zod.dev) |
| Testing | [Vitest](https://vitest.dev) (193 tests) |
| Storage | Local JSON files (no database) |
| Agent CLIs | [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex) |

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run all 193 tests
pnpm verify           # Typecheck + lint + build + test
pnpm daemon:start     # Start autonomous daemon
pnpm daemon:stop      # Stop daemon
pnpm daemon:status    # Show daemon status
pnpm gen:context      # Regenerate ai-context.md
```

---

## Credits

Forked from [Mission Control](https://github.com/MeisnerDan/mission-control) by Dan Meisner. Original concept: an open-source command center for solo entrepreneurs delegating work to AI agents.

This fork generalizes the tool for any user orchestrating AI agent workflows, adds real-time streaming, multi-CLI support, and @-mention agent interactions.

---

## License

[AGPL-3.0](LICENSE) -- free to use, modify, and self-host. If you offer it as a hosted service, you must open-source your modifications under the same license.

---

<p align="center">
  <sub><strong>Orchestrate AI agents. Ship what matters.</strong></sub>
</p>
