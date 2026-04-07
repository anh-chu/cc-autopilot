---
name: ship-feature
description: Ship a feature by running verification, committing, and updating task status
disable-model-invocation: true
---

Ship the feature: $ARGUMENTS

1. Read `$CMC_DATA_DIR/workspaces/<id>/ai-context.md` for a quick snapshot of current state
2. Read relevant task and milestone from `$CMC_DATA_DIR/workspaces/<id>/`
3. Run the test suite and fix any failures
4. Run typecheck (`pnpm tsc --noEmit`) and fix errors
5. Run lint (`pnpm lint`) and fix issues
6. Create a git commit with a descriptive message
7. Update task status to `"done"` in `$CMC_DATA_DIR/workspaces/<id>/tasks.json`
8. Update milestone progress in `goals.json`
9. Run `pnpm gen:context` in `mission-control/` to regenerate the AI context
10. Report what was shipped and any remaining work

IMPORTANT: Do not skip any verification step. Every step must pass before shipping.
