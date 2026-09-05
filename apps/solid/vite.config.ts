import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig, type Plugin } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, '../..');
const solidPackageRoot = path.join(workspaceRoot, 'packages/solid');
const docsRoot = path.join(dirname, 'content/docs');
const staticNitroEntry = '\0tile-ui-static-nitro-entry';

function collectDocRoutes(directory = docsRoot, base = ''): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const relative = base ? path.join(base, entry.name) : entry.name;
		if (entry.isDirectory()) return collectDocRoutes(path.join(directory, entry.name), relative);
		if (!entry.name.endsWith('.mdx')) return [];
		const segments = relative.replace(/\.mdx$/, '').split(path.sep);
		if (segments.at(-1) === 'index') segments.pop();
		return [`/docs${segments.length ? `/${segments.join('/')}` : ''}`];
	});
}

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

function staticNitroEntryPlugin(): Plugin {
	return {
		name: 'tile-ui-static-nitro-entry',
		configEnvironment(name, config) {
			if (name !== 'nitro') return;
			config.build ??= {};
			config.build.rolldownOptions ??= {};
			config.build.rolldownOptions.input = staticNitroEntry;
		},
		resolveId(source) {
			if (source === staticNitroEntry) return source;
		},
		load(id) {
			if (id === staticNitroEntry) return 'export default {}';
		},
	};
}

export default defineConfig({
	plugins: [assertSolidPackageResolution(), solidStart({ ssr: true }), nitro(), staticNitroEntryPlugin()],
	optimizeDeps: {
		// SolidStart's dev sourcemap client loads this CommonJS dependency lazily.
		include: ['@jridgewell/resolve-uri'],
	},
	resolve: {
		alias: {
			'@tile-ui/core/liveline': path.join(workspaceRoot, 'packages/core/src/liveline/index.ts'),
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
		preset: 'static',
		serveStatic: false,
		output: {
			publicDir: path.join(dirname, 'dist'),
		},
		prerender: {
			crawlLinks: false,
			routes: ['/', ...collectDocRoutes()],
		},
	},
});
