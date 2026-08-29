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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch2-interaction-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch2-interaction-server.tsx',
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
			lib: { entry: 'test/fixtures/batch2-interaction-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch2InteractionFixture();
	const second = server.renderBatch2InteractionFixture();
	assert.equal(first.html, second.html);
	assert.match(first.html, /aria-valuenow="8"/);
	assert.match(first.html, /left:75%/);
	assert.match(first.html, /name="level"[^>]*value="8"/);
	assert.match(first.html, /name="code"[^>]*value="12"/);
	assert.match(first.html, /tile-solid-input-otp-/);
	assert.match(first.html, /data-out-of-range="true"[^>]*hidden/);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of [
		'window',
		'document',
		'Node',
		'HTMLElement',
		'HTMLInputElement',
		'HTMLSelectElement',
		'HTMLTextAreaElement',
		'FormData',
		'Event',
		'InputEvent',
		'KeyboardEvent',
		'PointerEvent',
		'navigator',
	]) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const clientCode = `const _$HY = globalThis._$HY;\n${clientBundle}`;
		const client = await import(`data:text/javascript;base64,${Buffer.from(clientCode).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-id="batch2-interaction-root"]');
		const thumb = container.querySelector('[data-id="slider-thumb"]');
		const hidden = [...container.querySelectorAll('input[type="hidden"]')];
		const slots = [...container.querySelectorAll('[data-slot="input-otp-slot"] input')];
		const slotIds = slots.map((slot) => slot.id);
		assert.equal(new Set(slotIds).size, 4);
		assert.equal(slots[3].disabled, true);
		assert.equal(slots[3].closest('[data-slot="input-otp-slot"]').hidden, true);
		client.hydrateBatch2InteractionFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch2-interaction-root"]'), root);
		assert.strictEqual(container.querySelector('[data-id="slider-thumb"]'), thumb);
		assert.deepEqual([...container.querySelectorAll('input[type="hidden"]')], hidden);
		assert.deepEqual(
			[...container.querySelectorAll('[data-slot="input-otp-slot"] input')].map((slot) => slot.id),
			slotIds,
		);
		assert.deepEqual(new dom.window.FormData(container.querySelector('form')).getAll('level'), ['8']);
		assert.deepEqual(new dom.window.FormData(container.querySelector('form')).getAll('code'), ['12']);
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
