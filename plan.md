# Plan: Replace Hand-Rolled Chat with assistant-ui + Vercel AI SDK + ai-sdk-provider-claude-code

---

## 1. Scope

### Covered

- Replace `AgentConsole` component and `useAgentStream` hook with assistant-ui `Thread` + `useChatRuntime`.
- Replace `/api/runs/stream` SSE tail endpoint with `/api/chat` route using `streamText` + `claudeCode` provider.
- Replace the documents-page inline chat panel (which uses `useAgentStream` + `prepareConsoleLines` + `StreamEntry` directly) with an `AssistantThread` component.
- Replace autopilot-page and logs-page `AgentConsole` mounts.
- Custom tool-call rendering via `makeAssistantToolUI` for Claude Code tools.
- Session resume via `sdkOptions.resume` + `persistSession`.

### Not covered

- The daemon (`scripts/daemon/*`) continues to run non-chat workloads (scheduled tasks, brain-dump triage, project runs). Its job-file bus, `AgentRunner`, `Dispatcher`, and warm-sdk remain untouched.
- Tiptap document editor stays as-is.
- Ask Wiki BM25 search stays as-is.
- `/api/wiki/generate` route stays for daemon-initiated wiki runs; only the user-facing chat path changes.
- `/api/runs` REST endpoints (list, stop) stay for daemon runs.

---

## 2. What Dies, What Stays, What Changes

### Delete

| File | Reason |
|------|--------|
| `/home/sil/ccmc-assistant-ui/src/components/agent-console.tsx` | Entire component replaced by assistant-ui Thread. Exports `AgentConsole`, `StreamEntry`, `prepareConsoleLines`. |
| `/home/sil/ccmc-assistant-ui/src/hooks/use-agent-stream.ts` | SSE EventSource hook replaced by `useChatRuntime` internals. |
| `/home/sil/ccmc-assistant-ui/src/app/api/runs/stream/route.ts` | JSONL-tail SSE endpoint. Chat now uses AI SDK data-stream protocol. Daemon runs that still need live tailing will need a separate lightweight endpoint (see Risks). |

### Keep (untouched)

| File | Reason |
|------|--------|
| `scripts/daemon/*` (all files) | Daemon scheduler, dispatcher, runner, warm-sdk, security, recovery. Non-chat runs unaffected. |
| `src/components/wiki/*` | Wiki UI components (frontmatter-header, etc.). |
| `src/app/api/wiki/generate/route.ts` | Daemon-consumed job-file writer. Keep for non-chat wiki runs. |
| `src/app/api/runs/route.ts` | List/manage runs. Still needed for daemon runs. |
| `src/providers/active-runs-provider.tsx` | Provides daemon run status + decision dialog. Stays. |
| `src/hooks/use-active-runs.ts` | Polls daemon active runs. Stays. |
| `src/lib/types.ts`, `src/lib/utils.ts`, `src/lib/paths.ts` | Hot files, many importers. No changes. |
| `src/components/markdown-content.tsx` | Used elsewhere. Keep. |

### Modify

| File | Change |
|------|--------|
| `/home/sil/ccmc-assistant-ui/src/app/documents/page.tsx` | Remove `useAgentStream`, `prepareConsoleLines`, `StreamEntry` imports. Replace inline chat panel with `<AssistantThread>` component. Keep tiptap editor, wiki init, BM25 search, model/agent select. |
| `/home/sil/ccmc-assistant-ui/src/app/autopilot/page.tsx` | Replace `<AgentConsole runId={...} onStop={...} />` with `<AssistantThread>` scoped to the active run. |
| `/home/sil/ccmc-assistant-ui/src/app/logs/page.tsx` | Replace `<AgentConsole runId={selectedRunId} />` with `<AssistantThread>` or a read-only log viewer. |
| `/home/sil/ccmc-assistant-ui/package.json` | Add new deps, remove unused if any. |

