import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Fake PTY ──────────────────────────────────────────────────────────────
function makeFakePty() {
	const ee = new EventEmitter();
	const pty = {
		killed: false,
		written: [] as string[],
		resized: [] as { cols: number; rows: number }[],
		onData: (cb: (data: string) => void) => {
			ee.on("data", cb);
			return { dispose: () => ee.off("data", cb) };
		},
		onExit: (cb: (e: { exitCode: number }) => void) => {
			ee.on("exit", cb);
			return { dispose: () => ee.off("exit", cb) };
		},
		write: (data: string) => pty.written.push(data),
		resize: (cols: number, rows: number) => pty.resized.push({ cols, rows }),
		kill: () => {
			pty.killed = true;
		},
		emit: (event: string, ...args: unknown[]) => ee.emit(event, ...args),
		cols: 80,
		rows: 24,
		pid: 1234,
		handleFlowControl: false,
		process: "bash",
		on: ee.on.bind(ee),
		off: ee.off.bind(ee),
	};
	return pty;
}

// ── Mock node-pty ─────────────────────────────────────────────────────────
let fakePtyInstance = makeFakePty();

vi.mock("node-pty", () => ({
	default: {
		spawn: vi.fn(() => fakePtyInstance),
	},
	spawn: vi.fn(() => fakePtyInstance),
}));

// ── Import after mock ─────────────────────────────────────────────────────
const {
	TerminalSessionManager,
	IDLE_MS,
	MAX_AGE_MS,
	MAX_SESSIONS_PER_USER,
	buildEnv,
	detectShell,
} = await import("@/lib/terminal/session-manager");

describe("TerminalSessionManager", () => {
	let manager: InstanceType<typeof TerminalSessionManager>;

	beforeEach(() => {
		fakePtyInstance = makeFakePty();
		manager = new TerminalSessionManager();
	});

	afterEach(() => {
		manager.killAll();
		manager.stopReaper();
	});

	it("create() returns a session with valid id and increments count()", () => {
		const session = manager.create("user@example.com", { cols: 80, rows: 24 });
		expect(session.id).toBeTruthy();
		expect(session.ownerEmail).toBe("user@example.com");
		expect(manager.count()).toBe(1);
	});

	it("get() returns the session after create()", () => {
		const session = manager.create("user@example.com", { cols: 80, rows: 24 });
		expect(manager.get(session.id)).toBe(session);
	});

	it("kill() removes the session and calls pty.kill()", () => {
		const session = manager.create("user@example.com", { cols: 80, rows: 24 });
		manager.kill(session.id);
		expect(manager.count()).toBe(0);
		expect(fakePtyInstance.killed).toBe(true);
	});

	it("killAll() empties the manager", () => {
		manager.create("a@example.com", { cols: 80, rows: 24 });
		fakePtyInstance = makeFakePty();
		manager.create("b@example.com", { cols: 80, rows: 24 });
		manager.killAll();
		expect(manager.count()).toBe(0);
	});

	it("reapIdle() kills sessions idle longer than IDLE_MS", () => {
		const session = manager.create("user@example.com", { cols: 80, rows: 24 });
		// Backdate lastInputAt beyond idle threshold
		session.lastInputAt = Date.now() - IDLE_MS - 1;
		const killed = manager.reapIdle(Date.now());
		expect(killed).toBe(1);
		expect(manager.count()).toBe(0);
	});

	it("reapIdle() kills sessions older than MAX_AGE_MS regardless of input", () => {
		const session = manager.create("user@example.com", { cols: 80, rows: 24 });
		session.lastInputAt = Date.now(); // recent input
		session.createdAt = Date.now() - MAX_AGE_MS - 1;
		const killed = manager.reapIdle(Date.now());
		expect(killed).toBe(1);
	});

	it("reapIdle() does not kill fresh sessions", () => {
		manager.create("user@example.com", { cols: 80, rows: 24 });
		const killed = manager.reapIdle(Date.now());
		expect(killed).toBe(0);
		expect(manager.count()).toBe(1);
	});

	it(`create() kills oldest session when user reaches MAX_SESSIONS_PER_USER (${MAX_SESSIONS_PER_USER})`, () => {
		// firstPty is the pty used by the FIRST created session (uses current fakePtyInstance from beforeEach)
		const firstPty = fakePtyInstance;
		manager.create("user@example.com", { cols: 80, rows: 24 }); // uses firstPty
		for (let i = 1; i < MAX_SESSIONS_PER_USER; i++) {
			fakePtyInstance = makeFakePty();
			manager.create("user@example.com", { cols: 80, rows: 24 });
		}
		expect(manager.count()).toBe(MAX_SESSIONS_PER_USER);
		// One more — should evict the oldest (firstPty's session)
		fakePtyInstance = makeFakePty();
		manager.create("user@example.com", { cols: 80, rows: 24 });
		expect(manager.count()).toBe(MAX_SESSIONS_PER_USER);
		expect(firstPty.killed).toBe(true);
	});
});

describe("buildEnv()", () => {
	const orig = { ...process.env };
	afterEach(() => {
		process.env = { ...orig };
	});

	it("strips AUTH_SECRET", () => {
		process.env.AUTH_SECRET = "super-secret";
		const env = buildEnv();
		expect(env.AUTH_SECRET).toBeUndefined();
	});

	it("strips ANTHROPIC_API_KEY", () => {
		process.env.ANTHROPIC_API_KEY = "sk-ant-123";
		const env = buildEnv();
		expect(env.ANTHROPIC_API_KEY).toBeUndefined();
	});

	it("strips keys matching /(SECRET|TOKEN|KEY|PASSWORD)$/i", () => {
		process.env.MY_API_KEY = "val";
		process.env.DB_PASSWORD = "pass";
		process.env.SOME_TOKEN = "tok";
		const env = buildEnv();
		expect(env.MY_API_KEY).toBeUndefined();
		expect(env.DB_PASSWORD).toBeUndefined();
		expect(env.SOME_TOKEN).toBeUndefined();
	});

	it("preserves non-secret env vars", () => {
		process.env.HOME = "/home/user";
		const env = buildEnv();
		expect(env.HOME).toBe("/home/user");
	});
});

describe("detectShell()", () => {
	const orig = { ...process.env };
	afterEach(() => {
		process.env = { ...orig };
	});

	it("uses process.env.SHELL when set and it exists", () => {
		process.env.SHELL = "/bin/bash";
		const { command } = detectShell();
		// /bin/bash typically exists on the test runner
		expect(["/bin/bash", "/bin/sh"]).toContain(command);
	});

	it("falls back gracefully when SHELL is not set", () => {
		delete process.env.SHELL;
		const { command } = detectShell();
		expect(["/bin/bash", "/bin/sh"]).toContain(command);
	});
});
