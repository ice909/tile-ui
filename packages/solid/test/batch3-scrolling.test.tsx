import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { Show, createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
} from '../src/components/message-scroller/message-scroller';
import { ScrollArea, ScrollBar } from '../src/components/scroll-area/scroll-area';

const disposers: Array<() => void> = [];
const execFileAsync = promisify(execFile);
let resizeObservers: MockResizeObserver[] = [];

class MockResizeObserver {
	readonly observed = new Set<Element>();
	disconnected = false;
	constructor(private readonly callback: ResizeObserverCallback) {
		resizeObservers.push(this);
	}
	observe(element: Element) {
		this.observed.add(element);
	}
	unobserve(element: Element) {
		this.observed.delete(element);
	}
	disconnect() {
		this.disconnected = true;
		this.observed.clear();
	}
	trigger() {
		this.callback([], this as unknown as ResizeObserver);
	}
}

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function setGeometry(element: Element, geometry: Partial<Record<'clientHeight' | 'clientWidth' | 'scrollHeight' | 'scrollWidth' | 'scrollTop' | 'scrollLeft', number>>) {
	for (const [key, value] of Object.entries(geometry)) Object.defineProperty(element, key, { configurable: true, value, writable: true });
}

function pointer(type: string, init: PointerEventInit) {
	const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
	Object.defineProperties(event, {
		pointerId: { value: init.pointerId ?? 1 },
		clientX: { value: init.clientX ?? 0 },
		clientY: { value: init.clientY ?? 0 },
		button: { value: init.button ?? 0 },
		isPrimary: { value: init.isPrimary ?? true },
	});
	return event;
}

