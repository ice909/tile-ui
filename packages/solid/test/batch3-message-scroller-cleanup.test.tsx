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
} from '../src/components/message-scroller/message-scroller';

const disposers: Array<() => void> = [];
let resizeObservers: MockResizeObserver[] = [];
let mutationObservers: MockMutationObserver[] = [];

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

class MockMutationObserver {
	disconnected = false;
	constructor(private readonly callback: MutationCallback) {
		mutationObservers.push(this);
	}
	observe() {}
	disconnect() {
		this.disconnected = true;
	}
	trigger() {
		this.callback([], this as unknown as MutationObserver);
	}
}

/** 与 scripts/browser-check.mjs 的 memory gate 一致的资源计数仪表。 */
function installCounters() {
	const counters = { listeners: 0, timeouts: 0, intervals: 0, observers: 0, scrollListeners: 0, frames: 0 };
	const add = EventTarget.prototype.addEventListener;
	const remove = EventTarget.prototype.removeEventListener;
	EventTarget.prototype.addEventListener = function (type: string, ...args: [EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]) {
		counters.listeners += 1;
		if (type === 'scroll') counters.scrollListeners += 1;
		return add.call(this, type, ...args);
	};
	EventTarget.prototype.removeEventListener = function (type: string, ...args: [EventListenerOrEventListenerObject, boolean | EventListenerOptions | undefined]) {
		counters.listeners = Math.max(0, counters.listeners - 1);
		if (type === 'scroll') counters.scrollListeners = Math.max(0, counters.scrollListeners - 1);
		return remove.call(this, type, ...args);
	};
	const setTimeoutNative = window.setTimeout;
	const clearTimeoutNative = window.clearTimeout;
	const timeouts = new Set<number>();
	window.setTimeout = ((callback: TimerHandler, timeout?: number, ...args: unknown[]) => {
		const id = setTimeoutNative(() => {
			timeouts.delete(id);
			counters.timeouts = timeouts.size;
			(typeof callback === 'function' ? callback : () => {})(...(args as []));
		}, timeout);
		timeouts.add(id);
		counters.timeouts = timeouts.size;
		return id;
	}) as typeof window.setTimeout;
	window.clearTimeout = ((id: number) => {
		timeouts.delete(id);
		counters.timeouts = timeouts.size;
		return clearTimeoutNative(id);
	}) as typeof window.clearTimeout;
	const setIntervalNative = window.setInterval;
	const clearIntervalNative = window.clearInterval;
	const intervals = new Set<number>();
	window.setInterval = ((callback: TimerHandler, timeout?: number, ...args: unknown[]) => {
		const id = setIntervalNative(callback, timeout, ...args);
		intervals.add(id);
		counters.intervals = intervals.size;
		return id;
	}) as typeof window.setInterval;
	window.clearInterval = ((id: number) => {
		intervals.delete(id);
		counters.intervals = intervals.size;
		return clearIntervalNative(id);
	}) as typeof window.clearInterval;
	const requestAnimationFrameNative = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame.bind(window) : undefined;
	const cancelAnimationFrameNative = typeof window.cancelAnimationFrame === 'function' ? window.cancelAnimationFrame.bind(window) : undefined;
	const frames = new Set<number>();
	if (requestAnimationFrameNative && cancelAnimationFrameNative) {
		window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
			const id = requestAnimationFrameNative(() => {
				frames.delete(id);
				counters.frames = frames.size;
				callback(0);
			});
			frames.add(id);
			counters.frames = frames.size;
			return id;
		}) as typeof window.requestAnimationFrame;
		window.cancelAnimationFrame = ((id: number) => {
			frames.delete(id);
			counters.frames = frames.size;
			return cancelAnimationFrameNative(id);
		}) as typeof window.cancelAnimationFrame;
	}
	return counters;
}

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function mountScrollerTree() {
	return (
		<MessageScrollerProvider>
			<MessageScroller>
				<MessageScrollerViewport>
					<MessageScrollerContent>
						<MessageScrollerItem scrollAnchor>Latest</MessageScrollerItem>
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton direction="start" />
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}

beforeEach(() => {
	resizeObservers = [];
	mutationObservers = [];
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
	vi.stubGlobal('MutationObserver', MockMutationObserver);
});

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('MessageScroller unmount cleanup (memory gate regression)', () => {
	it('removes the viewport scroll listener exactly once per unmount across repeated mount/unmount cycles', () => {
		const counters = installCounters();
		let toggle!: () => void;
		const container = mount(() => {
			const [mounted, setMounted] = createSignal(true);
			toggle = () => setMounted((value) => !value);
			return <Show when={mounted()}>{mountScrollerTree()}</Show>;
		});
		expect(container.querySelector('[data-slot="message-scroller-viewport"]')).toBeTruthy();
		expect(counters.scrollListeners).toBe(1);
		const baseline = { ...counters };

		for (let cycle = 0; cycle < 25; cycle += 1) {
			toggle();
			expect(container.querySelector('[data-slot="message-scroller-viewport"]')).toBeNull();
			expect(counters.scrollListeners).toBe(0);
			toggle();
			expect(container.querySelector('[data-slot="message-scroller-viewport"]')).toBeTruthy();
			expect(counters.scrollListeners).toBe(1);
		}
		expect(counters.scrollListeners).toBe(baseline.scrollListeners);
		expect(counters.listeners).toBeLessThanOrEqual(baseline.listeners);
	});

	it('keeps listener, timeout, interval, and observer counters flat over 25 unmount/remount cycles', async () => {
		const counters = installCounters();
		let toggle!: () => void;
		mount(() => {
			const [mounted, setMounted] = createSignal(true);
			toggle = () => setMounted((value) => !value);
			return <Show when={mounted()}>{mountScrollerTree()}</Show>;
		});
		await Promise.resolve();
		await Promise.resolve();
		const baseline = { ...counters };

		for (let cycle = 0; cycle < 25; cycle += 1) {
			toggle();
			await Promise.resolve();
			toggle();
			await Promise.resolve();
		}
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
		expect(counters.listeners).toBe(baseline.listeners);
		expect(counters.scrollListeners).toBe(baseline.scrollListeners);
		expect(counters.timeouts).toBe(baseline.timeouts);
		expect(counters.intervals).toBe(baseline.intervals);
		expect(counters.observers).toBe(baseline.observers);
		expect(counters.frames).toBe(baseline.frames);
	});

	it('disposes observers exactly once and remounts rebind fresh observers', async () => {
		const counters = installCounters();
		let toggle!: () => void;
		mount(() => {
			const [mounted, setMounted] = createSignal(true);
			toggle = () => setMounted((value) => !value);
			return <Show when={mounted()}>{mountScrollerTree()}</Show>;
		});
		const firstResize = resizeObservers.at(-1)!;
		const firstMutation = mutationObservers.at(-1)!;
		toggle();
		expect(firstResize.disconnected).toBe(true);
		expect(firstMutation.disconnected).toBe(true);
		const afterFirstUnmount = { ...counters };
		toggle();
		expect(resizeObservers.at(-1)).not.toBe(firstResize);
		expect(mutationObservers.at(-1)).not.toBe(firstMutation);
		for (let cycle = 0; cycle < 10; cycle += 1) {
			toggle();
			expect(resizeObservers.at(-1)!.disconnected).toBe(true);
			expect(mutationObservers.at(-1)!.disconnected).toBe(true);
			toggle();
		}
		expect(counters.observers).toBe(afterFirstUnmount.observers);
	});

	it('cancels the setTimeout fallback layout task when requestAnimationFrame is unavailable', async () => {
		vi.stubGlobal('requestAnimationFrame', undefined);
		vi.stubGlobal('cancelAnimationFrame', undefined);
		const counters = installCounters();
		let toggle!: () => void;
		mount(() => {
			const [mounted, setMounted] = createSignal(true);
			toggle = () => setMounted((value) => !value);
			return <Show when={mounted()}>{mountScrollerTree()}</Show>;
		});
		expect(counters.timeouts).toBeGreaterThan(0);
		const baseline = { ...counters };
		toggle();
		await Promise.resolve();
		expect(counters.timeouts).toBeLessThanOrEqual(baseline.timeouts);
		expect(counters.timeouts).toBe(0);
		toggle();
		await Promise.resolve();
		expect(counters.timeouts).toBeGreaterThan(0);
	});

	it('does not schedule layout after unmount when font-ready settles', async () => {
		let resolveFonts!: () => void;
		const fontsReady = new Promise<void>((resolve) => {
			resolveFonts = resolve;
		});
		Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: fontsReady } });
		const counters = installCounters();
		let toggle!: () => void;
		mount(() => {
			const [mounted, setMounted] = createSignal(true);
			toggle = () => setMounted((value) => !value);
			return <Show when={mounted()}>{mountScrollerTree()}</Show>;
		});
		toggle();
		resolveFonts();
		await fontsReady;
		await Promise.resolve();
		await new Promise<void>((resolve) => setTimeout(resolve, 0));
		expect(counters.timeouts).toBe(0);
		expect(counters.frames).toBe(0);
	});

	it('supports repeated dispose of a disposed owner without errors or double removal', () => {
		const counters = installCounters();
		const container = document.createElement('div');
		document.body.appendChild(container);
		const dispose = render(() => mountScrollerTree(), container);
		expect(counters.scrollListeners).toBe(1);
		dispose();
		dispose();
		expect(counters.scrollListeners).toBe(0);
		expect(counters.listeners).toBeLessThanOrEqual(0);
		container.remove();
	});
});
