import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';
import solid from 'vite-plugin-solid';
import { build } from 'vite';

import { completeFixtures, strictIdentitySelectors } from './complete-fixtures-manifest.mjs';
import { installGlobals, snapshotGlobals } from './complete-globals.mjs';

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, '..');
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-complete-'));
const stylesRoot = path.resolve(packageRoot, '../styles/scss');
const shard = process.argv[2] ?? 'all';
const shardNames = shard === 'all' ? ['foundation', 'overlays', 'advanced'] : [shard];
const statefulCovered = new Set();
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
const artifactRoot = path.join(outputRoot, 'artifacts');
const serverArtifact = path.join(artifactRoot, 'server.js');
const browserArtifact = path.join(artifactRoot, 'browser.js');
const primitivesServerArtifact = path.join(artifactRoot, 'primitives/server.js');
const resolveArtifact = (specifier) => import.meta.resolve(specifier).replace('file://', '');
const serverDependencyAliases = {
	'@tile-ui/core/liveline': path.join(packageRoot, '../core/dist/liveline/index.js'),
	'@tile-ui/core': path.join(packageRoot, '../core/dist/index.js'),
	'@tile-ui/styles': path.resolve(packageRoot, '../styles'),
	'solid-js/web': resolveArtifact('solid-js/web'),
	'solid-js': resolveArtifact('solid-js'),
};
const browserDependencyAliases = {
	...serverDependencyAliases,
	'solid-js/web': path.join(path.dirname(resolveArtifact('solid-js/web')), 'web.js'),
	'solid-js': path.join(path.dirname(resolveArtifact('solid-js')), 'solid.js'),
};

function sourceRegistrySlugs(source) {
	const names = new Set();
	for (const match of source.matchAll(/\bname:\s*'([^']+)'/g)) names.add(match[1]);
	for (const match of source.matchAll(/^\s*\[\s*'([^']+)'\s*,\s*'[^']+'\s*,\s*'[^']+'/gm)) if (!match[1].startsWith('@')) names.add(match[1]);
	return [...names].sort();
}

function assertMeaningfulRoot(root, slug) {
	assert.ok(root, `${slug} root is missing`);
	assert.ok(root.children.length > 0 || root.textContent.trim().length > 0, `${slug} root is empty`);
}

function snapshotStableAttributes(container) {
	return [...container.querySelectorAll('[id], [aria-controls], [aria-describedby], [aria-labelledby], [aria-owns], [aria-activedescendant]')].map((node) => ({
		attributes: [...node.attributes].filter(({ name }) => name === 'id' || name.startsWith('aria-')).map(({ name, value }) => [name, value]),
		node,
	}));
}

function assertUniqueIds(root, label) {
	const ids = [...root.querySelectorAll('[id]')].map((node) => node.id);
	assert.equal(new Set(ids).size, ids.length, `${label} contains duplicate IDs`);
	return new Set(ids);
}

function click(window, node) {
	assert.ok(node, 'interaction control is missing');
	node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

async function flush(window) {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function driveFoundation(window, container) {
	const cover = (slug, action) => {
		action();
		statefulCovered.add(slug);
	};
	cover('button', () => click(window, container.querySelector('[data-control="button"]')));
	cover('input', () => {
		const node = container.querySelector('[data-control="input"]');
		node.value = 'Changed';
		node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: 'Changed' }));
	});
	cover('toggle', () => click(window, container.querySelector('[data-control="toggle"]')));
	cover('dialog', () => click(window, container.querySelector('[data-control="dialog-trigger"]')));
	cover('attachment', () =>
		click(window, container.querySelector('[data-slug="attachment"] [aria-label="Download"]') ?? container.querySelector('[data-slug="attachment"] button')),
	);
	cover('avatar', () => container.querySelector('[data-control="avatar-image"]').dispatchEvent(new window.Event('error')));
	cover('checkbox', () => click(window, container.querySelector('[data-control="checkbox"]')));
	cover('form', () => {
		const node = container.querySelector('[data-control="form-input"]');
		node.value = 'changed@example.com';
		node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: 'changed@example.com' }));
	});
	cover('input-group', () => {
		const node = container.querySelector('[data-control="input-group"]');
		node.value = 'changed';
		node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: 'changed' }));
	});
	cover('input-otp', () => {
		const node = container.querySelector('[data-slug="input-otp"] input');
		node.value = '34';
		node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: '34' }));
	});
	cover('native-select', () => {
		const node = container.querySelector('[data-control="native-select"]');
		node.value = 'vue';
		node.dispatchEvent(new window.Event('change', { bubbles: true }));
	});
	cover('radio-group', () => click(window, container.querySelector('[data-slug="radio-group"] [value="two"]')));
	cover('slider', () => {
		const node = container.querySelector('[data-control="slider"]');
		node.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
	});
	cover('switch', () => click(window, container.querySelector('[data-control="switch"]')));
	cover('textarea', () => {
		const node = container.querySelector('[data-control="textarea"]');
		node.value = 'Changed';
		node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: 'Changed' }));
	});
	cover('toggle-group', () => click(window, container.querySelector('[data-slug="toggle-group"] [value="italic"]')));
	cover('accordion', () => click(window, container.querySelector('[data-control="accordion-two"]')));
	cover('calendar', () => click(window, container.querySelector('[data-slug="calendar"] button:not([disabled])')));
	cover('collapsible', () => click(window, container.querySelector('[data-control="collapsible"]')));
	cover('tabs', () => click(window, container.querySelector('[data-control="tabs-registry"]')));
}