async function settleLayout() {
	await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

beforeEach(() => {
	resizeObservers = [];
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Solid ScrollArea scrolling lane', () => {
	it('keeps a native viewport, refs, attrs, and independent vertical/horizontal thumb metrics in sync', () => {
		const refs: HTMLDivElement[] = [];
		const container = mount(() => (
			<ScrollArea ref={(element) => refs.push(element)} class="area-user" aria-label="Files">
				<div data-id="content">Content</div>
				<ScrollBar data-id="vertical" />
				<ScrollBar data-id="horizontal" orientation="horizontal" class="bar-user" />
			</ScrollArea>
		));
		const root = container.querySelector('[data-slot="scroll-area"]') as HTMLDivElement;
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const vertical = container.querySelector('[data-id="vertical"]') as HTMLDivElement;
		const horizontal = container.querySelector('[data-id="horizontal"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100, clientWidth: 200, scrollWidth: 800, scrollLeft: 300 });
		setGeometry(vertical, { clientHeight: 200 });
		setGeometry(horizontal, { clientWidth: 300 });
		for (const observer of resizeObservers) observer.trigger();
		const verticalThumb = vertical.firstElementChild as HTMLElement;
		const horizontalThumb = horizontal.firstElementChild as HTMLElement;
		expect(refs).toEqual([root]);
		expect(root.getAttribute('aria-label')).toBe('Files');
		expect(root.className).toContain('area-user');
		expect(viewport.tabIndex).toBe(0);
		expect(viewport.hasAttribute('aria-hidden')).toBe(false);
		expect(horizontal.className).toContain('bar-user');
		expect(vertical.getAttribute('role')).toBe('scrollbar');
		expect(vertical.getAttribute('aria-controls')).toBe(viewport.id);
		expect(vertical.getAttribute('aria-orientation')).toBe('vertical');
		expect(vertical.getAttribute('aria-valuemin')).toBe('0');
		expect(vertical.getAttribute('aria-valuemax')).toBe('400');
		expect(vertical.getAttribute('aria-valuenow')).toBe('100');
		expect(vertical.tabIndex).toBe(0);
		viewport.scrollTop = 120;
		expect(viewport.scrollTop).toBe(120);
		expect(vertical.dataset.visible).toBe('true');
		expect(verticalThumb.style.height).toBe('40px');
		expect(verticalThumb.style.transform).toBe('translateY(40px)');
		expect(horizontalThumb.style.width).toBe('75px');
		expect(horizontalThumb.style.transform).toBe('translateX(112.5px)');
		viewport.scrollTop = 400;
		viewport.scrollLeft = 600;
		viewport.dispatchEvent(new Event('scroll'));
		expect(verticalThumb.style.transform).toBe('translateY(160px)');
		expect(horizontalThumb.style.transform).toBe('translateX(225px)');
		expect(vertical.getAttribute('aria-valuenow')).toBe('400');
	});

	it('supports scrollbar keyboard controls and cancellable tuple key handlers', () => {
		const calls: string[] = [];
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar onKeyDown={[(label: string) => calls.push(label), 'key']} />
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
		setGeometry(track, { clientHeight: 200 });
		resizeObservers[0].trigger();
		for (const key of ['ArrowDown', 'PageDown', 'End', 'ArrowUp', 'PageUp', 'Home'])
			track.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		expect(calls).toEqual(['key', 'key', 'key', 'key', 'key', 'key']);
		expect(viewport.scrollTop).toBe(0);
		expect(track.getAttribute('aria-valuenow')).toBe('0');

		const blocked = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar onKeyDown={(event) => event.preventDefault()} />
			</ScrollArea>
		));
		const blockedViewport = blocked.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const blockedTrack = blocked.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		setGeometry(blockedViewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
		setGeometry(blockedTrack, { clientHeight: 200 });
		resizeObservers.at(-1)?.trigger();
		blockedTrack.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(blockedViewport.scrollTop).toBe(100);
	});

	it('ignores cross-axis arrows without preventing defaults or changing native values', () => {
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar data-id="vertical" />
				<ScrollBar data-id="horizontal" orientation="horizontal" />
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const vertical = container.querySelector('[data-id="vertical"]') as HTMLDivElement;
		const horizontal = container.querySelector('[data-id="horizontal"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100, clientWidth: 200, scrollWidth: 800, scrollLeft: 300 });
		setGeometry(vertical, { clientHeight: 200 });
		setGeometry(horizontal, { clientWidth: 300 });
		for (const observer of resizeObservers) observer.trigger();

		const verticalCrossAxis = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		vertical.dispatchEvent(verticalCrossAxis);
		expect(verticalCrossAxis.defaultPrevented).toBe(false);
		expect(viewport.scrollTop).toBe(100);
		expect(vertical.getAttribute('aria-valuenow')).toBe('100');

		const horizontalCrossAxis = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
		horizontal.dispatchEvent(horizontalCrossAxis);
		expect(horizontalCrossAxis.defaultPrevented).toBe(false);
		expect(viewport.scrollLeft).toBe(300);
		expect(horizontal.getAttribute('aria-valuenow')).toBe('300');

		const horizontalArrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		horizontal.dispatchEvent(horizontalArrow);
		expect(horizontalArrow.defaultPrevented).toBe(true);
		expect(viewport.scrollLeft).toBe(340);
	});

	it('keeps unavailable scrollbars measurable but visually hidden, inert, and free of control ARIA until observer geometry becomes scrollable', () => {
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar data-id="bar" />
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-id="bar"]') as HTMLDivElement;
		setGeometry(track, { clientHeight: 200 });
		const unavailableStyle = getComputedStyle(track);
		expect(track.hidden).toBe(false);
		expect(track.clientHeight).toBe(200);
		expect(unavailableStyle.display).not.toBe('none');
		expect(unavailableStyle.visibility).toBe('hidden');
		expect(unavailableStyle.opacity).toBe('0');
		expect(unavailableStyle.pointerEvents).toBe('none');
		expect([track.tabIndex, track.getAttribute('aria-hidden')]).toEqual([-1, 'true']);
		expect(track.getAttribute('role')).toBeNull();
		expect(track.getAttribute('aria-controls')).toBeNull();
		expect(track.getAttribute('aria-orientation')).toBeNull();
		expect(track.getAttribute('aria-valuemin')).toBeNull();
		expect(track.getAttribute('aria-valuemax')).toBeNull();
		expect(track.getAttribute('aria-valuenow')).toBeNull();

		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
		resizeObservers[0].trigger();
		const availableStyle = getComputedStyle(track);
		expect(track.clientHeight).toBe(200);
		expect(availableStyle.visibility).toBe('visible');
		expect(availableStyle.opacity).toBe('1');
		expect(availableStyle.pointerEvents).toBe('auto');
		expect([track.tabIndex, track.getAttribute('aria-hidden')]).toEqual([0, null]);
		expect(track.getAttribute('role')).toBe('scrollbar');
		expect(track.getAttribute('aria-controls')).toBe(viewport.id);
		expect(track.getAttribute('aria-valuenow')).toBe('100');
	});

	it('recomputes metrics, ARIA, classes, and thumb styles when orientation changes', () => {
		let setOrientation!: (orientation: 'vertical' | 'horizontal') => void;
		const container = mount(() => {
			const [orientation, updateOrientation] = createSignal<'vertical' | 'horizontal'>('vertical');
			setOrientation = updateOrientation;
			return (
				<ScrollArea>
					<div />
					<ScrollBar orientation={orientation()} />
				</ScrollArea>
			);
		});
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		const thumb = track.firstElementChild as HTMLElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100, clientWidth: 200, scrollWidth: 800, scrollLeft: 300 });
		setGeometry(track, { clientHeight: 200, clientWidth: 300 });
		resizeObservers[0].trigger();
		expect(thumb.style.height).toBe('40px');
		setOrientation('horizontal');
		expect(track.dataset.orientation).toBe('horizontal');
		expect(track.getAttribute('aria-orientation')).toBe('horizontal');
		expect(track.getAttribute('aria-valuemax')).toBe('600');
		expect(track.getAttribute('aria-valuenow')).toBe('300');
		expect(thumb.style.height).toBe('');
		expect(thumb.style.width).toBe('75px');
		expect(thumb.style.transform).toBe('translateX(112.5px)');
	});

	it('observes viewport content changes and feature-detects ResizeObserver', async () => {
		let add!: () => void;
		const container = mount(() => {
			const [extra, setExtra] = createSignal(false);
			add = () => setExtra(true);
			return (
				<ScrollArea>
					<div data-id="first" />
					<Show when={extra()}>
						<div data-id="second" />
					</Show>
					<ScrollBar />
				</ScrollArea>
			);
		});
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 300 });
		setGeometry(track, { clientHeight: 100 });
		resizeObservers[0].trigger();
		add();
		await Promise.resolve();
		expect(resizeObservers[0].observed.has(container.querySelector('[data-id="second"]')!)).toBe(true);

		for (const dispose of disposers.splice(0)) dispose();
		vi.stubGlobal('ResizeObserver', undefined);
		expect(() =>
			mount(() => (
				<ScrollArea>
					<div />
					<ScrollBar />
				</ScrollArea>
			)),
		).not.toThrow();
	});

	it('preserves pointer-to-thumb offset, guards capture APIs, and cleans up up/cancel/lostcapture', () => {
		const calls: string[] = [];
		const tuple = (label: string, event: PointerEvent) => {
			calls.push(label);
			if (label === 'cancel-down') event.preventDefault();
		};
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar onPointerMove={[tuple, 'move']} onPointerCancel={[tuple, 'cancel']} onLostPointerCapture={[tuple, 'lost']} />
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		const thumb = track.firstElementChild as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
		setGeometry(track, { clientHeight: 200 });
		vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 0, height: 200, width: 10 } as DOMRect);
		const captured = new Set<number>();
		Object.defineProperties(track, {
			setPointerCapture: { configurable: true, value: (id: number) => captured.add(id) },
			hasPointerCapture: { configurable: true, value: (id: number) => captured.has(id) },
			releasePointerCapture: { configurable: true, value: (id: number) => captured.delete(id) },
		});
		resizeObservers[0].trigger();
		thumb.dispatchEvent(pointer('pointerdown', { pointerId: 3, clientY: 60 }));
		expect(viewport.scrollTop).toBe(100);
		track.dispatchEvent(pointer('pointermove', { pointerId: 3, clientY: 100 }));
		expect(viewport.scrollTop).toBe(200);
		track.dispatchEvent(pointer('pointercancel', { pointerId: 3 }));
		expect(captured.has(3)).toBe(false);
		track.dispatchEvent(pointer('pointerdown', { pointerId: 4, clientY: 100 }));
		track.dispatchEvent(pointer('lostpointercapture', { pointerId: 4 }));
		track.dispatchEvent(pointer('pointermove', { pointerId: 4, clientY: 180 }));
		expect(calls).toEqual(['move', 'cancel', 'lost', 'move']);
		Object.defineProperty(track, 'hasPointerCapture', {
			configurable: true,
			value: () => {
				throw new DOMException('detached');
			},
		});
		expect(() => track.dispatchEvent(pointer('pointermove', { pointerId: 5 }))).not.toThrow();
	});

	it('continues dragging through document listeners when capture is unavailable and removes fallback listeners', () => {
		const moves: number[] = [];
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar onPointerMove={(event) => moves.push(event.clientY)} />
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		const thumb = track.firstElementChild as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
		setGeometry(track, { clientHeight: 200 });
		vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 0, height: 200, width: 10 } as DOMRect);
		Object.defineProperties(track, {
			setPointerCapture: {
				configurable: true,
				value: () => {
					throw new DOMException('unsupported');
				},
			},
			hasPointerCapture: { configurable: true, value: () => false },
		});
		resizeObservers[0].trigger();
		thumb.dispatchEvent(pointer('pointerdown', { pointerId: 8, clientY: 60 }));
		document.dispatchEvent(pointer('pointermove', { pointerId: 8, clientY: 100 }));
		expect(viewport.scrollTop).toBe(200);
		expect(moves).toEqual([100]);
		document.dispatchEvent(pointer('pointerup', { pointerId: 8 }));
		document.dispatchEvent(pointer('pointermove', { pointerId: 8, clientY: 180 }));
		expect(viewport.scrollTop).toBe(200);
		expect(moves).toEqual([100]);

		thumb.dispatchEvent(pointer('pointerdown', { pointerId: 9, clientY: 100 }));
		for (const dispose of disposers.splice(0)) dispose();
		document.dispatchEvent(pointer('pointermove', { pointerId: 9, clientY: 180 }));
		expect(moves).toEqual([100]);
	});

	it('honors cancellable tuple pointer handlers before starting a drag', () => {
		const container = mount(() => (
			<ScrollArea>
				<div />
				<ScrollBar
					onPointerDown={[
						(label: string, event: PointerEvent) => {
							expect(label).toBe('blocked');
							event.preventDefault();
						},
						'blocked',
					]}
				/>
			</ScrollArea>
		));
		const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
		const track = container.querySelector('[data-slot="scroll-area-scrollbar"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 0 });
		setGeometry(track, { clientHeight: 200 });
		resizeObservers[0].trigger();
		track.dispatchEvent(pointer('pointerdown', { clientY: 150 }));
		expect(viewport.scrollTop).toBe(0);
	});
});

