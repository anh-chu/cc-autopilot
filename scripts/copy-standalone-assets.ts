/**
 * Copy static assets to standalone output directory.
 * Next.js standalone does not include public/ or .next/static/,
 * so we copy them manually after build.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const standaloneDir = resolve(".next/standalone");
const publicDir = resolve("public");
const staticDir = resolve(".next/static");
const outputPublicDir = join(standaloneDir, "public");
const outputStaticDir = join(standaloneDir, ".next/static");

if (!existsSync(standaloneDir)) {
	console.log("No standalone output found, skipping asset copy");
	process.exit(0);
}

// Copy public/ to standalone/public/
if (existsSync(publicDir)) {
	console.log("Copying public/ to standalone/public/");
	if (existsSync(outputPublicDir)) {
		rmSync(outputPublicDir, { recursive: true });
	}
	cpSync(publicDir, outputPublicDir, { recursive: true });
} else {
	console.log("No public/ directory found, skipping");
}

// Copy .next/static/ to standalone/.next/static/
if (existsSync(staticDir)) {
	console.log("Copying .next/static/ to standalone/.next/static/");
	if (existsSync(outputStaticDir)) {
		rmSync(outputStaticDir, { recursive: true });
	}
	cpSync(staticDir, outputStaticDir, { recursive: true });
} else {
	console.log("No .next/static/ directory found, skipping");
}

console.log("Static assets copied successfully");
