import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	type DropdownMenuContentProps,
	type DropdownMenuItemProps,
	type DropdownMenuProps,
	type DropdownMenuTriggerProps,
} from '../src/components/dropdown-menu/dropdown-menu';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '../src/components/context-menu/context-menu';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '../src/components/menubar/menubar';
import * as ContextMenuExports from '../src/components/context-menu/context-menu';
import * as DropdownMenuExports from '../src/components/dropdown-menu/dropdown-menu';
import * as MenubarExports from '../src/components/menubar/menubar';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function key(element: Element, value: string, init: KeyboardEventInit = {}) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init }));
}

function keyEvent(element: Element, value: string, init: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init });
	element.dispatchEvent(event);
	return event;
}

async function tick() {
	await Promise.resolve();
	await new Promise((resolve) => setTimeout(resolve, 20));
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('Batch 4 menu lane', () => {
	it('exposes the complete dropdown family with roles, custom IDs, callback refs, and native attributes', async () => {
		const refs: Element[] = [];
		mount(() => (
			<DropdownMenu ref={(element) => refs.push(element)} data-ref="root">
				<DropdownMenuTrigger ref={(element) => refs.push(element)} data-ref="trigger">
					Open
				</DropdownMenuTrigger>
				<DropdownMenuPortal>
					<DropdownMenuContent id="custom-menu" ref={(element) => refs.push(element)} data-ref="content">
						<DropdownMenuLabel ref={(element) => refs.push(element)}>Actions</DropdownMenuLabel>
						<DropdownMenuGroup ref={(element) => refs.push(element)}>
							<DropdownMenuItem ref={(element) => refs.push(element)}>
								Edit<DropdownMenuShortcut ref={(element) => refs.push(element)}>E</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator ref={(element) => refs.push(element)} />
						<DropdownMenuCheckboxItem defaultChecked>Toolbar</DropdownMenuCheckboxItem>
						<DropdownMenuRadioGroup defaultValue="one">
							<DropdownMenuRadioItem value="one">One</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenuPortal>
			</DropdownMenu>
		));
		const trigger = document.querySelector<HTMLButtonElement>('[data-ref="trigger"]')!;
		trigger.click();
		await tick();
		const content = document.querySelector<HTMLElement>('#custom-menu')!;
		expect(trigger.getAttribute('aria-controls')).toBe('custom-menu');
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
		expect(content.getAttribute('role')).toBe('menu');
		expect(content.querySelector('[role="group"]')).not.toBeNull();
		expect(content.querySelector('[role="separator"]')).not.toBeNull();
		expect(content.querySelector('[role="menuitemcheckbox"]')?.getAttribute('aria-checked')).toBe('true');
		expect(content.querySelector('[role="menuitemradio"]')?.getAttribute('aria-checked')).toBe('true');
		expect(refs.map((element) => element.getAttribute('data-ref')).filter(Boolean)).toEqual(['root', 'trigger', 'content']);
	});

	it('supports controlled and uncontrolled root, checkbox, radio, and submenu state', async () => {
		let setOpen!: (open: boolean) => void;
		let setChecked!: (checked: boolean) => void;
		let setValue!: (value: string) => void;
		let setSubOpen!: (open: boolean) => void;
		const changes: unknown[] = [];
		mount(() => {
			const [open, updateOpen] = createSignal(false);
			const [checked, updateChecked] = createSignal(false);
			const [value, updateValue] = createSignal('one');
			const [subOpen, updateSubOpen] = createSignal(false);
			setOpen = updateOpen;
			setChecked = updateChecked;
			setValue = updateValue;
			setSubOpen = updateSubOpen;
			return (
				<DropdownMenu open={open()} onOpenChange={(next) => changes.push(['open', next])}>
					<DropdownMenuTrigger>Open</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuCheckboxItem checked={checked()} onCheckedChange={(next) => changes.push(['checked', next])}>
							Check
						</DropdownMenuCheckboxItem>
						<DropdownMenuRadioGroup value={value()} onValueChange={(next) => changes.push(['value', next])}>
							<DropdownMenuRadioItem value="one">One</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="two">Two</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
						<DropdownMenuSub open={subOpen()} onOpenChange={(next) => changes.push(['sub', next])}>
							<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuItem>Nested</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		});
		const trigger = document.querySelector('button')!;
		trigger.click();
		expect(changes).toContainEqual(['open', true]);
		expect(document.querySelector('[role="menu"]')).toBeNull();
		setOpen(true);
		await tick();
		const checkbox = document.querySelector<HTMLElement>('[role="menuitemcheckbox"]')!;
		checkbox.click();
		expect(changes).toContainEqual(['checked', true]);
		expect(checkbox.getAttribute('aria-checked')).toBe('false');
		setChecked(true);
		expect(checkbox.getAttribute('aria-checked')).toBe('true');
		const radios = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
		radios[1].click();
		expect(changes).toContainEqual(['value', 'two']);
		expect(radios[0].getAttribute('aria-checked')).toBe('true');
		setValue('two');
		expect(radios[1].getAttribute('aria-checked')).toBe('true');
		const subTrigger = document.querySelector<HTMLElement>('[aria-haspopup="menu"][role="menuitem"]')!;
		subTrigger.click();
		expect(changes).toContainEqual(['sub', true]);
		setSubOpen(true);
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
	});

	it('uses DOM-order disabled filtering, roving focus, typeahead, activation keys, and action close policy', async () => {
		const selected: string[] = [];
		mount(() => (
			<DropdownMenu defaultOpen>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem textValue="Alpha" onSelect={() => selected.push('alpha')}>
						Alpha
					</DropdownMenuItem>
					<DropdownMenuItem disabled>Beta</DropdownMenuItem>
					<DropdownMenuItem
						textValue="Charlie"
						onSelect={(event) => {
							selected.push('charlie');
							event.preventDefault();
						}}>
						Charlie
					</DropdownMenuItem>
					<DropdownMenuCheckboxItem>Delta</DropdownMenuCheckboxItem>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		await tick();
		const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		const items = menu.querySelectorAll<HTMLElement>('[role^="menuitem"]');
		expect(document.activeElement).toBe(items[0]);
		key(items[0], 'ArrowDown');
		expect(document.activeElement).toBe(items[2]);
		key(items[2], 'End');
		expect(document.activeElement).toBe(items[3]);
		key(items[3], 'Home');
		expect(document.activeElement).toBe(items[0]);
		key(items[0], 'c');
		expect(document.activeElement).toBe(items[2]);
		key(items[2], 'Enter');
		expect(selected).toEqual(['charlie']);
		expect(document.querySelector('[role="menu"]')).not.toBeNull();
		items[3].click();
		expect(document.querySelector('[role="menu"]')).not.toBeNull();
		items[0].click();
		expect(selected).toEqual(['charlie', 'alpha']);
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it('ignores modified arrows, Home, End, and printable keys in menu content and menubar triggers', async () => {
		mount(() => (
			<>
				<DropdownMenu defaultOpen>
					<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Alpha</DropdownMenuItem>
						<DropdownMenuItem>Beta</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<Menubar>
					<MenubarMenu value="one">
						<MenubarTrigger>One</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Item</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu value="two">
						<MenubarTrigger>Two</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Item</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</>
		));
		await tick();
		const items = document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]');
		items[0].focus();
		for (const [value, init] of [
			['ArrowDown', { ctrlKey: true }],
			['Home', { metaKey: true }],
			['End', { altKey: true }],
			['b', { ctrlKey: true }],
		] as const) {
			const event = keyEvent(items[0], value, init);
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(items[0]);
		}
		const triggers = document.querySelectorAll<HTMLButtonElement>('[role="menubar"] button');
		triggers[0].focus();
		for (const [value, init] of [
			['ArrowRight', { metaKey: true }],
			['Home', { ctrlKey: true }],
			['End', { altKey: true }],
			['x', { ctrlKey: true }],
		] as const) {
			const event = keyEvent(triggers[0], value, init);
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(triggers[0]);
			expect(document.querySelectorAll('[role="menu"]')).toHaveLength(0);
		}
	});

	it('uses logical submenu arrows in RTL and Escape closes one layer with focus restoration', async () => {
		mount(() => (
			<DropdownMenu defaultOpen dir="rtl">
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub defaultOpen>
						<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem>Nested</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		await tick();
		const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
		const subTrigger = document.querySelector<HTMLElement>('[role="menuitem"][aria-haspopup="menu"]')!;
		const nested = menus[1].querySelector<HTMLElement>('[role="menuitem"]')!;
		key(nested, 'ArrowRight');
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
		expect(document.activeElement).toBe(subTrigger);
		key(subTrigger, 'ArrowLeft');
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
		key(document.querySelectorAll<HTMLElement>('[role="menu"]')[1], 'Escape');
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
		expect(document.activeElement).toBe(subTrigger);
	});

	it('supports submenu typeahead and resets uncontrolled descendants while requesting controlled ancestors close once', async () => {
		const subChanges = vi.fn();
		mount(() => (
			<DropdownMenu defaultOpen>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub open onOpenChange={subChanges}>
						<DropdownMenuSubTrigger>Controlled</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem>Alpha</DropdownMenuItem>
							<DropdownMenuItem disabled>Zulu disabled</DropdownMenuItem>
							<DropdownMenuItem textValue="Zebra">Zebra</DropdownMenuItem>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Nested</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem data-id="deep-action">Deep action</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		await tick();
		const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
		const submenuItems = menus[1].querySelectorAll<HTMLElement>('[role="menuitem"]');
		submenuItems[0].focus();
		key(submenuItems[0], 'z');
		expect(document.activeElement).toBe(submenuItems[2]);
		const nestedTrigger = Array.from(submenuItems).find((item) => item.textContent?.includes('Nested'))!;
		nestedTrigger.click();
		await tick();
		document.querySelector<HTMLElement>('[data-id="deep-action"]')!.click();
		await tick();
		expect(subChanges).toHaveBeenCalledTimes(1);
		expect(subChanges).toHaveBeenCalledWith(false);
		const rootTrigger = document.querySelector<HTMLButtonElement>('button')!;
		rootTrigger.click();
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
		expect(document.querySelector<HTMLElement>('[data-id="deep-action"]')).toBeNull();
	});

	it('keeps parent layers open when interacting with nested portal branches', async () => {
		mount(() => (
			<DropdownMenu defaultOpen>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuPortal>
					<DropdownMenuContent>
						<DropdownMenuSub defaultOpen>
							<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuCheckboxItem>Nested check</DropdownMenuCheckboxItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenuPortal>
			</DropdownMenu>
		));
		await tick();
		const nested = document.querySelectorAll<HTMLElement>('[role="menu"]')[1].querySelector<HTMLElement>('[role="menuitemcheckbox"]')!;
		nested.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		nested.click();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
	});

	it('closes the entire open submenu tree on one outside pointer interaction while Escape remains one layer', async () => {
		mount(() => (
			<DropdownMenu defaultOpen>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub defaultOpen>
						<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuSub defaultOpen>
								<DropdownMenuSubTrigger>Deep</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem>Action</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(3);
		key(document.querySelectorAll<HTMLElement>('[role="menu"]')[2], 'Escape');
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
		const deepTrigger = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"][aria-haspopup="menu"]')).find((item) => item.textContent?.includes('Deep'))!;
		deepTrigger.click();
		await tick();
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(3);
		document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		await tick();
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it('opens dropdown from keyboard and computes anchored position', async () => {
		mount(() => (
			<DropdownMenu>
				<DropdownMenuTrigger>Open</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom" align="start">
					<DropdownMenuItem>One</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		const trigger = document.querySelector<HTMLButtonElement>('button')!;
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 30, 80, 20));
		key(trigger, 'ArrowDown');
		await tick();
		const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(menu.style.position).toBe('fixed');
		expect(menu.style.left).toBe('20px');
		expect(menu.style.top).toBe('54px');
	});

	it('renders ContextMenuTrigger as a native focusable button without tabindex or div semantics', async () => {
		mount(() => (
			<ContextMenu>
				<ContextMenuTrigger id="button-context-trigger">Target</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		));
		const trigger = document.querySelector<HTMLButtonElement>('#button-context-trigger')!;
		expect(trigger.tagName).toBe('BUTTON');
		expect(trigger.type).toBe('button');
		expect(trigger.hasAttribute('tabindex')).toBe(false);
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
		expect(trigger.tabIndex).toBe(0);
		trigger.focus();
		expect(document.activeElement).toBe(trigger);
	});

	it('opens context menus at pointer and keyboard coordinates', async () => {
		mount(() => (
			<ContextMenu>
				<ContextMenuTrigger>Target</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		));
		const trigger = document.querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
		trigger.dispatchEvent(new MouseEvent('contextmenu', { clientX: 120, clientY: 90, bubbles: true, cancelable: true }));
		await tick();
		let menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(menu.style.left).toBe('120px');
		expect(menu.style.top).toBe('90px');
		key(menu, 'Escape');
		await tick();
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(40, 50, 100, 30));
		key(trigger, 'ContextMenu');
		await tick();
		menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(menu.style.left).toBe('40px');
		expect(menu.style.top).toBe('80px');
		key(menu, 'Escape');
		await tick();
		key(trigger, 'F10', { shiftKey: true });
		await tick();
		expect(document.querySelector('[role="menu"]')).not.toBeNull();
	});

	it('repositions an already-open context menu for repeated pointer and keyboard invocation', async () => {
		mount(() => (
			<ContextMenu defaultOpen>
				<ContextMenuTrigger id="repeat-context-trigger">Target</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		));
		await tick();
		const trigger = document.querySelector<HTMLElement>('#repeat-context-trigger')!;
		trigger.dispatchEvent(new MouseEvent('contextmenu', { clientX: 180, clientY: 140, bubbles: true, cancelable: true }));
		await tick();
		let menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(menu.style.left).toBe('180px');
		expect(menu.style.top).toBe('140px');
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(60, 70, 120, 40));
		key(trigger, 'ContextMenu');
		await tick();
		menu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(menu.style.left).toBe('60px');
		expect(menu.style.top).toBe('110px');
	});

	it('repositions context content from its last point on viewport scroll, resize, and content resize', async () => {
		let resizeCallback: (() => void) | undefined;
		const ResizeObserverMock = class {
			constructor(callback: () => void) {
				resizeCallback = callback;
			}
			observe() {}
			disconnect() {}
		};
		Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: ResizeObserverMock });
		Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000, writable: true });
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800, writable: true });
		let content!: HTMLDivElement;
		mount(() => (
			<ContextMenu>
				<ContextMenuTrigger>Target</ContextMenuTrigger>
				<ContextMenuContent ref={(element) => (content = element)}>
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		));
		const trigger = document.querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
		trigger.dispatchEvent(new MouseEvent('contextmenu', { clientX: 980, clientY: 760, bubbles: true, cancelable: true }));
		await Promise.resolve();
		let width = 100;
		let height = 50;
		vi.spyOn(content, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, width, height));
		window.dispatchEvent(new Event('resize'));
		expect(content.style.left).toBe('892px');
		expect(content.style.top).toBe('742px');
		Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700, writable: true });
		document.dispatchEvent(new Event('scroll'));
		expect(content.style.left).toBe('592px');
		width = 200;
		height = 150;
		resizeCallback?.();
		expect(content.style.left).toBe('492px');
		expect(content.style.top).toBe('642px');
	});

	it('dismisses dropdown and context menus on focus outside without stealing Tab focus', async () => {
		mount(() => (
			<>
				<DropdownMenu defaultOpen>
					<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Dropdown item</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<ContextMenu defaultOpen>
					<ContextMenuTrigger>Context</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem>Context item</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
				<button data-id="outside">Outside</button>
			</>
		));
		await tick();
		const outside = document.querySelector<HTMLButtonElement>('[data-id="outside"]')!;
		outside.focus();
		await tick();
		expect(document.activeElement).toBe(outside);
		expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
		outside.blur();
		document.querySelector<HTMLElement>('[role="menu"] [role="menuitem"]')!.focus();
		outside.focus();
		await tick();
		expect(document.activeElement).toBe(outside);
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it('uses whole-tree focus ownership when a submenu is the top dropdown, context, or menubar layer', async () => {
		const runFamily = async (family: 'dropdown' | 'context' | 'menubar') => {
			if (family === 'dropdown') {
				mount(() => (
					<DropdownMenu defaultOpen>
						<DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem data-id="ancestor">Ancestor</DropdownMenuItem>
							<DropdownMenuSub defaultOpen>
								<DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem>Child</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuContent>
					</DropdownMenu>
				));
			} else if (family === 'context') {
				mount(() => (
					<ContextMenu defaultOpen>
						<ContextMenuTrigger>Trigger</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem data-id="ancestor">Ancestor</ContextMenuItem>
							<ContextMenuSub defaultOpen>
								<ContextMenuSubTrigger>Sub</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									<ContextMenuItem>Child</ContextMenuItem>
								</ContextMenuSubContent>
							</ContextMenuSub>
						</ContextMenuContent>
					</ContextMenu>
				));
			} else {
				mount(() => (
					<Menubar defaultValue="file">
						<MenubarMenu value="file">
							<MenubarTrigger>Trigger</MenubarTrigger>
							<MenubarContent>
								<MenubarItem data-id="ancestor">Ancestor</MenubarItem>
								<MenubarSub defaultOpen>
									<MenubarSubTrigger>Sub</MenubarSubTrigger>
									<MenubarSubContent>
										<MenubarItem>Child</MenubarItem>
									</MenubarSubContent>
								</MenubarSub>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>
				));
			}
			const outside = document.createElement('button');
			outside.dataset.id = 'outside';
			document.body.appendChild(outside);
			await tick();
			expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
			document.querySelector<HTMLElement>('[data-id="ancestor"]')!.focus();
			await tick();
			expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
			const subTrigger = document.querySelector<HTMLElement>('div[role="menuitem"][aria-haspopup="menu"]')!;
			subTrigger.click();
			await tick();
			expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);
			outside.focus();
			await tick();
			expect(document.querySelector('[role="menu"]')).toBeNull();
			disposers.pop()?.();
			outside.remove();
			document.body.innerHTML = '';
		};
		await runFamily('dropdown');
		await runFamily('context');
		await runFamily('menubar');
	});

	it('continues Tab and Shift+Tab in document order from portalled dropdown, context, and menubar content', async () => {
		mount(() => (
			<>
				<section data-family="dropdown">
					<button data-id="dropdown-before">Before</button>
					<DropdownMenu>
						<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>Item</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<button data-id="dropdown-after">After</button>
				</section>
				<section data-family="context">
					<button data-id="context-before">Before</button>
					<ContextMenu>
						<ContextMenuTrigger>Context</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem>Item</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
					<button data-id="context-after">After</button>
				</section>
				<section data-family="menubar">
					<button data-id="menubar-before">Before</button>
					<Menubar>
						<MenubarMenu value="file">
							<MenubarTrigger>File</MenubarTrigger>
							<MenubarContent>
								<MenubarItem>Item</MenubarItem>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>
					<button data-id="menubar-after">After</button>
				</section>
			</>
		));
		for (const family of ['dropdown', 'context', 'menubar'] as const) {
			const section = document.querySelector<HTMLElement>(`[data-family="${family}"]`)!;
			const trigger = section.querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
			if (family === 'context') key(trigger, 'ContextMenu');
			else trigger.click();
			await tick();
			let menu = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]')).find((candidate) => candidate.getAttribute('aria-labelledby') === trigger.id)!;
			key(menu.querySelector<HTMLElement>('[role="menuitem"]')!, 'Tab');
			await tick();
			expect(document.activeElement).toBe(section.querySelector(`[data-id="${family}-after"]`));

			if (family === 'context') key(trigger, 'ContextMenu');
			else trigger.click();
			await tick();
			menu = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]')).find((candidate) => candidate.getAttribute('aria-labelledby') === trigger.id)!;
			key(menu.querySelector<HTMLElement>('[role="menuitem"]')!, 'Tab', { shiftKey: true });
			await tick();
			expect(document.activeElement).toBe(section.querySelector(`[data-id="${family}-before"]`));
		}
	});

	it('ignores Ctrl, Meta, and Alt modified Tab and Shift+Tab without dismissal or focus movement', async () => {
		mount(() => (
			<DropdownMenu defaultOpen>
				<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Item</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		await tick();
		const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
		item.focus();
		for (const modifier of ['ctrlKey', 'metaKey', 'altKey'] as const) {
			for (const shiftKey of [false, true]) {
				const event = keyEvent(item, 'Tab', { [modifier]: true, shiftKey });
				expect(event.defaultPrevented).toBe(false);
				expect(document.activeElement).toBe(item);
				expect(document.querySelector('[role="menu"]')).not.toBeNull();
			}
		}
	});

	it('uses native-like positive tabindex ordering and excludes inert or hidden Tab candidates', async () => {
		mount(() => (
			<>
				<button data-id="positive-one" tabIndex={1}>
					Positive one
				</button>
				<div inert>
					<button data-id="inert" tabIndex={2}>
						Inert
					</button>
				</div>
				<button data-id="positive-two" tabIndex={2}>
					Positive two
				</button>
				<button data-id="hidden" tabIndex={3} hidden>
					Hidden
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger tabIndex={3}>Dropdown</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Item</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<button data-id="positive-four" tabIndex={4}>
					Positive four
				</button>
				<div style={{ display: 'none' }}>
					<button data-id="css-hidden" tabIndex={5}>
						CSS hidden
					</button>
				</div>
				<button data-id="normal-after">Normal after</button>
			</>
		));
		const trigger = document.querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
		trigger.click();
		await tick();
		let item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
		key(item, 'Tab');
		await tick();
		expect(document.activeElement).toBe(document.querySelector('[data-id="positive-four"]'));
		trigger.click();
		await tick();
		item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
		key(item, 'Tab', { shiftKey: true });
		await tick();
		expect(document.activeElement).toBe(document.querySelector('[data-id="positive-two"]'));
	});

	it('keeps event, branch, focus, and custom portal behavior realm-safe inside an iframe', async () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		const frameDocument = iframe.contentDocument!;
		const frameWindow = iframe.contentWindow!;
		const host = frameDocument.createElement('div');
		const portal = frameDocument.createElement('div');
		frameDocument.body.append(host, portal);
		const dispose = render(
			() => (
				<>
					<button data-id="before">Before</button>
					<DropdownMenu defaultOpen>
						<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
						<DropdownMenuPortal container={portal}>
							<DropdownMenuContent>
								<DropdownMenuSub defaultOpen>
									<DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
									<DropdownMenuSubContent container={portal}>
										<DropdownMenuItem>Child</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</DropdownMenuContent>
						</DropdownMenuPortal>
					</DropdownMenu>
					<button data-id="after">After</button>
				</>
			),
			host,
		);
		disposers.push(() => {
			dispose();
			iframe.remove();
		});
		await tick();
		expect(portal.querySelectorAll('[role="menu"]')).toHaveLength(2);
		const child = portal.querySelector<HTMLElement>('[role="menu"]:last-of-type [role="menuitem"]') ?? portal.querySelectorAll<HTMLElement>('[role="menuitem"]')[1];
		const FramePointerEvent = (frameWindow as typeof frameWindow & { PointerEvent?: typeof PointerEvent }).PointerEvent ?? PointerEvent;
		child.dispatchEvent(new FramePointerEvent('pointerdown', { bubbles: true }));
		expect(portal.querySelectorAll('[role="menu"]')).toHaveLength(2);
		const FrameKeyboardEvent = (frameWindow as typeof frameWindow & { KeyboardEvent: typeof KeyboardEvent }).KeyboardEvent;
		const tabEvent = new FrameKeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		child.dispatchEvent(tabEvent);
		await tick();
		expect(frameDocument.activeElement).toBe(host.querySelector('[data-id="after"]'));
	});

	it('restores dropdown focus after Escape, action selection, and pointer dismissal', async () => {
		mount(() => (
			<DropdownMenu>
				<DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Action</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		const trigger = document.querySelector<HTMLButtonElement>('button')!;
		for (const dismiss of ['escape', 'action', 'pointer'] as const) {
			trigger.click();
			await tick();
			const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
			if (dismiss === 'escape') key(menu, 'Escape');
			else if (dismiss === 'action') menu.querySelector<HTMLElement>('[role="menuitem"]')!.click();
			else document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
			await tick();
			expect(document.activeElement).toBe(trigger);
		}
	});

	it('switches open portaled menubar content horizontally with logical RTL and first/last focus intent', async () => {
		mount(() => (
			<>
				<Menubar defaultValue="file">
					<MenubarMenu value="file">
						<MenubarTrigger>File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>New</MenubarItem>
							<MenubarItem>Open</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu value="disabled">
						<MenubarTrigger disabled>Disabled</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>No</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu value="edit">
						<MenubarTrigger>Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Copy first</MenubarItem>
							<MenubarItem disabled>Copy disabled</MenubarItem>
							<MenubarItem>Copy last</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
				<Menubar dir="rtl">
					<MenubarMenu value="rtl-one">
						<MenubarTrigger>RTL One</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>One first</MenubarItem>
							<MenubarItem>One last</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu value="rtl-two">
						<MenubarTrigger>RTL Two</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Two first</MenubarItem>
							<MenubarItem>Two last</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</>
		));
		await tick();
		const bars = document.querySelectorAll<HTMLElement>('[role="menubar"]');
		const triggers = bars[0].querySelectorAll<HTMLButtonElement>(':scope > div > button');
		let activeMenu = document.querySelector<HTMLElement>('[role="menu"]')!;
		const fileItems = activeMenu.querySelectorAll<HTMLElement>('[role="menuitem"]');
		fileItems[0].focus();
		key(fileItems[0], 'ArrowRight');
		await tick();
		expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
		expect(triggers[2].getAttribute('aria-expanded')).toBe('true');
		activeMenu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(document.activeElement).toBe(activeMenu.querySelectorAll<HTMLElement>('[role="menuitem"]')[0]);
		key(document.activeElement as HTMLElement, 'ArrowLeft');
		await tick();
		activeMenu = document.querySelector<HTMLElement>('[role="menu"]')!;
		expect(document.activeElement).toBe(activeMenu.querySelectorAll<HTMLElement>('[role="menuitem"]')[1]);

		const rtlTriggers = bars[1].querySelectorAll<HTMLButtonElement>(':scope > div > button');
		rtlTriggers[0].click();
		await tick();
		const rtlMenu = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]')).find((menu) => menu.getAttribute('aria-labelledby') === rtlTriggers[0].id)!;
		const rtlFirst = rtlMenu.querySelector<HTMLElement>('[role="menuitem"]')!;
		rtlFirst.focus();
		key(rtlFirst, 'ArrowLeft');
		await tick();
		const switchedRtl = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]')).find((menu) => menu.getAttribute('aria-labelledby') === rtlTriggers[1].id)!;
		expect(document.activeElement).toBe(switchedRtl.querySelector<HTMLElement>('[role="menuitem"]'));
	});

	it('opens menubar with first/last intent and restores the active trigger after Escape or action selection', async () => {
		const selected = vi.fn();
		mount(() => (
			<Menubar>
				<MenubarMenu value="file">
					<MenubarTrigger>File</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>First</MenubarItem>
						<MenubarItem disabled>Disabled</MenubarItem>
						<MenubarItem onSelect={selected}>Last</MenubarItem>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		));
		const trigger = document.querySelector<HTMLButtonElement>('[role="menubar"] button')!;
		key(trigger, 'ArrowUp');
		await tick();
		let items = document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]');
		expect(document.activeElement).toBe(items[2]);
		key(items[2], 'Escape');
		await tick();
		expect(document.activeElement).toBe(trigger);
		key(trigger, 'ArrowDown');
		await tick();
		items = document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]');
		expect(document.activeElement).toBe(items[0]);
		items[2].click();
		await tick();
		expect(selected).toHaveBeenCalledOnce();
		expect(document.activeElement).toBe(trigger);
	});

	it('tracks the last focused enabled menubar trigger as the reactive roving tab stop', async () => {
		let setSecondVisible!: (visible: boolean) => void;
		let setThirdDisabled!: (disabled: boolean) => void;
		mount(() => {
			const [secondVisible, updateSecondVisible] = createSignal(true);
			const [thirdDisabled, updateThirdDisabled] = createSignal(false);
			setSecondVisible = updateSecondVisible;
			setThirdDisabled = updateThirdDisabled;
			return (
				<>
					<button data-id="before-menubar">Before</button>
					<Menubar>
						<MenubarMenu value="one">
							<MenubarTrigger>One</MenubarTrigger>
							<MenubarContent>
								<MenubarItem>One item</MenubarItem>
							</MenubarContent>
						</MenubarMenu>
						<Show when={secondVisible()}>
							<MenubarMenu value="two">
								<MenubarTrigger>Two</MenubarTrigger>
								<MenubarContent>
									<MenubarItem>Two item</MenubarItem>
								</MenubarContent>
							</MenubarMenu>
						</Show>
						<MenubarMenu value="three">
							<MenubarTrigger disabled={thirdDisabled()}>Three</MenubarTrigger>
							<MenubarContent>
								<MenubarItem>Three item</MenubarItem>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>
					<button data-id="after-menubar">After</button>
				</>
			);
		});
		const triggers = () => document.querySelectorAll<HTMLButtonElement>('[role="menubar"] > div > button');
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([0, -1, -1]);
		triggers()[1].focus();
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([-1, 0, -1]);
		key(triggers()[1], 'ArrowRight');
		expect(document.activeElement).toBe(triggers()[2]);
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([-1, -1, 0]);
		document.querySelector<HTMLButtonElement>('[data-id="after-menubar"]')!.focus();
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([-1, -1, 0]);
		triggers()[2].focus();
		setThirdDisabled(true);
		await tick();
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([0, -1, -1]);
		triggers()[1].focus();
		setSecondVisible(false);
		await tick();
		expect(Array.from(triggers(), (trigger) => trigger.tabIndex)).toEqual([0, -1]);
	});

	it('labels menus from effective dynamic trigger IDs and allows an explicit context aria-label', async () => {
		let setDropdownId!: (id: string) => void;
		let setContextId!: (id: string) => void;
		mount(() => {
			const [dropdownId, updateDropdownId] = createSignal('dropdown-trigger-one');
			const [contextId, updateContextId] = createSignal('context-trigger-one');
			setDropdownId = updateDropdownId;
			setContextId = updateContextId;
			return (
				<>
					<DropdownMenu defaultOpen>
						<DropdownMenuTrigger id={dropdownId()}>Dropdown</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>Action</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ContextMenu defaultOpen>
						<ContextMenuTrigger id={contextId()}>Context</ContextMenuTrigger>
						<ContextMenuContent aria-label="Context actions">
							<ContextMenuItem>Action</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</>
			);
		});
		await tick();
		const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
		expect(menus[0].getAttribute('aria-labelledby')).toBe('dropdown-trigger-one');
		expect(menus[1].getAttribute('aria-label')).toBe('Context actions');
		expect(menus[1].hasAttribute('aria-labelledby')).toBe(false);
		setDropdownId('dropdown-trigger-two');
		setContextId('context-trigger-two');
		expect(menus[0].getAttribute('aria-labelledby')).toBe('dropdown-trigger-two');
		expect(document.querySelector('#context-trigger-two')).not.toBeNull();
	});

	it('honors tuple handlers and rejects element refs in public component props', async () => {
		const calls: string[] = [];
		const cancel = (label: string, event: Event) => {
			calls.push(label);
			event.preventDefault();
		};
		mount(() => (
			<DropdownMenu>
				<DropdownMenuTrigger onClick={[cancel, 'trigger']}>Open</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={[cancel, 'item']}>Item</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		));
		const trigger = document.querySelector<HTMLButtonElement>('button')!;
		trigger.click();
		expect(calls).toEqual(['trigger']);
		expect(document.querySelector('[role="menu"]')).toBeNull();

		const div = document.createElement('div');
		const button = document.createElement('button');
		// @ts-expect-error Wrapper refs are callbacks.
		const rootProps: DropdownMenuProps = { ref: div };
		// @ts-expect-error Wrapper refs are callbacks.
		const triggerProps: DropdownMenuTriggerProps = { ref: button };
		// @ts-expect-error Wrapper refs are callbacks.
		const contentProps: DropdownMenuContentProps = { ref: div };
		// @ts-expect-error Wrapper refs are callbacks.
		const itemProps: DropdownMenuItemProps = { ref: div };
		expect([rootProps, triggerProps, contentProps, itemProps]).toHaveLength(4);
	});

	it('exports meaningful family-specific component function names', () => {
		const names = [
			DropdownMenuExports.DropdownMenu.name,
			DropdownMenuExports.DropdownMenuContent.name,
			DropdownMenuExports.DropdownMenuSubTrigger.name,
			ContextMenuExports.ContextMenu.name,
			ContextMenuExports.ContextMenuContent.name,
			ContextMenuExports.ContextMenuSubContent.name,
			MenubarExports.Menubar.name,
			MenubarExports.MenubarMenu.name,
			MenubarExports.MenubarTrigger.name,
		];
		// vite-plugin-solid may add a development-only refresh prefix; named wrappers preserve the public suffix.
		expect(names.map((name) => name.replace(/^\[solid-refresh\]/, ''))).toEqual([
			'DropdownMenu',
			'DropdownMenuContent',
			'DropdownMenuSubTrigger',
			'ContextMenu',
			'ContextMenuContent',
			'ContextMenuSubContent',
			'Menubar',
			'MenubarMenu',
			'MenubarTrigger',
		]);
	});

	it('renders deterministic closed SSR relationships and hydrates without replacing roots', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch4-menu-'));
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
						await build({ plugins: [solid({ ssr: true })], logLevel: 'silent', css, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: 'test/fixtures/batch4-menu-server.tsx', outDir: path.join(outputRoot, 'server'), rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
						await build({ plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css, resolve: { conditions: ['browser'] }, build: { outDir: path.join(outputRoot, 'client'), lib: { entry: 'test/fixtures/batch4-menu-client.tsx', formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });
					`,
					outputRoot,
					stylesRoot,
				],
				{ cwd: process.cwd(), stdio: 'inherit' },
			);
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const first = server.renderBatch4MenuFixture() as { html: string; hydrationScript: string; renderId: string };
			const second = server.renderBatch4MenuFixture() as { html: string };
			expect(first.html).toBe(second.html);
			const serverContainer = document.createElement('div');
			serverContainer.innerHTML = first.html;
			expect(serverContainer.querySelector('[role="menu"]')).toBeNull();
			expect(serverContainer.querySelector('#fixture-dropdown-trigger')?.getAttribute('aria-controls')).toBe('fixture-dropdown-content');
			expect(serverContainer.querySelector('#fixture-context-trigger')?.getAttribute('aria-controls')).toBe('fixture-context-content');
			expect(serverContainer.querySelector('#fixture-menubar-trigger')?.getAttribute('aria-controls')).toBe('fixture-menubar-content');

			const scriptContainer = document.createElement('div');
			scriptContainer.innerHTML = first.hydrationScript;
			new Function(scriptContainer.textContent ?? '')();
			document.body.innerHTML = `<div id="app">${first.html}</div>`;
			const app = document.querySelector<HTMLElement>('#app')!;
			const root = app.querySelector<HTMLElement>('[data-id="batch4-menu-root"]')!;
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateBatch4MenuFixture(app, first.renderId);
			(window as typeof window & { _$HY: { fe: () => void } })._$HY.fe();
			await tick();
			expect(app.querySelector('[data-id="batch4-menu-root"]')).toBe(root);
			expect(document.querySelector('#fixture-dropdown-content')).not.toBeNull();
			expect(document.querySelector('#fixture-dropdown-content')?.getAttribute('aria-labelledby')).toBe('fixture-dropdown-trigger');
			expect(document.querySelector('#fixture-context-content')?.getAttribute('aria-labelledby')).toBe('fixture-context-trigger');
			expect(document.querySelector('#fixture-menubar-content')?.getAttribute('aria-labelledby')).toBe('fixture-menubar-trigger');
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	});
});
