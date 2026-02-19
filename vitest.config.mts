import {playwright} from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
	optimizeDeps: {
		include: ['@avanio/logger-like', '@luolapeikko/result-option', '@luolapeikko/ts-common', 'events', 'zod'],
	},
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			events: 'events',
		},
	},
	test: {
		coverage: {
			exclude: ['**/dist/**', '**/*.test-d.ts', '**/index.ts'],
			include: ['packages/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'lcov'],
		},
		globals: true,
		projects: [
			// Default Node tests (exclude the browser package)
			{
				test: {
					environment: 'node',
					exclude: ['packages/variable-util-vite/**/*.test.ts', '**/node_modules/**'],
					include: ['packages/**/*.test.ts'],
					name: 'node',
				},
			},
			// Browser tests only for tachyon-drive-browser
			{
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{browser: 'chromium'}],
						provider: playwright({}),
					},
					exclude: ['**/node_modules/**'],
					include: ['packages/variable-util-vite/**/*.test.ts'],
					name: 'chrome',
				},
			},
		],
		typecheck: {include: ['**/*.test-d.ts']},
	},
});
