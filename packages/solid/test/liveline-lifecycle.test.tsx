import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, expect, it, vi } from 'vitest';
import { Liveline, LivelineTransition } from '../src/components/liveline';

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('owns actual chart engines per key, stops outgoing loops, and recreates disposed keys', () => {
	vi.useFakeTimers();
	const frames = new Map<number, FrameRequestCallback>();
	let frameId = 0;
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(++frameId, callback);
		return frameId;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
	const observers = new Set<unknown>();
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {
				observers.add(this);
			}
			disconnect() {
				observers.delete(this);
			}
		},
	);
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 400, height: 200, left: 0, top: 0 } as DOMRect);
	const draws = new Map<HTMLCanvasElement, number>();
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
		return new Proxy(
			{
				canvas: this,
				measureText: (text: string) => ({ width: text.length * 7 }),
				createLinearGradient: () => ({ addColorStop() {} }),
				createRadialGradient: () => ({ addColorStop() {} }),
				clearRect: () => draws.set(this, (draws.get(this) ?? 0) + 1),
			},
			{ get: (target, key) => Reflect.get(target, key) ?? (() => {}) },
		) as unknown as CanvasRenderingContext2D;
	} as unknown as typeof HTMLCanvasElement.prototype.getContext);
	const tick = () => {
		const pending = [...frames.values()];
		frames.clear();
		for (const callback of pending) callback(performance.now());
	};
	const [active, setActive] = createSignal('a');
	const [value, setValue] = createSignal(12);
	const host = document.createElement('div');
	const dispose = render(
		() => (
			<LivelineTransition active={active()} duration={50}>
				{(key) => <Liveline data={[{ time: Date.now() / 1000, value: 10 }]} value={value()} aria-label={key} />}
			</LivelineTransition>
		),
		host,
	);
	try {
		const a = host.querySelector('canvas')!;
		expect(observers.size).toBe(1);
		setActive('b');
		const b = host.querySelector<HTMLCanvasElement>('canvas[aria-label="b"]')!;
		expect(observers.size).toBe(2);
		tick();
		tick();
		vi.advanceTimersByTime(100);
		expect(observers.size).toBe(1);
		expect(host.querySelectorAll('canvas')).toHaveLength(1);
		const stoppedDraws = draws.get(a);
		setValue(15);
		tick();
		tick();
		expect(draws.get(a)).toBe(stoppedDraws);
		expect(draws.get(b)).toBeGreaterThan(0);
		expect(frames.size).toBe(1);
		setActive('a');
		expect(host.querySelector('canvas[aria-label="a"]')).not.toBe(a);
		setActive('b');
		setActive('c');
		tick();
		tick();
		vi.advanceTimersByTime(100);
		expect(observers.size).toBe(1);
		expect(host.querySelectorAll('canvas')).toHaveLength(1);
		expect(host.querySelector('canvas')?.getAttribute('aria-label')).toBe('c');
		vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
		setActive('a');
		expect(observers.size).toBe(1);
		expect(host.querySelectorAll('canvas')).toHaveLength(1);
		expect(host.querySelector('canvas')?.getAttribute('aria-label')).toBe('a');
		vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
		setActive('b');
		expect(observers.size).toBe(2);
	} finally {
		dispose();
	}
	expect(observers.size).toBe(0);
	expect(frames.size).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});
