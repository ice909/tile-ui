import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import solid from 'vite-plugin-solid';
import { build } from 'vite';

const packageRoot = path.resolve(import.meta.dirname, '..');
const stylesRoot = path.resolve(packageRoot, '../styles/scss');
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch4-overlay-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch4-overlay-server.tsx',
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
			lib: { entry: 'test/fixtures/batch4-overlay-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch4OverlayFixture();
	const second = server.renderBatch4OverlayFixture();
	assert.equal(first.html, second.html);
	assert.doesNotMatch(first.html, /data-id="tooltip-trigger"[^>]*aria-describedby/);
	assert.match(first.html, /data-id="popover-trigger"[^>]*aria-expanded="false"/);
	assert.match(first.html, /data-id="popover-trigger"[^>]*aria-controls="ssr-popover-content"/);
	assert.match(first.html, /data-id="open-trigger"[^>]*aria-expanded="true"/);
	assert.doesNotMatch(first.html, /data-id="(?:tooltip|hover|popover|open)-content"/);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of [
		'window',
		'document',
		'Document',
		'Node',
		'Element',
		'HTMLElement',
		'HTMLHeadElement',
		'HTMLBodyElement',
		'HTMLButtonElement',
		'HTMLInputElement',
		'SVGElement',
		'Event',
		'MouseEvent',
		'PointerEvent',
		'FocusEvent',
		'KeyboardEvent',
		'DOMRect',
		'navigator',
		'getComputedStyle',
	]) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, {
			configurable: true,
			value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key],
			writable: true,
		});
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-id="batch4-overlay-root"]');
		const tooltipTrigger = container.querySelector('[data-id="tooltip-trigger"]');
		const popoverTrigger = container.querySelector('[data-id="popover-trigger"]');
		const openTrigger = container.querySelector('[data-id="open-trigger"]');
		client.hydrateBatch4OverlayFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch4-overlay-root"]'), root);
		assert.strictEqual(container.querySelector('[data-id="tooltip-trigger"]'), tooltipTrigger);
		assert.strictEqual(container.querySelector('[data-id="popover-trigger"]'), popoverTrigger);
		assert.strictEqual(container.querySelector('[data-id="open-trigger"]'), openTrigger);
		assert.equal(tooltipTrigger.getAttribute('aria-describedby'), null);
		assert.equal(popoverTrigger.getAttribute('aria-expanded'), 'false');
		assert.equal(openTrigger.getAttribute('aria-expanded'), 'true');
		assert.equal(dom.window.document.querySelector('#ssr-tooltip-content').hidden, true);
		assert.equal(dom.window.document.querySelector('#ssr-hover-content').hidden, false);
		assert.equal(dom.window.document.querySelector('#ssr-popover-content').dataset.state, 'closed');
		assert.equal(dom.window.document.querySelector('#ssr-popover-content').hidden, false);
		assert.equal(dom.window.document.querySelector('#ssr-open-content').dataset.state, 'open');
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
