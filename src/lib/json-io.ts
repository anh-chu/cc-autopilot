import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function readJSON<T>(file: string): T | null {
	try {
		if (!existsSync(file)) return null;
		return JSON.parse(readFileSync(file, "utf-8")) as T;
	} catch {
		return null;
	}
}

export function writeJSON(file: string, data: unknown): void {
	writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}
