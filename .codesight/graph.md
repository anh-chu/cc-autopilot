# Dependency Graph

## Most Imported Files (change these carefully)

- `src/lib/types.ts` — imported by **57** files
- `src/lib/utils.ts` — imported by **51** files
- `src/lib/paths.ts` — imported by **40** files
- `src/components/ui/button.tsx` — imported by **36** files
- `src/components/breadcrumb-nav.tsx` — imported by **24** files
- `src/components/ui/badge.tsx` — imported by **24** files
- `src/lib/data.ts` — imported by **17** files
- `src/lib/workspace-context.ts` — imported by **16** files
- `src/hooks/use-data.ts` — imported by **14** files
- `scripts/daemon/logger.ts` — imported by **13** files
- `src/components/ui/input.tsx` — imported by **13** files
- `src/lib/api-client.ts` — imported by **13** files
- `src/components/ui/card.tsx` — imported by **12** files
- `src/components/ui/tip.tsx` — imported by **11** files
- `src/components/error-state.tsx` — imported by **9** files
- `src/lib/toast.ts` — imported by **9** files
- `src/components/skeletons.tsx` — imported by **9** files
- `src/components/ui/textarea.tsx` — imported by **9** files
- `src/providers/active-runs-provider.tsx` — imported by **8** files
- `scripts/daemon/security.ts` — imported by **7** files

## Import Map (who imports what)

- `src/lib/types.ts` ← `__tests__/data.test.ts`, `src/app/activity/page.tsx`, `src/app/api/activity-log/route.ts`, `src/app/api/agents/route.ts`, `src/app/api/brain-dump/route.ts` +52 more
- `src/lib/utils.ts` ← `src/app/api/activity-log/route.ts`, `src/app/api/brain-dump/route.ts`, `src/app/api/decisions/route.ts`, `src/app/api/inbox/route.ts`, `src/app/api/projects/route.ts` +46 more
- `src/lib/paths.ts` ← `scripts/cleanup-uploads.ts`, `scripts/daemon/config.ts`, `scripts/daemon/dispatcher.ts`, `scripts/daemon/health.ts`, `scripts/daemon/index.ts` +35 more
- `src/components/ui/button.tsx` ← `src/app/activity/page.tsx`, `src/app/autopilot/page.tsx`, `src/app/brain-dump/page.tsx`, `src/app/crew/[id]/edit/page.tsx`, `src/app/crew/[id]/page.tsx` +31 more
- `src/components/breadcrumb-nav.tsx` ← `src/app/activity/page.tsx`, `src/app/autopilot/page.tsx`, `src/app/brain-dump/loading.tsx`, `src/app/brain-dump/page.tsx`, `src/app/crew/[id]/edit/page.tsx` +19 more
- `src/components/ui/badge.tsx` ← `src/app/activity/page.tsx`, `src/app/autopilot/page.tsx`, `src/app/brain-dump/page.tsx`, `src/app/crew/[id]/page.tsx`, `src/app/crew/page.tsx` +19 more
- `src/lib/data.ts` ← `__tests__/seeding.test.ts`, `src/app/api/activity-log/route.ts`, `src/app/api/brain-dump/route.ts`, `src/app/api/daemon/route.ts`, `src/app/api/emergency-stop/route.ts` +12 more
- `src/lib/workspace-context.ts` ← `src/app/api/agents/route.ts`, `src/app/api/initiatives/route.ts`, `src/app/api/runs/stream/route.ts`, `src/app/api/sidebar/route.ts`, `src/app/api/tasks/[id]/comment/route.ts` +11 more
- `src/hooks/use-data.ts` ← `src/app/activity/page.tsx`, `src/app/brain-dump/page.tsx`, `src/app/crew/[id]/edit/page.tsx`, `src/app/crew/new/page.tsx`, `src/app/crew/page.tsx` +9 more
- `scripts/daemon/logger.ts` ← `scripts/daemon/config.ts`, `scripts/daemon/dispatcher.ts`, `scripts/daemon/health.ts`, `scripts/daemon/index.ts`, `scripts/daemon/prompt-builder.ts` +8 more
