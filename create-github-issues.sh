#!/bin/bash
# Mission Control — Create GitHub Issues (Safe Community Issues Only)
# Run this from anywhere. Requires: gh CLI authenticated (run `gh auth login` first)
# Usage: bash create-github-issues.sh

REPO="MeisnerDan/mission-control"

echo "Creating labels..."
gh label create "ui" --repo "$REPO" --color "5319e7" --description "User interface and visual improvements" 2>/dev/null
gh label create "clipboard" --repo "$REPO" --color "d4c5f9" --description "Clipboard functionality" 2>/dev/null
gh label create "responsive" --repo "$REPO" --color "c2e0c6" --description "Mobile and responsive design" 2>/dev/null
gh label create "mobile" --repo "$REPO" --color "bfe5bf" --description "Mobile-specific improvements" 2>/dev/null
gh label create "accessibility" --repo "$REPO" --color "0075ca" --description "Accessibility (WCAG, keyboard, screen readers)" 2>/dev/null
gh label create "docker" --repo "$REPO" --color "0075ca" --description "Docker and containerization" 2>/dev/null
gh label create "devops" --repo "$REPO" --color "006b75" --description "DevOps and infrastructure" 2>/dev/null
gh label create "setup" --repo "$REPO" --color "c5def5" --description "Setup and installation" 2>/dev/null
gh label create "error-handling" --repo "$REPO" --color "d93f0b" --description "Error handling and resilience" 2>/dev/null
gh label create "onboarding" --repo "$REPO" --color "fbca04" --description "First-run experience and onboarding" 2>/dev/null
echo "Labels done."
echo ""

echo "Creating issues..."
echo ""

# Issue 1
echo "Creating issue 1/5: Copy task link..."
gh issue create --repo "$REPO" \
  --title 'Add "copy task link" button to task cards' \
  --label "good first issue" --label "ui" --label "clipboard" \
  --body "$(cat <<'EOF'
## Description

Add a button to task cards and task detail pages that copies a deep link to the clipboard. This allows users to share task references in messages, notes, or across collaboration tools.

## Acceptance Criteria

- [ ] Copy button appears on task cards and task detail panel
- [ ] Clicking the button copies the full task URL to clipboard
- [ ] Toast notification confirms successful copy ("Task link copied!")
- [ ] Toast disappears automatically after 3 seconds
- [ ] Works on both desktop and mobile (touch-friendly button size)
- [ ] Uses native Clipboard API with fallback for older browsers
- [ ] Unit tests verify URL generation and clipboard functionality

## Getting Started

1. Fork the repo and create branch `feature/#<this-issue>-copy-task-link`
2. Run `pnpm install && pnpm dev`
3. Look at existing task card components in `src/components/`
4. Use the shadcn/ui toast component for notifications
5. Run `pnpm test` before submitting PR
EOF
)"

# Issue 2
echo "Creating issue 2/5: Mobile Eisenhower..."
gh issue create --repo "$REPO" \
  --title "Improve mobile Eisenhower matrix with tab-based quadrant switching" \
  --label "good first issue" --label "responsive" --label "mobile" --label "ui" \
  --body "$(cat <<'EOF'
## Description

The Eisenhower matrix view has basic responsive grid support (collapses to single column on mobile), but the UX on phones could be much better. Implement a tab-based interface on small screens so users can switch between quadrants (Do / Schedule / Delegate / Eliminate) with a single tap, rather than scrolling through all four.

## Current State

The matrix already uses \`grid grid-cols-1 sm:grid-cols-2\` for responsive columns. This issue is about taking the mobile experience further with a purpose-built mobile UI.

## Acceptance Criteria

- [ ] On screens < 768px, matrix switches to a tab-based layout
- [ ] Tabs for each quadrant: Do, Schedule, Delegate, Eliminate
- [ ] Active tab is visually highlighted
- [ ] Swipe gesture support between quadrants (nice-to-have)
- [ ] All four quadrants accessible without vertical scrolling through all of them
- [ ] Task cards maintain readability with proper spacing
- [ ] Tested on iOS Safari and Android Chrome
- [ ] Uses Tailwind breakpoints (`md:`, `lg:`)

## Getting Started

1. Fork the repo and create branch `feature/#<this-issue>-mobile-eisenhower`
2. Run `pnpm install && pnpm dev`
3. Check the priority matrix view in `src/app/priority-matrix/`
4. Use browser DevTools mobile emulation for testing
5. Run `pnpm test` before submitting PR
EOF
)"