describe('Solid MessageScroller scrolling lane', () => {
	function ScrollerProbe() {
		const context = useMessageScroller();
		const scrollable = useMessageScrollerScrollable();
		const visibility = useMessageScrollerVisibility();
		return (
			<output
				data-slot="probe"
				data-scrollable={scrollable.scrollable()}
				data-start={visibility.startVisible()}
				data-end={visibility.endVisible()}
				onClick={() => context.scrollToEnd('auto')}
			/>
		);
	}

	function ScrollerGeneration(props: { generation: number; calls: ScrollToOptions[] }) {
		return (
			<MessageScroller data-generation={props.generation}>
				<MessageScrollerViewport
					ref={(element) => {
						Object.defineProperty(element, 'scrollTo', {
							configurable: true,
							value: (options: ScrollToOptions) => {
								props.calls.push(options);
								element.scrollTop = options.top ?? element.scrollTop;
							},
						});
					}}>
					<MessageScrollerContent />
				</MessageScrollerViewport>
				<MessageScrollerButton direction="start" />
				<MessageScrollerButton />
			</MessageScroller>
		);
	}

	it('tracks near-end stickiness, independent start/end visibility, hooks, labels, refs, attrs, and button scrolling', () => {
		const scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
			this.scrollTop = options.top ?? this.scrollTop;
		});
		const refs: HTMLDivElement[] = [];
		const container = mount(() => (
			<MessageScrollerProvider>
				<MessageScroller class="root-user">
					<MessageScrollerViewport ref={(element) => refs.push(element)} aria-label="Messages">
						<MessageScrollerContent>
							<MessageScrollerItem scrollAnchor>Message</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="start" />
					<MessageScrollerButton aria-label="Newest message" />
					<ScrollerProbe />
				</MessageScroller>
			</MessageScrollerProvider>
		));
		const root = container.querySelector('[data-slot="message-scroller"]') as HTMLElement;
		const viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		const content = container.querySelector('[data-slot="message-scroller-content"]') as HTMLDivElement;
		const item = container.querySelector('[data-slot="message-scroller-item"]') as HTMLDivElement;
		const buttons = container.querySelectorAll<HTMLButtonElement>('[data-slot="message-scroller-button"]');
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 200 });
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		viewport.dispatchEvent(new Event('scroll'));
		expect(refs).toEqual([viewport]);
		expect(root.className).toContain('root-user');
		expect(root.className).toContain('root');
		expect(viewport.className).toContain('viewport');
		expect(content.className).toContain('content');
		expect(item.className).toContain('item');
		expect([root, viewport, content, item, ...buttons].every((element) => !element.className.includes('undefined'))).toBe(true);
		expect(root.children[0]).toBe(viewport);
		expect(viewport.children[0]).toBe(content);
		expect(content.children[0]).toBe(item);
		expect(item.dataset.scrollAnchor).toBe('true');
		expect(viewport.getAttribute('aria-label')).toBe('Messages');
		expect(viewport.tabIndex).toBe(0);
		expect(viewport.hasAttribute('aria-hidden')).toBe(false);
		expect(buttons[0].getAttribute('aria-label')).toBe('Scroll to start');
		expect(buttons[1].getAttribute('aria-label')).toBe('Newest message');
		expect(buttons[0].className).toContain('directionStart');
		expect(buttons[1].className).toContain('directionEnd');
		expect(Array.from(buttons, (button) => button.dataset.active)).toEqual(['true', 'true']);
		expect(Array.from(buttons, (button) => [button.hidden, button.disabled, button.getAttribute('aria-hidden'), button.tabIndex])).toEqual([
			[false, false, null, 0],
			[false, false, null, 0],
		]);
		const icons = Array.from(buttons, (button) => button.firstElementChild as SVGSVGElement);
		expect(icons.map((icon) => [icon.namespaceURI, icon.getAttribute('stroke'), icon.querySelectorAll('path').length])).toEqual([
			['http://www.w3.org/2000/svg', 'currentColor', 2],
			['http://www.w3.org/2000/svg', 'currentColor', 2],
		]);
		expect(container.querySelector('[data-slot="probe"]')?.getAttribute('data-scrollable')).toBe('true');
		buttons[0].click();
		expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
		expect(Array.from(buttons, (button) => button.dataset.active)).toEqual(['false', 'true']);
		expect([buttons[0].hidden, buttons[0].disabled, buttons[0].getAttribute('aria-hidden'), buttons[0].tabIndex]).toEqual([false, true, 'true', -1]);
		buttons[1].click();
		expect(scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'smooth' });
		expect(Array.from(buttons, (button) => button.dataset.active)).toEqual(['true', 'false']);
		expect([buttons[1].hidden, buttons[1].disabled, buttons[1].getAttribute('aria-hidden'), buttons[1].tabIndex]).toEqual([false, true, 'true', -1]);
	});

	it('rebinds observer lifecycle across conditional content unmount/remount and autosticks only while near the end', async () => {
		let toggle!: () => void;
		const scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
			this.scrollTop = options.top ?? this.scrollTop;
		});
		const container = mount(() => {
			const [shown, setShown] = createSignal(true);
			toggle = () => setShown((value) => !value);
			return (
				<MessageScrollerProvider>
					<MessageScroller>
						<MessageScrollerViewport>
							<Show when={shown()}>
								<MessageScrollerContent data-id="content" />
							</Show>
						</MessageScrollerViewport>
					</MessageScroller>
				</MessageScrollerProvider>
			);
		});
		const viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 400 });
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		viewport.dispatchEvent(new Event('scroll'));
		resizeObservers.at(-1)?.trigger();
		await settleLayout();
		expect(scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'auto' });
		const stickyCallCount = scrollTo.mock.calls.length;
		viewport.scrollTop = 100;
		viewport.dispatchEvent(new Event('scroll'));
		resizeObservers.at(-1)?.trigger();
		await settleLayout();
		expect(scrollTo).toHaveBeenCalledTimes(stickyCallCount);
		const firstObserver = resizeObservers.at(-1)!;
		toggle();
		await Promise.resolve();
		expect(firstObserver.disconnected).toBe(true);
		toggle();
		await Promise.resolve();
		expect(resizeObservers.at(-1)).not.toBe(firstObserver);
		expect(resizeObservers.at(-1)?.observed.has(container.querySelector('[data-id="content"]')!)).toBe(true);
		expect(resizeObservers.at(-1)?.observed.has(viewport)).toBe(true);
	});

	it('observes viewport resize, restores remounted sticky viewports to end, and rebinds both nodes', async () => {
		let remount!: () => void;
		const scrollCalls: ScrollToOptions[] = [];
		const container = mount(() => {
			const [generation, setGeneration] = createSignal(0);
			remount = () => setGeneration((value) => value + 1);
			return (
				<MessageScrollerProvider>
					<Show when={generation()} keyed fallback={<ScrollerGeneration generation={0} calls={scrollCalls} />}>
						{(value) => <ScrollerGeneration generation={value} calls={scrollCalls} />}
					</Show>
				</MessageScrollerProvider>
			);
		});
		let viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		let content = container.querySelector('[data-slot="message-scroller-content"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 400 });
		viewport.dispatchEvent(new Event('scroll'));
		const firstObserver = resizeObservers.at(-1)!;
		expect(firstObserver.observed).toEqual(new Set([viewport, content]));
		setGeometry(viewport, { clientHeight: 300, scrollHeight: 500, scrollTop: 200 });
		firstObserver.trigger();
		await settleLayout();
		expect(container.querySelector('[data-direction="end"]')?.getAttribute('data-active')).toBe('false');

		remount();
		await Promise.resolve();
		expect(firstObserver.disconnected).toBe(true);
		viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		content = container.querySelector('[data-slot="message-scroller-content"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 600, scrollTop: 0 });
		resizeObservers.at(-1)?.trigger();
		await settleLayout();
		expect(scrollCalls.at(-1)).toEqual({ top: 600, behavior: 'auto' });
		expect(resizeObservers.at(-1)?.observed).toEqual(new Set([viewport, content]));
	});

	it('measures initial overflowing layout after refs settle, sticks to end, and exposes independent buttons without a scroll event', async () => {
		const scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
			this.scrollTop = options.top ?? this.scrollTop;
		});
		const container = mount(() => (
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport>
						<MessageScrollerContent>
							<MessageScrollerItem>Earlier</MessageScrollerItem>
							<MessageScrollerItem scrollAnchor>Latest</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="start" />
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
		));
		const viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		const content = container.querySelector('[data-slot="message-scroller-content"]') as HTMLDivElement;
		const buttons = container.querySelectorAll<HTMLButtonElement>('[data-slot="message-scroller-button"]');
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 0 });
		setGeometry(content, { clientHeight: 500, scrollHeight: 500 });
		await settleLayout();
		expect(scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'auto' });
		expect(viewport.scrollTop).toBe(500);
		expect(Array.from(buttons, (button) => button.dataset.active)).toEqual(['true', 'false']);
		expect(resizeObservers.at(-1)?.observed).toEqual(new Set([viewport, content]));
	});

	it('marks only opted-in items and generates native scroll anchoring rules', async () => {
		const container = mount(() => (
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport>
						<MessageScrollerContent>
							<MessageScrollerItem data-id="ordinary">Ordinary</MessageScrollerItem>
							<MessageScrollerItem data-id="anchor" scrollAnchor>
								Anchor
							</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
				</MessageScroller>
			</MessageScrollerProvider>
		));
		const ordinary = container.querySelector('[data-id="ordinary"]') as HTMLElement;
		const anchor = container.querySelector('[data-id="anchor"]') as HTMLElement;
		expect(ordinary.hasAttribute('data-scroll-anchor')).toBe(false);
		expect(anchor.getAttribute('data-scroll-anchor')).toBe('true');
		const css = await readFile(path.resolve(import.meta.dirname, '../../styles/css/components/message-scroller.css'), 'utf8');
		expect(css).toContain('.item{');
		expect(css).toContain('overflow-anchor:none');
		expect(css).toContain('.item[data-scroll-anchor=true]{overflow-anchor:auto}');
	});

	it('feature-detects observers, always updates native scroll state, and keeps click cancellation', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		const calls: string[] = [];
		const cancel = (label: string, event: Event) => {
			calls.push(label);
			event.preventDefault();
		};
		const scrollTo = vi.fn();
		const container = mount(() => (
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport onScroll={[cancel, 'scroll']}>
						<MessageScrollerContent />
					</MessageScrollerViewport>
					<MessageScrollerButton onClick={[cancel, 'click']} />
				</MessageScroller>
			</MessageScrollerProvider>
		));
		const viewport = container.querySelector('[data-slot="message-scroller-viewport"]') as HTMLDivElement;
		setGeometry(viewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 200 });
		Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
		viewport.dispatchEvent(new Event('scroll', { cancelable: true }));
		(container.querySelector('button') as HTMLButtonElement).click();
		expect(calls).toEqual(['scroll', 'click']);
		expect(scrollTo).not.toHaveBeenCalled();
		expect((container.querySelector('button') as HTMLButtonElement).dataset.active).toBe('true');
	});

	it('throws clear errors for every provider-dependent component and hook', () => {
		expect(() => mount(() => <MessageScrollerViewport />)).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
		expect(() => mount(() => <MessageScrollerContent />)).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
		expect(() => mount(() => <MessageScrollerButton />)).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
		expect(() =>
			mount(() => {
				useMessageScroller();
				return null;
			}),
		).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
		expect(() =>
			mount(() => {
				useMessageScrollerScrollable();
				return null;
			}),
		).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
		expect(() =>
			mount(() => {
				useMessageScrollerVisibility();
				return null;
			}),
		).toThrow('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
	});
});

