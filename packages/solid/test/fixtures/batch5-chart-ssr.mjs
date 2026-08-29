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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch5-chart-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch5-chart-server.tsx',
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
			lib: { entry: 'test/fixtures/batch5-chart-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch5ChartFixture();
	const second = server.renderBatch5ChartFixture();
	assert.equal(first.html, second.html);
	assert.match(first.html, /data-chart="chart-batch5-chart-/);
	assert.match(first.html, /width="480" height="240" viewBox="0 0 480 240"/);
	assert.match(first.html, /aria-label="Revenue trend"/);
	assert.match(first.html, /<title[^>]*>Revenue trend<\/title>/);
	assert.match(first.html, /\\3c /);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of ['window', 'document', 'Node', 'HTMLElement', 'SVGElement', 'Event', 'PointerEvent', 'KeyboardEvent', 'navigator', 'ResizeObserver']) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: key === 'ResizeObserver' ? undefined : dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-id="batch5-chart-root"]');
		const svg = container.querySelector('svg');
		const style = container.querySelector('style');
		client.hydrateBatch5ChartFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch5-chart-root"]'), root);
		assert.strictEqual(container.querySelector('svg'), svg);
		assert.strictEqual(container.querySelector('style'), style);
		assert.equal(container.querySelector('svg').getAttribute('width'), '480');
		assert.equal(dom.window.chartAttack, undefined);
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
