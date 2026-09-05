import { defineConfig } from 'vitest/config';

export default defineConfig({
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: 'vue',
	},
	test: {
		environment: 'jsdom',
		include: ['test/**/*.test.{ts,tsx}'],
	},
});