describe('Solid Batch 3 scrolling SSR and hydration', () => {
	it('renders deterministic inactive markup without browser globals and hydrates without replacing nodes', async () => {
		const outputRoot = await mkdtemp(path.join(tmpdir(), 'tile-solid-batch3-scrolling-'));
		const packageRoot = path.resolve(import.meta.dirname, '..');
		const stylesRoot = path.resolve(import.meta.dirname, '../../styles/scss');
		const solidRoot = path.resolve(packageRoot, 'node_modules/solid-js');
		const coreEntry = path.resolve(packageRoot, '../core/src/index.ts');
		const stylesPackageRoot = path.resolve(packageRoot, '../styles');
		const serverEntry = path.resolve(import.meta.dirname, 'fixtures/batch3-scrolling-server.tsx');
		const clientEntry = path.resolve(import.meta.dirname, 'fixtures/batch3-scrolling-client.tsx');
		const buildScript = path.join(outputRoot, 'build.mjs');
		const viteUrl = pathToFileURL(path.resolve(packageRoot, 'node_modules/vite/dist/node/index.js')).href;
		const solidPluginUrl = pathToFileURL(path.resolve(packageRoot, 'node_modules/vite-plugin-solid/dist/esm/index.mjs')).href;
		await writeFile(
			buildScript,
			`import { build } from ${JSON.stringify(viteUrl)};
			import solid from ${JSON.stringify(solidPluginUrl)};
			const root = ${JSON.stringify(packageRoot)};
			const stylesRoot = ${JSON.stringify(stylesRoot)};
			const alias = { 'solid-js': ${JSON.stringify(solidRoot)}, '@tile-ui/core': ${JSON.stringify(coreEntry)}, '@tile-ui/styles': ${JSON.stringify(stylesPackageRoot)} };
			await build({ root, plugins: [solid({ ssr: true })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias }, ssr: { noExternal: true, resolve: { conditions: ['node'] } }, build: { ssr: ${JSON.stringify(serverEntry)}, outDir: ${JSON.stringify(path.join(outputRoot, 'server'))}, rollupOptions: { output: { entryFileNames: 'fixture.mjs' } } } });
			await build({ root, plugins: [solid({ solid: { hydratable: true } })], logLevel: 'silent', css: { preprocessorOptions: { scss: { loadPaths: [stylesRoot] } } }, resolve: { alias, conditions: ['browser'] }, build: { outDir: ${JSON.stringify(path.join(outputRoot, 'client'))}, lib: { entry: ${JSON.stringify(clientEntry)}, formats: ['es'], fileName: () => 'fixture.mjs' }, rollupOptions: { output: { inlineDynamicImports: true } } } });`,
		);
		try {
			await execFileAsync(process.execPath, [buildScript], { cwd: packageRoot });
			const serverCode = await readFile(path.join(outputRoot, 'server/fixture.mjs'), 'utf8');
			const server = await import(`data:text/javascript;base64,${btoa(serverCode)}`);
			const fixture = server.renderBatch3ScrollingFixture();
			expect(fixture.html).toContain('data-visible="false"');
			expect(fixture.html).toContain('data-active="false"');
			expect(fixture.html).not.toContain('role="scrollbar"');
			expect(fixture.html).not.toContain('aria-controls=');
			expect(fixture.html).not.toContain('aria-valuemin=');
			expect(fixture.html).toContain('visibility:hidden');
			expect(fixture.html).toContain('pointer-events:none');
			expect(fixture.html).toContain('disabled');
			expect(fixture.html).toContain('aria-hidden="true"');
			expect(fixture.html).toContain('height:0px');
			expect(fixture.html).toContain('width:0px');

			document.body.innerHTML = `<div id="batch3-app">${fixture.html}</div>`;
			const hydrationCode = fixture.hydrationScript.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
			if (!hydrationCode) throw new Error('Missing Solid hydration script.');
			window.eval(hydrationCode);
			const hydrationState = (window as typeof window & { _$HY?: unknown })._$HY;
			Object.defineProperty(globalThis, '_$HY', { configurable: true, value: hydrationState, writable: true });
			const container = document.querySelector('#batch3-app') as HTMLElement;
			const scrollArea = container.querySelector('[data-id="scroll-area"]');
			const scrollViewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
			const verticalBar = container.querySelector('[data-id="vertical-bar"]') as HTMLDivElement;
			const messageViewport = container.querySelector('[data-id="message-viewport"]');
			expect(verticalBar.hidden).toBe(false);
			expect([verticalBar.tabIndex, verticalBar.getAttribute('aria-hidden')]).toEqual([-1, 'true']);
			expect(getComputedStyle(verticalBar).visibility).toBe('hidden');
			expect(getComputedStyle(verticalBar).pointerEvents).toBe('none');
			setGeometry(scrollViewport, { clientHeight: 100, scrollHeight: 500, scrollTop: 100 });
			setGeometry(verticalBar, { clientHeight: 200 });
			const clientCode = await readFile(path.join(outputRoot, 'client/fixture.mjs'), 'utf8');
			const client = await import(`data:text/javascript;base64,${btoa(`const _$HY = globalThis._$HY;\n${clientCode}`)}`);
			client.hydrateBatch3ScrollingFixture(container, fixture.renderId);
			(window as typeof window & { _$HY: { fe(): void } })._$HY.fe();
			await Promise.resolve();
			expect(container.querySelector('[data-id="scroll-area"]')).toBe(scrollArea);
			expect(container.querySelector('[data-id="message-viewport"]')).toBe(messageViewport);
			expect(container.querySelector('[data-id="vertical-bar"]')).toBe(verticalBar);
			expect([verticalBar.tabIndex, verticalBar.getAttribute('aria-hidden')]).toEqual([0, null]);
			expect(getComputedStyle(verticalBar).visibility).toBe('visible');
			expect(getComputedStyle(verticalBar).pointerEvents).toBe('auto');
			expect(verticalBar.getAttribute('role')).toBe('scrollbar');
			expect(verticalBar.getAttribute('aria-controls')).toBe(scrollViewport.id);
			expect(verticalBar.getAttribute('aria-valuemax')).toBe('400');
			expect(verticalBar.getAttribute('aria-valuenow')).toBe('100');
		} finally {
			delete (globalThis as typeof globalThis & { _$HY?: unknown })._$HY;
			await rm(outputRoot, { recursive: true, force: true });
		}
	}, 30_000);
});
