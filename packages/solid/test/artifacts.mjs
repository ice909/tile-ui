import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import solid from 'vite-plugin-solid';
import { build } from 'vite';

import { DOM_GLOBAL_KEYS, installDomGlobals } from './fixtures/dom-globals.mjs';

const packageRoot = path.resolve(import.meta.dirname, '..');
const stylesRoot = path.resolve(packageRoot, '../styles/scss');
const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-artifacts-'));
const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
const execFileAsync = promisify(execFile);
const primitiveNames = [
	'createClickOutside',
	'createCopyToClipboard',
	'createIsMobile',
	'createKeyPress',
	'createLocalStorage',
	'createMediaQuery',
	'createMousePosition',
	'createOnlineStatus',
	'createScrollPosition',
	'createSessionStorage',
	'createWindowSize',
];

function snapshotGlobalDescriptors(extraKeys = []) {
	return new Map([...DOM_GLOBAL_KEYS, ...extraKeys].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
}

function assertGlobalDescriptorsRestored(before) {
	for (const [key, descriptor] of before) assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, key), descriptor, `${key} global was not restored`);
}

try {
	const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
	assert.equal(packageJson.exports['.'].require, undefined);
	assert.deepEqual(packageJson.exports['./primitives'], {
		types: './dist/primitives/index.d.ts',
		browser: './dist/primitives/browser.js',
		node: './dist/primitives/server.js',
		import: './dist/primitives/browser.js',
	});
	for (const relativePath of ['dist/browser.js', 'dist/server.js', 'dist/index.d.ts']) {
		await access(path.join(packageRoot, relativePath));
	}
	for (const relativePath of ['dist/primitives/browser.js', 'dist/primitives/server.js', 'dist/primitives/index.d.ts']) {
		await access(path.join(packageRoot, relativePath));
	}
	const primitiveDeclarations = await readFile(path.join(packageRoot, 'dist/primitives/index.d.ts'), 'utf8');
	for (const name of primitiveNames) assert.match(primitiveDeclarations, new RegExp(`\\b${name}\\b`));
	const nodeProbe = `
		import assert from 'node:assert/strict';
		for (const key of ['window', 'document', 'navigator']) Reflect.deleteProperty(globalThis, key);
		const resolved = import.meta.resolve('@tile-ui/solid/primitives');
		assert.match(resolved, /dist\\/primitives\\/server\\.js$/);
		const primitives = await import('@tile-ui/solid/primitives');
		assert.deepEqual(Object.keys(primitives).sort(), ${JSON.stringify(primitiveNames)});
		const { createRoot } = await import('solid-js');
		createRoot((dispose) => {
			let defaults = 0;
			const [local, setLocal] = primitives.createLocalStorage('local', () => { defaults += 1; return 'server'; });
			const [session, setSession] = primitives.createSessionStorage('session', 'session');
			assert.equal(local(), 'server');
			assert.equal(session(), 'session');
			assert.equal(defaults, 1);
			assert.equal(setLocal((previous) => previous + '-next'), 'server-next');
			assert.equal(setSession('next'), 'next');
			assert.deepEqual(primitives.createWindowSize()(), { width: 0, height: 0 });
			assert.equal(primitives.createMediaQuery('(min-width: 1px)')(), false);
			assert.equal(primitives.createIsMobile()(), false);
			assert.equal(primitives.createOnlineStatus()(), true);
			assert.deepEqual(primitives.createScrollPosition()(), { x: 0, y: 0 });
			assert.deepEqual(primitives.createMousePosition()(), { x: 0, y: 0 });
			const clipboard = primitives.createCopyToClipboard();
			assert.equal(clipboard.copied(), false);
			assert.equal(clipboard.error(), null);
			primitives.createClickOutside(() => undefined, () => assert.fail('SSR click callback'));
			primitives.createKeyPress('Escape', () => assert.fail('SSR key callback'));
			dispose();
			dispose();
		});
	`;
	await execFileAsync(process.execPath, ['--conditions=node', '--input-type=module', '--eval', nodeProbe], { cwd: packageRoot });
	const declarations = await readFile(path.join(packageRoot, 'dist/index.d.ts'), 'utf8');
	for (const name of [
		'Badge',
		'Button',
		'ButtonGroup',
		'Card',
		'Checkbox',
		'Dialog',
		'Field',
		'Form',
		'Input',
		'InputGroup',
		'InputOTP',
		'NativeSelect',
		'Progress',
		'RadioGroup',
		'Separator',
		'Slider',
		'Switch',
		'Textarea',
		'Toggle',
		'ToggleGroup',
		'Accordion',
		'Calendar',
		'Collapsible',
		'DirectionProvider',
		'useDirection',
		'Message',
		'MessageScroller',
		'useMessageScroller',
		'useMessageScrollerScrollable',
		'useMessageScrollerVisibility',
		'Pagination',
		'ScrollArea',
		'ScrollBar',
		'Tabs',
		'AlertDialog',
		'Combobox',
		'Command',
		'ContextMenu',
		'Drawer',
		'DropdownMenu',
		'HoverCard',
		'Menubar',
		'NavigationMenu',
		'Popover',
		'Select',
		'Sheet',
		'Tooltip',
		'Carousel',
		'CarouselContent',
		'CarouselItem',
		'ChartContainer',
		'ChartTooltip',
		'ChartLegend',
		'ChartLegendItem',
		'ChartTooltipEntry',
		'Liveline',
		'LivelineTransition',
		'ResizablePanelGroup',
		'ResizablePanel',
		'ResizableHandle',
		'Sidebar',
		'SidebarProvider',
		'useSidebar',
		'Toaster',
		'useToast',
		'toast',
	]) {
		assert.match(declarations, new RegExp(`\\b${name}\\b`));
	}
	assert.doesNotMatch(declarations, /asChild\?:/);

	await build({
		root: packageRoot,
		plugins: [solid()],
		logLevel: 'error',
		resolve: { conditions: ['browser'] },
		build: {
			outDir: path.join(outputRoot, 'primitives-client'),
			emptyOutDir: true,
			lib: { entry: 'test/fixtures/primitives-client.ts', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/server.tsx',
			outDir: path.join(outputRoot, 'server'),
			emptyOutDir: true,
			rollupOptions: { output: { entryFileNames: 'fixture.mjs' } },
		},
	});
	await build({
		root: packageRoot,
		plugins: [solid({ ssr: true })],
		logLevel: 'error',
		css,
		ssr: { noExternal: true, resolve: { conditions: ['node'] } },
		build: {
			ssr: 'test/fixtures/avatar-server.tsx',
			outDir: path.join(outputRoot, 'avatar-server'),
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
			outDir: path.join(outputRoot, 'avatar-client'),
			emptyOutDir: true,
			lib: { entry: 'test/fixtures/avatar-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
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
			lib: { entry: 'test/fixtures/client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' },
			rollupOptions: { output: { inlineDynamicImports: true } },
		},
	});
	const serverBundle = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
	const clientBundle = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
	const avatarClientBundle = await readFile(path.join(outputRoot, 'avatar-client/fixture.mjs'), 'utf8');
	const primitivesClientBundle = await readFile(path.join(outputRoot, 'primitives-client/fixture.mjs'), 'utf8');
	assert.match(serverBundle, /ssrElement|data-hk/);
	assert.doesNotMatch(primitivesClientBundle, /@tile-ui\/solid\/primitives/);

	const primitivesDom = new JSDOM('<div></div>', { url: 'http://localhost/' });
	Object.defineProperty(primitivesDom.window, 'innerWidth', { configurable: true, value: 777, writable: true });
	Object.defineProperty(primitivesDom.window, 'innerHeight', { configurable: true, value: 555, writable: true });
	const primitiveGlobalsBefore = snapshotGlobalDescriptors();
	const restorePrimitiveGlobals = installDomGlobals(primitivesDom.window);
	try {
		const primitiveClient = await import(pathToFileURL(path.join(outputRoot, 'primitives-client/fixture.mjs')).href);
		const interaction = primitiveClient.exercisePrimitives();
		assert.deepEqual(interaction.size(), { width: 777, height: 555 });
		assert.equal(interaction.stored(), 2);
		assert.equal(primitivesDom.window.localStorage.getItem('artifact-counter'), '2');
		primitivesDom.window.innerWidth = 900;
		primitivesDom.window.innerHeight = 600;
		primitivesDom.window.dispatchEvent(new primitivesDom.window.Event('resize'));
		assert.deepEqual(interaction.size(), { width: 900, height: 600 });
		interaction.dispose();
		primitivesDom.window.innerWidth = 1000;
		primitivesDom.window.dispatchEvent(new primitivesDom.window.Event('resize'));
		assert.deepEqual(interaction.size(), { width: 900, height: 600 });
	} finally {
		restorePrimitiveGlobals();
		assertGlobalDescriptorsRestored(primitiveGlobalsBefore);
		primitivesDom.window.close();
	}

	const server = await import(pathToFileURL(path.join(outputRoot, 'server/fixture.mjs')).href);
	const { html, hydrationScript, renderId } = server.renderFixture();
	assert.match(html, />切换 0</);
	assert.match(html, /tile-solid-input-/);
	assert.match(html, /value="Tile"/);
	assert.match(html, /data-id="server-alert"/);
	assert.match(html, /--tile-aspect-ratio-padding:50%/);
	assert.match(html, />TU</);
	assert.match(html, />21</);
	assert.match(html, />server note<\/textarea>/);
	assert.match(html, /value="solid" selected/);
	assert.match(html, /data-id="artifact-form-control"/);
	assert.match(html, /aria-describedby="[^"]*form-description/);
	assert.match(html, /id="artifact-accordion-trigger"[^>]*aria-controls="artifact-accordion-content"/);
	assert.match(html, /data-id="artifact-accordion-default-trigger"[^>]*id="tile-solid-accordion-/);
	assert.match(html, /id="artifact-collapsible-trigger"[^>]*aria-controls="artifact-collapsible-content"/);
	assert.match(html, /id="artifact-tabs-trigger"[^>]*aria-controls="artifact-tabs-content"/);
	assert.match(html, /data-id="artifact-tabs-default-trigger"[^>]*id="tile-solid-tabs-/);
	assert.match(html, /data-id="artifact-calendar"/);
	assert.match(html, /August 2026/);
	assert.match(html, /data-today="true"/);
	assert.match(html, /data-id="artifact-direction"[^>]*dir="rtl"/);
	assert.match(html, /data-id="artifact-scrollbar"[^>]*tabIndex="-1"[^>]*aria-hidden="true"/);
	assert.match(html, /data-id="artifact-message-scroller-button"[^>]*disabled[^>]*aria-hidden="true"/);
	assert.match(html, /data-id="artifact-message-scroller-button"[^>]*><svg[^>]*stroke="currentColor"/);
	assert.match(html, /data-id="artifact-pagination"[^>]*role="navigation"/);
	assert.match(html, /data-id="artifact-message"/);

	const dom = new JSDOM(`${hydrationScript}<div id="app">${html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	Object.defineProperty(dom.window.HTMLImageElement.prototype, 'complete', {
		configurable: true,
		get() {
			return this.getAttribute('src')?.includes('cached-avatar') || this.getAttribute('src')?.includes('broken-avatar');
		},
	});
	Object.defineProperty(dom.window.HTMLImageElement.prototype, 'naturalWidth', {
		configurable: true,
		get() {
			return this.getAttribute('src')?.includes('cached-avatar') ? 64 : 0;
		},
	});
	const globalsBeforeHydration = snapshotGlobalDescriptors(['_$HY']);
	const restoreGlobals = installDomGlobals(dom.window, { _$HY: dom.window._$HY });

	const errors = [];
	const originalError = console.error;
	console.error = (...args) => errors.push(args.join(' '));
	try {
		const clientCode = `const _$HY = globalThis._$HY;\n${clientBundle}`;
		const clientUrl = `data:text/javascript;base64,${Buffer.from(clientCode).toString('base64')}`;
		const client = await import(clientUrl);
		const container = dom.window.document.querySelector('#app');
		const serverIdentity = container.querySelector('[data-id="server-identity"]');
		const serverInput = container.querySelector('input');
		const serverToggle = container.querySelector('[data-state="off"]');
		const serverTrigger = [...container.querySelectorAll('button')].find((button) => button.textContent === '打开对话框');
		const serverInputId = serverInput.id;
		const batch2Identities = new Map(
			[
				'artifact-textarea',
				'artifact-select',
				'artifact-checkbox',
				'artifact-switch',
				'artifact-radio',
				'artifact-slider',
				'field-control',
				'artifact-form-control',
				'artifact-toggle-group',
			].map((id) => [id, container.querySelector(`[data-id="${id}"]`)]),
		);
		const batch3Identities = new Map(
			[
				'artifact-accordion-trigger',
				'artifact-accordion-content',
				'artifact-accordion-default-trigger',
				'artifact-collapsible-trigger',
				'artifact-collapsible-content',
				'artifact-tabs-trigger',
				'artifact-tabs-content',
				'artifact-tabs-default-trigger',
				'artifact-calendar',
				'artifact-direction',
				'artifact-scroll-area',
				'artifact-scrollbar',
				'artifact-message-scroller',
				'artifact-message-scroller-button',
				'artifact-pagination',
				'artifact-message',
			].map((id) => [id, container.querySelector(`[data-id="${id}"]`)]),
		);
		client.hydrateFixture(container, renderId);
		dom.window._$HY.fe();
		await Promise.resolve();
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.strictEqual(container.querySelector('[data-id="server-identity"]'), serverIdentity);
		assert.strictEqual(container.querySelector('input'), serverInput);
		assert.strictEqual(container.querySelector('[data-state="off"]'), serverToggle);
		assert.strictEqual(
			[...container.querySelectorAll('button')].find((button) => button.textContent === '打开对话框'),
			serverTrigger,
		);
		assert.equal(serverInput.id, serverInputId);
		for (const [id, node] of batch2Identities) assert.strictEqual(container.querySelector(`[data-id="${id}"]`), node, `${id} was replaced during hydration`);
		for (const [id, node] of batch3Identities) assert.strictEqual(container.querySelector(`[data-id="${id}"]`), node, `${id} was replaced during hydration`);
		assert.equal(container.querySelector('[data-id="artifact-accordion-trigger"]').tabIndex, 0);
		assert.equal(container.querySelector('[data-id="artifact-accordion-default-trigger"]').tabIndex, -1);
		assert.equal(container.querySelector('[data-id="artifact-tabs-trigger"]').tabIndex, 0);
		assert.equal(container.querySelector('[data-id="artifact-tabs-default-trigger"]').tabIndex, -1);
		assert.equal(container.querySelector('[data-id="artifact-scrollbar"]').getAttribute('role'), null);
		assert.equal(container.querySelector('[data-id="artifact-message-scroller-button"]').hidden, false);
		assert.equal(container.querySelector('[data-id="artifact-textarea"]').value, 'server note');
		assert.equal(container.querySelector('[data-id="artifact-select"]').value, 'solid');
		assert.equal(container.querySelector('[data-id="artifact-checkbox"]').getAttribute('aria-checked'), 'true');
		assert.equal(container.querySelector('[data-id="artifact-switch"]').getAttribute('aria-checked'), 'true');
		assert.equal(container.querySelector('[data-id="artifact-radio"]').checked, true);
		assert.equal(container.querySelector('[data-id="artifact-slider"]').getAttribute('aria-valuenow'), '40');
		assert.equal(container.querySelector('input[name="code"]').value, '12');
		assert.equal(container.querySelector('[data-id="artifact-toggle-group"]').getAttribute('aria-pressed'), 'true');
		assert.equal(serverInput.value, 'Tile');
		assert.equal(serverInput.defaultValue, 'Tile');
		assert.equal(serverInput.getAttribute('aria-label'), '名称');
		serverInput.value = 'Edited';
		assert.equal(serverInput.value, 'Edited');
		container.querySelector('[data-id="input-form"]').reset();
		assert.equal(serverInput.value, 'Tile');
		serverToggle.click();
		assert.equal(serverToggle.textContent, '切换 1');
		assert.equal(serverToggle.getAttribute('data-state'), 'on');
		container.querySelector('[aria-label="下载"]').click();
		assert.equal(serverToggle.textContent, '切换 2');

		assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
		serverTrigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
		assert.equal(serverTrigger.getAttribute('aria-expanded'), 'true');
		await Promise.resolve();
		await new Promise((resolve) => setTimeout(resolve, 0));
		const dialog = dom.window.document.querySelector('[role="dialog"]');
		if (dialog) assert.equal(dialog.textContent, '水合对话框');
		assert.equal(
			errors.some((message) => /hydration|mismatch/i.test(message)),
			false,
			errors.join('\n'),
		);
	} finally {
		console.error = originalError;
		restoreGlobals();
		assertGlobalDescriptorsRestored(globalsBeforeHydration);
		dom.window.close();
	}

	const avatarServer = await import(pathToFileURL(path.join(outputRoot, 'avatar-server/fixture.mjs')).href);
	const avatarFixture = avatarServer.renderAvatarFixture();
	const avatarDom = new JSDOM(`${avatarFixture.hydrationScript}<div id="avatar-app">${avatarFixture.html}</div>`, { runScripts: 'dangerously', url: 'http://localhost/' });
	Object.defineProperty(avatarDom.window.HTMLImageElement.prototype, 'complete', {
		configurable: true,
		get() {
			return this.getAttribute('src')?.includes('cached-avatar') || this.getAttribute('src')?.includes('broken-avatar');
		},
	});
	Object.defineProperty(avatarDom.window.HTMLImageElement.prototype, 'naturalWidth', {
		configurable: true,
		get() {
			return this.getAttribute('src')?.includes('cached-avatar') ? 64 : 0;
		},
	});
	const globalsBeforeAvatarHydration = snapshotGlobalDescriptors(['_$HY']);
	const restoreAvatarGlobals = installDomGlobals(avatarDom.window, { _$HY: avatarDom.window._$HY });
	try {
		const avatarClientCode = `const _$HY = globalThis._$HY;\n${avatarClientBundle}`;
		const avatarClient = await import(`data:text/javascript;base64,${Buffer.from(avatarClientCode).toString('base64')}`);
		const container = avatarDom.window.document.querySelector('#avatar-app');
		const cachedImage = container.querySelector('[data-id="cached-avatar"]');
		const cachedFallback = container.querySelector('[data-id="cached-avatar-fallback"]');
		const brokenImage = container.querySelector('[data-id="broken-avatar"]');
		const brokenFallback = container.querySelector('[data-id="broken-avatar-fallback"]');
		const firstA = container.querySelector('[data-id="reactive-avatar"]');
		const reactiveFallback = container.querySelector('[data-id="reactive-avatar-fallback"]');
		avatarClient.hydrateAvatarFixture(container, avatarFixture.renderId);
		await Promise.resolve();
		assert.strictEqual(container.querySelector('[data-id="cached-avatar"]'), cachedImage);
		assert.strictEqual(container.querySelector('[data-id="cached-avatar-fallback"]'), cachedFallback);
		assert.strictEqual(container.querySelector('[data-id="broken-avatar"]'), brokenImage);
		assert.strictEqual(container.querySelector('[data-id="broken-avatar-fallback"]'), brokenFallback);
		container.querySelector('[data-id="avatar-b"]').click();
		const imageB = container.querySelector('[data-id="reactive-avatar"]');
		container.querySelector('[data-id="avatar-a"]').click();
		const secondA = container.querySelector('[data-id="reactive-avatar"]');
		assert.notStrictEqual(imageB, firstA);
		assert.notStrictEqual(secondA, firstA);
		assert.notStrictEqual(secondA, imageB);
		imageB.dispatchEvent(new avatarDom.window.Event('load'));
		firstA.dispatchEvent(new avatarDom.window.Event('load'));
		assert.equal(reactiveFallback.hidden, false);
		secondA.dispatchEvent(new avatarDom.window.Event('load'));
		assert.equal(reactiveFallback.hidden, true);
		container.querySelector('[data-id="avatar-unmount"]').click();
		assert.equal(container.querySelector('[data-id="reactive-avatar"]'), null);
		secondA.dispatchEvent(new avatarDom.window.Event('error'));
		assert.equal(container.querySelector('[data-id="reactive-avatar"]'), null);
	} finally {
		restoreAvatarGlobals();
		assertGlobalDescriptorsRestored(globalsBeforeAvatarHydration);
		avatarDom.window.close();
	}

	const packRoot = path.join(outputRoot, 'pack');
	await mkdir(packRoot);
	const { stdout: packOutput } = await execFileAsync('corepack', ['pnpm', 'pack', '--pack-destination', packRoot], { cwd: packageRoot });
	const tarballName = packOutput.trim().split(/\r?\n/).at(-1);
	assert.ok(tarballName, 'pnpm pack did not report a tarball');
	const tarballPath = path.isAbsolute(tarballName) ? tarballName : path.join(packageRoot, tarballName);
	const { stdout: tarEntries } = await execFileAsync('tar', ['-tf', tarballPath]);
	for (const relativePath of ['package/dist/primitives/browser.js', 'package/dist/primitives/server.js', 'package/dist/primitives/index.d.ts']) {
		assert.match(tarEntries, new RegExp(`^${relativePath.replaceAll('.', '\\.')}$`, 'm'));
	}
} finally {
	await rm(outputRoot, { recursive: true, force: true });
}
