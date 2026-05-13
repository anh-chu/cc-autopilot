# mandio — AI Context Map

> **Stack:** next-app | none | react | typescript

> 0 routes | 0 models | 53 components | 57 lib files | 32 env vars | 7 middleware | 2 events | 0% test coverage
> **Token savings:** this file is ~6,500 tokens. Without it, AI exploration would cost ~47,500 tokens. **Saves ~41,000 tokens per conversation.**
> **Last scanned:** 2026-05-13 17:36 — re-run after significant changes

---

# Components

- **Error** [client] — props: error, reset — `src/app/error.tsx`
- **GlobalError** [client] — props: error, reset — `src/app/global-error.tsx`
- **RootLayout** — `src/app/layout.tsx`
- **HomeContentSkeleton** — `src/app/loading.tsx`
- **HomeLoading** — `src/app/loading.tsx`
- **NotFound** — `src/app/not-found.tsx`
- **CommandCenterPage** [client] — `src/app/page.tsx`
- **AgentForm** [client] — props: mode, initialData, currentStatus, onSave, onDelete, onStatusToggle, onCancel — `src/components/agent-form.tsx`
- **AgentSkills** [client] — `src/components/agent-skills.tsx`
- **AuthProvider** [client] — `src/components/auth-provider.tsx`
- **AutopilotPage** [client] — `src/components/autopilot-page.tsx`
- **DraggableTaskCard** [client] — props: task, project, onClick, isSelected, onToggleSelect, isRunning, onRun, pendingDecisionTaskIds, onStatusChange, onDuplicate — `src/components/board-view.tsx`
- **BoardColumn** [client] — props: config, tasks, projects, onTaskClick, minHeight, maxHeight, selected, onToggleSelect, runningTaskIds, onRunTask — `src/components/board-view.tsx`
- **BoardPanels** [client] — props: showCreateTask, onCloseCreate, onSubmitCreate — `src/components/board-view.tsx`
- **BoardDndWrapper** [client] — props: activeTask, projects, onDragStart, onDragEnd — `src/components/board-view.tsx`
- **BreadcrumbNav** [client] — props: items, className, peers — `src/components/breadcrumb-nav.tsx`
- **CommandBar** [client] — props: onCapture, tasks, onTaskClick, commands — `src/components/command-bar.tsx`
- **CommandForm** [client] — props: mode, initialData, onDelete, activationProps — `src/components/command-form.tsx`
- **ConditionalShell** [client] — `src/components/conditional-shell.tsx`
- **ConfirmDialog** [client] — props: open, onOpenChange, title, description, confirmLabel, onConfirm, variant — `src/components/confirm-dialog.tsx`
- **CreateTaskDialog** [client] — props: open, onOpenChange, onSubmit, defaultValues — `src/components/create-task-dialog.tsx`
- **DecisionDialog** [client] — props: open, onOpenChange, decision, onAnswered — `src/components/decision-dialog.tsx`
- **EmptyState** — props: Icon, title, description, actionLabel, onAction, className, compact — `src/components/empty-state.tsx`
- **ErrorState** — props: message, onRetry, className, compact — `src/components/error-state.tsx`
- **FilterBar** [client] — props: search, filters, onClear, className — `src/components/filter-bar.tsx`
- **HomeActivity** [client] — `src/components/home-activity.tsx`
- **HomeInbox** [client] — `src/components/home-inbox.tsx`
- **HomeLogs** [client] — `src/components/home-logs.tsx`
- **KeyboardShortcuts** [client] — props: onCreateTask — `src/components/keyboard-shortcuts.tsx`
- **LayoutShell** [client] — `src/components/layout-shell.tsx`
- **MarkdownContent** [client] — props: content, className — `src/components/markdown-content.tsx`
- **MentionTextarea** [client] — props: value, onChange, agents, placeholder, className, onSubmit, stagedFiles, onFilesChange — `src/components/mention-textarea.tsx`
- **ProjectRunProgress** [client] — props: projectRun, runs, onStop — `src/components/mission-progress.tsx`
- **ModelSelect** [client] — props: value, onChange, className — `src/components/model-select.tsx`
- **ProjectCardLarge** [client] — props: project, tasks, isRunning, isProjectRunActive, onRun, onStop, onArchive, onDelete — `src/components/project-card-large.tsx`
- **ProjectDetailPage** [client] — props: parentLabel, parentHref — `src/components/project-detail-page.tsx`
- **ProjectDialog** [client] — props: open, onOpenChange, agents, onSubmit — `src/components/project-dialog.tsx`
- **ProjectInitiativeCanvas** [client] — `src/components/project-initiative-canvas.tsx`
- **RunButton** [client] — props: isRunning, onClick, size, disabled, title, isProjectRunActive, onStop — `src/components/run-button.tsx`
- **RunsFeed** [client] — `src/components/runs-feed.tsx`
- **SearchDialog** [client] — `src/components/search-dialog.tsx`
- **CardSkeleton** — props: className, lines, footer, footerClassName, childrenPosition — `src/components/skeletons.tsx`
- **RowSkeleton** — props: className, leading, lines, trailing, linesClassName, trailingClassName — `src/components/skeletons.tsx`
- **GridSkeleton** — props: className, count, renderItem — `src/components/skeletons.tsx`
- **PageSkeleton** — props: className — `src/components/skeletons.tsx`
- **SkillForm** [client] — props: mode, initialData, onDelete, activationProps — `src/components/skill-form.tsx`
- **TaskCard** [client] — props: task, project, agents, className, isDragging, onClick, allTasks, pendingDecisionTaskIds, isRunning, onRun — `src/components/task-card.tsx`
- **TaskForm** [client] — props: initial, allTasks, currentTaskId, onSubmit, onCancel, submitLabel — `src/components/task-form.tsx`
- **ThemeProvider** [client] — `src/components/theme-provider.tsx`
- **ThemeToggle** [client] — `src/components/theme-toggle.tsx`
- **TopNav** [client] — `src/components/top-nav.tsx`
- **WorkMapView** [client] — `src/components/work-map-view.tsx`
- **ActiveRunsProvider** [client] — `src/providers/active-runs-provider.tsx`

