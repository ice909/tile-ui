import { execFileSync } from 'node:child_process';
import { createEffect, createSignal, onCleanup, type JSX } from 'solid-js';
import { delegateEvents, render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	type HoverCardContentProps,
	type HoverCardProps,
	type HoverCardTriggerProps,
} from '../src/components/hover-card/hover-card';
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps, type PopoverProps, type PopoverTriggerProps } from '../src/components/popover/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, type TooltipContentProps, type TooltipProps, type TooltipTriggerProps } from '../src/components/tooltip/tooltip';
import { activateModalFocusScope, createPortalScope, PortalScopeContext } from '../src/utils';

const disposers: Array<() => void> = [];

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function mountInDocument(document: Document, node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function pointer(element: EventTarget, type: string, pointerType = 'mouse') {
	const event = new MouseEvent(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'pointerType', { value: pointerType });
	element.dispatchEvent(event);
	return event;
}

function key(element: EventTarget, value: string) {
	const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
	element.dispatchEvent(event);
	return event;
}

function rect(top: number, left: number, width: number, height: number): DOMRect {
	return {
		top,
		right: left + width,
		bottom: top + height,
		left,
		width,
		height,
		x: left,
		y: top,
		toJSON: () => ({}),
	};
}

async function settlePosition(trigger: HTMLElement, content: HTMLElement, container: HTMLElement) {
	trigger.style.direction = 'rtl';
	vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(rect(70, 120, 20, 20));
	vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 80, 40));
	vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(50, 100, 200, 100));
	await flush();
	window.dispatchEvent(new Event('resize'));
	if (vi.isFakeTimers()) vi.advanceTimersByTime(20);
	else await new Promise((resolve) => setTimeout(resolve, 20));
	await flush();
}

