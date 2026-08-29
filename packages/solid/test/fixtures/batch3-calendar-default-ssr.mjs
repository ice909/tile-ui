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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-calendar-default-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
const NativeDate = Date;
const fixedTime = new NativeDate('2024-03-31T23:30:00.000Z').getTime();

class FixedDate extends NativeDate {
	constructor(...args) {
		super(...(args.length === 0 ? [fixedTime] : args));
	}

	static now() {
		return fixedTime;
	}
}

const previousDate = Object.getOwnPropertyDescriptor(globalThis, 'Date');
Object.defineProperty(globalThis, 'Date', { configurable: true, value: FixedDate, writable: true });

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch3-calendar-default-server.tsx',
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
			lib: { entry: 'test/fixtures/batch3-calendar-default-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch3CalendarDefaultFixture();
	const second = server.renderBatch3CalendarDefaultFixture();
	assert.equal(first.html, second.html);
	assert.match(first.html, /data-today="true"/);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of ['window', 'document', 'Node', 'HTMLElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'navigator']) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });
	Object.defineProperty(globalThis, 'Date', { configurable: true, value: FixedDate, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-id="batch3-calendar-default-root"]');
		const today = container.querySelector('[data-today="true"]');
		client.hydrateBatch3CalendarDefaultFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch3-calendar-default-root"]'), root);
		assert.strictEqual(container.querySelector('[data-today="true"]'), today);
	} finally {
		for (const [key, descriptor] of Object.entries(previous)) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		}
		dom.window.close();
	}
} finally {
	if (previousDate) Object.defineProperty(globalThis, 'Date', previousDate);
	else delete globalThis.Date;
	await rm(outputRoot, { recursive: true, force: true });
}