---

# Libraries

- `bin/bootstrap.ts` — function bootstrapDataDir: () => Promise<void>
- `bin/checks.ts`
  - function checkNodeVersion: (minVersion) => boolean
  - function checkClaudeCLI: () => boolean
  - function checkPortAvailable: (port) => Promise<boolean>
  - function checkDataDirWritable: (dataDir) => boolean
- `scripts/daemon/active-runs.ts`
  - function readActiveRuns: (filePath) => void
  - function writeActiveRuns: (filePath, data) => void
  - interface ActiveRunEntry
- `scripts/daemon/config.ts` — function loadConfig: (workspaceId) => DaemonConfig, function saveConfig: (config, workspaceId) => void
- `scripts/daemon/conversation-writer.ts`
  - function __resetWriterState: () => void
  - function startConversationForTask: (params) => Promise<ConversationContext>
  - function attachPidToRun: (ctx, pid) => Promise<void>
  - function appendUserTurn: (ctx, content) => Promise<void>
  - function pauseForDecision: (ctx, decisionId, reason, claudeSessionId) => Promise<void>
  - function completeConversation: (ctx, result) => Promise<void>
  - _...5 more_
- `scripts/daemon/data-io.ts` — function readJSON: (filePath) => T | null
- `scripts/daemon/prompt-builder.ts`
  - function buildTaskPrompt: (agentId, task, missionId?, workspaceId) => string
  - function getTask: (taskId) => TaskDef | null
  - function getPendingTasks: () => TaskDef[]
  - function isTaskUnblocked: (task) => boolean
  - function hasPendingDecision: (taskId) => boolean
- `scripts/daemon/runner.ts` — function parseClaudeOutput: (stdout) => ClaudeOutputMeta, class AgentRunner
- `scripts/daemon/runs-registry.ts` — function readJsonFile: (filePath, defaultValue) => T, function atomicWriteJson: (filePath, data) => void
- `scripts/daemon/security.ts`
  - function validatePathWithinWorkspace: (filePath, workspaceRoot) => boolean
  - function escapeFenceContent: (content) => string
  - function fenceTaskData: (taskData) => string
  - function enforcePromptLimit: (prompt) => string
  - function validateBinary: (binary) => boolean
  - function buildSafeEnv: (opts?) => Record<string, string>
- `scripts/daemon/spawn-utils.ts` — function extractSummary: (stdout) => string
- `scripts/daemon/warm-sdk.ts`
  - function appendStreamEvent: (streamFile, event) => void
  - function buildSdkOptions: (opts) => void
  - function consumeStream: (stream, streamFile) => Promise<
  - function runWithSdk: (opts) => Promise<
  - function preheatSdk: (opts) => Promise<void>
  - function getWarmHandle: (expectedKey) => WarmQuery | null