### Create

| File | Purpose |
|------|---------|
| `/home/sil/ccmc-assistant-ui/src/app/api/chat/route.ts` | AI SDK route handler using `streamText` + `claudeCode` provider. |
| `/home/sil/ccmc-assistant-ui/src/components/chat/AssistantThread.tsx` | Wrapper around assistant-ui `Thread` with `useChatRuntime`. |
| `/home/sil/ccmc-assistant-ui/src/components/chat/tool-uis.tsx` | `makeAssistantToolUI` registrations for Claude Code tools. |
| `/home/sil/ccmc-assistant-ui/src/components/chat/ChatProvider.tsx` | `AssistantRuntimeProvider` wrapper with runtime config. |
| `/home/sil/ccmc-assistant-ui/src/lib/chat-sessions.ts` | Session ID persistence helpers (per workspace/document). |

---

## 3. Target Architecture

### 3.1 API Route: `/api/chat/route.ts`

```
POST /api/chat
Body: AI SDK data-stream protocol messages
Response: AI SDK data-stream (SSE with typed parts)
```

Implementation:

```typescript
import { streamText } from 'ai';
import { claudeCode } from 'ai-sdk-provider-claude-code';

export async function POST(request: Request) {
  const { messages, data } = await request.json();
  // data.cwd = workspace dir, data.sessionId = resume target

  const model = claudeCode('sonnet', {
    cwd: data?.cwd ?? getWorkspaceDir(workspaceId),
    persistSession: true,
    allowDangerouslySkipPermissions: true, // match current daemon behavior
    sdkOptions: {
      ...(data?.sessionId ? { resume: data.sessionId } : {}),
    },
  });

  const result = streamText({
    model,
    messages,
    // system prompt injected by provider via CLAUDE.md / settingSources
  });

  return result.toDataStreamResponse();
}
```

Key design decisions:
- Each chat message is a separate `streamText` call. Claude Code provider manages the underlying SDK session.
- `cwd` is passed per-request from the client, scoped to the workspace or project directory.
- `persistSession: true` lets Claude Code save sessions to `~/.claude/projects/` for resume.
- `allowDangerouslySkipPermissions` matches current daemon config. Can be toggled per workspace config.

### 3.2 Component: `AssistantThread.tsx`

```typescript
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { AssistantRuntimeProvider, Thread } from '@assistant-ui/react';

export function AssistantThread({ cwd, sessionId }: Props) {
  const runtime = useChatRuntime({
    api: '/api/chat',
    body: { cwd, sessionId },  // forwarded as `data` to route
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
      {/* Tool UI registrations */}
      <ClaudeCodeToolUIs />
    </AssistantRuntimeProvider>
  );
}
```

### 3.3 Tool-Call Rendering

Claude Code tools streamed via `tool-call` / `tool-result` / `tool-error` parts with `providerExecuted: true`. Use `makeAssistantToolUI` for each:

| Tool | Rendering | Expand/Collapse |
|------|-----------|-----------------|
| `Read` | Show file path + line range. Collapse content by default. | Collapsible |
| `Edit` | Show file path + diff (old/new). Always visible. | Expanded |
| `Bash` | Show command. Collapse stdout. Highlight stderr. | Collapsible |
| `Glob` / `Grep` | Show pattern + match count. Collapse full results. | Collapsible |
| `Task` | Show task description + status. | Expanded |
| `Write` | Show file path. Collapse content. | Collapsible |
| All others | Generic JSON collapsible (matches current unknown-event behavior). | Collapsible |

Each tool UI component receives `{ args, result, status }` from `makeAssistantToolUI`. The `status.type` drives loading/complete/error states.

### 3.4 Session Resume Strategy

