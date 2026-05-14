/**
 * WebSocket ↔ PTY Bridge
 *
 * Wires a ws.WebSocket to a TerminalSession.
 *
 * Wire protocol (ALL server→client frames are JSON envelopes):
 *   { type: "output", data: string }    — PTY output
 *   { type: "exit",   code: number }    — process exited
 *   { type: "error",  message: string } — server error
 *   { type: "pong" }                    — heartbeat reply
 *
 * Client → server JSON control frames:
 *   { type: "input",  data: string }
 *   { type: "resize", cols: number, rows: number }
 *   { type: "ping" }
 */
import type { WebSocket } from "ws";
import { type TerminalSession, terminalSessions } from "./session-manager";

const BACKPRESSURE_HIGH = 1_000_000; // 1 MB: drop output frames
const BACKPRESSURE_KILL = 5_000_000; // 5 MB: close connection
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 s server ping
const HEARTBEAT_TIMEOUT_MS = 10_000; // 10 s pong deadline

function safeSend(ws: WebSocket, data: string): void {
	if (ws.readyState !== 1 /* OPEN */) return;
	const buffered = (ws as { bufferedAmount?: number }).bufferedAmount ?? 0;
	if (buffered > BACKPRESSURE_HIGH) return; // drop frame under backpressure
	ws.send(data);
}

function sendControl(ws: WebSocket, payload: Record<string, unknown>): void {
	safeSend(ws, JSON.stringify(payload));
}

export function attachWebSocketToSession(
	ws: WebSocket,
	session: TerminalSession,
): void {
	// ── Heartbeat ────────────────────────────────────────────────────────────
	let pongDeadlineTimer: ReturnType<typeof setTimeout> | null = null;

	const heartbeat = setInterval(() => {
		if (ws.readyState !== 1) {
			clearInterval(heartbeat);
			return;
		}
		try {
			ws.ping();
		} catch {
			return;
		}
		pongDeadlineTimer = setTimeout(() => {
			// No pong received — close stale connection
			ws.close(1001, "heartbeat timeout");
		}, HEARTBEAT_TIMEOUT_MS);
	}, HEARTBEAT_INTERVAL_MS);

	ws.on("pong", () => {
		if (pongDeadlineTimer) {
			clearTimeout(pongDeadlineTimer);
			pongDeadlineTimer = null;
		}
	});

	// ── PTY → WS ────────────────────────────────────────────────────────────
	session.pty.onData((data: string) => {
		if (ws.readyState !== 1) return;
		const buffered = (ws as { bufferedAmount?: number }).bufferedAmount ?? 0;
		if (buffered > BACKPRESSURE_KILL) {
			ws.close(1011, "output buffer overflow");
			return;
		}
		if (buffered > BACKPRESSURE_HIGH) return; // throttle
		// Always envelope PTY output as JSON so client can unambiguously route it
		sendControl(ws, { type: "output", data });
	});

	session.pty.onExit(({ exitCode }: { exitCode: number }) => {
		sendControl(ws, { type: "exit", code: exitCode });
		clearInterval(heartbeat);
		if (pongDeadlineTimer) clearTimeout(pongDeadlineTimer);
		ws.close(1000, "process exited");
	});

	// ── WS → PTY ────────────────────────────────────────────────────────────
	ws.on("message", (raw: Buffer | string) => {
		const text = typeof raw === "string" ? raw : raw.toString("utf-8");

		// Determine if this is a JSON control frame
		if (text.startsWith("{")) {
			let msg: Record<string, unknown>;
			try {
				msg = JSON.parse(text) as Record<string, unknown>;
			} catch {
				sendControl(ws, { type: "error", message: "bad frame" });
				return;
			}

			switch (msg.type) {
				case "input": {
					const data = String(msg.data ?? "");
					session.lastInputAt = Date.now();
					session.pty.write(data);
					break;
				}
				case "resize": {
					// Clamp to safe bounds (same limits as upgrade-handler initial dimensions)
					const cols = Math.max(1, Math.min(500, Number(msg.cols) || 80));
					const rows = Math.max(1, Math.min(200, Number(msg.rows) || 24));
					session.pty.resize(cols, rows);
					break;
				}
				case "ping":
					sendControl(ws, { type: "pong" });
					break;
				default:
					sendControl(ws, { type: "error", message: "unknown type" });
			}
		} else {
			// Raw input (not currently used; all client input is JSON-wrapped)
			session.lastInputAt = Date.now();
			session.pty.write(text);
		}
	});

	// ── Cleanup ──────────────────────────────────────────────────────────────
	ws.on("close", () => {
		clearInterval(heartbeat);
		if (pongDeadlineTimer) clearTimeout(pongDeadlineTimer);
		terminalSessions.kill(session.id);
	});
}
