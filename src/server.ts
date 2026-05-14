/**
 * Custom Next.js server — attaches WebSocket terminal support to the HTTP server.
 *
 * In dev:  tsx watch src/server.ts
 * In prod: node dist/server.js
 *
 * Set MANDIO_ENABLE_TERMINAL=false to disable the terminal feature at runtime.
 */
import * as http from "node:http";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { terminalSessions } from "@/lib/terminal/session-manager";
import { attachTerminalUpgrade } from "@/lib/terminal/upgrade-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// When running as dist/server.js the root is one level up from dist/
const rootDir = path.resolve(__dirname, "..");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const terminalEnabled = process.env.MANDIO_ENABLE_TERMINAL !== "false";

async function main() {
	const app = next({ dev, hostname, port, dir: rootDir });
	const nextHandler = app.getRequestHandler();

	await app.prepare();

	const server = http.createServer((req, res) => {
		void nextHandler(req, res);
	});

	if (terminalEnabled) {
		const wss = new WebSocketServer({ noServer: true });
		attachTerminalUpgrade(server, wss);
		terminalSessions.startReaper();
		console.log("[server] Terminal WebSocket enabled at /api/terminal/ws");
	} else {
		console.log(
			"[server] Terminal WebSocket disabled (MANDIO_ENABLE_TERMINAL=false)",
		);
	}

	const shutdown = (signal: string) => {
		console.log(`[server] received ${signal}, shutting down`);
		terminalSessions.killAll();
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(1), 10_000).unref();
	};
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));

	server.listen(port, hostname, () => {
		console.log(`[server] ready on http://${hostname}:${port}`);
	});
}

main().catch((err) => {
	console.error("[server] fatal", err);
	process.exit(1);
});
