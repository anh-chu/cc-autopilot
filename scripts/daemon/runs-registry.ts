/**
 * Shared JSON-file read/write utilities for daemon registries (recovery.ts, etc.).
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export function readJsonFile<T>(filePath: string, defaultValue: T): T {
	try {
		if (!existsSync(filePath)) {
			return defaultValue;
		}
		const raw = readFileSync(filePath, "utf-8");
		return JSON.parse(raw) as T;
	} catch {
		return defaultValue;
	}
}

/** Atomic write via tmp+rename to prevent partial reads. */
export function atomicWriteJson<T>(filePath: string, data: T): void {
	const tmp = `${filePath}.tmp`;
	writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
	renameSync(tmp, filePath);
}