- Claude Code sessions are identified by session IDs emitted in the `system.init` stream event.
- The provider exposes session ID via `providerMetadata['claude-code'].sessionId` on result parts.
- Persist mapping: `{ workspaceId, documentSlug?, lastSessionId, updatedAt }` in a JSON file at `<workspaceDataDir>/chat-sessions.json`.
- On new chat message for the same workspace+document context, pass `sdkOptions.resume` with the stored session ID.
- Session IDs rotate when Claude Code creates a new conversation; update the mapping on each response.

### 3.5 Cwd / Workspace Scoping

- Documents page: `cwd` = workspace wiki directory (`getWikiDir(workspaceId)`).
- Autopilot/Logs: `cwd` = workspace root (`getWorkspaceDir(workspaceId)`).
- Project-scoped chats (future): `cwd` = project directory if available.
- Client sends `cwd` in request body. Server validates it is within the workspace root using `validatePathWithinWorkspace` from `scripts/daemon/security.ts` (or a copy in `src/lib/`).

### 3.6 Auth / Claude Binary

Current daemon uses `findClaudeBinary()` to locate the Claude CLI and `buildSafeEnv()` to pass `CLAUDE_CODE_OAUTH_TOKEN`. The `ai-sdk-provider-claude-code` package uses `@anthropic-ai/claude-agent-sdk` directly (not the CLI binary). It reads the API key from:
1. `ANTHROPIC_API_KEY` env var, or
2. Claude Code's stored OAuth token at `~/.claude/.credentials.json`, or
3. `CLAUDE_CODE_OAUTH_TOKEN` env var.

No binary detection needed for the new path. The provider handles SDK initialization internally.

---

## 4. Risks and Unknowns

### 4.1 AI SDK Version: v6, Not v5

**Finding:** `@assistant-ui/react-ai-sdk@latest` (v1.3.21) has `peerDependency` on `ai@^6.0.168`. The `ai-sdk-provider-claude-code@latest` (v3.x.x) also targets AI SDK v6. The repo currently has no `ai` package installed.

**Action:** Install `ai@^6`, `@ai-sdk/react@^3`, `ai-sdk-provider-claude-code@latest` (v3.x.x, not `@ai-sdk-v5` tag).

### 4.2 ai-sdk-provider-claude-code Compatibility