- `scripts/daemon/workspace-env.ts` — function getWorkspaceEnv: (workspaceId) => Record<string, string>
- `src/hooks/use-active-runs.ts` — function useActiveRuns: () => void
- `src/hooks/use-connection.ts` — function useConnection: () => void
- `src/hooks/use-conversation-stream.ts`
  - function conversationReducer: (state, action) => ConversationReducerState
  - function useConversationStream: (conversationId) => ConversationStreamState &
  - interface ConversationReducerState
  - interface ConversationStreamState
  - const initialReducerState: ConversationReducerState
- `src/hooks/use-daemon.ts` — function useDaemon: () => DaemonData
- `src/hooks/use-data.ts`
  - function useTasks: () => void
  - function useInitiativeTasks: (initiativeId) => void
  - function useProjects: () => void
  - function useBrainDump: () => void
  - function useActivityLog: () => void
  - function useInbox: () => void
  - _...6 more_
- `src/hooks/use-fast-task-poll.ts` — function useFastTaskPoll: (hasRunningTasks, refetchTasks) => void
- `src/hooks/use-home-data.ts`
  - function useHomeData: () => void
  - interface HomeStats
  - interface HomeData
- `src/hooks/use-processing-entries.ts` — function useProcessingEntries: (entries) => void
- `src/hooks/use-sidebar.ts` — function useSidebar: () => void
- `src/hooks/use-workspace.ts` — function useWorkspace: () => void
- `src/instrumentation.ts` — function register: () => void
- `src/lib/agent-icons.ts` — function getAgentIcon: (agentId, iconName?) => LucideIcon
- `src/lib/api-client.ts` — function apiFetch: (url, init?) => Promise<Response>, interface ApiFetchInit
- `src/lib/auth-guards.ts` — function requireSession: () => Promise<Response | null>
- `src/lib/auth-paths.ts` — function isPublicPath: (pathname) => boolean
- `src/lib/claude-sdk.ts` — function resolveClaudeExecutable: () => string | null
- `src/lib/command-activation.ts`
  - function activateCommand: (workspaceId, commandId) => Promise<void>
  - function deactivateCommand: (workspaceId, commandId) => Promise<void>
  - function listActivatedCommands: (workspaceId) => Promise<string[]>
  - function listActivatedCommandsSync: (workspaceId) => string[]
  - function isCommandActivated: (workspaceId, commandId) => Promise<boolean>
  - function activateAllCommands: (workspaceId) => Promise<void>
  - _...6 more_
- `src/lib/command-files.ts`
  - function parseCommandFile: (id, raw) => Omit<CommandFileData, "createdAt" | "updatedAt">
  - function serializeCommandFile: (cmd, "createdAt" | "updatedAt">) => string
  - function readCommandFile: (cmdDir) => Promise<CommandFileData | null>
  - function readCommandFileSync: (cmdDir) => CommandFileData | null
  - function writeCommandFile: (cmdDir, cmd, "createdAt" | "updatedAt">) => Promise<void>
  - function listCommandIds: (baseDir) => Promise<string[]>
  - _...5 more_
- `src/lib/command-prompt.ts`
  - function buildScheduledTask: (command, description, agentId?) => void
  - function loadCommandPrompt: (command, workspaceId) => CommandPromptResult
  - interface CommandPromptResult
- `src/lib/conversation-event-bus.ts`
  - function emitLocal: (event) => void
  - function subscribeLocal: (conversationId, listener) => void
  - function subscribe: (conversationId, listener) => void
  - function publishAndEmit: (event, "ts" | "seq">) => Promise<ConversationEvent>
  - function _watcherCount: () => number
  - function _clearWatchers: () => void
- `src/lib/conversations.ts`
  - function setConversationsWorkspace: (id) => void
  - function turnsFilePath: (conversationId) => string
  - function eventsFilePath: (conversationId) => string
  - function seqFilePath: (conversationId) => string
  - function ensureConversationDir: (conversationId) => Promise<void>
  - function getConversationsFile: () => Promise<ConversationsFile>
  - _...23 more_
