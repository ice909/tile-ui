import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const fixtureRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: fixtureRoot,
	plugins: [solid()],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [path.resolve(fixtureRoot, '../../../styles/scss')],
			},
		},
	},
	build: {
		outDir: process.env.BATCH3_BROWSER_OUT_DIR,
		emptyOutDir: true,
		rollupOptions: {
			input: path.join(fixtureRoot, 'batch3-message-scroller-browser.html'),
		},
	},
});
