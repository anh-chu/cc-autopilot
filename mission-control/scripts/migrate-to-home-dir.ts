#!/usr/bin/env tsx
/**
 * One-time migration: copies mission-control/data/ → ~/.cmc/
 * Safe to run multiple times — skips if ~/.cmc already has content.
 * Does NOT delete the source directory.
 */
import { existsSync, readdirSync } from "fs";
import { cp, mkdir } from "fs/promises";
import path from "path";
import os from "os";

const SRC = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const DEST = process.env.CMC_DATA_DIR
  ? path.resolve(process.env.CMC_DATA_DIR)
  : path.join(os.homedir(), ".cmc");

async function main() {
  console.log(`Migration: ${SRC} → ${DEST}`);

  if (!existsSync(SRC)) {
    console.log("Source directory mission-control/data/ not found — nothing to migrate.");
    console.log(`Creating empty ${DEST}...`);
    await mkdir(DEST, { recursive: true });
    console.log("Done.");
    return;
  }

  if (existsSync(DEST) && readdirSync(DEST).length > 0) {
    console.log(`${DEST} already exists and has content — skipping migration.`);
    console.log("If you want to re-migrate, remove ~/.cmc first.");
    return;
  }

  await mkdir(DEST, { recursive: true });
  await cp(SRC, DEST, { recursive: true });

  const count = readdirSync(DEST).length;
  console.log(`✓ Migrated ${count} top-level entries to ${DEST}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Verify the app works with the new data location");
  console.log("  2. Then manually remove mission-control/data/ if no longer needed");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
