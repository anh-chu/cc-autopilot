import os from "node:os";
import path from "node:path";

const TEST_DATA_DIR = path.join(os.tmpdir(), "mandio-vitest");
const resolvedTmp = path.resolve(os.tmpdir());
const resolvedDataDir = path.resolve(
	process.env.MANDIO_DATA_DIR ?? TEST_DATA_DIR,
);

if (!resolvedDataDir.startsWith(`${resolvedTmp}${path.sep}`)) {
	throw new Error(
		`Tests must use a data directory under ${resolvedTmp}, got ${resolvedDataDir}`,
	);
}

process.env.MANDIO_DATA_DIR = resolvedDataDir;
