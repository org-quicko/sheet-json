import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		setupFiles: ["tests/setup.ts"],
		testTimeout: 60_000,
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/**/index.ts", "src/commands/**"],
		},
	},
});
