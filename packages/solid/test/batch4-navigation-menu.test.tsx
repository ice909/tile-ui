import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSignal, Show, type JSX } from 'solid-js';
import { delegateEvents, render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
	type NavigationMenuContentProps,
	type NavigationMenuIndicatorProps,
	type NavigationMenuItemProps,
	type NavigationMenuLinkProps,
	type NavigationMenuListProps,
	type NavigationMenuProps,
	type NavigationMenuTriggerProps,
	type NavigationMenuViewportProps,
} from '../src/components/navigation-menu/navigation-menu';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function keydown(element: HTMLElement, key: string, init: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
	element.dispatchEvent(event);
	return event;
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 4 navigation-menu lane', () => {
	it('supports uncontrolled and controlled values, semantic structure, local viewport content, and active anchors', () => {
		let setControlled!: (value: string | undefined) => void;
		const changes: Array<string | undefined> = [];
		const container = mount(() => {
			const [controlled, updateControlled] = createSignal<string | undefined>('one');
			setControlled = updateControlled;
			return (
				<>
					<NavigationMenu defaultValue="one" data-id="uncontrolled">
						<NavigationMenuList>
							<NavigationMenuItem value="one">
								<NavigationMenuTrigger>One</NavigationMenuTrigger>
								<NavigationMenuContent>
									<NavigationMenuLink href="/one" active>
										One link
									</NavigationMenuLink>
								</NavigationMenuContent>
							</NavigationMenuItem>
							<NavigationMenuItem value="two">
								<NavigationMenuTrigger>Two</NavigationMenuTrigger>
								<NavigationMenuContent>Two content</NavigationMenuContent>
							</NavigationMenuItem>
						</NavigationMenuList>
					</NavigationMenu>
					<NavigationMenu value={controlled()} onValueChange={(value) => changes.push(value)} data-id="controlled">
						<NavigationMenuList>
							<NavigationMenuItem value="one">
								<NavigationMenuTrigger>Controlled</NavigationMenuTrigger>
								<NavigationMenuContent>Controlled content</NavigationMenuContent>
							</NavigationMenuItem>
						</NavigationMenuList>
					</NavigationMenu>
				</>
			);
		});
		const root = container.querySelector<HTMLElement>('[data-id="uncontrolled"]')!;
		const triggers = root.querySelectorAll<HTMLButtonElement>('[data-slot="navigation-menu-trigger"]');
		const viewport = root.querySelector<HTMLElement>('[data-slot="navigation-menu-viewport"]')!;
		expect(root.tagName).toBe('NAV');
		expect(root.querySelector('ul > li > button')).toBe(triggers[0]);
		expect(viewport.textContent).toContain('One link');
		expect(document.body.children).toHaveLength(1);
		expect(root.querySelector('a')?.getAttribute('aria-current')).toBe('page');
		expect(root.querySelector('a')?.dataset.active).toBe('true');
		triggers[1].click();
		expect(viewport.textContent).toContain('Two content');
		const controlledTrigger = container.querySelector<HTMLButtonElement>('[data-id="controlled"] button')!;
		controlledTrigger.click();
		expect(changes).toEqual([undefined]);
		expect(controlledTrigger.getAttribute('aria-expanded')).toBe('true');
		setControlled(undefined);
		expect(controlledTrigger.getAttribute('aria-expanded')).toBe('false');
	});

	it('maintains one disabled-aware tab stop and supports arrows, Home, End, and typeahead', () => {
		const container = mount(() => (
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem value="alpha">
						<NavigationMenuTrigger>Alpha</NavigationMenuTrigger>
						<NavigationMenuContent>A</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="beta" disabled>
						<NavigationMenuTrigger>Beta</NavigationMenuTrigger>
						<NavigationMenuContent>B</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="charlie">
						<NavigationMenuTrigger>Charlie</NavigationMenuTrigger>
						<NavigationMenuContent>C</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="delta">
						<NavigationMenuTrigger>Delta</NavigationMenuTrigger>
						<NavigationMenuContent>D</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		));
		const triggers = container.querySelectorAll<HTMLButtonElement>('button');
		expect(Array.from(triggers, (trigger) => trigger.tabIndex)).toEqual([0, -1, -1, -1]);
		triggers[0].focus();
		keydown(triggers[0], 'ArrowRight');
		expect(document.activeElement).toBe(triggers[2]);
		keydown(triggers[2], 'End');
		expect(document.activeElement).toBe(triggers[3]);
		keydown(triggers[3], 'Home');
		expect(document.activeElement).toBe(triggers[0]);
		keydown(triggers[0], 'ArrowLeft');
		expect(document.activeElement).toBe(triggers[3]);
		keydown(triggers[3], 'c');
		expect(document.activeElement).toBe(triggers[2]);
		const shortcut = keydown(triggers[2], 'a', { ctrlKey: true });
		expect(shortcut.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(triggers[2]);
		expect(Array.from(triggers, (trigger) => trigger.tabIndex)).toEqual([-1, -1, 0, -1]);
	});

	it('leaves modified arrows, Home, End, and typeahead to browser shortcuts', () => {
		const container = mount(() => (
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem value="alpha">
						<NavigationMenuTrigger>Alpha</NavigationMenuTrigger>
						<NavigationMenuContent>Alpha</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="beta">
						<NavigationMenuTrigger>Beta</NavigationMenuTrigger>
						<NavigationMenuContent>Beta</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		));
		const triggers = container.querySelectorAll<HTMLButtonElement>('button');
		triggers[0].focus();
		for (const [key, modifier] of [
			['ArrowRight', { ctrlKey: true }],
			['ArrowLeft', { metaKey: true }],
			['Home', { altKey: true }],
			['End', { ctrlKey: true }],
			['b', { metaKey: true }],
		] as const) {
			const event = keydown(triggers[0], key, modifier);
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(triggers[0]);
		}
	});

	it('supports keyboard navigation and modified shortcuts inside an iframe realm', () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		const frameDocument = iframe.contentDocument!;
		const frameWindow = iframe.contentWindow!;
		const realm = frameWindow as Window & typeof globalThis;
		delegateEvents(['keydown'], frameDocument);
		const host = frameDocument.createElement('div');
		frameDocument.body.appendChild(host);
		const dispose = render(
			() => (
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem value="alpha">
							<NavigationMenuTrigger>Alpha</NavigationMenuTrigger>
							<NavigationMenuContent>Alpha</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem value="beta">
							<NavigationMenuTrigger>Beta</NavigationMenuTrigger>
							<NavigationMenuContent>Beta</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem value="charlie">
							<NavigationMenuTrigger>Charlie</NavigationMenuTrigger>
							<NavigationMenuContent>Charlie</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			),
			host,
		);
		disposers.push(() => {
			dispose();
			iframe.remove();
		});
		const triggers = host.querySelectorAll<HTMLButtonElement>('[data-slot="navigation-menu-trigger"]');
		const frameKey = (element: HTMLButtonElement, key: string, init: KeyboardEventInit = {}) => {
			const event = new realm.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, view: frameWindow, ...init });
			element.dispatchEvent(event);
			return event;
		};
		triggers[0].focus();
		frameKey(triggers[0], 'ArrowRight');
		expect(frameDocument.activeElement).toBe(triggers[1]);
		frameKey(triggers[1], 'End');
		expect(frameDocument.activeElement).toBe(triggers[2]);
		frameKey(triggers[2], 'Home');
		expect(frameDocument.activeElement).toBe(triggers[0]);
		frameKey(triggers[0], 'c');
		expect(frameDocument.activeElement).toBe(triggers[2]);
		for (const [key, modifier] of [
			['ArrowLeft', { ctrlKey: true }],
			['Home', { metaKey: true }],
			['End', { altKey: true }],
			['a', { ctrlKey: true }],
		] as const) {
			const event = frameKey(triggers[2], key, modifier);
			expect(event.defaultPrevented).toBe(false);
			expect(frameDocument.activeElement).toBe(triggers[2]);
		}
	});

	it('mounts, unmounts, and switches local content reactively when viewport is false', () => {
		let setValue!: (value: string | undefined) => void;
		const refs: HTMLDivElement[] = [];
		const container = mount(() => {
			const [value, updateValue] = createSignal<string | undefined>('one');
			setValue = updateValue;
			return (
				<NavigationMenu value={value()} viewport={false} data-id="local-menu">
					<NavigationMenuList>
						<NavigationMenuItem value="one">
							<NavigationMenuTrigger>One</NavigationMenuTrigger>
							<NavigationMenuContent id="local-one" ref={(element) => refs.push(element)}>
								One local
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem value="two">
							<NavigationMenuTrigger>Two</NavigationMenuTrigger>
							<NavigationMenuContent id="local-two" ref={(element) => refs.push(element)}>
								Two local
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			);
		});
		const root = container.querySelector<HTMLElement>('[data-id="local-menu"]')!;
		expect(root.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
		expect(root.querySelector('#local-one')?.parentElement?.dataset.slot).toBe('navigation-menu-item');
		expect(root.querySelector('#local-two')).toBeNull();
		setValue('two');
		expect(root.querySelector('#local-one')).toBeNull();
		expect(root.querySelector('#local-two')?.textContent).toBe('Two local');
		setValue(undefined);
		expect(root.querySelectorAll('[data-slot="navigation-menu-content"]')).toHaveLength(0);
		expect(refs.map((element) => element.id)).toEqual(['local-one', 'local-two']);
	});

	it('reactively switches viewport mode and conditional explicit viewport without duplicates', () => {
		let setViewport!: (value: boolean) => void;
		let setExplicit!: (value: boolean) => void;
		const explicitRefs: HTMLDivElement[] = [];
		const contentRefs: HTMLDivElement[] = [];
		const container = mount(() => {
			const [viewport, updateViewport] = createSignal(true);
			const [explicit, updateExplicit] = createSignal(false);
			setViewport = updateViewport;
			setExplicit = updateExplicit;
			return (
				<NavigationMenu defaultValue="one" viewport={viewport()} data-id="reactive-viewport-menu">
					<Show when={explicit()}>
						<NavigationMenuViewport id="conditional-viewport" ref={(element) => explicitRefs.push(element)} />
					</Show>
					<NavigationMenuList>
						<NavigationMenuItem value="one">
							<NavigationMenuTrigger>One</NavigationMenuTrigger>
							<NavigationMenuContent id="reactive-content" ref={(element) => contentRefs.push(element)}>
								Reactive content
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			);
		});
		const root = container.querySelector<HTMLElement>('[data-id="reactive-viewport-menu"]')!;
		const assertSingleContent = () => expect(root.querySelectorAll('#reactive-content')).toHaveLength(1);
		expect(root.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
		expect(root.querySelector('#conditional-viewport')).toBeNull();
		assertSingleContent();
		setExplicit(true);
		expect(root.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
		expect(root.querySelector('#conditional-viewport #reactive-content')).not.toBeNull();
		assertSingleContent();
		setExplicit(false);
		expect(root.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
		expect(root.querySelector('#conditional-viewport')).toBeNull();
		assertSingleContent();
		setViewport(false);
		expect(root.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
		expect(root.querySelector('#reactive-content')?.parentElement?.dataset.slot).toBe('navigation-menu-item');
		assertSingleContent();
		setExplicit(true);
		expect(root.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
		assertSingleContent();
		setViewport(true);
		expect(root.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
		expect(root.querySelector('#conditional-viewport #reactive-content')).not.toBeNull();
		assertSingleContent();
		expect(explicitRefs).toHaveLength(2);
		expect(contentRefs).toHaveLength(5);
		expect(new Set(contentRefs)).toHaveLength(5);
	});

	it('reactively synchronizes trigger and content custom IDs in both directions', () => {
		let setTriggerId!: (value: string) => void;
		let setContentId!: (value: string) => void;
		const container = mount(() => {
			const [triggerId, updateTriggerId] = createSignal('trigger-one');
			const [contentId, updateContentId] = createSignal('content-one');
			setTriggerId = updateTriggerId;
			setContentId = updateContentId;
			return (
				<NavigationMenu defaultValue="one">
					<NavigationMenuList>
						<NavigationMenuItem value="one">
							<NavigationMenuContent id={contentId()}>Content</NavigationMenuContent>
							<NavigationMenuTrigger id={triggerId()}>Trigger</NavigationMenuTrigger>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			);
		});
		const trigger = () => container.querySelector<HTMLButtonElement>('[data-slot="navigation-menu-trigger"]')!;
		const content = () => container.querySelector<HTMLElement>('[data-slot="navigation-menu-content"]')!;
		expect(trigger().getAttribute('aria-controls')).toBe('content-one');
		expect(content().getAttribute('aria-labelledby')).toBe('trigger-one');
		setTriggerId('trigger-two');
		setContentId('content-two');
		expect(trigger().id).toBe('trigger-two');
		expect(trigger().getAttribute('aria-controls')).toBe('content-two');
		expect(content().id).toBe('content-two');
		expect(content().getAttribute('aria-labelledby')).toBe('trigger-two');
	});

	it('uses one consumer viewport without duplicate content, IDs, or refs', () => {
		const refs: Element[] = [];
		const container = mount(() => (
			<NavigationMenu defaultValue="one">
				<NavigationMenuViewport id="manual-viewport" ref={(element) => refs.push(element)} />
				<NavigationMenuList>
					<NavigationMenuItem value="one">
						<NavigationMenuTrigger>One</NavigationMenuTrigger>
						<NavigationMenuContent id="manual-content" ref={(element) => refs.push(element)}>
							Manual content
						</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		));
		expect(container.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
		expect(container.querySelectorAll('#manual-content')).toHaveLength(1);
		expect(container.querySelector('#manual-viewport #manual-content')).not.toBeNull();
		expect(refs.map((element) => element.id)).toEqual(['manual-viewport', 'manual-content']);
	});

	it('clears stale indicator geometry when the active trigger is missing, disabled, or removed', async () => {
		let setValue!: (value: string | undefined) => void;
		let setDisabled!: (value: boolean) => void;
		let setVisible!: (value: boolean) => void;
		const container = mount(() => {
			const [value, updateValue] = createSignal<string | undefined>('one');
			const [disabled, updateDisabled] = createSignal(false);
			const [visible, updateVisible] = createSignal(true);
			setValue = updateValue;
			setDisabled = updateDisabled;
			setVisible = updateVisible;
			return (
				<NavigationMenu value={value()}>
					<NavigationMenuList>
						<Show when={visible()}>
							<NavigationMenuItem value="one" disabled={disabled()}>
								<NavigationMenuTrigger>One</NavigationMenuTrigger>
								<NavigationMenuContent>One</NavigationMenuContent>
							</NavigationMenuItem>
						</Show>
					</NavigationMenuList>
					<NavigationMenuIndicator />
				</NavigationMenu>
			);
		});
		const root = container.querySelector<HTMLElement>('nav')!;
		const trigger = container.querySelector<HTMLButtonElement>('button')!;
		const indicator = container.querySelector<HTMLElement>('[data-slot="navigation-menu-indicator"]')!;
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 0, width: 300, height: 40, right: 310, bottom: 40, x: 10, y: 0, toJSON: () => ({}) });
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ left: 30, top: 0, width: 70, height: 30, right: 100, bottom: 30, x: 30, y: 0, toJSON: () => ({}) });
		window.dispatchEvent(new Event('resize'));
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(indicator.dataset.state).toBe('visible');
		setValue('missing');
		expect(indicator.dataset.state).toBe('hidden');
		expect(indicator.style.left).toBe('');
		setValue('one');
		setDisabled(true);
		expect(indicator.dataset.state).toBe('hidden');
		setDisabled(false);
		setVisible(false);
		expect(indicator.dataset.state).toBe('hidden');
	});

	it('synchronizes custom IDs, isolates nested ownership, and closes only the nested owner on Escape', async () => {
		const container = mount(() => (
			<NavigationMenu defaultValue="outer" data-id="outer">
				<NavigationMenuList>
					<NavigationMenuItem value="outer">
						<NavigationMenuContent id="outer-content">
							<NavigationMenu defaultValue="inner" data-id="inner">
								<NavigationMenuList>
									<NavigationMenuItem value="inner">
										<NavigationMenuContent id="inner-content">Inner content</NavigationMenuContent>
										<NavigationMenuTrigger id="inner-trigger">Inner</NavigationMenuTrigger>
									</NavigationMenuItem>
								</NavigationMenuList>
							</NavigationMenu>
						</NavigationMenuContent>
						<NavigationMenuTrigger id="outer-trigger">Outer</NavigationMenuTrigger>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		));
		const outer = container.querySelector<HTMLElement>('[data-id="outer"]')!;
		const inner = container.querySelector<HTMLElement>('[data-id="inner"]')!;
		const outerTrigger = container.querySelector<HTMLButtonElement>('#outer-trigger')!;
		const innerTrigger = container.querySelector<HTMLButtonElement>('#inner-trigger')!;
		expect(outer.dataset.navigationMenuOwner).not.toBe(inner.dataset.navigationMenuOwner);
		expect(outerTrigger.getAttribute('aria-controls')).toBe('outer-content');
		expect(container.querySelector('#outer-content')?.getAttribute('aria-labelledby')).toBe('outer-trigger');
		expect(innerTrigger.getAttribute('aria-controls')).toBe('inner-content');
		expect(container.querySelector('#inner-content')?.getAttribute('aria-labelledby')).toBe('inner-trigger');
		keydown(innerTrigger, 'Escape');
		await Promise.resolve();
		expect(innerTrigger.getAttribute('aria-expanded')).toBe('false');
		expect(outerTrigger.getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(innerTrigger);
	});

	it('closes on outside interaction, respects prevented custom events, and updates indicator geometry', async () => {
		const changes: Array<string | undefined> = [];
		let indicator!: HTMLDivElement;
		const preventKey = (_data: string, event: KeyboardEvent) => event.preventDefault();
		const preventClick = (_data: string, event: MouseEvent) => event.preventDefault();
		const container = mount(() => (
			<NavigationMenu defaultValue="one" onValueChange={(value) => changes.push(value)}>
				<NavigationMenuList onKeyDown={[preventKey, 'list']}>
					<NavigationMenuItem value="one">
						<NavigationMenuTrigger onClick={[preventClick, 'trigger']}>One</NavigationMenuTrigger>
						<NavigationMenuContent>One content</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="two">
						<NavigationMenuTrigger>Two</NavigationMenuTrigger>
						<NavigationMenuContent>Two content</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
				<NavigationMenuIndicator ref={(element) => (indicator = element)} />
			</NavigationMenu>
		));
		const root = container.querySelector<HTMLElement>('nav')!;
		const triggers = root.querySelectorAll<HTMLButtonElement>('button');
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 0, width: 300, height: 40, right: 310, bottom: 40, x: 10, y: 0, toJSON: () => ({}) });
		vi.spyOn(triggers[0], 'getBoundingClientRect').mockReturnValue({ left: 40, top: 0, width: 80, height: 30, right: 120, bottom: 30, x: 40, y: 0, toJSON: () => ({}) });
		expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
		triggers[0].click();
		expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
		triggers[0].focus();
		keydown(triggers[0], 'ArrowRight');
		expect(document.activeElement).toBe(triggers[0]);
		window.dispatchEvent(new Event('resize'));
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(indicator.style.left).toBe('30px');
		expect(indicator.style.width).toBe('80px');
		document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
		expect(changes).toEqual([undefined]);
	});

	it('preserves callback refs, native attributes, and excludes asChild from the public API', () => {
		const refs: Element[] = [];
		const container = mount(() => (
			<NavigationMenu ref={(element) => refs.push(element)} data-ref="root">
				<NavigationMenuList ref={(element) => refs.push(element)} data-ref="list">
					<NavigationMenuItem value="one" ref={(element) => refs.push(element)} data-ref="item">
						<NavigationMenuTrigger ref={(element) => refs.push(element)} data-ref="trigger">
							One
						</NavigationMenuTrigger>
						<NavigationMenuContent ref={(element) => refs.push(element)} data-ref="content">
							<NavigationMenuLink href="/one" ref={(element) => refs.push(element)} data-ref="link">
								One
							</NavigationMenuLink>
						</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
				<NavigationMenuIndicator ref={(element) => refs.push(element)} data-ref="indicator" />
			</NavigationMenu>
		));
		container.querySelector<HTMLButtonElement>('button')!.click();
		expect(refs.map((element) => element.getAttribute('data-ref'))).toEqual(['root', 'list', 'item', 'trigger', 'indicator', 'content', 'link']);
		const nav = document.createElement('nav');
		const list = document.createElement('ul');
		const item = document.createElement('li');
		const button = document.createElement('button');
		const div = document.createElement('div');
		const anchor = document.createElement('a');
		// @ts-expect-error Wrapper refs are callbacks.
		const rootProps: NavigationMenuProps = { ref: nav };
		// @ts-expect-error Wrapper refs are callbacks.
		const listProps: NavigationMenuListProps = { ref: list };
		// @ts-expect-error Wrapper refs are callbacks.
		const itemProps: NavigationMenuItemProps = { value: 'one', ref: item };
		// @ts-expect-error Wrapper refs are callbacks.
		const triggerProps: NavigationMenuTriggerProps = { ref: button };
		// @ts-expect-error Wrapper refs are callbacks.
		const contentProps: NavigationMenuContentProps = { ref: div };
		// @ts-expect-error Wrapper refs are callbacks.
		const viewportProps: NavigationMenuViewportProps = { ref: div };
		// @ts-expect-error Wrapper refs are callbacks.
		const indicatorProps: NavigationMenuIndicatorProps = { ref: div };
		// @ts-expect-error NavigationMenuLink intentionally has no asChild API.
		const linkProps: NavigationMenuLinkProps = { ref: anchor, asChild: true };
		expect([rootProps, listProps, itemProps, triggerProps, contentProps, viewportProps, indicatorProps, linkProps]).toHaveLength(8);
	});

	it('renders and hydrates stable IDs, one tab stop, and active content inside the root-local viewport', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch4-navigation-menu-'));
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		try {
			execFileSync(
				process.execPath,
				[
					'--input-type=module',
					'-e',
					String.raw`
				import path from 'node:path';
				import { build } from 'vite';
				import solid from 'vite-plugin-solid';
				const [outputRoot, stylesRoot] = process.argv.slice(1);
				const css = { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } };
				await build({ plugins: [solid({ ssr: true })], logLevel: 'silent', css, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: 'test/fixtures/batch4-navigation-menu-server.tsx', outDir: path.join(outputRoot, 'server'), rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
				await build({ plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { conditions: ['browser'] }, build: { outDir: path.join(outputRoot, 'client'), lib: { entry: 'test/fixtures/batch4-navigation-menu-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
			`,
					outputRoot,
					stylesRoot,
				],
				{ cwd: process.cwd(), stdio: 'inherit' },
			);
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const first = server.renderBatch4NavigationMenuFixture() as { html: string; hydrationScript: string; renderId: string };
			const second = server.renderBatch4NavigationMenuFixture() as { html: string };
			expect(first.html).toBe(second.html);
			const serverContainer = document.createElement('div');
			serverContainer.innerHTML = first.html;
			const serverRoot = serverContainer.querySelector<HTMLElement>('nav')!;
			const serverTriggers = serverRoot.querySelectorAll<HTMLButtonElement>('button[data-slot="navigation-menu-trigger"]');
			expect(Array.from(serverTriggers, (trigger) => trigger.tabIndex)).toEqual([-1, 0, -1]);
			expect(serverRoot.querySelector('[data-slot="navigation-menu-viewport"] #products-content')).not.toBeNull();
			expect(serverRoot.querySelector('#products-trigger')?.getAttribute('aria-controls')).toBe('products-content');
			expect(serverRoot.querySelector('#products-content')?.getAttribute('aria-labelledby')).toBe('products-trigger');
			const serverManualRoot = serverContainer.querySelector<HTMLElement>('[data-id="manual-hydration-menu"]')!;
			expect(serverManualRoot.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
			expect(serverManualRoot.querySelectorAll('#manual-content')).toHaveLength(1);
			expect(serverManualRoot.querySelector('#manual-viewport #manual-content')).not.toBeNull();
			const serverLocalRoot = serverContainer.querySelector<HTMLElement>('[data-id="local-hydration-menu"]')!;
			expect(serverLocalRoot.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
			expect(serverLocalRoot.querySelector('#local-content')?.parentElement?.dataset.slot).toBe('navigation-menu-item');

			const scriptContainer = document.createElement('div');
			scriptContainer.innerHTML = first.hydrationScript;
			new Function(scriptContainer.textContent ?? '')();
			document.body.innerHTML = `<div id="app">${first.html}</div>`;
			const app = document.querySelector<HTMLElement>('#app')!;
			const root = app.querySelector<HTMLElement>('nav')!;
			const ids = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-slot="navigation-menu-trigger"]'), (trigger) => trigger.id);
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateBatch4NavigationMenuFixture(app, first.renderId);
			(window as typeof window & { _$HY: { fe: () => void } })._$HY.fe();
			await Promise.resolve();
			expect(app.querySelector('nav')).toBe(root);
			expect(Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-slot="navigation-menu-trigger"]'), (trigger) => trigger.id)).toEqual(ids);
			expect(root.querySelector('[data-slot="navigation-menu-viewport"] #products-content')).not.toBeNull();
			expect(Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-slot="navigation-menu-trigger"]'), (trigger) => trigger.tabIndex)).toEqual([-1, 0, -1]);
			const hydratedManualRoot = app.querySelector<HTMLElement>('[data-id="manual-hydration-menu"]')!;
			expect(hydratedManualRoot.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
			expect(hydratedManualRoot.querySelectorAll('#manual-content')).toHaveLength(1);
			expect(hydratedManualRoot.querySelector('#manual-viewport #manual-content')).not.toBeNull();
			const hydratedLocalRoot = app.querySelector<HTMLElement>('[data-id="local-hydration-menu"]')!;
			expect(hydratedLocalRoot.querySelector('[data-slot="navigation-menu-viewport"]')).toBeNull();
			expect(hydratedLocalRoot.querySelector('#local-content')?.parentElement?.dataset.slot).toBe('navigation-menu-item');
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	});
});
