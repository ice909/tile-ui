import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import solid from 'vite-plugin-solid';
import { build } from 'vite';

const packageRoot = path.resolve(import.meta.dirname, '../..');
const stylesRoot = path.resolve(packageRoot, '../styles/scss');
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-liveline-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/liveline-server.tsx',
			outDir: path.join(outputRoot, 'server'),
			emptyOutDir: true,
			rollupOptions: { output: { entryFileNames: 'fixture.mjs' } },
		},
	});
	await build({
		root: packageRoot,
		plugins: [solid({ solid: { hydratable: true } })],
		logLevel: 'error',
		css,
		resolve: { conditions: ['browser'] },
		build: {
			outDir: path.join(outputRoot, 'client'),
			emptyOutDir: true,
			lib: { entry: 'test/fixtures/liveline-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const rendered = server.renderLivelineFixture();
	assert.match(rendered.html, /data-slot="liveline"/);
	assert.match(rendered.html, /data-slot="liveline-canvas"/);
	assert.match(rendered.html, /Hydrated live chart/);
	assert.match(rendered.html, />Line</);
	assert.doesNotMatch(rendered.html, />Candle</);

	const dom = new JSDOM(`${rendered.hydrationScript}<div id="app">${rendered.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'navigator']) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });
	dom.window.matchMedia = () => ({
		matches: true,
		media: '',
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => true,
	});
	dom.window.requestAnimationFrame = (callback) => dom.window.setTimeout(() => callback(0), 0);
	dom.window.cancelAnimationFrame = (handle) => dom.window.clearTimeout(handle);
	dom.window.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: dom.window.ResizeObserver, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-slot="liveline"]');
		const canvas = container.querySelector('[data-slot="liveline-canvas"]');
		const errors = [];
		const originalError = console.error;
		console.error = (...args) => errors.push(args.join(' '));
		const dispose = client.hydrateLivelineFixture(container, rendered.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		console.error = originalError;
		assert.strictEqual(container.querySelector('[data-slot="liveline"]'), root);
		assert.strictEqual(container.querySelector('[data-slot="liveline-canvas"]'), canvas);
		assert.deepEqual(errors, []);
		container.querySelector('[data-id="liveline-update"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
		await Promise.resolve();
		dispose();
	} finally {
		for (const [key, descriptor] of Object.entries(previous)) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		}
		delete globalThis.ResizeObserver;
		dom.window.close();
	}
} finally {
	await rm(outputRoot, { recursive: true, force: true });
}
