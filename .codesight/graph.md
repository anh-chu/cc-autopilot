# Dependency Graph

## Most Imported Files (change these carefully)

- `src/lib/types.ts` — imported by **32** files
- `src/lib/paths.ts` — imported by **24** files
- `src/lib/utils.ts` — imported by **24** files
- `src/hooks/use-data.ts` — imported by **11** files
- `scripts/daemon/logger.ts` — imported by **10** files
- `src/lib/api-client.ts` — imported by **10** files
- `__tests__/helpers.ts` — imported by **9** files
- `src/lib/toast.ts` — imported by **7** files
- `scripts/daemon/security.ts` — imported by **6** files
- `src/lib/workspace-store.ts` — imported by **6** files
- `src/components/task-form.tsx` — imported by **6** files
- `src/providers/active-runs-provider.tsx` — imported by **6** files
- `scripts/daemon/config.ts` — imported by **5** files
- `src/lib/logger.ts` — imported by **5** files
- `scripts/daemon/runner.ts` — imported by **5** files
- `src/components/breadcrumb-nav.tsx` — imported by **5** files
- `src/components/create-task-dialog.tsx` — imported by **5** files
- `src/components/error-state.tsx` — imported by **5** files
- `src/lib/agent-icons.ts` — imported by **5** files
- `src/lib/data.ts` — imported by **4** files

## Import Map (who imports what)

- `src/lib/types.ts` ← `__tests__/conversation-event-bus.test.ts`, `__tests__/data.test.ts`, `scripts/daemon/run-task.ts`, `src/app/page.tsx`, `src/app/page.tsx` +27 more
- `src/lib/paths.ts` ← `__tests__/api-projects-stop-conversation.test.ts`, `__tests__/api-tasks-stop-conversation.test.ts`, `__tests__/daemon-multi-workspace.test.ts`, `__tests__/seeding.test.ts`, `bin/cli.ts` +19 more
- `src/lib/utils.ts` ← `src/app/page.tsx`, `src/components/agent-form.tsx`, `src/components/board-view.tsx`, `src/components/breadcrumb-nav.tsx`, `src/components/command-bar.tsx` +19 more
- `src/hooks/use-data.ts` ← `src/app/page.tsx`, `src/components/autopilot-page.tsx`, `src/components/command-form.tsx`, `src/components/home-activity.tsx`, `src/components/home-inbox.tsx` +6 more
- `scripts/daemon/logger.ts` ← `scripts/daemon/config.ts`, `scripts/daemon/conversation-writer.ts`, `scripts/daemon/prompt-builder.ts`, `scripts/daemon/run-brain-dump-triage.ts`, `scripts/daemon/run-conversation.ts` +5 more
- `src/lib/api-client.ts` ← `src/app/page.tsx`, `src/components/autopilot-page.tsx`, `src/components/decision-dialog.tsx`, `src/components/home-logs.tsx`, `src/components/layout-shell.tsx` +5 more
- `__tests__/helpers.ts` ← `__tests__/api-conversations-flow.test.ts`, `__tests__/api-projects-stop-conversation.test.ts`, `__tests__/api-tasks-stop-conversation.test.ts`, `__tests__/conversation-event-bus.test.ts`, `__tests__/conversation-writer.test.ts` +4 more
- `src/lib/toast.ts` ← `src/app/page.tsx`, `src/components/decision-dialog.tsx`, `src/components/home-activity.tsx`, `src/components/layout-shell.tsx`, `src/hooks/use-active-runs.ts` +2 more
- `scripts/daemon/security.ts` ← `__tests__/security.test.ts`, `__tests__/security.test.ts`, `scripts/daemon/prompt-builder.ts`, `scripts/daemon/run-task-comment.ts`, `scripts/daemon/runner.ts` +1 more
- `src/lib/workspace-store.ts` ← `scripts/daemon/run-task-comment.ts`, `scripts/daemon/run-task.ts`, `src/lib/conversations.ts`, `src/lib/data.ts`, `src/lib/scheduled-jobs.ts` +1 more
