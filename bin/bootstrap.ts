import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "os";
import path from "path";

// Data directory constants (replicated from src/lib/paths.ts to avoid cross-module issues)
const DATA_DIR: string = process.env.CMC_DATA_DIR
	? path.resolve(process.env.CMC_DATA_DIR)
	: path.join(os.homedir(), ".cmc");

function getWorkspaceDir(workspaceId: string): string {
	return path.join(DATA_DIR, "workspaces", workspaceId);
}

import { loadMigrations, type Migration } from "./migrations";

const VERSION_FILE = ".version";

/**
 * Bootstrap the data directory for Mission Control.
 * Creates the base ~/.cmc/ structure and runs migrations if needed.
 */
export async function bootstrapDataDir(): Promise<void> {
	ensureDataDir();
	await writeVersion();
	await ensureDefaultWorkspace();
	await ensureLogsDir();
	await runMigrationsIfNeeded();
}

/**
 * Ensure the base data directory exists.
 */
function ensureDataDir(): void {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
		console.log(`[bootstrap] Created ${DATA_DIR}`);
	}
}

/**
 * Read the current package version from package.json.
 */
function getCurrentVersion(): string {
	const pkgPath = path.join(process.cwd(), "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	return pkg.version;
}

/**
 * Write the current version to ~/.cmc/.version.
 */
async function writeVersion(): Promise<void> {
	const versionPath = path.join(DATA_DIR, VERSION_FILE);
	const currentVersion = getCurrentVersion();

	if (!existsSync(versionPath)) {
		writeFileSync(versionPath, currentVersion, "utf-8");
		console.log(`[bootstrap] Written ${VERSION_FILE}: ${currentVersion}`);
	} else {
		const existing = readFileSync(versionPath, "utf-8").trim();
		if (existing !== currentVersion) {
			writeFileSync(versionPath, currentVersion, "utf-8");
			console.log(
				`[bootstrap] Updated ${VERSION_FILE}: ${existing} -> ${currentVersion}`,
			);
		}
	}
}

/**
 * Ensure the default workspace exists with seed structure.
 */
async function ensureDefaultWorkspace(): Promise<void> {
	const defaultWs = getWorkspaceDir("default");

	// Seed files to create if they don't exist
	const seedFiles: Record<string, unknown> = {
		"tasks.json": [],
		"projects.json": [],
		"inbox.json": [],
	};

	for (const [filename, defaultContent] of Object.entries(seedFiles)) {
		const filePath = path.join(defaultWs, filename);
		if (!existsSync(filePath)) {
			const dir = path.dirname(filePath);
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
			console.log(`[bootstrap] Created ${filename} in default workspace`);
		}
	}

	// Create logs subdirectory if needed
	const logsSubDir = path.join(defaultWs, "logs");
	if (!existsSync(logsSubDir)) {
		mkdirSync(logsSubDir, { recursive: true });
		console.log(`[bootstrap] Created logs/ in default workspace`);
	}
}

/**
 * Ensure the logs directory exists at ~/.cmc/logs/.
 */
function ensureLogsDir(): void {
	const logsDir = path.join(DATA_DIR, "logs");
	if (!existsSync(logsDir)) {
		mkdirSync(logsDir, { recursive: true });
		console.log(`[bootstrap] Created ${logsDir}`);
	}
}

/**
 * Read stored version from ~/.cmc/.version.
 */
function getStoredVersion(): string | null {
	const versionPath = path.join(DATA_DIR, VERSION_FILE);
	if (!existsSync(versionPath)) return null;

	try {
		return readFileSync(versionPath, "utf-8").trim();
	} catch {
		return null;
	}
}

/**
 * If stored version differs from current, run migrations.
 */
async function runMigrationsIfNeeded(): Promise<void> {
	const currentVersion = getCurrentVersion();
	const storedVersion = getStoredVersion();

	// No stored version = fresh install, no migrations needed
	if (!storedVersion) {
		console.log(`[bootstrap] Fresh install, skipping migrations`);
		return;
	}

	// Same version = already bootstrapped, no migrations
	if (storedVersion === currentVersion) {
		console.log(
			`[bootstrap] Already at current version ${currentVersion}, skipping migrations`,
		);
		return;
	}

	console.log(
		`[bootstrap] Running migrations: ${storedVersion} -> ${currentVersion}`,
	);

	// Load and run migrations
	const migrationsDir = path.join(__dirname, "migrations");
	const migrations = loadMigrations(migrationsDir);

	for (const migration of migrations) {
		const needsRun =
			migration.version > storedVersion && migration.version <= currentVersion;

		if (needsRun) {
			console.log(`[bootstrap] Applying migration ${migration.version}...`);
			await migration.up();
			console.log(`[bootstrap] Applied migration ${migration.version}`);
		}
	}

	// Update version file after migrations
	const versionPath = path.join(DATA_DIR, VERSION_FILE);
	writeFileSync(versionPath, currentVersion, "utf-8");
	console.log(`[bootstrap] Version updated to ${currentVersion}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	bootstrapDataDir()
		.then(() => {
			console.log("[bootstrap] Done");
			process.exit(0);
		})
		.catch((err) => {
			console.error("[bootstrap] Error:", err);
			process.exit(1);
		});
}