async function driveOverlays(window, container) {
	const controls = {
		'alert-dialog': '[data-control="alert-dialog-trigger"]',
		combobox: '[data-control="combobox"]',
		command: '[data-control="command-input"]',
		'context-menu': '[data-control="context-trigger"]',
		drawer: '[data-control="drawer-trigger"]',
		'dropdown-menu': '[data-control="dropdown-trigger"]',
		'hover-card': '[data-control="hover-trigger"]',
		menubar: '[data-control="menubar-trigger"]',
		'navigation-menu': '[data-control="navigation-trigger"]',
		popover: '[data-control="popover-trigger"]',
		select: '[data-control="select-trigger"]',
		sheet: '[data-control="sheet-trigger"]',
		tooltip: '[data-control="tooltip-trigger"]',
	};
	for (const [slug, selector] of Object.entries(controls)) {
		const node = container.querySelector(selector);
		if (slug === 'context-menu') node.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
		else if (slug === 'hover-card') node.dispatchEvent(new window.PointerEvent('pointerenter', { bubbles: true }));
		else if (slug === 'tooltip') node.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
		else if (slug === 'command') {
			node.value = 'beta';
			node.dispatchEvent(new window.InputEvent('input', { bubbles: true, data: 'beta' }));
		} else click(window, node);
		statefulCovered.add(slug);
		await flush(window);
	}
}

async function driveAdvanced(window, container) {
	click(window, container.querySelector('[data-control="carousel-next"]'));
	statefulCovered.add('carousel');
	const handle = container.querySelector('[data-control="resizable-handle"]');
	handle.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
	statefulCovered.add('resizable');
	click(window, container.querySelector('[data-control="sidebar-trigger"]'));
	statefulCovered.add('sidebar');
	click(window, container.querySelector('[data-control="toast-create"]'));
	statefulCovered.add('sonner');
}

