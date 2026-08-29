import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
	useSidebar,
	type SidebarGroupLabelProps,
	type SidebarMenuButtonProps,
	type SidebarProviderProps,
	type SidebarProps,
} from '../src/components/sidebar/sidebar';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function keydown(target: EventTarget, init: KeyboardEventInit) {
	const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(event);
	return event;
}

async function settle() {
	await Promise.resolve();
	for (let depth = 0; depth < 3; depth += 1) {
		await new Promise((resolve) => setTimeout(resolve, 0));
		await Promise.resolve();
	}
}

function mockMatchMedia(initial: boolean) {
	let matches = initial;
	const listeners = new Set<(event: MediaQueryListEvent) => void>();
	const media = {
		get matches() {
			return matches;
		},
		media: '(max-width: 767px)',
		onchange: null,
		addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
		removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	};
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => media),
	);
	return {
		media,
		set(next: boolean) {
			matches = next;
			for (const listener of listeners) listener({ matches: next, media: media.media } as MediaQueryListEvent);
		},
	};
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	document.body.style.overflow = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Batch 5 Sidebar lane', () => {
	it('supports controlled desktop state, accessor context, ARIA relationships, and cancellable trigger composition', () => {
		mockMatchMedia(false);
		let setOpen!: (open: boolean) => void;
		const changes: boolean[] = [];
		let contextSnapshot!: ReturnType<typeof useSidebar>;
		const container = mount(() => {
			const [open, updateOpen] = createSignal(true);
			setOpen = updateOpen;
			return (
				<SidebarProvider open={open()} onOpenChange={(next) => changes.push(next)} sidebarId="controlled-sidebar">
					{(() => {
						contextSnapshot = useSidebar();
						return null;
					})()}
					<Sidebar collapsible="icon" />
					<SidebarTrigger id="prevented" onClick={(event) => event.preventDefault()} />
					<SidebarTrigger id="active" />
				</SidebarProvider>
			);
		});
		const sidebar = container.querySelector<HTMLElement>('[data-slot="sidebar-container"]')!;
		const prevented = container.querySelector<HTMLButtonElement>('#prevented')!;
		const active = container.querySelector<HTMLButtonElement>('#active')!;
		expect(typeof contextSnapshot.open).toBe('function');
		expect(contextSnapshot.open()).toBe(true);
		expect(active.getAttribute('aria-controls')).toBe('controlled-sidebar');
		expect(active.getAttribute('aria-expanded')).toBe('true');
		prevented.click();
		expect(changes).toEqual([]);
		active.click();
		expect(changes).toEqual([false]);
		expect(sidebar.dataset.state).toBe('expanded');
		setOpen(false);
		expect(contextSnapshot.open()).toBe(false);
		expect(active.getAttribute('aria-expanded')).toBe('false');
		expect(sidebar.dataset.state).toBe('collapsed');
	});

	it('restores mobile focus to the trigger that opened the sheet and safely ignores a removed opener', async () => {
		mockMatchMedia(true);
		let setSecondVisible!: (visible: boolean) => void;
		const container = mount(() => {
			const [secondVisible, updateSecondVisible] = createSignal(true);
			setSecondVisible = updateSecondVisible;
			return (
				<SidebarProvider sidebarId="multi-trigger-sidebar">
					<Sidebar>
						<button id="sheet-focus-target">Sheet focus target</button>
					</Sidebar>
					<SidebarTrigger id="first-trigger" />
					<Show when={secondVisible()}>
						<SidebarTrigger id="second-trigger" />
					</Show>
				</SidebarProvider>
			);
		});
		const first = container.querySelector<HTMLButtonElement>('#first-trigger')!;
		const second = container.querySelector<HTMLButtonElement>('#second-trigger')!;
		first.click();
		await settle();
		keydown(document, { key: 'Escape' });
		await Promise.resolve();
		expect(document.activeElement).toBe(first);

		second.click();
		await settle();
		expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
		setSecondVisible(false);
		expect(second.isConnected).toBe(false);
		keydown(document, { key: 'Escape' });
		await Promise.resolve();
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(document.activeElement).not.toBe(second);
	});

	it('keeps rail ARIA state aligned with the desktop or mobile state it toggles', async () => {
		const query = mockMatchMedia(false);
		const container = mount(() => (
			<SidebarProvider defaultOpen={false} sidebarId="rail-sidebar">
				<Sidebar />
				<SidebarRail id="responsive-rail" />
			</SidebarProvider>
		));
		const rail = container.querySelector<HTMLButtonElement>('#responsive-rail')!;
		expect(rail.getAttribute('aria-controls')).toBe('rail-sidebar');
		expect(rail.getAttribute('aria-expanded')).toBe('false');
		rail.click();
		expect(rail.getAttribute('aria-expanded')).toBe('true');
		query.set(true);
		expect(rail.getAttribute('aria-expanded')).toBe('false');
		rail.click();
		expect(rail.getAttribute('aria-expanded')).toBe('true');
		await settle();
		expect(document.querySelector('[role="dialog"]')?.id).toBe('rail-sidebar');
		keydown(document, { key: 'Escape' });
		await Promise.resolve();
		expect(rail.getAttribute('aria-expanded')).toBe('false');
		query.set(false);
		expect(rail.getAttribute('aria-expanded')).toBe('true');
	});

	it('keeps desktop and mobile state separate and cleans up the media watcher', async () => {
		const query = mockMatchMedia(false);
		const container = mount(() => (
			<SidebarProvider defaultOpen={false} sidebarId="responsive-sidebar">
				<Sidebar>
					<button>Mobile focus target</button>
				</Sidebar>
				<SidebarTrigger />
			</SidebarProvider>
		));
		const trigger = container.querySelector<HTMLButtonElement>('[data-slot="sidebar-trigger"]')!;
		trigger.click();
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		query.set(true);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		trigger.focus();
		trigger.click();
		await settle();
		const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
		expect(dialog.id).toBe('responsive-sidebar');
		expect(dialog.dataset.mobile).toBe('true');
		expect(dialog.contains(document.activeElement)).toBe(true);
		keydown(document, { key: 'Escape' });
		await Promise.resolve();
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
		query.set(false);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		for (const dispose of disposers.splice(0)) dispose();
		expect(query.media.removeEventListener).toHaveBeenCalledOnce();
	});

	it('handles Cmd/Ctrl+B outside editable and composing targets only', () => {
		mockMatchMedia(false);
		const container = mount(() => (
			<SidebarProvider defaultOpen>
				<Sidebar />
				<SidebarTrigger />
				<input />
				<textarea />
				<div contentEditable>Edit</div>
			</SidebarProvider>
		));
		const trigger = container.querySelector<HTMLButtonElement>('[data-slot="sidebar-trigger"]')!;
		const input = container.querySelector('input')!;
		const textarea = container.querySelector('textarea')!;
		const editable = container.querySelector<HTMLElement>('[contenteditable]')!;
		for (const target of [input, textarea, editable]) {
			const event = keydown(target, { key: 'b', ctrlKey: true });
			expect(event.defaultPrevented).toBe(false);
			expect(trigger.getAttribute('aria-expanded')).toBe('true');
		}
		const composing = keydown(document.body, { key: 'b', metaKey: true, isComposing: true });
		expect(composing.defaultPrevented).toBe(false);
		const wrongKey = keydown(document.body, { key: 'x', ctrlKey: true });
		expect(wrongKey.defaultPrevented).toBe(false);
		const shortcut = keydown(document.body, { key: 'B', ctrlKey: true });
		expect(shortcut.defaultPrevented).toBe(true);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});

	it('shows menu tooltips only on collapsed desktop and keeps deterministic skeleton width', async () => {
		const query = mockMatchMedia(false);
		const container = mount(() => (
			<SidebarProvider defaultOpen>
				<Sidebar collapsible="icon">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton tooltip="Inbox">Inbox</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuSkeleton showIcon data-id="skeleton" />
					</SidebarMenu>
				</Sidebar>
				<SidebarTrigger />
			</SidebarProvider>
		));
		expect(container.querySelector('[data-slot="tooltip"]')).toBeNull();
		container.querySelector<HTMLButtonElement>('[data-slot="sidebar-trigger"]')!.click();
		const tooltip = container.querySelector<HTMLElement>('[data-slot="tooltip"]')!;
		expect(tooltip).not.toBeNull();
		const menuButton = tooltip.querySelector<HTMLButtonElement>('[data-slot="tooltip-trigger"]')!;
		menuButton.focus();
		await Promise.resolve();
		expect(document.querySelector('[role="tooltip"]')?.textContent).toContain('Inbox');
		const skeletonText = container.querySelector<HTMLElement>('[data-id="skeleton"] [aria-hidden="true"]:last-child')!;
		expect(skeletonText.style.getPropertyValue('--skeleton-width')).toBe('70%');
		query.set(true);
		expect(container.querySelector('[data-slot="tooltip"]')).toBeNull();
	});

	it('renders all 23 components with native attributes, callback refs, and active link semantics', () => {
		mockMatchMedia(false);
		const refs: Element[] = [];
		const container = mount(() => (
			<SidebarProvider ref={(element) => refs.push(element)} data-native="provider">
				<Sidebar ref={(element) => refs.push(element)} data-native="sidebar" collapsible="none">
					<SidebarHeader ref={(element) => refs.push(element)}>
						<SidebarInput ref={(element) => refs.push(element)} aria-label="Search" />
					</SidebarHeader>
					<SidebarSeparator ref={(element) => refs.push(element)} />
					<SidebarContent ref={(element) => refs.push(element)}>
						<SidebarGroup ref={(element) => refs.push(element)}>
							<SidebarGroupLabel ref={(element) => refs.push(element)}>Group</SidebarGroupLabel>
							<SidebarGroupAction ref={(element) => refs.push(element)}>Add</SidebarGroupAction>
							<SidebarGroupContent ref={(element) => refs.push(element)}>
								<SidebarMenu ref={(element) => refs.push(element)}>
									<SidebarMenuItem ref={(element) => refs.push(element)}>
										<SidebarMenuButton ref={(element) => refs.push(element)} isActive>
											Home
										</SidebarMenuButton>
										<SidebarMenuAction ref={(element) => refs.push(element)}>More</SidebarMenuAction>
										<SidebarMenuBadge ref={(element) => refs.push(element)}>2</SidebarMenuBadge>
									</SidebarMenuItem>
									<SidebarMenuSkeleton ref={(element) => refs.push(element)} />
									<SidebarMenuSub ref={(element) => refs.push(element)}>
										<SidebarMenuSubItem ref={(element) => refs.push(element)}>
											<SidebarMenuSubButton ref={(element) => refs.push(element)} href="/settings" isActive>
												Settings
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									</SidebarMenuSub>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter ref={(element) => refs.push(element)}>Footer</SidebarFooter>
					<SidebarRail ref={(element) => refs.push(element)} />
				</Sidebar>
				<SidebarInset ref={(element) => refs.push(element)} data-native="inset">
					<SidebarTrigger ref={(element) => refs.push(element)} />
				</SidebarInset>
			</SidebarProvider>
		));
		expect(container.querySelector('[data-native="provider"]')).not.toBeNull();
		expect(container.querySelector('[data-native="sidebar"]')).not.toBeNull();
		expect(container.querySelector('[data-native="inset"]')?.tagName).toBe('MAIN');
		expect(container.querySelector<HTMLAnchorElement>('a[href="/settings"]')?.getAttribute('aria-current')).toBe('page');
		expect(container.querySelector('[data-slot="sidebar-menu-button"]')?.getAttribute('data-active')).toBe('true');
		expect(refs).toHaveLength(23);
		expect(new Set(refs).size).toBe(23);
	});

	it('excludes asChild, Sidebar id, and element refs from the public type boundary', () => {
		// @ts-expect-error Solid Sidebar intentionally has no asChild API.
		const unsupportedLabel: SidebarGroupLabelProps = { asChild: true };
		// @ts-expect-error Solid Sidebar menu buttons intentionally have no asChild API.
		const unsupportedButton: SidebarMenuButtonProps = { asChild: true };
		// @ts-expect-error SidebarProvider.sidebarId is the authoritative ARIA relationship ID.
		const divergentSidebarId: SidebarProps = { id: 'divergent-sidebar' };
		// @ts-expect-error Wrapper refs are callback-only.
		const invalidRef: SidebarProviderProps = { ref: document.createElement('div') };
		expect([unsupportedLabel, unsupportedButton, divergentSidebarId, invalidRef]).toHaveLength(4);
	});

	it('renders deterministic desktop SSR and preserves hydration identity before media activation', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch5-sidebar-'));
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
				await build({ plugins: [solid({ ssr: true })], logLevel: 'silent', css, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: 'test/fixtures/batch5-sidebar-server.tsx', outDir: path.join(outputRoot, 'server'), rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
				await build({ plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { conditions: ['browser'] }, build: { outDir: path.join(outputRoot, 'client'), lib: { entry: 'test/fixtures/batch5-sidebar-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
			`,
					outputRoot,
					stylesRoot,
				],
				{ cwd: process.cwd(), stdio: 'inherit' },
			);
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${Buffer.from(serverCode).toString('base64')}`);
			const first = server.renderBatch5SidebarFixture() as { html: string; hydrationScript: string; renderId: string };
			const second = server.renderBatch5SidebarFixture() as { html: string };
			expect(first.html).toBe(second.html);
			const serverContainer = document.createElement('div');
			serverContainer.innerHTML = first.html;
			expect(serverContainer.querySelector('[data-slot="sidebar-container"]')?.getAttribute('data-state')).toBe('collapsed');
			expect(serverContainer.querySelector('[data-slot="sidebar"]')?.id).toBe('hydration-sidebar');
			expect(serverContainer.querySelector('#divergent-sidebar')).toBeNull();
			expect(serverContainer.querySelector('#hydration-trigger')?.getAttribute('aria-controls')).toBe('hydration-sidebar');
			expect(serverContainer.querySelector('#hydration-rail')?.getAttribute('aria-controls')).toBe('hydration-sidebar');
			expect(serverContainer.querySelector('#hydration-trigger')?.getAttribute('aria-expanded')).toBe('false');
			expect(serverContainer.querySelector('#hydration-rail')?.getAttribute('aria-expanded')).toBe('false');
			expect(serverContainer.querySelector('[data-mobile="true"]')).toBeNull();
			expect(
				serverContainer.querySelector<HTMLElement>('[data-slot="sidebar-menu-skeleton"] [aria-hidden="true"]:last-child')?.style.getPropertyValue('--skeleton-width'),
			).toBe('70%');

			const scriptContainer = document.createElement('div');
			scriptContainer.innerHTML = first.hydrationScript;
			new Function(scriptContainer.textContent ?? '')();
			document.body.innerHTML = `<div id="app">${first.html}</div>`;
			const app = document.querySelector<HTMLElement>('#app')!;
			const desktop = app.querySelector<HTMLElement>('[data-slot="sidebar-container"]')!;
			let matches = false;
			const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();
			const media = {
				get matches() {
					return matches;
				},
				media: '(max-width: 767px)',
				onchange: null,
				addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.add(listener)),
				removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.delete(listener)),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
			};
			const matchMedia = vi.fn(() => media);
			vi.stubGlobal('matchMedia', matchMedia);
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${Buffer.from(`const _$HY = globalThis._$HY;\n${clientCode}`).toString('base64')}`);
			client.hydrateBatch5SidebarFixture(app, first.renderId);
			(window as typeof window & { _$HY: { fe: () => void } })._$HY.fe();
			await Promise.resolve();
			expect(app.querySelector('[data-slot="sidebar-container"]')).toBe(desktop);
			expect(app.querySelector('[data-slot="sidebar"]')?.id).toBe('hydration-sidebar');
			expect(app.querySelector('#divergent-sidebar')).toBeNull();
			expect(app.querySelector('#hydration-trigger')?.getAttribute('aria-controls')).toBe('hydration-sidebar');
			expect(app.querySelector('#hydration-rail')?.getAttribute('aria-controls')).toBe('hydration-sidebar');

			const hydrationTrigger = app.querySelector<HTMLButtonElement>('#hydration-trigger')!;
			matches = true;
			for (const listener of mediaListeners) listener({ matches, media: media.media } as MediaQueryListEvent);
			expect(hydrationTrigger.getAttribute('aria-expanded')).toBe('false');
			hydrationTrigger.click();
			await settle();
			const mobileDialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
			expect(mobileDialog.id).toBe('hydration-sidebar');
			expect(mobileDialog.dataset.mobile).toBe('true');
			expect(mobileDialog.contains(document.activeElement)).toBe(true);
			expect(app.querySelector('#hydration-trigger')).toBe(hydrationTrigger);
			keydown(document, { key: 'Escape' });
			await Promise.resolve();
			expect(document.querySelector('[role="dialog"]')).toBeNull();
			expect(document.activeElement).toBe(hydrationTrigger);
			expect(consoleError).not.toHaveBeenCalled();
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	});
});
