# Libraries

> **Navigation aid.** Library inventory extracted via AST. Read the source files listed here before modifying exported functions.

**42 library files** across 5 modules

## Lib (16 files)

- `src/lib/types.ts` — getQuadrant, quadrantFromValues, valuesFromQuadrant, AgentDefinition, AgentsFile, SkillDefinition, …
- `src/lib/data.ts` — setCurrentWorkspace, getWorkspaceDataDir, ensureWorkspaceDir, initWikiDir, ensureDocMaintainerAgentForWorkspace, getTasks, …
- `src/lib/validations.ts` — validateBody, DEFAULT_LIMIT, LIMITS, commentSchema, taskCreateSchema, taskUpdateSchema, …
- `src/lib/wiki-plugin.ts` — ensureWikiPluginInstalledDetailed, ensureWikiPluginInstalled, ensureWikiBootstrappedFromPlugin, reconcileWikiWithPlugin, WikiPluginInstall, WikiBootstrapResult, …
- `src/lib/paths.ts` — getWorkspaceDir, getUploadsDir, getWikiPathFile, getWikiDir, getDefaultWikiDir, DATA_DIR
- `src/lib/paginate.ts` — parsePaginationParams, paginateItems, PaginationParams, PaginatedResult, CACHE_HEADERS
- `src/lib/sync-commands.ts` — generateAgentCommandMarkdown, syncAgentCommand, syncAllAgentCommands, syncSkillFile, syncAllSkillFiles
- `src/lib/log-reader.ts` — isAllowedLogPath, scrubLogLines, tailFile
- `src/lib/logger.ts` — createLogger, Logger, LogLevel
- `src/lib/scheduled-jobs.ts` — scheduleUploadsCleanup, scheduleLogCleanup, scheduleDaemonWatchdog
- `src/lib/toast.ts` — showSuccess, showError, showInfo
- `src/lib/utils.ts` — cn, generateId, parseAgentMentions
- `src/lib/api-client.ts` — apiFetch, ApiFetchInit
- `src/lib/agent-icons.ts` — getAgentIcon
- `src/lib/scrub.ts` — scrubCredentials
- `src/lib/workspace-context.ts` — applyWorkspaceContext

## Scripts (14 files)

- `scripts/daemon/runs-registry.ts` — readJsonFile, writeJsonFile, atomicWriteJson, pruneOldEntries, findEntryById, updateEntryById, …
- `scripts/daemon/prompt-builder.ts` — buildTaskPrompt, buildScheduledPrompt, getTask, getPendingTasks, isTaskUnblocked, hasPendingDecision
- `scripts/daemon/security.ts` — validatePathWithinWorkspace, escapeFenceContent, fenceTaskData, enforcePromptLimit, validateBinary, buildSafeEnv
- `scripts/daemon/warm-sdk.ts` — appendStreamEvent, buildSdkOptions, consumeStream, runWithSdk, preheatSdk, getWarmHandle
- `scripts/daemon/recovery.ts` — persistSessionRecord, clearSessionRecord, runCrashRecovery, SessionRecord, RecoveryResult
- `scripts/daemon/active-runs.ts` — readActiveRuns, writeActiveRuns, ActiveRunEntry
- `scripts/daemon/config.ts` — loadConfig, saveConfig, getConfigPath
- `scripts/daemon/runner.ts` — parseClaudeOutput, AgentRunner
- `scripts/daemon/data-io.ts` — readJSON
- `scripts/daemon/dispatcher.ts` — Dispatcher
- `scripts/daemon/health.ts` — HealthMonitor
- `scripts/daemon/scheduler.ts` — Scheduler
- `scripts/daemon/spawn-utils.ts` — extractSummary
- `scripts/daemon/workspace-env.ts` — getWorkspaceEnv

## Hooks (10 files)

- `src/hooks/use-data.ts` — useTasks, useInitiativeTasks, useProjects, useBrainDump, useActivityLog, useInbox, …
- `src/hooks/use-dashboard-data.ts` — useDashboardData, DashboardStats, DashboardData
- `src/hooks/use-agent-stream.ts` — useAgentStream, StreamLine
- `src/hooks/use-active-runs.ts` — useActiveRuns
- `src/hooks/use-connection.ts` — useConnection
- `src/hooks/use-daemon.ts` — useDaemon
- `src/hooks/use-fast-task-poll.ts` — useFastTaskPoll
- `src/hooks/use-processing-entries.ts` — useProcessingEntries
- `src/hooks/use-sidebar.ts` — useSidebar
- `src/hooks/use-workspace.ts` — useWorkspace

## Instrumentation.ts (1 files)

- `src/instrumentation.ts` — register

## Proxy.ts (1 files)

- `src/proxy.ts` — proxy, config

---
_Back to [overview.md](./overview.md)_