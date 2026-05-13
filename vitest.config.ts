import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

const TEST_DATA_DIR = path.join(os.tmpdir(), "mandio-vitest");

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
		fileParallelism: false,
		testTimeout: 15000,
		globalSetup: "./__tests__/global-setup.ts",
		setupFiles: ["./__tests__/setup-env.ts"],
		env: {
			MANDIO_DATA_DIR: TEST_DATA_DIR,
			MANDIO_DEFAULT_MODEL: "haiku",
			MANDIO_ALLOW_AGENT_IN_TESTS: "0",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
});