async function flush() {
	await Promise.resolve();
	await Promise.resolve();
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('Solid Tooltip anchored overlay lane', () => {
	it('uses provider delay, crosses trigger/content, keeps focus, exposes ARIA only while open, and ignores touch hover', async () => {
		vi.useFakeTimers();
		const changes: boolean[] = [];
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => (
			<TooltipProvider delayDuration={50}>
				<Tooltip onOpenChange={(open) => changes.push(open)} triggerId="tip-trigger" contentId="tip-content">
					<TooltipTrigger>Info</TooltipTrigger>
					<TooltipContent container={portal} side="right" sideOffset={7}>
						Details
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[role="tooltip"]') as HTMLDivElement;
		expect(trigger.id).toBe('tip-trigger');
		expect(content.hidden).toBe(true);
		expect(trigger.getAttribute('aria-describedby')).toBeNull();
		pointer(trigger, 'pointerenter', 'touch');
		vi.advanceTimersByTime(50);
		expect(content.hidden).toBe(true);
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(49);
		expect(content.hidden).toBe(true);
		vi.advanceTimersByTime(1);
		expect(content.hidden).toBe(false);
		trigger.focus();
		expect(trigger.getAttribute('aria-describedby')).toBe('tip-content');
		expect(document.activeElement).toBe(trigger);
		expect(content.dataset.side).toBe('right');
		pointer(trigger, 'pointerleave');
		pointer(content, 'pointerenter');
		vi.advanceTimersByTime(100);
		expect(content.hidden).toBe(false);
		trigger.blur();
		pointer(content, 'pointerleave');
		vi.advanceTimersByTime(100);
		expect(content.hidden).toBe(true);
		expect(trigger.getAttribute('aria-describedby')).toBeNull();
		expect(changes).toEqual([true, false]);
		await flush();
	});

	it('supports controlled state, focus ownership, Escape, tuple cancellation, callbacks refs, classes, and positioning cleanup', async () => {
		vi.useFakeTimers();
		let setOpen!: (open: boolean) => void;
		let triggerRef: HTMLButtonElement | undefined;
		let contentRef: HTMLDivElement | undefined;
		const changes: boolean[] = [];
		const cancel = (_label: string, event: Event) => event.preventDefault();
		const addSpy = vi.spyOn(document, 'addEventListener');
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const container = mount(() => {
			const [open, update] = createSignal(false);
			setOpen = update;
			return (
				<TooltipProvider>
					<Tooltip open={open()} onOpenChange={(next) => changes.push(next)} class="root-user">
						<TooltipTrigger ref={(element) => (triggerRef = element)} onPointerEnter={[cancel, 'pointer']} class="trigger-user">
							Info
						</TooltipTrigger>
						<TooltipContent ref={(element) => (contentRef = element)} class="content-user">
							Details
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		pointer(trigger, 'pointerenter');
		vi.runAllTimers();
		expect(changes).toEqual([]);
		setOpen(true);
		await flush();
		expect(triggerRef).toBe(trigger);
		expect(contentRef?.className).toContain('content-user');
		expect(container.firstElementChild?.className).toContain('root-user');
		key(contentRef!, 'Escape');
		expect(changes).toEqual([false]);
		expect(contentRef?.hidden).toBe(false);
		setOpen(false);
		await flush();
		expect(removeSpy.mock.calls.length).toBeGreaterThan(0);
		expect(addSpy.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
	});

	it('rejects element-valued refs', () => {
		const div = document.createElement('div');
		const button = document.createElement('button');
		// @ts-expect-error Public wrapper refs are callback-only.
		const root: TooltipProps = { ref: div };
		// @ts-expect-error Public wrapper refs are callback-only.
		const trigger: TooltipTriggerProps = { ref: button };
		// @ts-expect-error Public wrapper refs are callback-only.
		const content: TooltipContentProps = { ref: div };
		expect([root, trigger, content]).toHaveLength(3);
	});

	it('uses updated provider delays for future opens and positions resolved RTL sides in an offset container', async () => {
		vi.useFakeTimers();
		let setDelay!: (delay: number) => void;
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [delay, updateDelay] = createSignal(100);
			setDelay = updateDelay;
			return (
				<TooltipProvider delayDuration={delay()}>
					<Tooltip>
						<TooltipTrigger>Info</TooltipTrigger>
						<TooltipContent container={portal} side="left" sideOffset={5}>
							Details
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[role="tooltip"]') as HTMLDivElement;
		setDelay(20);
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(19);
		expect(content.hidden).toBe(true);
		vi.advanceTimersByTime(1);
		expect(content.hidden).toBe(false);
		await settlePosition(trigger, content, portal);
		expect(content.dataset.side).toBe('right');
		expect(content.style.left).toBe('145px');
		expect(content.style.top).toBe('60px');
	});

	it('replays active ownership when provider delay changes and recomputes reactive placement without resize', async () => {
		vi.useFakeTimers();
		let setDelay!: (delay: number) => void;
		let setPlacement!: (value: { side: 'left' | 'bottom'; offset: number }) => void;
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [delay, updateDelay] = createSignal(100);
			const [placement, updatePlacement] = createSignal<{ side: 'left' | 'bottom'; offset: number }>({ side: 'left', offset: 5 });
			setDelay = updateDelay;
			setPlacement = updatePlacement;
			return (
				<TooltipProvider delayDuration={delay()}>
					<Tooltip>
						<TooltipTrigger>Info</TooltipTrigger>
						<TooltipContent container={portal} side={placement().side} sideOffset={placement().offset}>
							Details
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[role="tooltip"]') as HTMLDivElement;
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(30);
		setDelay(20);
		vi.advanceTimersByTime(19);
		expect(content.hidden).toBe(true);
		vi.advanceTimersByTime(1);
		expect(content.hidden).toBe(false);
		await settlePosition(trigger, content, portal);
		expect(content.dir).toBe('rtl');
		setPlacement({ side: 'bottom', offset: 10 });
		vi.advanceTimersByTime(20);
		await flush();
		expect(content.dataset.side).toBe('bottom');
		expect(content.style.left).toBe('104px');
		expect(content.style.top).toBe('100px');
	});
});

describe('Solid HoverCard anchored overlay lane', () => {
	it('coordinates trigger/content hover and focus ownership with open/close delays and Escape', async () => {
		vi.useFakeTimers();
		const changes: boolean[] = [];
		const container = mount(() => (
			<HoverCard openDelay={40} closeDelay={60} onOpenChange={(open) => changes.push(open)} contentId="card-content">
				<HoverCardTrigger>Profile</HoverCardTrigger>
				<HoverCardContent side="left" align="end" sideOffset={9}>
					<button>Action</button>
				</HoverCardContent>
			</HoverCard>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = document.body.querySelector('#card-content') as HTMLDivElement;
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(40);
		expect(content.hidden).toBe(false);
		expect(content.getAttribute('aria-modal')).toBe('false');
		expect(content.dataset.align).toBe('end');
		expect(document.activeElement).not.toBe(content);
		pointer(trigger, 'pointerleave');
		pointer(content, 'pointerenter');
		vi.advanceTimersByTime(60);
		expect(content.hidden).toBe(false);
		pointer(content, 'pointerleave');
		(content.querySelector('button') as HTMLButtonElement).focus();
		vi.advanceTimersByTime(60);
		expect(content.hidden).toBe(false);
		await flush();
		key(content, 'Escape');
		expect(content.hidden).toBe(true);
		expect(changes).toEqual([true, false]);
		await flush();
	});

	it('keeps controlled state external, honors user cancellation and ignores touch pointer timers', () => {
		vi.useFakeTimers();
		const changes: boolean[] = [];
		const cancel = (_data: string, event: Event) => event.preventDefault();
		const container = mount(() => (
			<HoverCard open={false} openDelay={10} onOpenChange={(open) => changes.push(open)}>
				<HoverCardTrigger onPointerEnter={[cancel, 'cancel']}>Profile</HoverCardTrigger>
				<HoverCardContent>Card</HoverCardContent>
			</HoverCard>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		pointer(trigger, 'pointerenter', 'touch');
		pointer(trigger, 'pointerenter');
		vi.runAllTimers();
		expect(changes).toEqual([]);
		expect(document.body.querySelector('[data-slot="hover-card-content"]')?.hasAttribute('hidden')).toBe(true);
	});

	it('forwards callback refs and rejects element refs', () => {
		let rootElement: HTMLDivElement | undefined;
		let triggerElement: HTMLButtonElement | undefined;
		let contentElement: HTMLDivElement | undefined;
		const rootProps: HoverCardProps = { ref: (element) => (rootElement = element), class: 'root-user' };
		const triggerProps: HoverCardTriggerProps = { ref: (element) => (triggerElement = element), class: 'trigger-user' };
		const contentProps: HoverCardContentProps = { ref: (element) => (contentElement = element), class: 'content-user' };
		const container = mount(() => (
			<HoverCard defaultOpen {...rootProps}>
				<HoverCardTrigger {...triggerProps}>Profile</HoverCardTrigger>
				<HoverCardContent {...contentProps}>Card</HoverCardContent>
			</HoverCard>
		));
		expect(rootElement).toBe(container.firstElementChild);
		expect(triggerElement?.className).toContain('trigger-user');
		expect(contentElement?.className).toContain('content-user');
		const div = document.createElement('div');
		// @ts-expect-error Public wrapper refs are callback-only.
		const invalid: HoverCardContentProps = { ref: div };
		expect(invalid).toBeTruthy();
	});

	it('restores focus before Escape and externally controlled close hide focused content', async () => {
		let setOpen!: (open: boolean) => void;
		const container = mount(() => {
			const [open, updateOpen] = createSignal(true);
			setOpen = updateOpen;
			return (
				<HoverCard open={open()} onOpenChange={updateOpen}>
					<HoverCardTrigger>Profile</HoverCardTrigger>
					<HoverCardContent>
						<button>Action</button>
					</HoverCardContent>
				</HoverCard>
			);
		});
		await flush();
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = document.body.querySelector('[data-slot="hover-card-content"]') as HTMLDivElement;
		const action = content.querySelector('button') as HTMLButtonElement;
		action.focus();
		key(content, 'Escape');
		expect(content.hidden).toBe(true);
		expect(document.activeElement).toBe(trigger);
		setOpen(true);
		await flush();
		action.focus();
		setOpen(false);
		expect(content.hidden).toBe(true);
		expect(document.activeElement).toBe(trigger);
		setOpen(true);
		await flush();
		action.focus();
		trigger.remove();
		setOpen(false);
		expect(content.hidden).toBe(true);
		expect(content.contains(document.activeElement)).toBe(false);
	});

	it('uses updated delays for future ownership and positions resolved RTL sides in an offset container', async () => {
		vi.useFakeTimers();
		let setDelays!: (value: { open: number; close: number }) => void;
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [delays, updateDelays] = createSignal({ open: 100, close: 100 });
			setDelays = updateDelays;
			return (
				<HoverCard openDelay={delays().open} closeDelay={delays().close}>
					<HoverCardTrigger>Profile</HoverCardTrigger>
					<HoverCardContent container={portal} side="left" sideOffset={5}>
						Card
					</HoverCardContent>
				</HoverCard>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[data-slot="hover-card-content"]') as HTMLDivElement;
		setDelays({ open: 20, close: 30 });
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(20);
		expect(content.hidden).toBe(false);
		pointer(trigger, 'pointerleave');
		vi.advanceTimersByTime(29);
		expect(content.hidden).toBe(false);
		vi.advanceTimersByTime(1);
		expect(content.hidden).toBe(true);
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(20);
		await settlePosition(trigger, content, portal);
		expect(content.dataset.side).toBe('right');
		expect(content.style.left).toBe('145px');
		expect(content.style.top).toBe('60px');
	});

	it('replays pending open and close ownership across delay changes and recomputes placement without resize', async () => {
		vi.useFakeTimers();
		let setDelays!: (value: { open: number; close: number }) => void;
		let setPlacement!: (value: { side: 'left' | 'bottom'; align: 'start' | 'end'; offset: number }) => void;
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [delays, updateDelays] = createSignal({ open: 100, close: 100 });
			const [placement, updatePlacement] = createSignal<{ side: 'left' | 'bottom'; align: 'start' | 'end'; offset: number }>({ side: 'left', align: 'start', offset: 5 });
			setDelays = updateDelays;
			setPlacement = updatePlacement;
			return (
				<HoverCard openDelay={delays().open} closeDelay={delays().close}>
					<HoverCardTrigger>Profile</HoverCardTrigger>
					<HoverCardContent container={portal} side={placement().side} align={placement().align} sideOffset={placement().offset}>
						Card
					</HoverCardContent>
				</HoverCard>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[data-slot="hover-card-content"]') as HTMLDivElement;
		pointer(trigger, 'pointerenter');
		vi.advanceTimersByTime(30);
		setDelays({ open: 20, close: 100 });
		vi.advanceTimersByTime(20);
		expect(content.hidden).toBe(false);
		await settlePosition(trigger, content, portal);
		expect(content.dir).toBe('rtl');
		setPlacement({ side: 'bottom', align: 'end', offset: 10 });
		vi.advanceTimersByTime(20);
		await flush();
		expect(content.dataset.side).toBe('bottom');
		expect(content.dataset.align).toBe('end');
		expect(content.style.left).toBe('120px');
		expect(content.style.top).toBe('100px');
		pointer(trigger, 'pointerleave');
		vi.advanceTimersByTime(30);
		setDelays({ open: 20, close: 20 });
		vi.advanceTimersByTime(19);
		expect(content.hidden).toBe(false);
		vi.advanceTimersByTime(1);
		expect(content.hidden).toBe(true);
	});
});

describe('Solid Popover anchored overlay lane', () => {
	it('positions and dismisses inside an iframe realm with a custom portal container', async () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		const iframeDocument = iframe.contentDocument!;
		const iframeView = iframe.contentWindow!;
		const realm = iframeView as Window & typeof globalThis;
		delegateEvents(['click', 'pointerdown'], iframeDocument);
		const portal = iframeDocument.createElement('div');
		iframeDocument.body.appendChild(portal);
		const outside = iframeDocument.createElement('button');
		iframeDocument.body.appendChild(outside);
		const container = mountInDocument(iframeDocument, () => (
			<Popover defaultOpen>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent container={portal} side="left" sideOffset={5}>
					Body
				</PopoverContent>
			</Popover>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		trigger.style.direction = 'rtl';
		vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(rect(70, 120, 20, 20));
		vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 80, 40));
		vi.spyOn(portal, 'getBoundingClientRect').mockReturnValue(rect(50, 100, 200, 100));
		await flush();
		iframeView.dispatchEvent(new realm.Event('resize'));
		await new Promise((resolve) => iframeView.setTimeout(resolve, 20));
		await flush();
		expect(content.style.left).toBe('145px');
		expect(content.style.top).toBe('60px');
		outside.dispatchEvent(new realm.MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: iframeView }));
		expect(content.hidden).toBe(true);
	});

	it('toggles uncontrolled state, forwards ARIA/custom IDs/container/placement, focuses content, and restores trigger on Escape', async () => {
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const changes: boolean[] = [];
		const container = mount(() => (
			<Popover triggerId="custom-trigger" contentId="custom-content" onOpenChange={(open) => changes.push(open)} class="root-user">
				<PopoverTrigger class="trigger-user">Open</PopoverTrigger>
				<PopoverContent container={portal} side="top" align="start" sideOffset={11} class="content-user">
					<button>Inside</button>
				</PopoverContent>
			</Popover>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('#custom-content') as HTMLDivElement;
		expect(trigger.id).toBe('custom-trigger');
		expect(trigger.getAttribute('aria-controls')).toBe('custom-content');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		trigger.focus();
		trigger.click();
		await flush();
		expect(content.hidden).toBe(false);
		expect(content.getAttribute('role')).toBe('dialog');
		expect(content.getAttribute('aria-modal')).toBe('false');
		expect(content.getAttribute('aria-labelledby')).toBe('custom-trigger');
		expect(content.dataset.side).toBe('top');
		expect(content.dataset.align).toBe('start');
		expect(content.contains(document.activeElement)).toBe(true);
		key(content, 'Escape');
		expect(content.hidden).toBe(true);
		expect(document.activeElement).toBe(trigger);
		expect(changes).toEqual([true, false]);
	});

	it('dismisses on outside pointer/focus, allows prevention, and keeps controlled state external', async () => {
		let setOpen!: (open: boolean) => void;
		const changes: boolean[] = [];
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		mount(() => {
			const [open, update] = createSignal(true);
			setOpen = update;
			return (
				<Popover open={open()} onOpenChange={(next) => changes.push(next)}>
					<PopoverTrigger>Open</PopoverTrigger>
					<PopoverContent onPointerDownOutside={(event) => event.preventDefault()}>Body</PopoverContent>
				</Popover>
			);
		});
		await flush();
		pointer(outside, 'pointerdown');
		expect(changes).toEqual([]);
		await flush();
		outside.focus();
		expect(changes).toEqual([false]);
		expect(document.body.querySelector('[data-slot="popover-content"]')?.hasAttribute('hidden')).toBe(false);
		setOpen(false);
		expect(document.body.querySelector('[data-slot="popover-content"]')?.hasAttribute('hidden')).toBe(true);
	});

	it('runs tuple click first, honors preventDefault, and only dismisses the top nested portal branch', async () => {
		const calls: string[] = [];
		const cancel = (label: string, event: Event) => {
			calls.push(label);
			event.preventDefault();
		};
		const container = mount(() => (
			<>
				<Popover>
					<PopoverTrigger onClick={[cancel, 'cancel']}>Cancelled</PopoverTrigger>
					<PopoverContent>Never</PopoverContent>
				</Popover>
				<Popover defaultOpen>
					<PopoverTrigger>Parent</PopoverTrigger>
					<PopoverContent data-id="parent-content">
						<Popover defaultOpen>
							<PopoverTrigger>Child</PopoverTrigger>
							<PopoverContent data-id="child-content">Nested</PopoverContent>
						</Popover>
					</PopoverContent>
				</Popover>
			</>
		));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(calls).toEqual(['cancel']);
		expect((document.body.querySelector('[data-slot="popover-content"]') as HTMLDivElement).hidden).toBe(true);
		await flush();
		const parent = document.body.querySelector('[data-id="parent-content"]') as HTMLDivElement;
		const child = document.body.querySelector('[data-id="child-content"]') as HTMLDivElement;
		pointer(child, 'pointerdown');
		expect(parent.hidden).toBe(false);
		expect(child.hidden).toBe(false);
		const outside = document.createElement('div');
		document.body.appendChild(outside);
		pointer(outside, 'pointerdown');
		expect(child.hidden).toBe(true);
		expect(parent.hidden).toBe(false);
		pointer(outside, 'pointerdown');
		expect(parent.hidden).toBe(true);
	});

	it('supports cancellable Escape hooks, callback-only refs, and listener cleanup', async () => {
		let rootElement: HTMLDivElement | undefined;
		let triggerElement: HTMLButtonElement | undefined;
		let contentElement: HTMLDivElement | undefined;
		const rootProps: PopoverProps = { ref: (element) => (rootElement = element) };
		const triggerProps: PopoverTriggerProps = { ref: (element) => (triggerElement = element) };
		const contentProps: PopoverContentProps = { ref: (element) => (contentElement = element), onEscapeKeyDown: (event) => event.preventDefault() };
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const container = mount(() => (
			<Popover defaultOpen {...rootProps}>
				<PopoverTrigger {...triggerProps}>Open</PopoverTrigger>
				<PopoverContent {...contentProps}>Body</PopoverContent>
			</Popover>
		));
		await flush();
		key(contentElement!, 'Escape');
		expect(contentElement?.hidden).toBe(false);
		expect(rootElement).toBe(container.firstElementChild);
		expect(triggerElement).toBe(container.querySelector('button'));
		disposers.pop()?.();
		expect(removeSpy.mock.calls.length).toBeGreaterThan(0);
		const div = document.createElement('div');
		// @ts-expect-error Public wrapper refs are callback-only.
		const invalid: PopoverProps = { ref: div };
		expect(invalid).toBeTruthy();
	});

	it('keeps the enclosing modal as the active trap while prevented focusOutside includes the popover branch', async () => {
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		let modalElement: HTMLDivElement | undefined;
		const outsideTargets: EventTarget[] = [];
		const focusOutside = vi.fn((event: { originalEvent: FocusEvent; preventDefault: () => void }) => {
			outsideTargets.push(event.originalEvent.target!);
			event.preventDefault();
		});
		mount(() => {
			const scope = createPortalScope();
			createEffect(() => {
				if (!modalElement) return;
				const focus = activateModalFocusScope({ container: () => modalElement, portalScope: scope, initialFocus: () => modalElement?.querySelector('button') });
				focus.update();
				onCleanup(() => focus.destroy());
			});
			return (
				<PortalScopeContext.Provider value={scope}>
					<div ref={(element) => (modalElement = element)}>
						<button>Modal action</button>
						<Popover defaultOpen>
							<PopoverTrigger>Open</PopoverTrigger>
							<PopoverContent onFocusOutside={focusOutside}>
								<button>Portal action</button>
							</PopoverContent>
						</Popover>
					</div>
				</PortalScopeContext.Provider>
			);
		});
		await flush();
		const content = document.body.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		expect(content.contains(document.activeElement)).toBe(true);
		outside.focus();
		expect(modalElement?.contains(document.activeElement) || content.contains(document.activeElement)).toBe(true);
		expect(content.hidden).toBe(false);
		const modalAction = modalElement?.querySelector('button') as HTMLButtonElement;
		modalAction.focus();
		outside.focus();
		expect(modalElement?.contains(document.activeElement) || content.contains(document.activeElement)).toBe(true);
		expect(content.hidden).toBe(false);
		expect(focusOutside).toHaveBeenCalled();
		expect(outsideTargets.filter((target) => target === outside)).toHaveLength(2);
	});

	it('positions a resolved RTL side within offset custom-container viewport bounds', async () => {
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => (
			<Popover defaultOpen>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent container={portal} side="left" sideOffset={5}>
					Body
				</PopoverContent>
			</Popover>
		));
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		await settlePosition(trigger, content, portal);
		expect(content.dataset.side).toBe('right');
		expect(content.style.left).toBe('145px');
		expect(content.style.top).toBe('60px');
		expect(content.dir).toBe('rtl');
	});

	it('recomputes reactive side/align/offset without resize and applies portal direction', async () => {
		vi.useFakeTimers();
		let setPlacement!: (value: { side: 'left' | 'bottom'; align: 'start' | 'end'; offset: number }) => void;
		const portal = document.createElement('div');
		document.body.appendChild(portal);
		const container = mount(() => {
			const [placement, updatePlacement] = createSignal<{ side: 'left' | 'bottom'; align: 'start' | 'end'; offset: number }>({ side: 'left', align: 'start', offset: 5 });
			setPlacement = updatePlacement;
			return (
				<Popover defaultOpen>
					<PopoverTrigger>Open</PopoverTrigger>
					<PopoverContent container={portal} side={placement().side} align={placement().align} sideOffset={placement().offset}>
						Body
					</PopoverContent>
				</Popover>
			);
		});
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = portal.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		await settlePosition(trigger, content, portal);
		expect(content.dir).toBe('rtl');
		setPlacement({ side: 'bottom', align: 'end', offset: 10 });
		vi.advanceTimersByTime(20);
		await flush();
		expect(content.dataset.side).toBe('bottom');
		expect(content.dataset.align).toBe('end');
		expect(content.style.left).toBe('120px');
		expect(content.style.top).toBe('100px');
	});

	it('restores only when closing while focus remains inside for an appropriate reason', async () => {
		let setOpen!: (open: boolean) => void;
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		const container = mount(() => {
			const [open, updateOpen] = createSignal(true);
			setOpen = updateOpen;
			return (
				<Popover open={open()} onOpenChange={updateOpen}>
					<PopoverTrigger>Open</PopoverTrigger>
					<PopoverContent>
						<button>Inside</button>
					</PopoverContent>
				</Popover>
			);
		});
		await flush();
		const trigger = container.querySelector('button') as HTMLButtonElement;
		const content = document.body.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		const inside = content.querySelector('button') as HTMLButtonElement;
		inside.focus();
		outside.focus();
		expect(content.hidden).toBe(true);
		expect(document.activeElement).toBe(outside);
		setOpen(true);
		await flush();
		inside.focus();
		outside.focus();
		setOpen(false);
		expect(document.activeElement).toBe(outside);
		setOpen(true);
		await flush();
		inside.focus();
		setOpen(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('restores a background pointer close without stealing focus from an outside control or later focus', async () => {
		const outsideButton = document.createElement('button');
		const background = document.createElement('div');
		const laterFocus = document.createElement('input');
		document.body.append(outsideButton, background, laterFocus);
		const container = mount(() => (
			<Popover defaultOpen>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>
					<button>Inside</button>
				</PopoverContent>
			</Popover>
		));
		await flush();
		const trigger = container.querySelector('button') as HTMLButtonElement;
		let content = document.body.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		pointer(background, 'pointerdown');
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(document.activeElement).toBe(trigger);

		trigger.click();
		await flush();
		content = document.body.querySelector('[data-slot="popover-content"]') as HTMLDivElement;
		expect(content.hidden).toBe(false);
		pointer(outsideButton, 'pointerdown');
		outsideButton.focus();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(document.activeElement).toBe(outsideButton);

		trigger.click();
		await flush();
		pointer(background, 'pointerdown');
		laterFocus.focus();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(document.activeElement).toBe(laterFocus);
	});
});

describe('Solid Batch 4 overlay SSR lane', () => {
	it('preserves closed/default-open policy, deterministic IDs, and hydrated node identity', () => {
		expect(() => execFileSync(process.execPath, ['test/batch4-overlay-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
	});
});
