import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
		pid: 9999,
		handleFlowControl: false,
		process: "bash",
	};
	return pty;
}

// ── Fake WebSocket ────────────────────────────────────────────────────────
function makeFakeWS() {
	const ee = new EventEmitter();
	const ws = {
		readyState: 1 as number, // OPEN
		sent: [] as string[],
		closed: false,
		closeCode: null as number | null,
		send: (data: string) => ws.sent.push(data),
		close: (code?: number) => {
			ws.closed = true;
			ws.closeCode = code ?? 1000;
			ws.readyState = 3; // CLOSED
			ee.emit("close", code);
		},
		ping: () => {},
		on: ee.on.bind(ee),
		off: ee.off.bind(ee),
		emit: ee.emit.bind(ee),
	};
	return ws;
}

// ── Fake session ──────────────────────────────────────────────────────────
function makeFakeSession(pty: ReturnType<typeof makeFakePty>) {
	return {
		id: "test-session-id",
		ownerEmail: "test@example.com",
		pty,
		lastInputAt: Date.now(),
		createdAt: Date.now(),
	};
}

// ── Mock session-manager's terminalSessions ───────────────────────────────
vi.mock("@/lib/terminal/session-manager", () => ({
	terminalSessions: {
		kill: vi.fn(),
	},
}));

const { attachWebSocketToSession } = await import("@/lib/terminal/ws-bridge");
const { terminalSessions } = await import("@/lib/terminal/session-manager");

describe("attachWebSocketToSession", () => {
	let pty: ReturnType<typeof makeFakePty>;
	let ws: ReturnType<typeof makeFakeWS>;
	let session: ReturnType<typeof makeFakeSession>;

	beforeEach(() => {
		pty = makeFakePty();
		ws = makeFakeWS();
		session = makeFakeSession(pty);
		vi.clearAllMocks();
	});

	it("kills PTY on websocket close", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);
		ws.emit("close", 1000);
		expect(terminalSessions.kill).toHaveBeenCalledWith("test-session-id");
	});

	it("wraps PTY output in JSON envelope { type: 'output', data }", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		// Simulate PTY emitting plain text
		pty.emit("data", "hello world");

		expect(ws.sent).toHaveLength(1);
		const parsed = JSON.parse(ws.sent[0]) as Record<string, unknown>;
		expect(parsed.type).toBe("output");
		expect(parsed.data).toBe("hello world");
	});

	it("wraps PTY output in JSON envelope even when output starts with '{'", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		// Simulate PTY emitting JSON-like text (e.g. printf '{"foo":1}')
		pty.emit("data", '{"foo":1}');

		expect(ws.sent).toHaveLength(1);
		const parsed = JSON.parse(ws.sent[0]) as Record<string, unknown>;
		expect(parsed.type).toBe("output");
		expect(parsed.data).toBe('{"foo":1}');
	});

	it("clamps resize cols to [1, 500] and rows to [1, 200]", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		// Send unbounded resize frame
		ws.emit(
			"message",
			JSON.stringify({ type: "resize", cols: 9999, rows: 9999 }),
		);
		expect(pty.resized[0]).toEqual({ cols: 500, rows: 200 });

		// Send zero/negative resize frame
		ws.emit("message", JSON.stringify({ type: "resize", cols: 0, rows: -5 }));
		// 0 → `Number(0) || 80` → 80; then Math.max(1, Math.min(500, 80)) → 80
		// -5 → `Number(-5) || 24` → -5; then Math.max(1, Math.min(200, -5)) → 1
		// Actually Number(0) || 80 = 80 (0 is falsy), Number(-5) || 24 = -5 (truthy)
		expect(pty.resized.at(1)?.cols).toBe(80); // 0 is falsy → defaults to 80
		expect(pty.resized.at(1)?.rows).toBe(1); // -5 clamped to 1
	});

	it("clamps resize to minimum 1 for both cols and rows", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		ws.emit("message", JSON.stringify({ type: "resize", cols: 1, rows: 1 }));
		expect(pty.resized[0]).toEqual({ cols: 1, rows: 1 });
	});

	it("sends input data to PTY", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		ws.emit("message", JSON.stringify({ type: "input", data: "ls -la\r" }));
		expect(pty.written).toContain("ls -la\r");
	});

	it("responds to ping with pong JSON", () => {
		attachWebSocketToSession(ws as unknown as import("ws").WebSocket, session);

		ws.emit("message", JSON.stringify({ type: "ping" }));
		const pongFrame = ws.sent.find((s) => {
			try {
				return (JSON.parse(s) as Record<string, unknown>).type === "pong";
			} catch {
				return false;
			}
		});
		expect(pongFrame).toBeDefined();
	});
});
