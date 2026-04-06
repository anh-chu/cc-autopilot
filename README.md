<p align="center">
  <img src="https://img.shields.io/badge/version-0.15-blue" alt="Version" />&nbsp;
  <img src="https://img.shields.io/github/license/MeisnerDan/mission-control" alt="License" />
</p>

<p align="center">
  <img src="mission-control/docs/rocket.svg" alt="Task Control" width="80" />
</p>

<h1 align="center">Task Control</h1>

<p align="center"><strong>Break down work into tasks. Assign them to AI agents. Let them run.</strong></p>

<p align="center"><img src="mission-control/docs/demo.gif" alt="Task Control Demo" width="800" /></p>

---

Task Control is a self-hosted web app that lets you manage work and hand it off to AI agents. You add tasks, set priorities, and assign them to agents. A background daemon (Autopilot) picks them up, spawns Claude Code or Codex CLI sessions, and executes them autonomously. You review results, answer decisions, and approve anything that touches the real world.

Everything runs on your machine. Data lives in `~/.cmc/`. Nothing is sent to a cloud service.

---

## How Work Is Organized

```
Workspace
  └── Goals           (long-term outcomes)
        └── Initiatives (projects grouping related work)
              ├── Tasks   (cognitive/execution work — agents run these)
              └── Actions (real-world side-effects — require your approval)
```

**Tasks** are things agents do: write code, research, analyze, plan. They run as Claude Code or Codex CLI sessions and stream output live.

**Actions** are things agents trigger in the world: post to X, send ETH, call an API. These go through an approval queue before anything executes.

---

## Quick Start

**Prerequisites:** Node.js v20+, pnpm v9+, and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or [Codex CLI](https://github.com/openai/codex).

```bash
git clone https://github.com/anh-chu/cc-autopilot.git
cd cc-autopilot/mission-control
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Click **"Load Demo Data"** to explore with sample tasks and agents.

Your data is created at `~/.cmc/` on first launch, separate from the repo.

### Enable Autopilot

```bash
pnpm daemon:start
```

Or start it from **Settings > Autopilot** in the UI. Autopilot will automatically relaunch on server restart until you explicitly stop it.

---

## What Autopilot Does

- Polls for eligible tasks and spawns agent sessions up to your concurrency limit
- Streams agent output live to `~/.cmc/agent-streams/<id>.jsonl`
- Pauses when an agent needs a human decision; resumes automatically once you answer
- Retries failed tasks with exponential backoff
- On server restart: resets orphaned in-progress tasks; resumes interrupted Claude sessions via `--resume <sessionId>`

---

## Features

- **Eisenhower Matrix** + **Kanban Board** for prioritization and workflow
- **Real-time streaming** — watch agent output as it happens
- **Claude Code + Codex CLI** — configurable per agent
- **@-mentions in comments** — tag an agent; they read context and respond inline
- **Encrypted vault** — AES-256-GCM for credentials, session-locked
- **64-service catalog** with working adapters for X/Twitter, Ethereum, Reddit
- **Financial safety controls** — per-service and global spend limits, emergency stop
- **Cost + token tracking** per session and cumulative
- **Markdown descriptions** + **file attachments** on tasks and comments
- **Continuous missions** — run an entire project; tasks auto-dispatch as dependencies resolve

---

## Commands

Run from `mission-control/`:

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run tests
pnpm daemon:start     # Start Autopilot
pnpm daemon:stop      # Stop Autopilot
pnpm daemon:status    # Show status + active sessions
pnpm cleanup:uploads  # Remove orphaned files from ~/.cmc/uploads
```

---

## Built-In Agents

| Agent | Handles |
|-------|---------|
| Me | Decisions, approvals, creative direction |
| Researcher | Market research, competitive analysis |
| Developer | Code, bug fixes, testing, deployment |
| Marketer | Copy, growth strategy, content |
| Business Analyst | Strategy, planning, financials |

Custom agents with unique instructions and tool access can be added from the Agents page.

---

## Stack

Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Zod, Vitest. Local JSON storage in `~/.cmc/`.

---

## Credits

Built on [Mission Control](https://github.com/MeisnerDan/mission-control) by Dan Meisner.

## License

[AGPL-3.0](LICENSE): free to use, modify, and self-host. If you offer it as a hosted service, you must open-source your modifications under the same license.
