# Libraries

> **Navigation aid.** Library inventory extracted via AST. Read the source files listed here before modifying exported functions.

**37 library files** across 5 modules

## Lib (15 files)

- `src/lib/data.ts` — getCurrentWorkspace, setCurrentWorkspace, getWorkspaceDataDir, ensureWorkspaceDir, initWikiDir, getCheckpointsDir, …
- `src/lib/types.ts` — getQuadrant, quadrantFromValues, valuesFromQuadrant, AgentDefinition, AgentsFile, SkillDefinition, …
- `src/lib/validations.ts` — validateBody, DEFAULT_LIMIT, LIMITS, taskCreateSchema, taskUpdateSchema, goalCreateSchema, …
- `src/lib/wiki-plugin.ts` — ensureWikiPluginInstalledDetailed, ensureWikiPluginInstalled, ensureWikiBootstrappedFromPlugin, reconcileWikiWithPlugin, WikiPluginInstall, WikiBootstrapResult, …
- `src/lib/paths.ts` — getWorkspaceDir, getUploadsDir, getWikiPathFile, getWikiDir, getDefaultWikiDir, DATA_DIR
- `src/lib/sync-commands.ts` — generateAgentCommandMarkdown, resolveLinkedSkills, syncAgentCommand, syncAllAgentCommands, syncSkillFile, syncAllSkillFiles
- `src/lib/log-reader.ts` — isAllowedLogPath, scrubLogLines, tailFile
- `src/lib/logger.ts` — createLogger, Logger, LogLevel
- `src/lib/scheduled-jobs.ts` — scheduleUploadsCleanup, scheduleLogCleanup, scheduleDaemonWatchdog
- `src/lib/toast.ts` — showSuccess, showError, showInfo
- `src/lib/utils.ts` — cn, generateId, parseAgentMentions
- `src/lib/agent-icons.ts` — getAgentIcon, getIconByName
- `src/lib/api-client.ts` — apiFetch, ApiFetchInit
- `src/lib/scrub.ts` — scrubCredentials
- `src/lib/workspace-context.ts` — applyWorkspaceContext

## Hooks (11 files)

- `src/hooks/use-data.ts` — useTasks, useInitiativeTasks, useGoals, useProjects, useBrainDump, useActivityLog, …
- `src/hooks/use-dashboard-data.ts` — useDashboardData, DashboardStats, DashboardAttention, DashboardEisenhowerCounts, DashboardData
- `src/hooks/use-agent-stream.ts` — useAgentStream, StreamLine
- `src/hooks/use-dashboard.ts` — useDashboard, DashboardData
- `src/hooks/use-active-runs.ts` — useActiveRuns
- `src/hooks/use-connection.ts` — useConnection
- `src/hooks/use-daemon.ts` — useDaemon
- `src/hooks/use-fast-task-poll.ts` — useFastTaskPoll
- `src/hooks/use-processing-entries.ts` — useProcessingEntries
- `src/hooks/use-sidebar.ts` — useSidebar
- `src/hooks/use-workspace.ts` — useWorkspace

## Scripts (9 files)

- `scripts/daemon/respond-runs.ts` — readRespondRuns, writeRespondRuns, isRunStopped, findRunningByMessage, getRunningRuns, createRespondRun, …
- `scripts/daemon/prompt-builder.ts` — buildTaskPrompt, buildScheduledPrompt, getTask, getPendingTasks, isTaskUnblocked, hasPendingDecision
- `scripts/daemon/security.ts` — validatePathWithinWorkspace, escapeFenceContent, fenceTaskData, enforcePromptLimit, validateBinary, buildSafeEnv
- `scripts/daemon/recovery.ts` — persistSessionRecord, clearSessionRecord, runCrashRecovery, SessionRecord, RecoveryResult
- `scripts/daemon/config.ts` — loadConfig, saveConfig, getConfigPath
- `scripts/daemon/runner.ts` — parseClaudeOutput, AgentRunner
- `scripts/daemon/dispatcher.ts` — Dispatcher
- `scripts/daemon/health.ts` — HealthMonitor
- `scripts/daemon/scheduler.ts` — Scheduler

## Instrumentation.ts (1 files)

- `src/instrumentation.ts` — register

## Proxy.ts (1 files)

- `src/proxy.ts` — proxy, config

---
_Back to [overview.md](./overview.md)_