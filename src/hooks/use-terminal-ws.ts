"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TerminalStatus =
	| "idle"
	| "connecting"
	| "open"
	| "closed"
	| "error";

export interface UseTerminalWSResult {
	containerRef: React.RefCallback<HTMLDivElement>;
	status: TerminalStatus;
	errorMessage: string | null;
	reconnect: () => void;
}

const PING_INTERVAL_MS = 25_000;
const PONG_DEADLINE_MS = 10_000;
const RESIZE_DEBOUNCE_MS = 100;

function wsCodeToMessage(code: number): string {
	switch (code) {
		case 1000:
			return "Session ended";
		case 1001:
			return "Server closed connection";
		case 1006:
			return "Could not connect — check server logs (auth or network error)";
		case 1008:
			return "Not authorized";
		case 1011:
			return "Server error — check server logs";
		default:
			return `Connection closed (code ${code})`;
	}
}

export function useTerminalWS(enabled: boolean): UseTerminalWSResult {
	const [status, setStatus] = useState<TerminalStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [reconnectToken, setReconnectToken] = useState(0);
	// Tracks when the container div is actually in the DOM so the effect can re-fire
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

	// Stable refs so cleanup/effects always see latest values
	const containerRef = useRef<HTMLDivElement | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
	const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pongDeadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortedRef = useRef(false);

	const cleanup = useCallback(() => {
		abortedRef.current = true;

		if (pingTimerRef.current) {
			clearInterval(pingTimerRef.current);
			pingTimerRef.current = null;
		}
		if (pongDeadlineRef.current) {
			clearTimeout(pongDeadlineRef.current);
			pongDeadlineRef.current = null;
		}
		if (resizeObserverRef.current) {
			resizeObserverRef.current.disconnect();
			resizeObserverRef.current = null;
		}
		if (wsRef.current && wsRef.current.readyState < 2 /* CLOSING */) {
			wsRef.current.close(1000, "client closing");
		}
		wsRef.current = null;
		if (termRef.current) {
			termRef.current.dispose();
			termRef.current = null;
		}
		fitRef.current = null;
	}, []);

	// Container ref callback — stores the DOM node AND triggers connect
	const setContainerRef: React.RefCallback<HTMLDivElement> = useCallback(
		(node) => {
			containerRef.current = node;
			setContainerEl(node); // causes effect to re-run once the div is actually in the DOM
		},
		[],
	);

	// reconnectToken is an intentional trigger dep — incrementing it forces a reconnect
	// biome-ignore lint/correctness/useExhaustiveDependencies: reconnectToken is a trigger, not a value dep
	useEffect(() => {
		if (!enabled || !containerEl) {
			if (!enabled) {
				cleanup();
				setStatus("idle");
				setErrorMessage(null);
			}
			return;
		}

		let cancelled = false;
		abortedRef.current = false;

		async function connect() {
			// containerEl is guaranteed non-null by the effect guard above
			if (!containerEl) return;
			const container = containerEl;

			setStatus("connecting");
			setErrorMessage(null);

			// Dynamic import to avoid SSR and reduce initial bundle size
			const [{ Terminal }, { FitAddon }] = await Promise.all([
				import("@xterm/xterm"),
				import("@xterm/addon-fit"),
			]);

			if (cancelled || abortedRef.current) return;

			// Initialize xterm
			const term = new Terminal({
				theme: {
					background: "#0c0a09",
					foreground: "#fafafa",
					cursor: "#fafafa",
					selectionBackground: "#ffffff33",
				},
				fontFamily: "Menlo, Monaco, 'Courier New', monospace",
				fontSize: 13,
				cursorBlink: true,
				convertEol: true,
				scrollback: 5000,
			});
			const fitAddon = new FitAddon();
			term.loadAddon(fitAddon);

			term.open(container);

			termRef.current = term;
			fitRef.current = fitAddon;

			// Defer fit() so the Sheet animation has finished and the container
			// has real pixel dimensions before xterm measures it
			await new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			);
			if (cancelled || abortedRef.current) return;
			fitAddon.fit();

			// Build WebSocket URL with initial terminal dimensions
			const proto = location.protocol === "https:" ? "wss:" : "ws:";
			const url = `${proto}//${location.host}/api/terminal/ws?cols=${term.cols}&rows=${term.rows}`;

			const ws = new WebSocket(url);
			wsRef.current = ws;

			ws.onopen = () => {
				if (cancelled || abortedRef.current) {
					ws.close(1000, "cancelled");
					return;
				}
				setStatus("open");

				// Wire terminal input to WS
				term.onData((data) => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "input", data }));
					}
				});

				// Ping/pong heartbeat
				pingTimerRef.current = setInterval(() => {
					if (ws.readyState !== WebSocket.OPEN) return;
					ws.send(JSON.stringify({ type: "ping" }));
					pongDeadlineRef.current = setTimeout(() => {
						ws.close(1001, "heartbeat timeout");
					}, PONG_DEADLINE_MS);
				}, PING_INTERVAL_MS);
			};

			ws.onmessage = (event: MessageEvent<string>) => {
				try {
					const msg = JSON.parse(event.data) as Record<string, unknown>;
					switch (msg.type) {
						case "output":
							term.write(String(msg.data ?? ""));
							break;
						case "pong":
							if (pongDeadlineRef.current) {
								clearTimeout(pongDeadlineRef.current);
								pongDeadlineRef.current = null;
							}
							break;
						case "exit": {
							const code = msg.code ?? "?";
							term.writeln(
								`\r\n\x1b[33m[Process exited with code ${code}]\x1b[0m`,
							);
							break;
						}
						case "error":
							term.writeln(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m`);
							break;
						default:
							// Unknown frame type — ignore
							break;
					}
				} catch {
					// Non-JSON frame (protocol error fallback) — treat as raw output
					term.write(event.data);
				}
			};

			ws.onclose = (event: CloseEvent) => {
				if (pingTimerRef.current) {
					clearInterval(pingTimerRef.current);
					pingTimerRef.current = null;
				}
				if (pongDeadlineRef.current) {
					clearTimeout(pongDeadlineRef.current);
					pongDeadlineRef.current = null;
				}
				setStatus("closed");
				setErrorMessage(wsCodeToMessage(event.code));
			};

			ws.onerror = () => {
				setStatus("error");
				setErrorMessage("WebSocket connection failed");
			};

			// Resize observer → fit terminal → send resize frame
			let resizeDebounce: ReturnType<typeof setTimeout> | null = null;
			const ro = new ResizeObserver(() => {
				if (resizeDebounce) clearTimeout(resizeDebounce);
				resizeDebounce = setTimeout(() => {
					if (!fitRef.current || !wsRef.current) return;
					fitRef.current.fit();
					if (wsRef.current.readyState === WebSocket.OPEN) {
						wsRef.current.send(
							JSON.stringify({
								type: "resize",
								cols: term.cols,
								rows: term.rows,
							}),
						);
					}
				}, RESIZE_DEBOUNCE_MS);
			});
			ro.observe(container);
			resizeObserverRef.current = ro;
		}

		void connect();

		return () => {
			cancelled = true;
			cleanup();
		};
	}, [enabled, reconnectToken, containerEl, cleanup]);

	const reconnect = useCallback(() => {
		cleanup();
		setStatus("idle");
		setErrorMessage(null);
		abortedRef.current = false;
		// Increment token to re-trigger the effect
		setReconnectToken((n) => n + 1);
	}, [cleanup]);

	return {
		containerRef: setContainerRef,
		status,
		errorMessage,
		reconnect,
	};
}
