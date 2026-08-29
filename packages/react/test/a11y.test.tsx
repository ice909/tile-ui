// @vitest-environment jsdom

import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from '../src/components/calendar/calendar';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../src/components/context-menu/context-menu';
import { MessageScroller, MessageScrollerContent, MessageScrollerProvider, MessageScrollerViewport } from '../src/components/message-scroller/message-scroller';
import { ScrollArea } from '../src/components/scroll-area/scroll-area';
import { Switch } from '../src/components/switch/switch';

const roots: Array<ReturnType<typeof createRoot>> = [];
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount());
	document.body.innerHTML = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function mount(node: React.ReactNode) {
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
	const container = document.createElement('div');
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.push(root);
	act(() => root.render(node));
	return container;
}

function flush() {
	return act(async () => {
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
	});
}

const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss/components');

describe('React 可访问性修复 (Stage 5)', () => {
	it('Calendar 将 aria-selected 放在 gridcell 而非日期按钮上', () => {
		const container = mount(<Calendar defaultMonth={new Date(2024, 1, 1)} selected={new Date(2024, 1, 10)} />);
		const buttons = container.querySelectorAll<HTMLButtonElement>('[data-day]');
		const cells = container.querySelectorAll<HTMLElement>('[role="gridcell"]');
		expect(buttons).toHaveLength(42);
		expect(cells).toHaveLength(42);
		expect(Array.from(buttons, (button) => button.hasAttribute('aria-selected')).every(Boolean)).toBe(false);
		const selectedCell = Array.from(cells).find((cell) => cell.getAttribute('aria-selected') === 'true');
		expect(selectedCell).toBeTruthy();
		expect(selectedCell?.querySelector('button')?.getAttribute('data-selected')).toBe('true');
		const unselectedCell = Array.from(cells).find((cell) => cell.getAttribute('aria-selected') === 'false');
		expect(unselectedCell).toBeTruthy();
	});

	it('ContextMenuTrigger 默认渲染原生 button 且无 tabindex/div 语义', async () => {
		const container = mount(
			<ContextMenu>
				<ContextMenuTrigger id="cm-trigger">Right-click me</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Copy</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>,
		);
		const trigger = container.querySelector<HTMLButtonElement>('#cm-trigger')!;
		expect(trigger.tagName).toBe('BUTTON');
		expect(trigger.type).toBe('button');
		expect(trigger.hasAttribute('tabindex')).toBe(false);
		expect(trigger.tabIndex).toBe(0);
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
		act(() => trigger.focus());
		expect(document.activeElement).toBe(trigger);
	});

	it('ContextMenuTrigger 支持指针与键盘唤起菜单', async () => {
		const container = mount(
			<ContextMenu>
				<ContextMenuTrigger id="cm-keyboard">Target</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>,
		);
		const trigger = container.querySelector<HTMLButtonElement>('#cm-keyboard')!;
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(40, 50, 100, 30));
		act(() => {
			trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
		});
		await flush();
		const menu = document.querySelector('[role="menu"]') as HTMLElement;
		expect(menu).toBeTruthy();
		expect(menu.style.left).toBe('40px');
		expect(menu.style.top).toBe('80px');
		act(() => {
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		});
		await flush();
		expect(document.querySelector('[role="menu"]')).toBeNull();
		act(() => {
			trigger.dispatchEvent(new MouseEvent('contextmenu', { clientX: 120, clientY: 90, bubbles: true, cancelable: true }));
		});
		await flush();
		const pointerMenu = document.querySelector('[role="menu"]') as HTMLElement;
		expect(pointerMenu).toBeTruthy();
		expect(pointerMenu.style.left).toBe('120px');
		expect(pointerMenu.style.top).toBe('90px');
	});

	it('ScrollArea 视口可键盘聚焦 (tabindex=0)', () => {
		const container = mount(
			<ScrollArea>
				<div>Content</div>
			</ScrollArea>,
		);
		const viewport = container.firstElementChild?.firstElementChild as HTMLElement | null;
		expect(viewport).toBeTruthy();
		expect(viewport?.textContent).toBe('Content');
		expect(viewport?.tabIndex).toBe(0);
	});

	it('MessageScroller 视口可键盘聚焦 (tabindex=0)', () => {
		const container = mount(
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport>
						<MessageScrollerContent>Message</MessageScrollerContent>
					</MessageScrollerViewport>
				</MessageScroller>
			</MessageScrollerProvider>,
		);
		const viewport = container.querySelector<HTMLElement>('[data-slot="message-scroller-viewport"]')!;
		expect(viewport).toBeTruthy();
		expect(viewport.tabIndex).toBe(0);
	});

	it('Switch 根节点按状态暴露 color 令牌 (SCSS 契约)', () => {
		const container = mount(<Switch defaultChecked />);
		const root = container.querySelector<HTMLButtonElement>('[role="switch"]')!;
		expect(root.getAttribute('data-state')).toBe('checked');
		const scss = fs.readFileSync(path.join(stylesRoot, 'switch.module.scss'), 'utf8');
		expect(scss).toMatch(/&\[data-state='checked'\] \{[\s\S]*?color: \$primary-foreground;/);
		expect(scss).toMatch(/&\[data-state='unchecked'\] \{[\s\S]*?color: \$foreground;/);
	});
});
