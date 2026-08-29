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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch5-sonner-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch5-sonner-server.tsx',
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
			lib: { entry: 'test/fixtures/batch5-sonner-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch5SonnerFixture('request-one-secret');
	const second = server.renderBatch5SonnerFixture('request-two-secret');
	assert.equal(first.html, second.html);
	assert.match(first.html, /data-id="sonner-root"/);
	assert.match(first.html, /data-id="sonner-count"[^>]*>0</);
	assert.doesNotMatch(first.html, /data-slot="toast"|data-slot="toaster"|request-(?:one|two)-secret/);
	assert.equal((first.html.match(/data-depth=/g) ?? []).length, 24);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLHeadElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'navigator']) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });
	dom.window.matchMedia = () => ({
		matches: false,
		media: '(prefers-color-scheme: dark)',
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => true,
	});

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const app = container.querySelector('[data-id="sonner-app"]');
		const root = container.querySelector('[data-id="sonner-root"]');
		const create = container.querySelector('[data-id="sonner-create"]');
		const mismatches = [];
		const originalError = console.error;
		const originalWarn = console.warn;
		console.error = (...args) => mismatches.push(args.join(' '));
		console.warn = (...args) => mismatches.push(args.join(' '));
		client.hydrateBatch5SonnerFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		console.error = originalError;
		console.warn = originalWarn;
		assert.strictEqual(container.querySelector('[data-id="sonner-app"]'), app);
		assert.strictEqual(container.querySelector('[data-id="sonner-root"]'), root);
		assert.strictEqual(container.querySelector('[data-id="sonner-create"]'), create);
		assert.deepEqual(mismatches, []);
		assert.equal(dom.window.document.querySelectorAll('[data-slot="toaster"]').length, 6);
		assert.equal(dom.window.document.querySelectorAll('[data-slot="toast"]').length, 0);
		create.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
		await Promise.resolve();
		assert.equal(container.querySelector('[data-id="sonner-count"]').textContent, '1');
		assert.equal(dom.window.document.querySelector('[data-slot="toast"]').textContent.includes('Hydrated toast'), true);
	} finally {
		for (const [key, descriptor] of Object.entries(previous)) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		}
		dom.window.close();
	}
} finally {
	await rm(outputRoot, { recursive: true, force: true });
}
