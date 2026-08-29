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
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-disclosure-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };

try {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/batch3-disclosure-server.tsx',
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
			lib: { entry: 'test/fixtures/batch3-disclosure-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const first = server.renderBatch3DisclosureFixture();
	const second = server.renderBatch3DisclosureFixture();
	assert.equal(first.html, second.html);
	assert.match(first.html, /tile-solid-accordion-/);
	assert.match(first.html, /data-id="accordion-one"[^>]*aria-expanded="true"/);
	assert.match(first.html, /data-id="accordion-one"[^>]*id="custom-accordion-trigger"[^>]*aria-controls="custom-accordion-content"/);
	assert.match(first.html, /data-id="accordion-one-content"[^>]*id="custom-accordion-content"[^>]*aria-labelledby="custom-accordion-trigger"/);
	assert.match(first.html, /data-id="accordion-two"[^>]*disabled/);
	assert.match(first.html, /data-id="accordion-three"[^>]*tabIndex="-1"/);
	assert.match(first.html, /data-id="accordion-two-content"[^>]*hidden/);
	assert.match(first.html, /data-id="collapsible-trigger"[^>]*aria-expanded="false"/);
	assert.match(first.html, /data-id="collapsible-trigger"[^>]*id="custom-collapsible-trigger"[^>]*aria-controls="custom-collapsible-content"/);
	assert.match(first.html, /data-id="collapsible-content"[^>]*id="custom-collapsible-content"[^>]*aria-labelledby="custom-collapsible-trigger"/);
	assert.match(first.html, /data-id="collapsible-content"[^>]*hidden/);
	assert.match(first.html, /data-id="generated-collapsible-trigger"[^>]*id="tile-solid-collapsible-[^"]+-trigger"/);
	assert.match(first.html, /data-id="generated-collapsible-content"[^>]*id="tile-solid-collapsible-[^"]+-content"/);

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	const previous = {};
	for (const key of [
		'window',
		'document',
		'Node',
		'HTMLElement',
		'HTMLAnchorElement',
		'HTMLButtonElement',
		'HTMLInputElement',
		'HTMLSelectElement',
		'HTMLTextAreaElement',
		'Event',
		'MouseEvent',
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
		const root = container.querySelector('[data-id="batch3-disclosure-root"]');
		const accordionOne = container.querySelector('[data-id="accordion-one"]');
		const accordionThree = container.querySelector('[data-id="accordion-three"]');
		const collapsibleTrigger = container.querySelector('[data-id="collapsible-trigger"]');
		const accordionContent = container.querySelector('[data-id="accordion-one-content"]');
		const collapsibleContent = container.querySelector('[data-id="collapsible-content"]');
		const generatedCollapsibleTrigger = container.querySelector('[data-id="generated-collapsible-trigger"]');
		const generatedCollapsibleContent = container.querySelector('[data-id="generated-collapsible-content"]');
		assert.match(generatedCollapsibleTrigger.id, /^tile-solid-collapsible-.+-trigger$/);
		assert.match(generatedCollapsibleContent.id, /^tile-solid-collapsible-.+-content$/);
		assert.equal(generatedCollapsibleTrigger.getAttribute('aria-controls'), generatedCollapsibleContent.id);
		assert.equal(generatedCollapsibleContent.getAttribute('aria-labelledby'), generatedCollapsibleTrigger.id);
		const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
		client.hydrateBatch3DisclosureFixture(container, first.renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="batch3-disclosure-root"]'), root);
		assert.strictEqual(container.querySelector('[data-id="accordion-one"]'), accordionOne);
		assert.strictEqual(container.querySelector('[data-id="collapsible-trigger"]'), collapsibleTrigger);
		assert.strictEqual(container.querySelector('[data-id="generated-collapsible-trigger"]'), generatedCollapsibleTrigger);
		assert.strictEqual(container.querySelector('[data-id="generated-collapsible-content"]'), generatedCollapsibleContent);
		assert.equal(accordionOne.id, 'custom-accordion-trigger');
		assert.equal(accordionOne.getAttribute('aria-controls'), 'custom-accordion-content');
		assert.equal(accordionContent.id, 'custom-accordion-content');
		assert.equal(accordionContent.getAttribute('aria-labelledby'), 'custom-accordion-trigger');
		assert.equal(collapsibleTrigger.id, 'custom-collapsible-trigger');
		assert.equal(collapsibleTrigger.getAttribute('aria-controls'), 'custom-collapsible-content');
		assert.equal(collapsibleContent.id, 'custom-collapsible-content');
		assert.equal(collapsibleContent.getAttribute('aria-labelledby'), 'custom-collapsible-trigger');
		assert.equal(generatedCollapsibleTrigger.getAttribute('aria-controls'), generatedCollapsibleContent.id);
		assert.equal(generatedCollapsibleContent.getAttribute('aria-labelledby'), generatedCollapsibleTrigger.id);
		assert.deepEqual(
			[...container.querySelectorAll('[id]')].map((element) => element.id),
			ids,
		);
		accordionOne.focus();
		accordionOne.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		assert.strictEqual(dom.window.document.activeElement, accordionThree);
		collapsibleTrigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
		assert.equal(collapsibleTrigger.getAttribute('aria-expanded'), 'true');
		assert.equal(container.querySelector('[data-id="collapsible-content"]').hidden, false);
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
