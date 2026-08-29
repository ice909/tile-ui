import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DirectionProvider, useDirection } from '../src/components/direction/direction';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from '../src/components/message/message';

const disposers: Array<() => void> = [];
const execFileAsync = promisify(execFile);

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function DirectionValue(props: { id: string }) {
	const direction = useDirection();
	return <span data-id={props.id}>{direction()}</span>;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 3 presentation lane', () => {
	it('DirectionProvider renders a real wrapper and preserves attrs, class, ref, and children', () => {
		const refs: HTMLDivElement[] = [];
		const container = mount(() => (
			<DirectionProvider ref={(element) => refs.push(element)} dir="rtl" id="direction-root" class="direction-user" aria-label="Arabic content" style={{ color: 'red' }}>
				<strong>مرحبا</strong>
				<DirectionValue id="inside" />
			</DirectionProvider>
		));
		const root = container.firstElementChild as HTMLDivElement;
		expect(refs).toEqual([root]);
		expect(root.tagName).toBe('DIV');
		expect(root.dir).toBe('rtl');
		expect(root.id).toBe('direction-root');
		expect(root.getAttribute('aria-label')).toBe('Arabic content');
		expect(root.style.color).toBe('red');
		expect(root.className).toContain('root');
		expect(root.className).toContain('direction-user');
		expect(root.querySelector('strong')?.textContent).toBe('مرحبا');
		expect(root.querySelector('[data-id="inside"]')?.textContent).toBe('rtl');
	});

	it('DirectionProvider and useDirection react to aliases, precedence, nesting, and the outside default', () => {
		let setDir!: (value: 'ltr' | 'rtl') => void;
		let setDirection!: (value: 'ltr' | 'rtl' | undefined) => void;
		const container = mount(() => {
			const [dir, updateDir] = createSignal<'ltr' | 'rtl'>('ltr');
			const [direction, updateDirection] = createSignal<'ltr' | 'rtl'>();
			setDir = updateDir;
			setDirection = updateDirection;
			return (
				<>
					<DirectionValue id="outside" />
					<DirectionProvider data-id="provider" dir={dir()} direction={direction()}>
						<DirectionValue id="provider-value" />
						<DirectionProvider data-id="nested" direction="rtl">
							<DirectionValue id="nested-value" />
						</DirectionProvider>
					</DirectionProvider>
				</>
			);
		});
		const provider = container.querySelector('[data-id="provider"]') as HTMLDivElement;
		expect(container.querySelector('[data-id="outside"]')?.textContent).toBe('ltr');
		expect([provider.dir, container.querySelector('[data-id="provider-value"]')?.textContent]).toEqual(['ltr', 'ltr']);
		expect(container.querySelector('[data-id="nested"]')?.getAttribute('dir')).toBe('rtl');
		expect(container.querySelector('[data-id="nested-value"]')?.textContent).toBe('rtl');
		setDir('rtl');
		expect([provider.dir, container.querySelector('[data-id="provider-value"]')?.textContent]).toEqual(['rtl', 'rtl']);
		setDirection('ltr');
		expect([provider.dir, container.querySelector('[data-id="provider-value"]')?.textContent]).toEqual(['ltr', 'ltr']);
		setDir('rtl');
		expect(provider.dir).toBe('ltr');
	});

	it('Message exposes all six primitives with style keys, slots, alignment metadata, attrs, classes, refs, and children', () => {
		const refs: HTMLDivElement[] = [];
		const container = mount(() => (
			<MessageGroup ref={(element) => refs.push(element)} id="thread" class="group-user" aria-label="Conversation">
				<Message ref={(element) => refs.push(element)} align="end" class="message-user" title="Sent message">
					<MessageAvatar ref={(element) => refs.push(element)} class="avatar-user" data-id="avatar">
						A
					</MessageAvatar>
					<MessageContent ref={(element) => refs.push(element)} class="content-user" data-id="content">
						<MessageHeader ref={(element) => refs.push(element)} class="header-user" data-id="header">
							Alice
						</MessageHeader>
						<p>Hello</p>
						<MessageFooter ref={(element) => refs.push(element)} class="footer-user" data-id="footer">
							10:00
						</MessageFooter>
					</MessageContent>
				</Message>
			</MessageGroup>
		));
		const group = container.querySelector('[data-slot="message-group"]') as HTMLDivElement;
		const message = container.querySelector('[data-slot="message"]') as HTMLDivElement;
		const primitives = ['avatar', 'content', 'header', 'footer'].map((name) => container.querySelector(`[data-slot="message-${name}"]`) as HTMLDivElement);
		expect(refs).toEqual([group, message, ...primitives]);
		expect(group.id).toBe('thread');
		expect(group.getAttribute('aria-label')).toBe('Conversation');
		expect(group.className).toContain('group');
		expect(group.className).toContain('group-user');
		expect(message.dataset.align).toBe('end');
		expect(message.title).toBe('Sent message');
		expect(message.className).toContain('message');
		expect(message.className).toContain('alignEnd');
		expect(message.className).toContain('message-user');
		expect(primitives.map((element) => element.dataset.slot)).toEqual(['message-avatar', 'message-content', 'message-header', 'message-footer']);
		expect(primitives.map((element) => element.className)).toEqual([
			expect.stringContaining('avatar-user'),
			expect.stringContaining('content-user'),
			expect.stringContaining('header-user'),
			expect.stringContaining('footer-user'),
		]);
		expect(group.textContent).toContain('Alice');
		expect(group.textContent).toContain('Hello');
		expect(group.textContent).toContain('10:00');
	});

	it('Message alignment is reactive and primitives do not invent live-region or list semantics', () => {
		let setAlign!: (value: 'start' | 'end') => void;
		const container = mount(() => {
			const [align, updateAlign] = createSignal<'start' | 'end'>('start');
			setAlign = updateAlign;
			return (
				<MessageGroup>
					<Message align={align()}>
						<MessageAvatar />
						<MessageContent>
							<MessageHeader />
							<MessageFooter />
						</MessageContent>
					</Message>
				</MessageGroup>
			);
		});
		const elements = container.querySelectorAll<HTMLElement>('[data-slot]');
		const message = container.querySelector('[data-slot="message"]') as HTMLDivElement;
		expect(message.dataset.align).toBe('start');
		expect(message.className).toContain('alignStart');
		setAlign('end');
		expect(message.dataset.align).toBe('end');
		expect(message.className).toContain('alignEnd');
		expect(Array.from(elements, (element) => [element.getAttribute('role'), element.getAttribute('aria-live')])).toEqual(Array.from(elements, () => [null, null]));
	});

	it('Direction and Message produce deterministic SSR and hydrate without replacing nodes', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-presentation-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const componentRoot = path.resolve(import.meta.dirname, '../src/components');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const solidRoot = path.resolve(packageRoot, 'node_modules/solid-js');
		const coreEntry = path.resolve(packageRoot, '../core/src/index.ts');
		const stylesPackageRoot = path.resolve(packageRoot, '../styles');
		const fixtureSource = `
			import { createSignal } from 'solid-js';
			import { DirectionProvider, useDirection } from ${JSON.stringify(path.join(componentRoot, 'direction/direction.tsx'))};
			import { Message, MessageContent, MessageGroup, MessageHeader } from ${JSON.stringify(path.join(componentRoot, 'message/message.tsx'))};
			function Value() { const direction = useDirection(); return <span data-id="value">{direction()}</span>; }
			export function Fixture() {
				const [direction, setDirection] = createSignal('rtl');
				const [align, setAlign] = createSignal('end');
				return <DirectionProvider data-id="direction" direction={direction()} class="direction-user">
					<Value />
					<MessageGroup data-id="group"><Message data-id="message" align={align()}><MessageContent><MessageHeader>Stable</MessageHeader></MessageContent></Message></MessageGroup>
					<button type="button" data-id="update" onClick={() => { setDirection('ltr'); setAlign('start'); }}>Update</button>
				</DirectionProvider>;
			}`;
		const serverEntry = path.join(outputRoot, 'server-entry.tsx');
		const clientEntry = path.join(outputRoot, 'client-entry.tsx');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(import.meta.dirname, '../node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		await Promise.all([
			writeFile(
				serverEntry,
				`${fixtureSource}\nimport { generateHydrationScript, renderToString } from 'solid-js/web'; export const renderFixture = () => ({ html: renderToString(() => <Fixture />, { renderId: 'batch3-' }), hydrationScript: generateHydrationScript(), renderId: 'batch3-' });`,
			),
			writeFile(
				clientEntry,
				`${fixtureSource}\nimport { hydrate } from 'solid-js/web'; export const hydrateFixture = (container, renderId) => hydrate(() => <Fixture />, container, { renderId });`,
			),
			writeFile(
				buildScript,
				`import { build } from ${JSON.stringify(viteUrl)};
				import solid from ${JSON.stringify(solidPluginUrl)};
				const root = ${JSON.stringify(packageRoot)};
				const stylesRoot = ${JSON.stringify(stylesRoot)};
				const alias = { 'solid-js': ${JSON.stringify(solidRoot)}, '@tile-ui/core': ${JSON.stringify(coreEntry)}, '@tile-ui/styles': ${JSON.stringify(stylesPackageRoot)} };
				await build({ root, plugins: [solid({ ssr: true })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias }, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: ${JSON.stringify(serverEntry)}, outDir: ${JSON.stringify(path.join(outputRoot, 'server'))}, rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
				await build({ root, plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias, conditions: ['browser'] }, build: { outDir: ${JSON.stringify(path.join(outputRoot, 'client'))}, lib: { entry: ${JSON.stringify(clientEntry)}, formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });`,
			),
		]);
		try {
			try {
				await execFileAsync(process.execPath, [buildScript], { cwd: packageRoot });
			} catch (error) {
				const failure = error as { stderr?: string; stdout?: string };
				throw new Error(failure.stderr || failure.stdout || String(error));
			}
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const first = server.renderFixture();
			const second = server.renderFixture();
			expect(second.html).toBe(first.html);
			expect(first.html).toContain('dir="rtl"');
			expect(first.html).toContain('data-align="end"');
			expect(first.html).not.toMatch(/role="(?:alert|log|status)"|aria-live=/);

			document.body.innerHTML = `<div id="batch3-app">${first.html}</div>`;
			const hydrationCode = first.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			const hydrationState = (window as typeof window & { _$HY?: unknown })._$HY;
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: hydrationState, writable: true });
			const container = document.querySelector('#batch3-app') as HTMLElement;
			const direction = container.querySelector('[data-id="direction"]') as HTMLDivElement;
			const message = container.querySelector('[data-id="message"]') as HTMLDivElement;
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateFixture(container, first.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await Promise.resolve();
			expect(container.querySelector('[data-id="direction"]')).toBe(direction);
			expect(container.querySelector('[data-id="message"]')).toBe(message);
			(container.querySelector('[data-id="update"]') as HTMLButtonElement).click();
			expect([direction.dir, container.querySelector('[data-id="value"]')?.textContent, message.dataset.align]).toEqual(['ltr', 'ltr', 'start']);
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});