- `src/lib/data.ts`
  - function ensureSkillsMigrated: (workspaceId) => Promise<void>
  - function getWorkspaceDataDir: (workspaceId) => string
  - function ensureWorkspaceDir: (workspaceId) => Promise<void>
  - function initWikiDir: (workspaceId) => Promise<void>
  - function ensureDocMaintainerAgentForWorkspace: (workspaceId) => Promise<void>
  - function getTasks: () => Promise<TasksFile>
  - _...32 more_
- `src/lib/json-io.ts` — function readJSON: (file) => T | null, function writeJSON: (file, data) => void
- `src/lib/log-reader.ts`
  - function isAllowedLogPath: (filePath) => boolean
  - function scrubLogLines: (lines) => string[]
  - function tailFile: (filePath, lines, search?) => Promise<string[]>
- `src/lib/logger.ts`
  - function createLogger: (processName, opts) => Logger
  - interface Logger
  - type LogLevel
- `src/lib/paginate.ts`
  - function parsePaginationParams: (searchParams) => PaginationParams
  - function paginateItems: (items, {...}, offset }, total) => PaginatedResult<T>
  - interface PaginationParams
  - interface PaginatedResult
  - const CACHE_HEADERS
- `src/lib/paths.ts`
  - function assertSafeId: (id) => void
  - function getWorkspaceDir: (workspaceId) => string
  - function getUploadsDir: (workspaceId) => string
  - function getWikiPathFile: (workspaceId) => string
  - function getWikiDir: (workspaceId) => string
  - function getDefaultWikiDir: (workspaceId) => string
  - _...16 more_
- `src/lib/plugin-reader.ts` — function listInstalledPlugins: (projectDir?) => Promise<PluginInfo[]>, interface PluginInfo
- `src/lib/process-utils.ts` — function isProcessAlive: (pid, assumeAliveIfZero) => boolean
- `src/lib/scheduled-jobs.ts`
  - function scheduleUploadsCleanup: () => void
  - function scheduleLogCleanup: () => void
  - function runStartupRecovery: () => Promise<void>
  - function scheduleAutopilotPoller: () => void
- `src/lib/script-entrypoints.ts` — function resolveScriptEntrypoint: (name) => void, type ScriptName
- `src/lib/scrub.ts` — function scrubCredentials: (text) => string
- `src/lib/skill-activation.ts`
  - function activateSkill: (workspaceId, skillId) => Promise<void>
  - function deactivateSkill: (workspaceId, skillId) => Promise<void>
  - function listActivatedSkills: (workspaceId) => Promise<string[]>
  - function isSkillActivated: (workspaceId, skillId) => Promise<boolean>
  - function listActivatedSkillsSync: (workspaceId) => string[]
  - function activateAllSkills: (workspaceId) => Promise<void>
  - _...6 more_
- `src/lib/skill-files.ts`
  - function parseSkillFile: (id, raw) => Omit<SkillFileData, "createdAt" | "updatedAt">
  - function serializeSkillFile: (skill, "createdAt" | "updatedAt">) => string
  - function readSkillFile: (skillDir) => Promise<SkillFileData | null>
  - function readSkillFileSync: (skillDir) => SkillFileData | null
  - function writeSkillFile: (skillDir, skill, "createdAt" | "updatedAt">) => Promise<void>
  - function listSkillIds: (skillsBaseDir) => Promise<string[]>
  - _...5 more_
- `src/lib/sync-commands.ts`
  - function generateAgentCommandMarkdown: (agent, linkedSkills) => string
  - function syncAgentCommand: (agent, workspaceId) => Promise<void>
  - function syncAllAgentCommands: (workspaceId) => Promise<void>
- `src/lib/toast.ts` — function showSuccess: (message, options?) => void, function showError: (message, options?) => void
- `src/lib/types.ts`
  - function getQuadrant: (task) => EisenhowerQuadrant
  - function valuesFromQuadrant: (quadrant) => void
  - interface AgentDefinition
  - interface AgentsFile
  - interface SkillDefinition
  - interface LegacySkillDefinition
  - _...75 more_
- `src/lib/utils.ts`
  - function cn: (...inputs) => void
  - function generateId: (prefix) => string
  - function parseAgentMentions: (text) => string[]
- `src/lib/validations.ts`
  - function validateBody: (request, schema) => Promise<ValidationResult<T>>
  - const safeId
  - const DEFAULT_LIMIT
  - const LIMITS
  - const commentSchema
  - const taskCreateSchema
  - _...21 more_
