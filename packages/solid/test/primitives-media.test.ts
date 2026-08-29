import { createRoot, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createIsMobile, createMediaQuery, createMousePosition, createOnlineStatus, createScrollPosition, createWindowSize } from '../src/primitives';

interface TestMediaQueryList extends MediaQueryList {
	emit(matches: boolean): void;
}

function installMatchMedia(initialMatches: Record<string, boolean> = {}) {
	const lists: TestMediaQueryList[] = [];
	const matchMedia = vi.fn((media: string) => {
		let matches = initialMatches[media] ?? false;
		const listeners = new Set<(event: MediaQueryListEvent) => void>();
		const list = {
			media,
			onchange: null,
			get matches() {
				return matches;
			},
			addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => listeners.add(listener as (event: MediaQueryListEvent) => void)),
			removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => listeners.delete(listener as (event: MediaQueryListEvent) => void)),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(() => true),
			emit(nextMatches: boolean) {
				matches = nextMatches;
				const event = { matches, media } as MediaQueryListEvent;
				for (const listener of listeners) listener(event);
			},
		} as TestMediaQueryList;
		lists.push(list);
		return list;
	});
	vi.stubGlobal('matchMedia', matchMedia);
	Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
	return { lists, matchMedia };
}

function setWindowNumber(key: 'innerWidth' | 'innerHeight' | 'scrollX' | 'scrollY', value: number) {
	Object.defineProperty(window, key, { configurable: true, value, writable: true });
}

beforeEach(() => {
	setWindowNumber('innerWidth', 1024);
	setWindowNumber('innerHeight', 768);
	setWindowNumber('scrollX', 0);
	setWindowNumber('scrollY', 0);
	Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Solid media primitives', () => {
	it('synchronizes window, online, and scroll state on mount and browser events', () => {
		setWindowNumber('scrollX', 12);
		setWindowNumber('scrollY', 34);
		Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
		let size!: ReturnType<typeof createWindowSize>;
		let online!: ReturnType<typeof createOnlineStatus>;
		let scroll!: ReturnType<typeof createScrollPosition>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			size = createWindowSize();
			online = createOnlineStatus();
			scroll = createScrollPosition();
		});

		expect(size()).toEqual({ width: 1024, height: 768 });
		expect(online()).toBe(false);
		expect(scroll()).toEqual({ x: 12, y: 34 });
		setWindowNumber('innerWidth', 640);
		setWindowNumber('innerHeight', 480);
		window.dispatchEvent(new Event('resize'));
		window.dispatchEvent(new Event('online'));
		setWindowNumber('scrollX', 90);
		setWindowNumber('scrollY', 120);
		window.dispatchEvent(new Event('scroll'));
		expect(size()).toEqual({ width: 640, height: 480 });
		expect(online()).toBe(true);
		expect(scroll()).toEqual({ x: 90, y: 120 });
		window.dispatchEvent(new Event('offline'));
		expect(online()).toBe(false);
		dispose();
	});

	it('rebinds a reactive media query and removes the old listener', () => {
		const { lists, matchMedia } = installMatchMedia({ '(min-width: 900px)': true });
		const [query, setQuery] = createSignal('(min-width: 900px)');
		let matches!: ReturnType<typeof createMediaQuery>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			matches = createMediaQuery(query);
		});

		expect(matches()).toBe(true);
		expect(matchMedia).toHaveBeenCalledWith('(min-width: 900px)');
		const oldList = lists[0];
		setQuery('(prefers-reduced-motion: reduce)');
		expect(oldList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
		expect(matchMedia).toHaveBeenLastCalledWith('(prefers-reduced-motion: reduce)');
		const currentList = lists[1];
		expect(matches()).toBe(false);
		oldList.emit(false);
		expect(matches()).toBe(false);
		currentList.emit(true);
		expect(matches()).toBe(true);
		dispose();
		expect(currentList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('uses the exact mobile query', () => {
		const { matchMedia } = installMatchMedia();
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			createIsMobile();
		});

		expect(matchMedia).toHaveBeenCalledOnce();
		expect(matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
		dispose();
	});

	it('tracks mouse coordinates and removes all listeners on cleanup', () => {
		const add = vi.spyOn(window, 'addEventListener');
		const remove = vi.spyOn(window, 'removeEventListener');
		let mouse!: ReturnType<typeof createMousePosition>;
		let dispose!: () => void;
		createRoot((ownerDispose) => {
			dispose = ownerDispose;
			createWindowSize();
			createOnlineStatus();
			createScrollPosition();
			mouse = createMousePosition();
		});

		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 15, clientY: 27 }));
		expect(mouse()).toEqual({ x: 15, y: 27 });
		dispose();
		dispose();
		for (const type of ['resize', 'online', 'offline', 'scroll', 'mousemove']) {
			expect(add.mock.calls.some(([eventType]) => eventType === type)).toBe(true);
			expect(remove.mock.calls.some(([eventType]) => eventType === type)).toBe(true);
		}
		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 99, clientY: 101 }));
		expect(mouse()).toEqual({ x: 15, y: 27 });
	});
});
