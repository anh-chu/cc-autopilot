# UI

> **Navigation aid.** Component inventory and prop signatures extracted via AST. Read the source files before adding props or modifying component logic.

**70 components** (react)

## Client Components

- **ActivityPage** — `src/app/activity/page.tsx`
- **AutopilotPage** — `src/app/autopilot/page.tsx`
- **BrainDumpPage** — `src/app/brain-dump/page.tsx`
- **EditAgentPage** — `src/app/crew/[id]/edit/page.tsx`
- **AgentPage** — `src/app/crew/[id]/page.tsx`
- **NewAgentPage** — `src/app/crew/new/page.tsx`
- **CrewPage** — `src/app/crew/page.tsx`
- **DocumentsPage** — `src/app/documents/page.tsx`
- **Error** — props: error, reset — `src/app/error.tsx`
- **GlobalError** — props: error, reset — `src/app/global-error.tsx`
- **InitiativeDetailPage** — `src/app/initiatives/[id]/page.tsx`
- **InitiativesPage** — `src/app/initiatives/page.tsx`
- **LogsPage** — `src/app/logs/page.tsx`
- **CommandCenterPage** — `src/app/page.tsx`
- **TasksPage** — `src/app/priority-matrix/page.tsx`
- **ProjectsPage** — `src/app/projects/page.tsx`
- **SettingsPage** — `src/app/settings/page.tsx`
- **SkillEditorPage** — `src/app/skills/[id]/page.tsx`
- **NewSkillPage** — `src/app/skills/new/page.tsx`
- **SkillsPage** — `src/app/skills/page.tsx`
- **TaskDetailPage** — `src/app/tasks/[id]/page.tsx`
- **StreamEntry** — props: line — `src/components/agent-console.tsx`
- **AgentConsole** — props: runId, onStop — `src/components/agent-console.tsx`
- **AgentForm** — props: mode, initialData, currentStatus, onSave, onDelete, onStatusToggle, onCancel — `src/components/agent-form.tsx`
- **AppSidebar** — props: collapsed, isMobile, onClose — `src/components/app-sidebar.tsx`
- **DraggableTaskCard** — props: task, project, onClick, isSelected, onToggleSelect, isRunning, onRun, pendingDecisionTaskIds, onStatusChange, onDuplicate — `src/components/board-view.tsx`
- **BoardColumn** — props: config, tasks, projects, onTaskClick, minHeight, maxHeight, selected, onToggleSelect, runningTaskIds, onRunTask — `src/components/board-view.tsx`
- **BoardPanels** — props: projects, showCreateTask, onCloseCreate, onSubmitCreate — `src/components/board-view.tsx`
- **BoardDndWrapper** — props: activeTask, projects, onDragStart, onDragEnd — `src/components/board-view.tsx`
- **BreadcrumbNav** — props: items, className — `src/components/breadcrumb-nav.tsx`
- **CommandBar** — props: onCapture, sidebarOpen, onToggleSidebar, isMobile, tasks, onTaskClick — `src/components/command-bar.tsx`
- **ConfirmDialog** — props: open, onOpenChange, title, description, confirmLabel, onConfirm, variant — `src/components/confirm-dialog.tsx`
- **AgentContextMenuContent** — props: agent, href, onEdit, onNewTask, onToggleStatus — `src/components/context-menus/agent-context-menu.tsx`
- **InitiativeContextMenuContent** — props: initiative, onTogglePause, onArchive, onDelete — `src/components/context-menus/initiative-context-menu.tsx`
- **ProjectContextMenuContent** — props: project, href, onEdit, onRun, onArchive, onDelete — `src/components/context-menus/project-context-menu.tsx`
- **TaskContextMenuContent** — props: task, onOpen, onStatusChange, onDuplicate, onRun, onDelete — `src/components/context-menus/task-context-menu.tsx`
- **CreateTaskDialog** — props: open, onOpenChange, projects, onSubmit, defaultValues — `src/components/create-task-dialog.tsx`
- **DecisionDialog** — props: open, onOpenChange, decision, onAnswered — `src/components/decision-dialog.tsx`
- **EisenhowerSummary** — props: tasks — `src/components/eisenhower-summary.tsx`
- **KeyboardShortcuts** — props: onCreateTask — `src/components/keyboard-shortcuts.tsx`
- **LayoutShell** — `src/components/layout-shell.tsx`
- **MarkdownContent** — props: content, className — `src/components/markdown-content.tsx`
- **MentionTextarea** — props: value, onChange, agents, placeholder, className, onSubmit, stagedFiles, onFilesChange — `src/components/mention-textarea.tsx`
- **ProjectRunProgress** — props: projectRun, runs, onStop — `src/components/mission-progress.tsx`
- **ProjectCardLarge** — props: project, tasks, isRunning, isProjectRunActive, onRun, onStop, onEdit, onArchive, onDelete — `src/components/project-card-large.tsx`
- **ProjectDetailPage** — props: parentLabel, parentHref — `src/components/project-detail-page.tsx`
- **ProjectDialog** — props: open, onOpenChange, project, agents, onSubmit — `src/components/project-dialog.tsx`
- **RunButton** — props: isRunning, onClick, size, disabled, title, isProjectRunActive, onStop — `src/components/run-button.tsx`
- **SearchDialog** — `src/components/search-dialog.tsx`
- **SidebarFooter** — props: collapsed — `src/components/sidebar-footer.tsx`
- **SkillForm** — props: mode, initialData, onDelete — `src/components/skill-form.tsx`
- **TaskCard** — props: task, project, agents, className, isDragging, onClick, allTasks, pendingDecisionTaskIds, isRunning, onRun — `src/components/task-card.tsx`
- **TaskForm** — props: initial, allTasks, currentTaskId, onSubmit, onCancel, submitLabel — `src/components/task-form.tsx`
- **ThemeProvider** — `src/components/theme-provider.tsx`
- **ThemeToggle** — `src/components/theme-toggle.tsx`
- **WorkspaceSwitcher** — props: collapsed — `src/components/workspace-switcher.tsx`
- **ActiveRunsProvider** — `src/providers/active-runs-provider.tsx`

## Components

- **BrainDumpLoading** — `src/app/brain-dump/loading.tsx`
- **CrewLoading** — `src/app/crew/loading.tsx`
- **RootLayout** — `src/app/layout.tsx`
- **DashboardLoading** — `src/app/loading.tsx`
- **NotFound** — `src/app/not-found.tsx`
- **PriorityMatrixLoading** — `src/app/priority-matrix/loading.tsx`
- **ProjectsDetailPage** — `src/app/projects/[id]/page.tsx`
- **EmptyState** — props: Icon, title, description, actionLabel, onAction, className, compact — `src/components/empty-state.tsx`
- **ErrorState** — props: message, onRetry, className, compact — `src/components/error-state.tsx`
- **CardSkeleton** — props: className, lines, footer, footerClassName, childrenPosition — `src/components/skeletons.tsx`
- **RowSkeleton** — props: className, leading, lines, trailing, linesClassName, trailingClassName — `src/components/skeletons.tsx`
- **GridSkeleton** — props: className, count, renderItem — `src/components/skeletons.tsx`
- **PageSkeleton** — props: className — `src/components/skeletons.tsx`

---
_Back to [overview.md](./overview.md)_