async function buildFixtures() {
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		resolve: { alias: { ...serverDependencyAliases, '@tile-ui/solid/primitives': primitivesServerArtifact, '@tile-ui/solid': serverArtifact }, conditions: ['node'] },
		ssr: { noExternal: true },
		build: {
			target: 'esnext',
			ssr: 'test/fixtures/complete-import-probe.mjs',
			outDir: path.join(outputRoot, 'probe'),
			emptyOutDir: true,
			rollupOptions: { output: { entryFileNames: 'probe.mjs' } },
		},
	});
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		resolve: { alias: { ...serverDependencyAliases, '@tile-ui/solid': serverArtifact }, conditions: ['node'] },
		ssr: { noExternal: true },
		build: {
			ssr: 'test/fixtures/complete-server.tsx',
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
		resolve: { alias: { ...browserDependencyAliases, '@tile-ui/solid': browserArtifact }, conditions: ['browser'] },
		build: {
			outDir: path.join(outputRoot, 'client'),
			emptyOutDir: true,
			lib: { entry: 'test/fixtures/complete-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});
}

async function runShard(name, server, clientBundle) {
	const renderId = `stage5-${name}-`;
	const first = server.renderCompleteFixture(name, renderId);
	const second = server.renderCompleteFixture(name, renderId);
	assert.equal(first.html, second.html, `${name} server output is not byte deterministic`);
	const slugs = Object.entries(completeFixtures).filter(([, policy]) => policy.fixture === name);
	const serverDom = new JSDOM(`<div id="server">${first.html}</div>`);
	for (const [slug, policy] of slugs) assertMeaningfulRoot(serverDom.window.document.querySelector(policy.selector), slug);
	assertUniqueIds(serverDom.window.document, `${name} SSR`);
	serverDom.window.close();

	const dom = new JSDOM(`${first.hydrationScript}<div id="app">${first.html}</div>`, { pretendToBeVisual: true, runScripts: 'dangerously', url: 'http://localhost/' });
	const beforeGlobals = snapshotGlobals();
	const restore = installGlobals(dom.window);
	const messages = [];
	const originalError = console.error;
	const originalWarn = console.warn;
	const onRejection = (reason) => messages.push(`unhandledRejection: ${String(reason)}`);
	const onException = (error) => messages.push(`uncaughtException: ${String(error)}`);
	console.error = (...args) => messages.push(`error: ${args.join(' ')}`);
	console.warn = (...args) => messages.push(`warn: ${args.join(' ')}`);
	process.on('unhandledRejection', onRejection);
	process.on('uncaughtException', onException);
	try {
		const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientBundle}`).toString('base64')}#${name}`);
		const container = dom.window.document.querySelector('#app');
		const roots = new Map(slugs.map(([slug, policy]) => [slug, container.querySelector(policy.selector)]));
		const strictNodes = new Map(strictIdentitySelectors[name].map((selector) => [selector, container.querySelector(selector)]));
		const stableAttributes = snapshotStableAttributes(container);
		client.hydrateCompleteFixture(name, container, renderId);
		dom.window._$HY.fe();
		await flush(dom.window);
		for (const [slug, node] of roots) assert.strictEqual(container.querySelector(completeFixtures[slug].selector), node, `${slug} root was replaced during hydration`);
		for (const [selector, node] of strictNodes) assert.strictEqual(container.querySelector(selector), node, `${selector} control was replaced during hydration`);
		for (const item of stableAttributes)
			assert.deepEqual(
				[...item.node.attributes].filter(({ name }) => name === 'id' || name.startsWith('aria-')).map(({ name, value }) => [name, value]),
				item.attributes,
				`${name} ID/ARIA changed during hydration`,
			);
		assertUniqueIds(dom.window.document, `${name} hydration`);
		if (name === 'foundation') await driveFoundation(dom.window, container);
		if (name === 'overlays') await driveOverlays(dom.window, container);
		if (name === 'advanced') await driveAdvanced(dom.window, container);
		await flush(dom.window);
		assert.equal(messages.length, 0, messages.join('\n'));

		const isolated = server.renderCompleteFixture(name, `${renderId}isolated-`);
		const secondContainer = dom.window.document.createElement('div');
		secondContainer.innerHTML = isolated.html;
		dom.window.document.body.append(secondContainer);
		const firstIds = assertUniqueIds(container, `${name} first root`);
		const secondIds = assertUniqueIds(secondContainer, `${name} isolated root`);
		for (const id of firstIds) assert.equal(secondIds.has(id), false, `${name} request roots share ID ${id}`);
		client.hydrateCompleteFixture(name, secondContainer, `${renderId}isolated-`);
		await flush(dom.window);
		assert.equal(messages.length, 0, messages.join('\n'));
		if (name === 'advanced') {
			assert.equal(secondContainer.querySelectorAll('[data-sonner-toast]').length, 0, 'Sonner store leaked into isolated root');
			const styleIds = [...dom.window.document.querySelectorAll('[data-chart] style[id], style[data-chart]')].map((node) => node.id || node.getAttribute('data-chart'));
			assert.equal(new Set(styleIds).size, styleIds.length, 'Chart style IDs collide across roots');
		}
	} finally {
		process.off('unhandledRejection', onRejection);
		process.off('uncaughtException', onException);
		console.error = originalError;
		console.warn = originalWarn;
		restore();
		for (const [key, descriptor] of beforeGlobals) assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, key), descriptor, `${key} descriptor changed`);
		dom.window.close();
	}
}

