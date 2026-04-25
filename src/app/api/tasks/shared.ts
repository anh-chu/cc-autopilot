import { existsSync, readFileSync, writeFileSync } from "fs";

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

export interface TaskEntry {
	id: string;
	kanban: string;
	title?: string;
	assignedTo?: string | null;
	projectId?: string | null;
	blockedBy?: string[];
	updatedAt?: string;
	comments?: Array<{
		id: string;
		author: string;
		content: string;
		createdAt: string;
		attachments?: Array<{
			id: string;
			type: string;
			url: string;
			filename: string;
		}>;
	}>;
	[key: string]: unknown;
}

export interface RunEntry {
	id: string;
	taskId: string;
	status: string;
	pid: number;
	completedAt?: string | null;
	error?: string | null;
}
