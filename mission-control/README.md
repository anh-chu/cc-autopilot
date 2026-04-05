# Mission Control

**The command center for humans supervising AI agents.** Task management, agent orchestration, and external action execution. See the [main README](../README.md) for full documentation, features, and architecture.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Click **"Load Demo Data"** on the welcome screen to try it with sample tasks, agents, and messages.

### Platform-Specific Scripts

| Platform | Start | Stop |
|----------|-------|------|
| Windows | `start-mission-control.bat` | `stop-mission-control.bat` or Ctrl+C |
| Linux/macOS | `./start-mission-control.sh` | `./stop-mission-control.sh` or Ctrl+C |
| Any | `pnpm dev` | Ctrl+C |

### Troubleshooting

If port 3000 is stuck after a crash:
- **Windows:** Run `stop-mission-control.bat` (kills orphaned Node processes)
- **Linux/Mac:** Run `./stop-mission-control.sh` or `lsof -ti:3000 | xargs kill -9`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm tsc --noEmit` | TypeScript type check |
| `pnpm seed:demo` | Load sample demo data |
| `pnpm gen:context` | Generate AI context snapshot |
| `pnpm daemon:start` | Start autonomous agent daemon |
| `pnpm daemon:stop` | Stop daemon |

## Data Hierarchy

```
Workspace → Goals → Initiatives → Tasks + Actions
```

All data lives under `data/workspaces/{id}/`. The workspace registry is at `data/workspaces.json`.

## Project Structure

```
src/
  app/                    Pages and API routes (Next.js App Router)
    initiatives/          Initiative list and detail pages (inline editing)
    approvals/            Cross-initiative pending actions queue
    actions/activity/     Global actions activity log
    settings/             Workspace settings + autopilot config
    api/workspaces/       Workspace CRUD
    api/initiatives/      Initiative CRUD (workspace-scoped)
    api/actions/          Action CRUD (workspace-scoped)
    api/field-ops/        Field Ops execution (services, vault, execute)
  components/             React components (shadcn/ui + custom)
    autonomy-selector.tsx Shield button autonomy toggle (3 levels + inherit)
    workspace-switcher.tsx Workspace dropdown in sidebar header
    field-ops/            FieldTaskCard, VaultUnlockDialog, FinancialOverviewCard, etc.
  hooks/                  Custom hooks (SWR-based data fetching)
  lib/
    action-adapter.ts     Maps Action → FieldTask shape for FieldTaskCard
    autonomy.ts           3-tier autonomy cascade (action > initiative > workspace)
    workspace-context.ts  Reads x-workspace-id header in API routes
    adapters/             Service adapters (Twitter, Ethereum, Reddit)
data/
  workspaces.json         Workspace registry
  workspaces/{id}/        Per-workspace isolated data
    tasks.json            Tasks
    initiatives.json      Initiatives
    actions.json          Actions
    goals.json            Long-term goals
    agents.json           Agent registry
    inbox.json            Agent messages
    daemon-config.json    Per-workspace autopilot config
    field-ops/            Services, vault, safety
```

## Claude Code Integration

Mission Control is designed to work with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Agents operate by reading and writing the JSON data files under `data/workspaces/`. See [CLAUDE.md](../CLAUDE.md) for the full agent operations manual, including data schemas, communication protocols, and slash commands.

## License

[MIT](../LICENSE)
