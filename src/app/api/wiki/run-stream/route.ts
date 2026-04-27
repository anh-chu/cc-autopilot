import {
	closeSync,
	existsSync,
	openSync,
	readFileSync,
	readSync,
	statSync,
	watch,
} from "node:fs";
import path from "node:path";
import { getWikiDir } from "@/lib/paths";
import { applyWorkspaceContext } from "@/lib/workspace-context";
import type { WikiRunRecord } from "../../../../../scripts/daemon/run-wiki-generate";

/**
 * SSE endpoint: streams wiki run events in real-time.
 * Query params:
 *   runId  - required
 *   since  - byte offset to resume from (default 0)
 */
export async function GET(request: Request) {
	const workspaceId = await applyWorkspaceContext();
	const { searchParams } = new URL(request.url);
	const runId = searchParams.get("runId") ?? "";
	const since = Math.max(0, Number(searchParams.get("since") ?? "0") || 0);

	if (!runId) {
		return new Response("runId is required", { status: 400 });
	}

	const wikiDir = getWikiDir(workspaceId);
	const runFile = path.join(wikiDir, ".runs", `${runId}.json`);
	if (!existsSync(runFile)) {
		return new Response("Run not found", { status: 404 });
	}

	const run = JSON.parse(readFileSync(runFile, "utf-8")) as WikiRunRecord;
	const streamPath = run.streamFile
		? path.join(wikiDir, run.streamFile)
		: path.join(wikiDir, ".runs", `${runId}.stream.jsonl`);

	const encoder = new TextEncoder();
	let offset = since;
	let closed = false;

	const stream = new ReadableStream({
		start(controller) {
			function sendEvent(event: string, data: string) {
				if (closed) return;
				controller.enqueue(
					encoder.encode(`event: ${event}\ndata: ${data}\n\n`),
				);
			}

			function flush() {
				if (closed || !existsSync(streamPath)) return;
				const stat = statSync(streamPath);
				if (stat.size <= offset) return;

				const buf = Buffer.alloc(stat.size - offset);
				const fd = openSync(streamPath, "r");
				readSync(fd, buf, 0, buf.length, offset);
				closeSync(fd);
				offset += buf.length;

				const chunk = buf.toString("utf-8");
				const lines = chunk.split("\n").filter((l: string) => l.trim());
				for (const line of lines) {
					sendEvent("message", line);
				}
			}

			// Send initial offset so client knows where we started
			sendEvent("offset", String(offset));

			// Flush any existing data
			flush();

			// If stream file doesn't exist yet, wait for it
			if (!existsSync(streamPath)) {
				// Watch the directory for the file to appear
				const dirWatcher = watch(path.dirname(streamPath), (_, filename) => {
					if (filename === path.basename(streamPath)) {
						dirWatcher.close();
						startFileWatch();
					}
				});
				request.signal.addEventListener("abort", () => {
					dirWatcher.close();
				});
			} else {
				startFileWatch();
			}

			function startFileWatch() {
				// Check if run is already done
				const currentRun = JSON.parse(
					readFileSync(runFile, "utf-8"),
				) as WikiRunRecord;
				if (
					currentRun.status === "completed" ||
					currentRun.status === "failed"
				) {
					flush();
					sendEvent("done", JSON.stringify({ status: currentRun.status }));
					if (!closed) {
						closed = true;
						controller.close();
					}
					return;
				}

				const watcher = watch(streamPath, () => {
					flush();
				});

				// Also poll run status to detect completion
				const statusInterval = setInterval(() => {
					if (closed) {
						clearInterval(statusInterval);
						return;
					}
					try {
						const r = JSON.parse(
							readFileSync(runFile, "utf-8"),
						) as WikiRunRecord;
						if (r.status === "completed" || r.status === "failed") {
							flush();
							sendEvent("done", JSON.stringify({ status: r.status }));
							clearInterval(statusInterval);
							watcher.close();
							if (!closed) {
								closed = true;
								controller.close();
							}
						}
					} catch {
						// ignore read errors
					}
				}, 1000);

				request.signal.addEventListener("abort", () => {
					closed = true;
					watcher.close();
					clearInterval(statusInterval);
				});
			}

			request.signal.addEventListener("abort", () => {
				closed = true;
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
