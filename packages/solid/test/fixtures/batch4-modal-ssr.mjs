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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch4-modal-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch4-modal-server.tsx',
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
			lib: { entry: 'test/fixtures/batch4-modal-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});
	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const closedFirst = server.renderBatch4ModalClosedFixture();
	const closedSecond = server.renderBatch4ModalClosedFixture();
	assert.equal(closedFirst.html, closedSecond.html);
	assert.doesNotMatch(closedFirst.html, /role="(?:alert)?dialog"/);
	assert.match(closedFirst.html, /data-id="closed-alert-trigger"[^>]*aria-expanded="false"/);
	const openFirst = server.renderBatch4ModalOpenFixture();
	const openSecond = server.renderBatch4ModalOpenFixture();
	assert.equal(openFirst.html, openSecond.html);
	assert.doesNotMatch(openFirst.html, /role="(?:alert)?dialog"/);
	assert.match(openFirst.html, /aria-expanded="true"/);
	assert.doesNotMatch(openFirst.html, /aria-controls=/);

	const dom = new JSDOM(`${openFirst.hydrationScript}<div id="app">${openFirst.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of [
		'window',
		'document',
		'Node',
		'Element',
		'HTMLElement',
		'HTMLHeadElement',
		'HTMLButtonElement',
		'Event',
		'MouseEvent',
		'PointerEvent',
		'FocusEvent',
		'KeyboardEvent',
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
		const root = container.querySelector('[data-id="open-root"]');
		const alertTrigger = container.querySelector('[data-id="open-alert-trigger"]');
		const sheetTrigger = container.querySelector('[data-id="open-sheet-trigger"]');
		const drawerTrigger = container.querySelector('[data-id="open-drawer-trigger"]');
		const mismatches = [];
		const originalError = console.error;
		const originalWarn = console.warn;
		console.error = (...args) => mismatches.push(args.join(' '));
		console.warn = (...args) => mismatches.push(args.join(' '));
		client.hydrateBatch4ModalOpenFixture(container, openFirst.renderId);
		dom.window._$HY.fe();
		await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
		console.error = originalError;
		console.warn = originalWarn;
		const alert = dom.window.document.querySelector('#ssr-alert');
		const sheet = dom.window.document.querySelector('#ssr-sheet');
		const drawer = dom.window.document.querySelector('#ssr-drawer');
		assert.strictEqual(container.querySelector('[data-id="open-root"]'), root);
		assert.strictEqual(container.querySelector('[data-id="open-alert-trigger"]'), alertTrigger);
		assert.strictEqual(container.querySelector('[data-id="open-sheet-trigger"]'), sheetTrigger);
		assert.strictEqual(container.querySelector('[data-id="open-drawer-trigger"]'), drawerTrigger);
		assert.deepEqual(mismatches, []);
		assert.ok(alert);
		assert.ok(sheet);
		assert.ok(drawer);
		assert.equal(alert.getAttribute('aria-labelledby'), 'ssr-alert-title');
		assert.equal(alert.getAttribute('aria-describedby'), 'ssr-alert-description');
		assert.equal(alertTrigger.getAttribute('aria-controls'), 'ssr-alert');
		assert.equal(sheetTrigger.getAttribute('aria-controls'), 'ssr-sheet');
		assert.equal(drawerTrigger.getAttribute('aria-controls'), 'ssr-drawer');
		assert.equal(drawer.hasAttribute('aria-modal'), false);
		dom.window.document.querySelector('[data-id="change-ids"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
		await Promise.resolve();
		const changedAlert = dom.window.document.querySelector('#changed-alert');
		assert.strictEqual(changedAlert, alert);
		assert.equal(alertTrigger.getAttribute('aria-controls'), 'changed-alert');
		assert.equal(changedAlert.getAttribute('aria-labelledby'), 'changed-alert-title');
		assert.equal(changedAlert.getAttribute('aria-describedby'), 'changed-alert-description');
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
