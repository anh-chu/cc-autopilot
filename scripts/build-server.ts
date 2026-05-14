#!/usr/bin/env node
/**
 * Bundle src/server.ts → dist/server.js with esbuild.
 * Mirrors scripts/build-cli.ts but for the custom Next.js server.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function buildServer() {
	const distDir = path.join(rootDir, "dist");
	if (!fs.existsSync(distDir)) {
		fs.mkdirSync(distDir, { recursive: true });
	}

	const srcPath = path.join(rootDir, "src/server.ts");
	const distPath = path.join(rootDir, "dist/server.js");

	console.log("Building: src/server.ts → dist/server.js");

	await build({
		entryPoints: [srcPath],
		bundle: true,
		platform: "node",
		target: "node18",
		format: "esm",
		outfile: distPath,
		external: [
			"next",
			"node-pty",
			"ws",
			"next-auth",
			"next-auth/jwt",
			"@anthropic-ai/claude-agent-sdk",
			"tree-kill",
			"dotenv",
			"nanoid",
		],
		alias: {
			"@": path.resolve(rootDir, "src"),
		},
		sourcemap: false,
		minify: false,
		banner: {
			js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
		},
	});

	const stats = fs.statSync(distPath);
	console.log(`  ✓ dist/server.js (${(stats.size / 1024).toFixed(1)} KB)`);
}

buildServer()
	.then(() => {
		console.log("\n✅ Server build complete");
	})
	.catch((err) => {
		console.error("❌ Build failed:", err);
		process.exit(1);
	});