- `src/lib/wiki-helpers.ts` — function isAppFolder: (wikiDir, relPath) => Promise<boolean>
- `src/lib/wiki-plugin.ts`
  - function compareVersions: (a, b) => number
  - function getPluginStatus: (cwd) => void
  - function ensureWikiPluginInstalledDetailed: (cwd, options?) => WikiPluginInstall
  - function ensureWikiBootstrappedFromPlugin: (wikiDir, pluginInstallPath, domain, options?) => WikiBootstrapResult
  - function reconcileWikiWithPlugin: (wikiDir, pluginInstallPath) => WikiReconcileResult
  - function getLatestAvailableVersion: () => string | null
  - _...5 more_
- `src/lib/workspace-context.ts` — function GET: () => void, function applyWorkspaceContext: (fn) => void
- `src/lib/workspace-store.ts`
  - function getWorkspaceId: () => string
  - function setFallbackWorkspaceId: (id) => void
  - const workspaceStore
- `src/stores/editor-store.ts`
  - class FetchPageError
  - type LoadStatus
  - const useEditorStore

---

# Config

## Environment Variables

- `ALLOWED_EMAILS` (has default) — .env.local
- `API_KEY` **required** — __tests__/daemon.test.ts
- `APPDATA` **required** — scripts/daemon/runner.ts
- `AUTH_ALLOW_ALL_USERS` **required** — __tests__/auth-signin-callback.test.ts
- `AUTH_GOOGLE_ID` (has default) — .env.local
- `AUTH_GOOGLE_SECRET` (has default) — .env.local
- `AUTH_SECRET` (has default) — .env.local
- `AUTH_URL` (has default) — .env.local
- `CLAUDE_CODE_EXECUTABLE` **required** — src/lib/claude-sdk.ts
- `CLAUDE_CODE_OAUTH_TOKEN` **required** — scripts/daemon/security.ts
- `COMSPEC` **required** — scripts/daemon/security.ts
- `HOME` **required** — scripts/daemon/runner.ts
- `LOCALAPPDATA` **required** — scripts/daemon/runner.ts
- `MANDIO_ALLOW_AGENT_IN_TESTS` **required** — scripts/daemon/runner.ts
- `MANDIO_BOOTSTRAP_STANDALONE` **required** — bin/bootstrap.ts
- `MANDIO_DATA_DIR` **required** — __tests__/helpers.ts
- `MANDIO_DEFAULT_MODEL` **required** — scripts/daemon/runner.ts
- `MANDIO_GLOBAL_MAX_PARALLEL_AGENTS` **required** — src/lib/scheduled-jobs.ts
- `MANDIO_INSTALL_DIR` **required** — src/lib/paths.ts
- `MANDIO_WORKSPACE_ID` **required** — scripts/daemon/config.ts
- `NEXT_RUNTIME` **required** — src/instrumentation.ts
- `NODE_ENV` **required** — __tests__/auth-signin-callback.test.ts
- `P` **required** — scripts/daemon/security.ts
- `PATH` **required** — scripts/daemon/security.ts
- `PATHEXT` **required** — scripts/daemon/security.ts
- `S` **required** — scripts/daemon/security.ts
- `SYSTEMROOT` **required** — scripts/daemon/security.ts
- `TEMP` **required** — scripts/daemon/security.ts
- `TMP` **required** — scripts/daemon/security.ts
- `USERPROFILE` **required** — scripts/daemon/runner.ts
- `VITEST` **required** — scripts/daemon/runner.ts
- `WINDIR` **required** — scripts/daemon/security.ts

## Config Files

- `.env.example`
- `next.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`

## Key Dependencies

- next: 16.2.4
- next-auth: 5.0.0-beta.31
- react: 19.2.5
- zod: ^4.3.6

---

# Middleware

## auth
- auth-oauth-security.test — `__tests__/auth-oauth-security.test.ts`
- auth-signin-callback.test — `__tests__/auth-signin-callback.test.ts`
- auth-provider — `src/components/auth-provider.tsx`
- auth-guards — `src/lib/auth-guards.ts`
- auth-paths — `src/lib/auth-paths.ts`
- auth — `src/lib/auth.ts`

## custom
- generate-context — `scripts/generate-context.ts`

---

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

---

# Events & Queues

- `event` [event] — `src/lib/conversation-event-bus.ts`
- `conversation:${event.conversationId}` [event] — `src/lib/conversation-event-bus.ts`

---

# Test Coverage

> **0%** of routes and models are covered by tests
> 20 test files found

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_