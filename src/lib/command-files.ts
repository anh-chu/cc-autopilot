import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export interface CommandFrontmatter {
	name: string;
	command: string;
	description: string;
	longDescription: string;
	icon?: string;
}

export interface CommandFileData {
	id: string; // derived from directory name
	name: string;
	command: string;
	description: string;
	longDescription: string;
	icon: string; // default "Terminal"
	content: string; // markdown body (no frontmatter)
	createdAt: string; // from fs stat mtime
	updatedAt: string; // from fs stat mtime
}

/** Parse a user.md file content string into CommandFileData */
export function parseCommandFile(
	id: string,
	raw: string,
): Omit<CommandFileData, "createdAt" | "updatedAt"> {
	const { data, content } = matter(raw);
	return {
		id,
		name: data.name || id,
		command: data.command || "",
		description: data.description || "",
		longDescription: data.longDescription || "",
		icon: data.icon || "Terminal",
		content: content.trim(),
	};
}

/** Serialize CommandFileData back to user.md format */
export function serializeCommandFile(
	cmd: CommandFileData | Omit<CommandFileData, "createdAt" | "updatedAt">,
): string {
	const frontmatter: CommandFrontmatter = {
		name: cmd.name,
		command: cmd.command,
		description: cmd.description,
		longDescription: cmd.longDescription,
		icon: cmd.icon,
	};
	return matter.stringify(cmd.content, frontmatter);
}

/** Read a single command from its directory */
export async function readCommandFile(
	cmdDir: string,
): Promise<CommandFileData | null> {
	const filePath = path.join(cmdDir, "user.md");
	if (!existsSync(filePath)) return null;
	const raw = await readFile(filePath, "utf-8");
	const id = path.basename(cmdDir);
	const parsed = parseCommandFile(id, raw);
	const stats = await stat(filePath);
	return {
		...parsed,
		createdAt: stats.birthtime.toISOString(),
		updatedAt: stats.mtime.toISOString(),
	};
}

/** Read a single command from its directory (sync version) */
export function readCommandFileSync(cmdDir: string): CommandFileData | null {
	const filePath = path.join(cmdDir, "user.md");
	if (!existsSync(filePath)) return null;
	const raw = readFileSync(filePath, "utf-8");
	const id = path.basename(cmdDir);
	const parsed = parseCommandFile(id, raw);
	const stats = statSync(filePath);
	return {
		...parsed,
		createdAt: stats.birthtime.toISOString(),
		updatedAt: stats.mtime.toISOString(),
	};
}

/** Write a command to its directory (creates dir if needed) */
export async function writeCommandFile(
	cmdDir: string,
	cmd: CommandFileData | Omit<CommandFileData, "createdAt" | "updatedAt">,
): Promise<void> {
	await mkdir(cmdDir, { recursive: true });
	const filePath = path.join(cmdDir, "user.md");
	const content = serializeCommandFile(cmd);
	await writeFile(filePath, content, "utf-8");
}

/** List all command IDs (directory names) from a commands base directory */
export async function listCommandIds(baseDir: string): Promise<string[]> {
	if (!existsSync(baseDir)) return [];
	const entries = await readdir(baseDir, { withFileTypes: true });
	const ids: string[] = [];
	for (const entry of entries) {
		if (entry.isDirectory() || entry.isSymbolicLink()) {
			const userMd = path.join(baseDir, entry.name, "user.md");
			if (existsSync(userMd)) {
				ids.push(entry.name);
			}
		}
	}
	return ids;
}

/** List all command IDs (directory names) from a commands base directory (sync version) */
export function listCommandIdsSync(baseDir: string): string[] {
	if (!existsSync(baseDir)) return [];
	const entries = readdirSync(baseDir, { withFileTypes: true });
	const ids: string[] = [];
	for (const entry of entries) {
		if (entry.isDirectory() || entry.isSymbolicLink()) {
			const userMd = path.join(baseDir, entry.name, "user.md");
			if (existsSync(userMd)) {
				ids.push(entry.name);
			}
		}
	}
	return ids;
}

/** Read all commands from a commands base directory */
export async function readAllCommands(
	baseDir: string,
): Promise<CommandFileData[]> {
	const ids = await listCommandIds(baseDir);
	const commands: CommandFileData[] = [];
	for (const id of ids) {
		const cmd = await readCommandFile(path.join(baseDir, id));
		if (cmd) commands.push(cmd);
	}
	return commands;
}

/** Read all commands from a commands base directory (sync version) */
export function readAllCommandsSync(baseDir: string): CommandFileData[] {
	const ids = listCommandIdsSync(baseDir);
	const commands: CommandFileData[] = [];
	for (const id of ids) {
		const cmd = readCommandFileSync(path.join(baseDir, id));
		if (cmd) commands.push(cmd);
	}
	return commands;
}
