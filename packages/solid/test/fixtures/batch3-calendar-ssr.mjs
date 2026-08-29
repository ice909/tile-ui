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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-calendar-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
const NativeDate = Date;
const previousDate = Object.getOwnPropertyDescriptor(globalThis, 'Date');
const previousTimezone = process.env.TZ;

function fixedDate(iso) {
	const fixedTime = new NativeDate(iso).getTime();
	return class FixedDate extends NativeDate {
		constructor(...args) {
			super(...(args.length === 0 ? [fixedTime] : args));
		}

		static now() {
			return fixedTime;
		}
	};
}

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch3-calendar-server.tsx',
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
			lib: { entry: 'test/fixtures/batch3-calendar-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	process.env.TZ = 'UTC';
	Object.defineProperty(globalThis, 'Date', { configurable: true, value: fixedDate('2024-02-28T23:30:00.000Z'), writable: true });
	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch3CalendarFixture();
	const second = server.renderBatch3CalendarFixture();
	assert.equal(first.html, second.html);
	assert.match(first.html, /aria-label="février 2024"/);
	assert.match(first.html, /data-day="2024-02-29"/);
	assert.match(first.html, /data-range-middle="true"/);
	assert.match(first.html, /data-day="2024-03-04"[^>]*disabled/);
	assert.match(first.html, /data-day="2024-02-29"[^>]*data-today="true"/);

	process.env.TZ = 'Pacific/Kiritimati';
	Object.defineProperty(globalThis, 'Date', { configurable: true, value: fixedDate('2024-03-02T12:30:00.000Z'), writable: true });
	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of ['window', 'document', 'Node', 'HTMLElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'navigator']) {
		previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key], writable: true });
	}
	previous._$HY = Object.getOwnPropertyDescriptor(globalThis, '_$HY');
	Object.defineProperty(globalThis, '_$HY', { configurable: true, value: dom.window._$HY, writable: true });

	try {
		const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}`);
		const container = dom.window.document.querySelector('#app');
		const root = container.querySelector('[data-id="batch3-calendar-root"]');
		const leapDay = container.querySelector('[data-day="2024-02-29"]');
		const buttons = [...container.querySelectorAll('[data-slot="calendar-day-button"]')];
		client.hydrateBatch3CalendarFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch3-calendar-root"]'), root);
		assert.strictEqual(container.querySelector('[data-day="2024-02-29"]'), leapDay);
		assert.deepEqual([...container.querySelectorAll('[data-slot="calendar-day-button"]')], buttons);
		assert.equal(buttons.filter((button) => button.tabIndex === 0).length, 1);
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
	if (previousTimezone === undefined) delete process.env.TZ;
	else process.env.TZ = previousTimezone;
	await rm(outputRoot, { recursive: true, force: true });
}
