import { existsSync, lstatSync, readdirSync, readlinkSync } from "node:fs";
import {
	lstat,
	mkdir,
	readdir,
	readlink,
	symlink,
	unlink,
} from "node:fs/promises";
import path from "node:path";
import {
	getGlobalCommandDir,
	getGlobalCommandsDir,
	getWorkspaceCommandLink,
	getWorkspaceCommandsDir,
	MANDIO_COMMAND_PREFIX,
} from "./paths";

/** List command IDs (directory names) from a commands base directory */
async function listCommandIds(commandsBaseDir: string): Promise<string[]> {
	if (!existsSync(commandsBaseDir)) return [];
	const entries = await readdir(commandsBaseDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isDirectory() || e.isSymbolicLink())
		.map((e) => e.name);
}

/** Activate a command for a workspace (create directory symlink) */
export async function activateCommand(
	workspaceId: string,
	commandId: string,
): Promise<void> {
	const globalDir = getGlobalCommandDir(commandId);
	if (!existsSync(globalDir)) {
		throw new Error(`Command ${commandId} not found in global store`);
	}
	const linkPath = getWorkspaceCommandLink(workspaceId, commandId);
	const parentDir = path.dirname(linkPath);
	await mkdir(parentDir, { recursive: true });

	// Remove existing link if present (idempotent)
	try {
		const st = await lstat(linkPath);
		if (st.isSymbolicLink()) {
			await unlink(linkPath); // remove old/broken symlink
		} else {
			throw new Error(`Command path exists and is not a symlink: ${linkPath}`);
		}
	} catch (err: unknown) {
		const code =
			err && typeof err === "object" && "code" in err
				? (err as { code: string }).code
				: undefined;
		if (code !== "ENOENT") throw err;
		// doesn't exist — fine, proceed to create
	}
	await symlink(globalDir, linkPath, "dir");
}

/** Deactivate a command for a workspace (remove symlink) */
export async function deactivateCommand(
	workspaceId: string,
	commandId: string,
): Promise<void> {
	const linkPath = getWorkspaceCommandLink(workspaceId, commandId);
	try {
		const stats = await lstat(linkPath);
		if (stats.isSymbolicLink()) {
			await unlink(linkPath);
		}
	} catch (err: unknown) {
		const code =
			err && typeof err === "object" && "code" in err
				? (err as { code: string }).code
				: undefined;
		if (err instanceof Error && err.message.includes("not a symlink"))
			throw err;
		if (code !== "ENOENT") throw err;
		// Already gone — fine
	}
}

/** List activated command IDs for a workspace (strips mandio- prefix) */
export async function listActivatedCommands(
	workspaceId: string,
): Promise<string[]> {
	const dir = getWorkspaceCommandsDir(workspaceId);
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	const ids: string[] = [];
	for (const entry of entries) {
		if (entry.name.startsWith(MANDIO_COMMAND_PREFIX)) {
			// Check if symlink is valid (not broken)
			const fullPath = path.join(dir, entry.name);
			try {
				const stats = await lstat(fullPath);
				if (stats.isSymbolicLink()) {
					const target = await readlink(fullPath);
					const resolved = path.isAbsolute(target)
						? target
						: path.resolve(dir, target);
					if (existsSync(resolved)) {
						ids.push(entry.name.slice(MANDIO_COMMAND_PREFIX.length));
					} else {
						console.warn(
							`Broken command symlink (target missing): ${fullPath}`,
						);
					}
				}
			} catch {
				// broken symlink — skip, log warning
				console.warn(`Broken command symlink: ${fullPath}`);
			}
		}
	}
	return ids;
}

/** List activated command IDs for a workspace synchronously (strips mandio- prefix) */
export function listActivatedCommandsSync(workspaceId: string): string[] {
	const dir = getWorkspaceCommandsDir(workspaceId);
	if (!existsSync(dir)) return [];
	const entries = readdirSync(dir, { withFileTypes: true });
	const ids: string[] = [];
	for (const entry of entries) {
		if (entry.name.startsWith(MANDIO_COMMAND_PREFIX)) {
			const fullPath = path.join(dir, entry.name);
			try {
				const stats = lstatSync(fullPath);
				if (stats.isSymbolicLink()) {
					const target = readlinkSync(fullPath);
					const resolved = path.isAbsolute(target)
						? target
						: path.resolve(dir, target);
					if (existsSync(resolved)) {
						ids.push(entry.name.slice(MANDIO_COMMAND_PREFIX.length));
					} else {
						console.warn(
							`Broken command symlink (target missing): ${fullPath}`,
						);
					}
				}
			} catch {
				console.warn(`Broken command symlink: ${fullPath}`);
			}
		}
	}
	return ids;
}

/** Check if a command is activated for a workspace */
export async function isCommandActivated(
	workspaceId: string,
	commandId: string,
): Promise<boolean> {
	const linkPath = getWorkspaceCommandLink(workspaceId, commandId);
	try {
		const stats = await lstat(linkPath);
		return stats.isSymbolicLink();
	} catch {
		return false;
	}
}

/** Activate all global commands for a workspace */
export async function activateAllCommands(workspaceId: string): Promise<void> {
	const globalDir = getGlobalCommandsDir();
	const commandIds = await listCommandIds(globalDir);
	for (const id of commandIds) {
		await activateCommand(workspaceId, id);
	}
}

/** Remove all workspace symlinks for a specific command across all workspaces */
export async function deactivateCommandFromAllWorkspaces(
	commandId: string,
	workspaceIds: string[],
): Promise<void> {
	for (const wsId of workspaceIds) {
		await deactivateCommand(wsId, commandId);
	}
}
