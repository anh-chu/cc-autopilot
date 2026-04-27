import { readdirSync } from "node:fs";
import path from "node:path";

export interface Migration {
	version: string;
	up: () => Promise<void>;
}

/**
 * Load all migrations from the migrations directory.
 * Files are expected to export { version: string, up: () => Promise<void> }.
 */
export function loadMigrations(migrationsDir: string): Migration[] {
	const migrations: Migration[] = [];

	try {
		const files = readdirSync(migrationsDir).filter(
			(f) => f.endsWith(".ts") && !f.startsWith("index"),
		);

		for (const file of files) {
			const mod = require(path.join(migrationsDir, file)) as Migration;
			if (mod.version && typeof mod.up === "function") {
				migrations.push(mod);
			}
		}
	} catch {
		// migrations dir doesn't exist or is empty - that's fine
	}

	// Sort by version ascending
	migrations.sort((a, b) =>
		a.version.localeCompare(b.version, undefined, { numeric: true }),
	);

	return migrations;
}
