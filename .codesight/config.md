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
- `VITEST` **required** — bin/bootstrap.ts
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