try {
	const source = await readFile(path.join(packageRoot, 'src/registry/items/ui.ts'), 'utf8');
	const registrySlugs = sourceRegistrySlugs(source);
	const manifestSlugs = Object.keys(completeFixtures).sort();
	assert.equal(manifestSlugs.length, 62, 'complete fixture manifest must explicitly contain 62 slugs');
	assert.deepEqual(manifestSlugs, registrySlugs, 'complete fixture manifest differs from source registry UI set');
	for (const [slug, policy] of Object.entries(completeFixtures)) {
		assert.ok(['foundation', 'overlays', 'advanced'].includes(policy.fixture), `${slug} has no fixture composition`);
		assert.equal(typeof policy.stateful, 'boolean', `${slug} has no state policy`);
		if (policy.stateful) assert.ok(policy.driver, `${slug} is stateful but has no interaction driver`);
	}
	await mkdir(path.join(artifactRoot, 'primitives'), { recursive: true });
	for (const [source, target] of [
		['dist/server.js', serverArtifact],
		['dist/browser.js', browserArtifact],
		['dist/primitives/server.js', primitivesServerArtifact],
		['dist/primitives/browser.js', path.join(artifactRoot, 'primitives/browser.js')],
	]) {
		await readFile(path.join(packageRoot, source));
		await copyFile(path.join(packageRoot, source), target);
	}
	await buildFixtures();
	await execFileAsync(process.execPath, [path.join(outputRoot, 'probe/probe.mjs')], { cwd: packageRoot, timeout: 20_000 });
	const serverBundle = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
	const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
	assert.doesNotMatch(serverBundle, /packages\/solid\/src\/components/);
	assert.doesNotMatch(clientBundle, /packages\/solid\/src\/components/);
	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	for (const name of shardNames) await runShard(name, server, clientBundle);
	const expectedStateful = Object.entries(completeFixtures)
		.filter(([, policy]) => policy.stateful && shardNames.includes(policy.fixture))
		.map(([slug]) => slug)
		.sort();
	assert.deepEqual([...statefulCovered].sort(), expectedStateful, 'stateful interaction coverage is incomplete');
	const fixtureFiles = await readdir(path.join(packageRoot, 'test/fixtures'));
	assert.ok(fixtureFiles.includes('complete-server.tsx') && fixtureFiles.includes('complete-client.tsx'));
	console.log(
		JSON.stringify({
			slugs: manifestSlugs.length,
			stateful: Object.values(completeFixtures).filter((policy) => policy.stateful).length,
			coveredStateful: statefulCovered.size,
			shards: shardNames,
		}),
	);
} finally {
	await rm(outputRoot, { force: true, recursive: true });
}