- **claude-agent-sdk version:** Provider v3.x uses `@anthropic-ai/claude-agent-sdk` (same as repo's `^0.2.114`). The provider declares its own dependency; version alignment should be checked at install time via `pnpm ls`.
- **cwd support:** Confirmed. `ClaudeCodeSettings.cwd` is a first-class option.
- **Session resume:** Via `sdkOptions.resume` (passes through to SDK `Options.resume`).
- **Streaming input mode:** `streamingInput` option supports `'auto' | 'always' | 'off'`.
- **Tool streaming:** Emits `tool-call`, `tool-result`, `tool-error` with `providerExecuted: true`. Full lifecycle: `tool-input-delta` -> `tool-call` -> `tool-result`.

### 4.3 assistant-ui Provider-Executed Tools

assistant-ui's `makeAssistantToolUI` renders tool calls regardless of whether they are client-executed or provider-executed. The `status` field differentiates states. Since Claude Code tools are provider-executed, the UI only renders — it never needs to execute tools client-side. This is the correct pattern.

### 4.4 Concurrency Model Change

**Before:** Daemon serializes runs per workspace via `maxParallelAgents` config in `Dispatcher`. Each run writes JSONL to disk; `/api/runs/stream` tails the file.

**After:** Each chat is its own SSE response from `/api/chat`. Multiple browser tabs = multiple concurrent Claude Code SDK sessions. No shared queue.

**Implications:**
- Cost control: Add `maxBudgetUsd` to the `claudeCode()` config to prevent runaway spend.
- Resource: Each active chat holds a Claude Code SDK process. Consider a server-side semaphore if needed (Phase 2+).
- Daemon runs are unaffected; they still use the job-file bus.

### 4.5 Logs Page: Daemon Run Tailing

The logs page currently uses `<AgentConsole runId={selectedRunId} />` to tail daemon runs via `/api/runs/stream`. If we delete `agent-console.tsx` and `/api/runs/stream`, the logs page loses its run-tailing capability.

**Decision:** Keep `/api/runs/stream` alive but rename it to `/api/runs/tail` (or just keep the path). It is only used for viewing daemon-initiated run output. Do NOT delete it in Phase 4 — only delete the client-side `AgentConsole` and replace it with a simpler read-only log viewer.

Alternative: the logs page could use a minimal `<DaemonRunViewer>` that tails JSONL without the full chat UI.

### 4.6 Documents Page Complexity

The documents page (1700+ LOC) has deep interleaving of:
- Tiptap editor state
- Wiki BM25 search
- Agent/model selection
- Stream run tracking (`streamRunId`, `priorLines`, `agentStreamLinesRef`)
- Chat input with skill/command expansion
- Wiki init flow
- `prepareConsoleLines` + `StreamEntry` rendering

Replacing the chat panel requires carefully extracting the stream-related state while preserving the editor, wiki init, and BM25 logic.

### 4.7 Blast Radius

`agent-console.tsx` is imported by 3 files:
- `src/app/autopilot/page.tsx` (imports `AgentConsole`)
- `src/app/logs/page.tsx` (imports `AgentConsole`)
- `src/app/documents/page.tsx` (imports `prepareConsoleLines`, `StreamEntry`)

`/api/runs/stream/route.ts` has zero downstream dependents (leaf endpoint).

---

## 5. Migration Phases

### Phase 0: Dependencies + Smoke Test

**Goal:** Prove the claude-code provider streams through assistant-ui Thread.

1. Install deps:
   ```
   pnpm add ai@^6 @ai-sdk/react@^3 @assistant-ui/react @assistant-ui/react-ai-sdk ai-sdk-provider-claude-code
   ```
2. Create `/api/chat/route.ts` with hardcoded `cwd` (workspace root) and no session resume.
3. Create `AssistantThread.tsx` with `useChatRuntime({ api: '/api/chat' })`.
4. Create a temporary test page at `/test-chat` that mounts `<AssistantThread />`.
5. Verify: send a message, see Claude Code response stream in the Thread, see tool calls rendered as raw JSON.
6. Check `pnpm ls @anthropic-ai/claude-agent-sdk` for version conflicts.

**Exit criteria:** A message sent from the Thread reaches Claude Code, response streams back, tool-call parts appear in the UI.

### Phase 1: Tool-Call Rendering + Cwd Scoping

**Goal:** Rich tool-call display and per-context cwd.

1. Create `tool-uis.tsx` with `makeAssistantToolUI` for Read, Edit, Bash, Glob, Grep, Task, Write.
2. Register tool UIs inside `AssistantThread.tsx`.
3. Add `cwd` prop to `AssistantThread`, forwarded via `body` to the API route.
4. Server-side: validate `cwd` is within workspace root.

**Exit criteria:** Tool calls render with file paths, diffs, and collapsible output. `cwd` correctly scopes Claude Code's file operations.

### Phase 2: Session Resume + Persistence

**Goal:** Multi-turn conversations that survive page reloads.

1. Create `chat-sessions.ts` with `getSessionId(workspaceId, context?)` and `saveSessionId(workspaceId, context?, sessionId)`.
2. Extract session ID from provider metadata on stream completion.
3. Pass `sessionId` from client to API route; server passes as `sdkOptions.resume`.
4. Store in `<workspaceDataDir>/chat-sessions.json`.

**Exit criteria:** Refresh the page, send a follow-up message, Claude Code continues the conversation with history.

### Phase 3: Replace Mount Points

**Goal:** Swap all three consumer pages to use the new chat.

#### 3a: Documents Page (`/home/sil/ccmc-assistant-ui/src/app/documents/page.tsx`)

1. Remove imports: `useAgentStream`, `StreamLine`, `prepareConsoleLines`, `StreamEntry` from `agent-console`.
2. Remove state: `streamRunId`, `priorLines`, `agentStreamLinesRef`, `pendingMessage`, `pendingRunId`, `chatSending`, `isConnected`, `streamDone`.
3. Remove `handleChatSend` callback (replaced by Thread's built-in input).
4. Replace the chat panel JSX with `<AssistantThread cwd={wikiDir} context="wiki" />`.
5. Keep: tiptap editor, wiki init, BM25 search, model/agent select (agent select can be wired to the API route body or provider config).
6. Wire model selection into the Thread's API body so the route can pass it to `claudeCode(selectedModel)`.

#### 3b: Autopilot Page (`/home/sil/ccmc-assistant-ui/src/app/autopilot/page.tsx`)

1. Remove `import { AgentConsole }`.
2. Replace `<AgentConsole runId={...} onStop={...} />` (line ~460) with `<AssistantThread cwd={workspaceDir} />`.
3. Wire `onStop` to the Thread's abort/cancel mechanism.

#### 3c: Logs Page (`/home/sil/ccmc-assistant-ui/src/app/logs/page.tsx`)

1. Remove `import { AgentConsole }`.
2. Replace `<AgentConsole runId={selectedRunId} />` (line ~505) with a `<DaemonRunViewer runId={selectedRunId} />` component that tails `/api/runs/stream` (kept alive for daemon runs).
3. `DaemonRunViewer` is a simple read-only JSONL renderer — no chat input, no assistant-ui Thread.

### Phase 4: Delete Dead Code

1. Delete `/home/sil/ccmc-assistant-ui/src/components/agent-console.tsx`.
2. Delete `/home/sil/ccmc-assistant-ui/src/hooks/use-agent-stream.ts`.
3. Delete `/home/sil/ccmc-assistant-ui/src/app/test-chat/page.tsx` (smoke test page from Phase 0).
4. Verify no remaining imports reference deleted files: `grep -r "agent-console\|use-agent-stream" src/`.
5. Do NOT delete `/api/runs/stream/route.ts` — it is still used by `DaemonRunViewer` on the logs page.

### Phase 5: Tests + Build Verification

1. Add vitest tests:
   - `/api/chat/route.ts`: mock `streamText`, verify data-stream response shape.
   - `AssistantThread.tsx`: render test with mocked runtime.
   - `tool-uis.tsx`: snapshot tests for each tool UI in loading/complete/error states.
   - `chat-sessions.ts`: unit tests for read/write/rotation.
2. Run: `pnpm check && pnpm build && pnpm test`.
3. Manual smoke test: documents page chat, autopilot live view, logs page daemon run viewer.

---

## 6. File-Level Task List

Each task is single-file scope, fully specified, no architectural decisions remaining.

### Task 1: Install dependencies

- **File:** `/home/sil/ccmc-assistant-ui/package.json`
- **Action:** `pnpm add ai@^6 @ai-sdk/react@^3 @assistant-ui/react @assistant-ui/react-ai-sdk ai-sdk-provider-claude-code`
- **Verify:** `pnpm ls ai @ai-sdk/react @assistant-ui/react @assistant-ui/react-ai-sdk ai-sdk-provider-claude-code @anthropic-ai/claude-agent-sdk` shows no version conflicts.
- **Acceptance:** `pnpm install` exits 0. No peer dependency warnings for ai/assistant-ui.

### Task 2: Create `/api/chat/route.ts`

- **File:** `/home/sil/ccmc-assistant-ui/src/app/api/chat/route.ts`
- **Inputs:** AI SDK `messages` array + `data` object with `{ cwd?, sessionId?, model? }`.
- **Action:** Import `streamText` from `ai`, `claudeCode` from `ai-sdk-provider-claude-code`. Create `POST` handler that:
  1. Reads workspace ID via `applyWorkspaceContext()`.
  2. Validates `data.cwd` is within workspace root (use logic from `scripts/daemon/security.ts:validatePathWithinWorkspace`).
  3. Defaults `cwd` to `getWorkspaceDir(workspaceId)`.
  4. Creates model: `claudeCode(data.model ?? 'sonnet', { cwd, persistSession: true, allowDangerouslySkipPermissions: true, sdkOptions: { ...(data.sessionId ? { resume: data.sessionId } : {}) } })`.
  5. Calls `streamText({ model, messages })`.
  6. Returns `result.toDataStreamResponse()`.
- **Acceptance:** `curl -X POST /api/chat` with valid messages returns SSE stream with text-delta parts.

### Task 3: Create `chat-sessions.ts`

- **File:** `/home/sil/ccmc-assistant-ui/src/lib/chat-sessions.ts`
- **Action:** Export `getSessionId(workspaceId: string, context?: string): string | null` and `saveSessionId(workspaceId: string, sessionId: string, context?: string): void`. Read/write `<workspaceDataDir>/chat-sessions.json`. Use atomic write (tmp + rename) pattern matching `scripts/daemon/runs-registry.ts`.
- **Acceptance:** Unit test: save then get returns the ID. File is valid JSON.

### Task 4: Create `tool-uis.tsx`

- **File:** `/home/sil/ccmc-assistant-ui/src/components/chat/tool-uis.tsx`
- **Action:** Export `makeAssistantToolUI` registrations for: `Read`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`, `Write`, and a `FallbackToolUI` for unknown tools. Each renders args/result/status with collapsible sections using existing `Collapsible` UI components from `src/components/ui/`. Use `MarkdownContent` for text output. Match the visual style of the current `StreamEntry` in `agent-console.tsx` (monospace, badges, icons from lucide-react).
- **Acceptance:** Each tool UI renders correctly in loading, complete, and error states. Snapshot tests pass.

### Task 5: Create `ChatProvider.tsx`

- **File:** `/home/sil/ccmc-assistant-ui/src/components/chat/ChatProvider.tsx`
- **Action:** Export `ChatProvider` component that wraps children in `AssistantRuntimeProvider`. Accept `cwd`, `sessionId`, `model` props. Use `useChatRuntime({ api: '/api/chat', body: { cwd, sessionId, model } })`.
- **Acceptance:** Renders children within runtime context. No errors in React DevTools.

### Task 6: Create `AssistantThread.tsx`

- **File:** `/home/sil/ccmc-assistant-ui/src/components/chat/AssistantThread.tsx`
- **Action:** Export `AssistantThread` component. Props: `{ cwd: string; context?: string; model?: string }`. Compose `ChatProvider` + `Thread` + tool UI registrations. Wire session resume: call `getSessionId` on mount, call `saveSessionId` on response completion (via `onFinish` or equivalent).
- **Acceptance:** Renders a functional chat thread. Messages send and stream back.

### Task 7: Create `DaemonRunViewer.tsx`

- **File:** `/home/sil/ccmc-assistant-ui/src/components/chat/DaemonRunViewer.tsx`
- **Action:** Extract a minimal read-only JSONL viewer from the current `AgentConsole` logic. Uses `useAgentStream` pattern (but inline, since the hook is being deleted) OR duplicates minimal SSE tailing logic. Renders stream lines without chat input. Used only on logs page.
- **Alternative:** Keep `use-agent-stream.ts` alive solely for this component. Rename to `use-daemon-stream.ts`.
- **Acceptance:** Tails a daemon run's JSONL file and renders output. No chat input.

### Task 8: Update documents page

- **File:** `/home/sil/ccmc-assistant-ui/src/app/documents/page.tsx`
- **Action:**
  1. Remove imports: `useAgentStream`, `StreamLine` from `@/hooks/use-agent-stream`; `prepareConsoleLines`, `StreamEntry` from `@/components/agent-console`.
  2. Remove state variables: `streamRunId`, `priorLines`, `agentStreamLinesRef`, `pendingMessage`, `pendingRunId`, `chatSending`, `isConnected`, `streamDone`.
  3. Remove `handleChatSend` callback and all its dependencies.
  4. Remove the inline chat rendering JSX that maps `displayLines` with `<StreamEntry>`.
  5. Add: `import { AssistantThread } from '@/components/chat/AssistantThread'`.
  6. In the chat panel area, render `<AssistantThread cwd={wikiDir} context="wiki" model={selectedModel} />`.
  7. Keep: tiptap editor, wiki init button, BM25 search, model select dropdown (wire value to AssistantThread prop), agent select (may move into API route body).
- **Acceptance:** Documents page loads. Chat sends messages via assistant-ui Thread. Tiptap editor unaffected. Wiki init works.

### Task 9: Update autopilot page

- **File:** `/home/sil/ccmc-assistant-ui/src/app/autopilot/page.tsx`
- **Action:**
  1. Remove `import { AgentConsole } from "@/components/agent-console"`.
  2. Replace `<AgentConsole runId={...} onStop={...} />` (~line 460) with `<AssistantThread cwd={getWorkspaceDir(workspaceId)} />`.
  3. Wire the stop button to the thread's cancel mechanism or keep using the existing `/api/tasks/[id]/stop` endpoint.
- **Acceptance:** Autopilot page shows active agent output in Thread. Stop button works.

### Task 10: Update logs page

- **File:** `/home/sil/ccmc-assistant-ui/src/app/logs/page.tsx`
- **Action:**
  1. Remove `import { AgentConsole } from "@/components/agent-console"`.
  2. Replace `<AgentConsole runId={selectedRunId} />` (~line 505) with `<DaemonRunViewer runId={selectedRunId} />`.
  3. Import `DaemonRunViewer` from `@/components/chat/DaemonRunViewer`.
- **Acceptance:** Logs page tails selected daemon run. No chat input shown.

### Task 11: Delete dead files

- **Files to delete:**
  - `/home/sil/ccmc-assistant-ui/src/components/agent-console.tsx`
  - `/home/sil/ccmc-assistant-ui/src/hooks/use-agent-stream.ts` (only if Task 7 chose to inline the SSE logic)
- **Action:** Delete files. Run `grep -r "agent-console\|use-agent-stream" src/` to confirm zero remaining references.
- **Acceptance:** No import errors. `pnpm build` succeeds.

### Task 12: Tests

- **Files:**
  - `/home/sil/ccmc-assistant-ui/__tests__/api-chat.test.ts`
  - `/home/sil/ccmc-assistant-ui/__tests__/chat-sessions.test.ts`
  - `/home/sil/ccmc-assistant-ui/__tests__/tool-uis.test.tsx`
- **Action:** Write vitest tests per Phase 5 spec.
- **Acceptance:** `pnpm test` passes. `pnpm build` succeeds. `pnpm check` (TypeScript) passes.

---

## 7. Open Questions

1. **Model selection on documents page:** Currently the user picks a model (sonnet, haiku, opus) via dropdown. Should this be passed to `claudeCode(model)` per-message, or locked per session? Recommendation: pass per-message via request body; provider creates a new SDK query per `streamText` call anyway.

2. **Agent selection on documents page:** Currently the user picks a "wiki agent" which determines the system prompt and allowed tools. With the new architecture, should this map to different `systemPrompt` / `settingSources` configs on the provider? Or should the agent's instruction be injected as a system message in the `messages` array?

3. **Autopilot page live view:** The autopilot page currently shows `<AgentConsole>` for actively-running daemon tasks. These runs are spawned by the daemon, not by the user's browser. The new `AssistantThread` is designed for user-initiated chat. For daemon-spawned runs, a `DaemonRunViewer` (same as logs page) may be more appropriate. Confirm whether autopilot should use `AssistantThread` (implying user can chat with running daemon task) or `DaemonRunViewer` (read-only tail).

4. **Concurrent session limit:** With no daemon queue gating browser-initiated chats, should the `/api/chat` route enforce a max concurrent sessions limit? Recommendation: add a configurable semaphore (default 3).

---

## 8. Critical Files for Implementation

- `/home/sil/ccmc-assistant-ui/src/app/documents/page.tsx` — Largest consumer (1700+ LOC), deepest integration with stream state. Most complex migration.
- `/home/sil/ccmc-assistant-ui/src/components/agent-console.tsx` — Source of truth for current tool-call rendering patterns. Reference when building `tool-uis.tsx`.
- `/home/sil/ccmc-assistant-ui/scripts/daemon/security.ts` — Contains `validatePathWithinWorkspace` needed by the new `/api/chat` route for cwd validation.
- `/home/sil/ccmc-assistant-ui/scripts/daemon/runner.ts` — Reference for Claude binary detection, session ID extraction, and spawn options. Not modified, but informs the provider config.
- `/home/sil/ccmc-assistant-ui/src/app/api/runs/stream/route.ts` — Current SSE implementation. Reference for the `DaemonRunViewer` if we keep JSONL tailing for daemon runs.

---

## Migration Log

| Phase | Commit | Outcome |
|-------|--------|---------|
| 0 | `d2e651b` | Smoke-test scaffold: deps, `/api/chat` route, `<AssistantThread>` (Thread+Composer primitives), `/test-chat` page. Worker discovered three plan deviations and documented inline (`toUIMessageStreamResponse`, `AssistantChatTransport({ api })`, `ThreadPrimitive` namespace). |
| 1 | `44ac2e2` | Tool-call UIs for Read/Edit/Bash/Glob/Grep/Task/Write + fallback. `cwd/model/persona` forwarded via transport body. In-memory semaphore caps concurrent chats at 3 with 429 + Retry-After. |
| 2-3-5 | `7e6ff91` | Server-side session id persistence (`src/lib/chat-sessions.ts`) keyed by workspaceId+context, atomic write. GET/POST `/api/chat` thread sessionId through `claudeCode` `sdkOptions.resume`. Mount points swapped: `documents/page.tsx` mounts `<AssistantThread>`, `autopilot/page.tsx` and `logs/page.tsx` swap to read-only `<DaemonRunViewer>`. Vitest coverage (api-chat, chat-sessions, tool-uis). Server resolves wikiDir from context to keep `node:fs` out of the client bundle. |
| 4 | `3cd3168` | Deleted `agent-console.tsx`, `use-agent-stream.ts`, `test-chat/page.tsx`. `/api/runs/stream` kept alive — still tailed by `DaemonRunViewer`. |

### Final verify
- `pnpm tsc --noEmit` → 0 errors
- `pnpm test --run` → 215/215 passing
- `pnpm build` → ok (53/53 static pages, 38s)
- `npx @biomejs/biome check` (chat surface) → 0 errors

### Morning manual test
1. `pnpm dev`
2. Visit `/documents`, select an agent + model, send a message.
3. Verify Claude Code response streams, tool calls render with the new collapsible cards.
4. Refresh — follow-up message should resume the same Claude Code session (check `<workspaceDataDir>/chat-sessions.json`).
5. Visit `/autopilot` and `/logs` while a daemon run is active — `<DaemonRunViewer>` tails `/api/runs/stream` read-only.

### Known follow-ups
- Tool-UI tests assert shape only (functions, count). Add render tests with @testing-library/react when needed.
- Concurrent-chat 429 path is asserted in unit test; consider adding e2e once a Playwright harness exists.
- `applyWorkspaceContext()` currently relies on cookies/headers; if multi-tab usage shows session crosstalk, accept `workspaceId` explicitly in the `/api/chat` body.
