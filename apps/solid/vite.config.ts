import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig, type Plugin } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, '../..');
const solidPackageRoot = path.join(workspaceRoot, 'packages/solid');

function assertSolidPackageResolution(): Plugin {
	const resolved = new Set();
	const entries = {
		'@tile-ui/solid': { browser: 'dist/browser.js', server: 'dist/server.js' },
		'@tile-ui/solid/primitives': { browser: 'dist/primitives/browser.js', server: 'dist/primitives/server.js' },
	} as const;
	return {
		name: 'tile-ui-solid-package-resolution',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!(source in entries)) return;
			const result = await this.resolve(source, importer, { ...options, skipSelf: true });
			if (!result) throw new Error(`Unable to resolve ${source} through package exports.`);
			const entry = entries[source as keyof typeof entries];
			const condition = options.ssr ? 'server' : 'browser';
			const expected = path.join(solidPackageRoot, entry[condition]);
			if (path.normalize(result.id) !== path.normalize(expected)) {
				throw new Error(`${source} resolved to ${result.id}; expected ${expected}.`);
			}
			resolved.add(`${source}:${condition}`);
			return result;
		},
		buildEnd() {
			const condition = this.environment.name === 'client' ? 'browser' : this.environment.name === 'ssr' ? 'server' : undefined;
			if (!condition) return;
			for (const [source, entry] of Object.entries(entries)) {
				if (!resolved.has(`${source}:${condition}`)) throw new Error(`${this.environment.name} build did not resolve ${source} to ${entry[condition]}.`);
				this.info(`Verified ${source} ${this.environment.name} resolution: packages/solid/${entry[condition]}`);
			}
		},
	};
}

export default defineConfig({
	plugins: [assertSolidPackageResolution(), solidStart({ ssr: true }), nitro()],
	resolve: {
		alias: {
			'@tile-ui/core': path.join(workspaceRoot, 'packages/core/src/index.ts'),
			'@tile-ui/styles': path.join(workspaceRoot, 'packages/styles'),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [path.join(workspaceRoot, 'packages/styles/scss')],
			},
		},
	},
	server: {
		port: 3003,
		fs: { allow: [workspaceRoot] },
	},
	nitro: {
		preset: 'node-server',
	},
});