# Issue 3
echo "Creating issue 3/5: Docker support..."
gh issue create --repo "$REPO" \
  --title "Docker support for one-command setup" \
  --label "help wanted" --label "docker" --label "devops" --label "setup" \
  --body "$(cat <<'EOF'
## Description

Create a Dockerfile and docker-compose.yml that allows users to run Mission Control with a single \`docker-compose up\` command. This dramatically lowers the barrier to entry and ensures consistent environments across machines.

## Acceptance Criteria

- [ ] Dockerfile builds a production-ready Next.js image
- [ ] docker-compose.yml with port mappings (localhost:3000)
- [ ] Data persistence: \`data/\` directory mounted as Docker volume
- [ ] Separate docker-compose.dev.yml for development with hot reload
- [ ] .dockerignore excludes node_modules, .git, etc.
- [ ] README section with Docker setup instructions
- [ ] Multi-stage build for optimized image size
- [ ] Container runs as non-root user for security

## Technical Notes

- Next.js has official Docker examples: https://github.com/vercel/next.js/tree/canary/examples/with-docker
- Data files live in \`data/\` — this must be a mounted volume so data survives restarts
- Use \`node:20-alpine\` as base image
- The daemon process (optional) can be a separate service in docker-compose

## Getting Started

1. Fork the repo and create branch `feature/#<this-issue>-docker`
2. Run `pnpm install && pnpm dev` to understand the app locally first
3. Test with `docker build -t mission-control .` and `docker run -p 3000:3000 mission-control`
4. Verify data persistence across container restarts
EOF
)"

# Issue 4
echo "Creating issue 4/5: Better error states..."
gh issue create --repo "$REPO" \
  --title "Add user-friendly error states and empty states across all views" \
  --label "good first issue" --label "ui" --label "error-handling" \
  --body "$(cat <<'EOF'
## Description

Several views could benefit from better error handling and empty state UIs. When a view has no data (e.g., no tasks, no activity, empty inbox), users should see a helpful message with a clear call to action — not a blank page.

## Acceptance Criteria

- [ ] Empty state for task list: "No tasks yet — create your first task" with a button
- [ ] Empty state for Eisenhower matrix: helpful prompt per quadrant
- [ ] Empty state for inbox: "All caught up!" message
- [ ] Empty state for activity log: "No activity recorded yet"
- [ ] Error boundary for API failures: friendly error message with retry button
- [ ] Loading skeletons for views that fetch data
- [ ] Consistent styling using shadcn/ui components
- [ ] Unit tests for empty state rendering

## Getting Started

1. Fork the repo and create branch `feature/#<this-issue>-empty-error-states`
2. Run `pnpm install && pnpm dev`
3. Check each view by temporarily emptying the relevant JSON files in `data/`
4. Use shadcn/ui Alert or Card components for empty states
5. Run `pnpm test` before submitting PR
EOF
)"

# Issue 5
echo "Creating issue 5/5: First-run onboarding..."
gh issue create --repo "$REPO" \
  --title "Add first-run onboarding walkthrough for new users" \
  --label "enhancement" --label "onboarding" --label "ui" --label "accessibility" \
  --body "$(cat <<'EOF'
## Description

New users who clone the repo and run \`pnpm dev\` for the first time land on the dashboard with sample data but no guidance. A lightweight onboarding walkthrough (tooltip tour or welcome modal) would help users understand the key concepts: Eisenhower matrix, AI agent delegation, brain dump, and the daemon.

## Acceptance Criteria

- [ ] First-run detection (e.g., check for a \`onboarding-complete\` flag in settings)
- [ ] Welcome modal or step-by-step tooltip tour highlighting key areas
- [ ] Steps cover: creating a task, the Eisenhower matrix, delegating to agents, brain dump, daemon
- [ ] "Skip tour" option that dismisses permanently
- [ ] Tour can be re-triggered from settings or help menu
- [ ] Mobile-friendly (tooltips don't overflow on small screens)
- [ ] Lightweight implementation — no heavy tour libraries required
- [ ] Unit tests for onboarding state management

## Technical Notes

- Keep it simple: a modal with 4-5 steps and Next/Back buttons works great
- Store onboarding state in a small JSON file or localStorage
- Consider using the existing keyboard shortcuts help overlay as inspiration

## Getting Started

1. Fork the repo and create branch `feature/#<this-issue>-onboarding`
2. Run `pnpm install && pnpm dev`
3. Look at the dashboard layout in `src/app/` for placement
4. Run `pnpm test` before submitting PR
EOF
)"

echo ""
echo "Done! 5 issues created."
echo "View them at: https://github.com/MeisnerDan/mission-control/issues"
