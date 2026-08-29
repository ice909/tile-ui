import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	type PaginationContentProps,
	type PaginationEllipsisProps,
	type PaginationItemProps,
	type PaginationLinkProps,
	type PaginationProps,
} from '../src/components/pagination/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsContentProps, type TabsListProps, type TabsProps, type TabsTriggerProps } from '../src/components/tabs/tabs';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function keydown(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 3 selection navigation lane', () => {
	it('Tabs supports uncontrolled and controlled selection with complete ARIA panel state', () => {
		let setControlled!: (value: string) => void;
		const changes: string[] = [];
		const container = mount(() => {
			const [controlled, updateControlled] = createSignal('a');
			setControlled = updateControlled;
			return (
				<>
					<Tabs defaultValue="a" data-root="uncontrolled">
						<TabsList>
							<TabsTrigger value="a">A</TabsTrigger>
							<TabsTrigger value="b">B</TabsTrigger>
						</TabsList>
						<TabsContent value="a">Panel A</TabsContent>
						<TabsContent value="b">Panel B</TabsContent>
					</Tabs>
					<Tabs value={controlled()} onValueChange={(value) => changes.push(value)}>
						<TabsList>
							<TabsTrigger value="a">A</TabsTrigger>
							<TabsTrigger value="b">B</TabsTrigger>
						</TabsList>
						<TabsContent value="a">Panel A</TabsContent>
						<TabsContent value="b">Panel B</TabsContent>
					</Tabs>
				</>
			);
		});
		const roots = container.querySelectorAll<HTMLElement>('[data-slot="tabs"]');
		const uncontrolledTabs = roots[0].querySelectorAll<HTMLButtonElement>('[role="tab"]');
		const uncontrolledPanels = roots[0].querySelectorAll<HTMLElement>('[role="tabpanel"]');
		expect(uncontrolledTabs[0].getAttribute('aria-controls')).toBe(uncontrolledPanels[0].id);
		expect(uncontrolledPanels[0].getAttribute('aria-labelledby')).toBe(uncontrolledTabs[0].id);
		expect(Array.from(uncontrolledTabs, (tab) => [tab.getAttribute('aria-selected'), tab.tabIndex])).toEqual([
			['true', 0],
			['false', -1],
		]);
		uncontrolledTabs[1].click();
		expect(Array.from(uncontrolledPanels, (panel) => panel.hidden)).toEqual([true, false]);

		const controlledTabs = roots[1].querySelectorAll<HTMLButtonElement>('[role="tab"]');
		controlledTabs[1].click();
		expect(changes).toEqual(['b']);
		expect(controlledTabs[0].getAttribute('aria-selected')).toBe('true');
		setControlled('b');
		expect(controlledTabs[1].getAttribute('aria-selected')).toBe('true');
	});

	it('Tabs filters disabled triggers and auto-activates orientation-aware arrows, Home, and End', () => {
		const horizontalChanges: string[] = [];
		const verticalChanges: string[] = [];
		const container = mount(() => (
			<>
				<Tabs defaultValue="a" onValueChange={(value) => horizontalChanges.push(value)}>
					<TabsList>
						<TabsTrigger value="a">A</TabsTrigger>
						<TabsTrigger value="b" disabled>
							B
						</TabsTrigger>
						<TabsTrigger value="c">C</TabsTrigger>
					</TabsList>
					<TabsContent value="a">A</TabsContent>
					<TabsContent value="c">C</TabsContent>
				</Tabs>
				<Tabs defaultValue="one" orientation="vertical" onValueChange={(value) => verticalChanges.push(value)}>
					<TabsList>
						<TabsTrigger value="one">One</TabsTrigger>
						<TabsTrigger value="two">Two</TabsTrigger>
						<TabsTrigger value="three">Three</TabsTrigger>
					</TabsList>
					<TabsContent value="one">One</TabsContent>
					<TabsContent value="two">Two</TabsContent>
					<TabsContent value="three">Three</TabsContent>
				</Tabs>
			</>
		));
		const lists = container.querySelectorAll<HTMLElement>('[role="tablist"]');
		const horizontal = lists[0].querySelectorAll<HTMLButtonElement>('[role="tab"]');
		horizontal[0].focus();
		keydown(horizontal[0], 'ArrowRight');
		expect(document.activeElement).toBe(horizontal[2]);
		expect(horizontalChanges).toEqual(['c']);
		keydown(horizontal[2], 'Home');
		expect(document.activeElement).toBe(horizontal[0]);
		keydown(horizontal[0], 'ArrowLeft');
		expect(document.activeElement).toBe(horizontal[2]);

		const vertical = lists[1].querySelectorAll<HTMLButtonElement>('[role="tab"]');
		vertical[0].focus();
		keydown(vertical[0], 'ArrowDown');
		expect(document.activeElement).toBe(vertical[1]);
		keydown(vertical[1], 'End');
		expect(document.activeElement).toBe(vertical[2]);
		keydown(vertical[2], 'ArrowUp');
		expect(document.activeElement).toBe(vertical[1]);
		expect(verticalChanges).toEqual(['two', 'three', 'two']);
	});

	it('Tabs preserves refs and attributes and honors tuple preventDefault before selection or keyboard movement', () => {
		let rootRef!: HTMLDivElement;
		let listRef!: HTMLDivElement;
		let triggerRef!: HTMLButtonElement;
		let panelRef!: HTMLDivElement;
		const changes = vi.fn();
		const cancel = (_label: string, event: MouseEvent | KeyboardEvent) => event.preventDefault();
		const container = mount(() => (
			<Tabs defaultValue="a" class="root-class" data-root="yes" ref={(element) => (rootRef = element)} onValueChange={changes}>
				<TabsList class="list-class" data-list="yes" ref={(element) => (listRef = element)} onKeyDown={[cancel, 'key']}>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b" class="trigger-class" data-trigger="yes" ref={(element) => (triggerRef = element)} onClick={[cancel, 'click']}>
						B
					</TabsTrigger>
				</TabsList>
				<TabsContent value="a">A</TabsContent>
				<TabsContent value="b" class="panel-class" data-panel="yes" ref={(element) => (panelRef = element)}>
					B
				</TabsContent>
			</Tabs>
		));
		expect([rootRef, listRef, triggerRef, panelRef].every(Boolean)).toBe(true);
		expect([rootRef.dataset.root, listRef.dataset.list, triggerRef.dataset.trigger, panelRef.dataset.panel]).toEqual(['yes', 'yes', 'yes', 'yes']);
		triggerRef.click();
		expect(changes).not.toHaveBeenCalled();
		const first = container.querySelector<HTMLButtonElement>('[role="tab"]') as HTMLButtonElement;
		first.focus();
		keydown(first, 'ArrowRight');
		expect(document.activeElement).toBe(first);
		expect(changes).not.toHaveBeenCalled();
	});

	it('Tabs synchronizes custom trigger and content IDs in arbitrary render order', () => {
		const container = mount(() => (
			<Tabs defaultValue="content-first">
				<TabsContent value="content-first" id="content-first-panel">
					Content first panel
				</TabsContent>
				<TabsList>
					<TabsTrigger value="content-first" id="content-first-trigger">
						Content first
					</TabsTrigger>
					<TabsTrigger value="trigger-first" id="trigger-first-trigger">
						Trigger first
					</TabsTrigger>
				</TabsList>
				<TabsContent value="trigger-first" id="trigger-first-panel">
					Trigger first panel
				</TabsContent>
			</Tabs>
		));
		expect((container.querySelector('#content-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('content-first-panel');
		expect((container.querySelector('#content-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('content-first-trigger');
		expect((container.querySelector('#trigger-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('trigger-first-panel');
		expect((container.querySelector('#trigger-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('trigger-first-trigger');
	});

	it('nested Tabs isolate overlapping values, custom IDs, tab stops, and keyboard state by owner', () => {
		const container = mount(() => (
			<Tabs data-id="outer" defaultValue="shared">
				<TabsContent value="shared" id="outer-shared-panel">
					<Tabs data-id="inner" defaultValue="shared">
						<TabsContent value="shared" id="inner-shared-panel">
							Inner shared panel
						</TabsContent>
						<TabsList>
							<TabsTrigger value="shared" id="inner-shared-trigger">
								Inner shared
							</TabsTrigger>
							<TabsTrigger value="other" id="inner-other-trigger">
								Inner other
							</TabsTrigger>
						</TabsList>
						<TabsContent value="other" id="inner-other-panel">
							Inner other panel
						</TabsContent>
					</Tabs>
				</TabsContent>
				<TabsList>
					<TabsTrigger value="shared" id="outer-shared-trigger">
						Outer shared
					</TabsTrigger>
					<TabsTrigger value="other" id="outer-other-trigger">
						Outer other
					</TabsTrigger>
				</TabsList>
				<TabsContent value="other" id="outer-other-panel">
					Outer other panel
				</TabsContent>
			</Tabs>
		));
		const outer = container.querySelector<HTMLElement>('[data-id="outer"]') as HTMLElement;
		const inner = container.querySelector<HTMLElement>('[data-id="inner"]') as HTMLElement;
		const ownedTabs = (root: HTMLElement) =>
			Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter((tab) => tab.dataset.tabsOwner === root.dataset.tabsOwner);
		expect(outer.dataset.tabsOwner).not.toBe(inner.dataset.tabsOwner);
		expect(ownedTabs(outer).map((tab) => tab.tabIndex)).toEqual([0, -1]);
		expect(ownedTabs(inner).map((tab) => tab.tabIndex)).toEqual([0, -1]);
		expect((container.querySelector('#outer-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('outer-shared-panel');
		expect((container.querySelector('#outer-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('outer-shared-trigger');
		expect((container.querySelector('#inner-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('inner-shared-panel');
		expect((container.querySelector('#inner-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('inner-shared-trigger');
		ownedTabs(inner)[0].focus();
		keydown(ownedTabs(inner)[0], 'ArrowRight');
		expect(ownedTabs(inner).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true']);
		expect(ownedTabs(outer).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
	});

	it('Tabs and Pagination families invoke callback refs supplied through props spreads', () => {
		const refs: Element[] = [];
		const rootProps = { ref: (element: HTMLDivElement) => refs.push(element), 'data-spread': 'tabs-root' };
		const listProps = { ref: (element: HTMLDivElement) => refs.push(element), 'data-spread': 'tabs-list' };
		const triggerProps = { ref: (element: HTMLButtonElement) => refs.push(element), 'data-spread': 'tabs-trigger' };
		const contentProps = { ref: (element: HTMLDivElement) => refs.push(element), 'data-spread': 'tabs-content' };
		const navProps = { ref: (element: HTMLElement) => refs.push(element), 'data-spread': 'pagination-root' };
		const paginationContentProps = { ref: (element: HTMLUListElement) => refs.push(element), 'data-spread': 'pagination-content' };
		const itemProps = { ref: (element: HTMLLIElement) => refs.push(element), 'data-spread': 'pagination-item' };
		const linkProps = { ref: (element: HTMLAnchorElement) => refs.push(element), 'data-spread': 'pagination-link' };
		const ellipsisProps = { ref: (element: HTMLSpanElement) => refs.push(element), 'data-spread': 'pagination-ellipsis' };
		const container = mount(() => (
			<>
				<Tabs {...rootProps} defaultValue="a">
					<TabsList {...listProps}>
						<TabsTrigger {...triggerProps} value="a">
							A
						</TabsTrigger>
					</TabsList>
					<TabsContent {...contentProps} value="a">
						A
					</TabsContent>
				</Tabs>
				<Pagination {...navProps}>
					<PaginationContent {...paginationContentProps}>
						<PaginationItem {...itemProps}>
							<PaginationLink {...linkProps} href="/one">
								1
							</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationEllipsis {...ellipsisProps} />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</>
		));
		expect(refs).toHaveLength(9);
		expect(Array.from(container.querySelectorAll<HTMLElement>('[data-spread]'), (element) => element.dataset.spread)).toEqual([
			'tabs-root',
			'tabs-list',
			'tabs-trigger',
			'tabs-content',
			'pagination-root',
			'pagination-content',
			'pagination-item',
			'pagination-link',
			'pagination-ellipsis',
		]);
	});

	it('Tabs and Pagination reject element-valued refs in props-spread component APIs', () => {
		const div = document.createElement('div');
		const button = document.createElement('button');
		const nav = document.createElement('nav');
		const list = document.createElement('ul');
		const item = document.createElement('li');
		const anchor = document.createElement('a');
		const span = document.createElement('span');
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const tabsProps: TabsProps = { ref: div };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const tabsListProps: TabsListProps = { ref: div };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const tabsTriggerProps: TabsTriggerProps = { value: 'one', ref: button };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const tabsContentProps: TabsContentProps = { value: 'one', ref: div };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const paginationProps: PaginationProps = { ref: nav };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const paginationContentProps: PaginationContentProps = { ref: list };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const paginationItemProps: PaginationItemProps = { ref: item };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const paginationLinkProps: PaginationLinkProps = { ref: anchor };
		// @ts-expect-error Wrapper refs must be callbacks, not Solid intrinsic element targets.
		const paginationEllipsisProps: PaginationEllipsisProps = { ref: span };
		expect([
			tabsProps,
			tabsListProps,
			tabsTriggerProps,
			tabsContentProps,
			paginationProps,
			paginationContentProps,
			paginationItemProps,
			paginationLinkProps,
			paginationEllipsisProps,
		]).toHaveLength(9);
	});

	it('Pagination renders semantic anchors, active state, sizes, composition, decorative ellipsis, refs, and native events', () => {
		let navRef!: HTMLElement;
		let contentRef!: HTMLUListElement;
		let itemRef!: HTMLLIElement;
		let linkRef!: HTMLAnchorElement;
		let previousRef!: HTMLAnchorElement;
		let nextRef!: HTMLAnchorElement;
		let ellipsisRef!: HTMLSpanElement;
		const calls: string[] = [];
		const tuple = (label: string, event: MouseEvent) => {
			event.preventDefault();
			calls.push(label);
		};
		const container = mount(() => (
			<Pagination aria-label="Results pages" class="nav-class" data-nav="yes" ref={(element) => (navRef = element)}>
				<PaginationContent class="content-class" ref={(element) => (contentRef = element)}>
					<PaginationItem class="item-class" ref={(element) => (itemRef = element)}>
						<PaginationPrevious href="/previous" class="previous-class" ref={(element) => (previousRef = element)} onClick={[tuple, 'previous']} />
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="/two" isActive size="lg" class="link-class" data-link="yes" ref={(element) => (linkRef = element)} onClick={[tuple, 'link']}>
							2
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationEllipsis class="ellipsis-class" ref={(element) => (ellipsisRef = element)} />
					</PaginationItem>
					<PaginationItem>
						<PaginationNext href="/next" class="next-class" ref={(element) => (nextRef = element)} onClick={[tuple, 'next']} />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		));
		expect(container.querySelector('nav > ul > li > a')).toBe(previousRef);
		expect([navRef, contentRef, itemRef, linkRef, previousRef, nextRef, ellipsisRef].every(Boolean)).toBe(true);
		expect(navRef.getAttribute('aria-label')).toBe('Results pages');
		expect(linkRef.getAttribute('aria-current')).toBe('page');
		expect(linkRef.dataset.active).toBe('true');
		expect(linkRef.className).toContain('sizeLg');
		expect(previousRef.className).toContain('sizeDefault');
		expect(nextRef.className).toContain('sizeDefault');
		expect(ellipsisRef.getAttribute('role')).toBe('presentation');
		expect(ellipsisRef.getAttribute('aria-hidden')).toBe('true');
		previousRef.click();
		linkRef.click();
		nextRef.click();
		expect(calls).toEqual(['previous', 'link', 'next']);
	});

	it('renders and hydrates deterministic Tabs IDs, one SSR tab stop per list, hidden panels, and Pagination semantics', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-navigation-'));
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
						await build({ plugins: [solid({ ssr: true })], logLevel: 'silent', css, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: 'test/fixtures/batch3-navigation-server.tsx', outDir: path.join(outputRoot, 'server'), rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
						await build({ plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { conditions: ['browser'] }, build: { outDir: path.join(outputRoot, 'client'), lib: { entry: 'test/fixtures/batch3-navigation-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
					`,
					outputRoot,
					stylesRoot,
				],
				{ cwd: process.cwd(), stdio: 'inherit' },
			);
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const first = server.renderBatch3NavigationFixture() as { html: string; hydrationScript: string; renderId: string };
			const second = server.renderBatch3NavigationFixture() as { html: string; hydrationScript: string; renderId: string };
			expect(first.html).toBe(second.html);
			const serverContainer = document.createElement('div');
			serverContainer.innerHTML = first.html;
			const serverLists = serverContainer.querySelectorAll('[role="tablist"]');
			expect(Array.from(serverLists, (list) => Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'), (tab) => tab.tabIndex))).toEqual([
				[-1, -1, 0],
				[-1, 0],
				[0, -1],
				[0, -1],
				[0, -1],
			]);
			expect(serverContainer.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(6);
			expect((serverContainer.querySelector('#custom-content-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('custom-content-first-panel');
			expect((serverContainer.querySelector('#custom-content-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('custom-content-first-trigger');
			expect((serverContainer.querySelector('#custom-trigger-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('custom-trigger-first-panel');
			expect((serverContainer.querySelector('#custom-trigger-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('custom-trigger-first-trigger');
			const serverOuter = serverContainer.querySelector<HTMLElement>('[data-id="nested-outer-tabs"]') as HTMLElement;
			const serverInner = serverContainer.querySelector<HTMLElement>('[data-id="nested-inner-tabs"]') as HTMLElement;
			const serverOwnedTabs = (root: HTMLElement) =>
				Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter((tab) => tab.dataset.tabsOwner === root.dataset.tabsOwner);
			expect(serverOuter.dataset.tabsOwner).not.toBe(serverInner.dataset.tabsOwner);
			expect(serverOwnedTabs(serverOuter).map((tab) => tab.tabIndex)).toEqual([0, -1]);
			expect(serverOwnedTabs(serverInner).map((tab) => tab.tabIndex)).toEqual([0, -1]);
			expect((serverContainer.querySelector('#nested-outer-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('nested-outer-shared-panel');
			expect((serverContainer.querySelector('#nested-outer-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('nested-outer-shared-trigger');
			expect((serverContainer.querySelector('#nested-inner-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('nested-inner-shared-panel');
			expect((serverContainer.querySelector('#nested-inner-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('nested-inner-shared-trigger');
			expect(serverContainer.querySelector('nav > ul > li > a[aria-current="page"]')).not.toBeNull();

			const scriptContainer = document.createElement('div');
			scriptContainer.innerHTML = first.hydrationScript;
			new Function(scriptContainer.textContent ?? '')();
			document.body.innerHTML = `<div id="app">${first.html}</div>`;
			const app = document.querySelector('#app') as HTMLElement;
			const root = app.querySelector('[data-id="batch3-navigation-root"]');
			const tabs = Array.from(app.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
			const ids = tabs.map((tab) => tab.id);
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateBatch3NavigationFixture(app, first.renderId);
			(window as typeof window & { _$HY: { fe: () => void } })._$HY.fe();
			await Promise.resolve();
			expect(app.querySelector('[data-id="batch3-navigation-root"]')).toBe(root);
			expect(Array.from(app.querySelectorAll<HTMLButtonElement>('[role="tab"]'), (tab) => tab.id)).toEqual(ids);
			expect((app.querySelector('#custom-content-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('custom-content-first-panel');
			expect((app.querySelector('#custom-content-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('custom-content-first-trigger');
			expect((app.querySelector('#custom-trigger-first-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('custom-trigger-first-panel');
			expect((app.querySelector('#custom-trigger-first-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('custom-trigger-first-trigger');
			const hydratedOuter = app.querySelector<HTMLElement>('[data-id="nested-outer-tabs"]') as HTMLElement;
			const hydratedInner = app.querySelector<HTMLElement>('[data-id="nested-inner-tabs"]') as HTMLElement;
			const hydratedOwnedTabs = (root: HTMLElement) =>
				Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter((tab) => tab.dataset.tabsOwner === root.dataset.tabsOwner);
			expect(hydratedOuter.dataset.tabsOwner).not.toBe(hydratedInner.dataset.tabsOwner);
			expect(hydratedOwnedTabs(hydratedOuter).map((tab) => tab.tabIndex)).toEqual([0, -1]);
			expect(hydratedOwnedTabs(hydratedInner).map((tab) => tab.tabIndex)).toEqual([0, -1]);
			expect((app.querySelector('#nested-outer-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('nested-outer-shared-panel');
			expect((app.querySelector('#nested-outer-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('nested-outer-shared-trigger');
			expect((app.querySelector('#nested-inner-shared-trigger') as HTMLButtonElement).getAttribute('aria-controls')).toBe('nested-inner-shared-panel');
			expect((app.querySelector('#nested-inner-shared-panel') as HTMLDivElement).getAttribute('aria-labelledby')).toBe('nested-inner-shared-trigger');
			hydratedOwnedTabs(hydratedInner)[0].focus();
			keydown(hydratedOwnedTabs(hydratedInner)[0], 'ArrowRight');
			expect(hydratedOwnedTabs(hydratedInner).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true']);
			expect(hydratedOwnedTabs(hydratedOuter).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
			tabs[2].focus();
			keydown(tabs[2], 'ArrowLeft');
			expect(document.activeElement).toBe(tabs[0]);
			expect(tabs[0].getAttribute('aria-selected')).toBe('true');
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	});
});
