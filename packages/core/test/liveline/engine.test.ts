import { describe, expect, it, vi } from 'vitest';
import { createLivelineEngine, resolveTheme } from '../../src/liveline';
import type { LivelineEngineConfig } from '../../src/liveline';
import { drawCandleFrame } from '../../src/liveline/draw';
import type { CandleDrawOptions } from '../../src/liveline/draw';
import { drawGrid } from '../../src/liveline/draw/grid';
import { createParticleState, spawnOnSwing } from '../../src/liveline/draw/particles';

class FakeStyle {
	[key: string]: unknown;
	removeProperty(name: string) {
		delete this[name];
	}
}

class FakeElement {
	ownerDocument!: FakeDocument;
	style = new FakeStyle();
	children: FakeElement[] = [];
	parent?: FakeElement;
	textContent: string | null = null;
	listeners = new Map<string, Set<EventListener>>();

	appendChild(child: FakeElement) {
		child.parent = this;
		this.children.push(child);
		return child;
	}

	remove() {
		if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
	}

	setAttribute() {}
	getBoundingClientRect() {
		return { width: 400, height: 200, left: 0, top: 0 } as DOMRect;
	}
	addEventListener(type: string, listener: EventListener) {
		const listeners = this.listeners.get(type) ?? new Set<EventListener>();
		listeners.add(listener);
		this.listeners.set(type, listeners);
	}
	removeEventListener(type: string, listener: EventListener) {
		this.listeners.get(type)?.delete(listener);
	}
	dispatch(type: string, event: object) {
		for (const listener of this.listeners.get(type) ?? []) listener(event as Event);
	}
}

class FakeDocument extends FakeElement {
	hidden = false;
	defaultView: { devicePixelRatio?: number } | null = null;
	createElement() {
		return this.makeElement();
	}
	createElementNS() {
		return this.makeElement();
	}
	makeElement() {
		const element = new FakeElement();
		element.ownerDocument = this;
		return element;
	}
}

function createContext(canvas: HTMLCanvasElement) {
	const gradient = { addColorStop: vi.fn() };
	let currentAlpha = 1;
	const alphaStack: number[] = [];
	const fillAlphas: number[] = [];
	const target = {
		canvas,
		globalAlpha: 1,
		fillAlphas,
		measureText: (text: string) => ({ width: text.length * 7 }),
		createLinearGradient: () => gradient,
		createRadialGradient: () => gradient,
		fillText: vi.fn(),
		fill: vi.fn(() => fillAlphas.push(currentAlpha)),
		arc: vi.fn(),
		save: vi.fn(() => alphaStack.push(currentAlpha)),
		restore: vi.fn(() => {
			currentAlpha = alphaStack.pop() ?? currentAlpha;
			target.globalAlpha = currentAlpha;
		}),
	};
	return new Proxy(target, {
		get(object, key) {
			if (key in object) return object[key as keyof typeof object];
			const method = vi.fn((...args: unknown[]) => {
				for (const arg of args) if (typeof arg === 'number') expect(Number.isFinite(arg)).toBe(true);
			});
			Reflect.set(object, key, method);
			return method;
		},
		set(object, key, value) {
			if (key === 'globalAlpha') currentAlpha = value as number;
			Reflect.set(object, key, value);
			return true;
		},
	}) as unknown as CanvasRenderingContext2D;
}

function setup() {
	const document = new FakeDocument();
	document.ownerDocument = document;
	const container = document.makeElement();
	const value = document.makeElement();
	const canvas = document.makeElement() as unknown as HTMLCanvasElement;
	Object.assign(canvas, { width: 0, height: 0 });
	const context = createContext(canvas);
	Object.assign(canvas, { getContext: () => context });
	return {
		document,
		container: container as unknown as HTMLElement,
		canvas,
		value: value as unknown as HTMLElement,
		context,
	};
}

function config(overrides: Partial<LivelineEngineConfig> = {}): LivelineEngineConfig {
	return {
		data: [
			{ time: 990, value: 10 },
			{ time: 995, value: 12 },
		],
		value: 12,
		palette: resolveTheme('#3b82f6', 'dark'),
		windowSecs: 30,
		lerpSpeed: 0.08,
		showGrid: false,
		showBadge: true,
		showMomentum: true,
		showFill: true,
		formatValue: (value) => value.toFixed(2),
		formatTime: String,
		padding: { top: 12, right: 80, bottom: 28, left: 12 },
		showPulse: true,
		scrub: true,
		exaggerate: false,
		badgeTail: true,
		badgeVariant: 'default',
		tooltipY: 14,
		tooltipOutline: true,
		valueMomentumColor: false,
		mode: 'line',
		...overrides,
	};
}

const environment = (document: FakeDocument) => ({
	document: document as unknown as Document,
	now: () => 1_000_000,
	performanceNow: () => 100,
	matchMedia: () =>
		({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}) as unknown as MediaQueryList,
});

function frameClock(document: FakeDocument, reducedMotion = false) {
	let ms = 0;
	let callback: FrameRequestCallback | undefined;
	return {
		environment: {
			...environment(document),
			now: () => 1_000_000 + ms,
			performanceNow: () => ms,
			matchMedia: () => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
			requestAnimationFrame: (next: FrameRequestCallback) => {
				callback = next;
				return 1;
			},
			cancelAnimationFrame: () => {
				callback = undefined;
			},
		},
		step(dt = 16) {
			ms += dt;
			const next = callback;
			callback = undefined;
			next?.(ms);
		},
	};
}

describe('createLivelineEngine', () => {
	it.each(['line', 'candle', 'multi'] as const)('keeps reduced-motion %s ranges live after changing windows', (mode) => {
		const host = setup();
		const clock = frameClock(host.document, true);
		const onHover = vi.fn();
		const makeConfig = (value: number, windowSecs: number) =>
			config({
				value,
				windowSecs,
				onHover,
				data: [
					{ time: 980, value: value - 1 },
					{ time: 995, value },
				],
				mode: mode === 'candle' ? 'candle' : 'line',
				candleWidth: 20,
				candles: [{ time: 980, open: value - 1, high: value + 1, low: value - 2, close: value }],
				isMultiSeries: mode === 'multi',
				multiSeries: [
					{
						id: 'a',
						value,
						data: [
							{ time: 980, value: value - 1 },
							{ time: 995, value },
						],
						palette: config().palette,
					},
				],
			});
		const engine = createLivelineEngine(host, makeConfig(12, 30), clock.environment);
		clock.step();
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 270, clientY: 80 });
		engine.update(makeConfig(100, 60));
		for (let i = 0; i < 80; i++) clock.step();
		expect(onHover.mock.lastCall?.[0]?.y).toBeGreaterThan(12);
		expect(onHover.mock.lastCall?.[0]?.y).toBeLessThan(172);
		engine.update(makeConfig(200, 60));
		for (let i = 0; i < 80; i++) clock.step();
		expect(onHover.mock.lastCall?.[0]?.y).toBeGreaterThan(12);
		expect(onHover.mock.lastCall?.[0]?.y).toBeLessThan(172);
		engine.destroy();
	});

	it.each([false, true])('keeps paused time fixed across hidden-tab gaps (reduced motion: %s)', (reducedMotion) => {
		const host = setup();
		const clock = frameClock(host.document, reducedMotion);
		const onHover = vi.fn();
		const cfg = config({ paused: true, onHover });
		const engine = createLivelineEngine(host, cfg, clock.environment);
		for (let i = 0; i < 100; i++) clock.step();
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 250, clientY: 80 });
		clock.step();
		const before = onHover.mock.lastCall?.[0];
		expect(before).toEqual(expect.objectContaining({ time: expect.any(Number) }));
		host.document.hidden = true;
		clock.step(60_000);
		host.document.hidden = false;
		host.document.dispatch('visibilitychange', {});
		clock.step();
		expect(onHover.mock.lastCall?.[0]?.time).toBeCloseTo(before.time, 8);
		engine.destroy();
	});

	it.each([false, true])('renders finite geometry at lerpSpeed=1 (multi: %s)', (multi) => {
		const host = setup();
		const clock = frameClock(host.document);
		const cfg = config({ lerpSpeed: 1, isMultiSeries: multi, multiSeries: [{ id: 'a', data: config().data, value: 12, palette: config().palette }] });
		const engine = createLivelineEngine(host, cfg, clock.environment);
		clock.step();
		engine.update({ ...cfg, value: 12.1 });
		clock.step(8);
		clock.step(33);
		expect(host.value.textContent).not.toContain('NaN');
		engine.destroy();
	});

	it('preserves negative values and clears disabled momentum color', () => {
		const host = setup();
		const cfg = config({ value: -12, valueMomentumColor: true, momentumOverride: 'up' });
		const engine = createLivelineEngine(host, cfg, environment(host.document));
		expect(host.value.textContent).toBe('-12.00');
		expect(host.value.style.color).toBe('#22c55e');
		engine.update({ ...cfg, valueMomentumColor: false });
		expect(host.value.style.color).toBeUndefined();
		engine.destroy();
	});

	it('interpolates candle line-mode hover from tick data, including between candles', () => {
		const host = setup();
		const onHover = vi.fn();
		const cfg = config({
			mode: 'candle',
			lineMode: true,
			candleWidth: 2,
			onHover,
			candles: [
				{ time: 980, open: 10, high: 30, low: 9, close: 12 },
				{ time: 995, open: 10, high: 30, low: 9, close: 12 },
			],
			lineData: [
				{ time: 980, value: 20 },
				{ time: 995, value: 26 },
			],
			lineValue: 26,
		});
		const engine = createLivelineEngine(host, cfg, environment(host.document));
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 220, clientY: 80 });
		engine.update(cfg);
		const point = onHover.mock.lastCall?.[0];
		expect(point.value).toBeCloseTo(20 + (point.time - 980) * 0.4);
		expect(host.context.fillText).toHaveBeenCalledWith(point.value.toFixed(2), expect.any(Number), expect.any(Number));
		engine.destroy();
	});

	it.each(['padding', 'above', 'empty', 'outside', 'before-data', 'candle-gap', 'hidden-series'] as const)('clears hover once on %s', (reason) => {
		const host = setup();
		const onHover = vi.fn();
		let cfg = config({ onHover });
		if (reason === 'candle-gap') cfg = { ...cfg, mode: 'candle', candleWidth: 2, candles: [{ time: 990, open: 10, high: 13, low: 9, close: 12 }] };
		if (reason === 'hidden-series') cfg = { ...cfg, isMultiSeries: true, multiSeries: [{ id: 'a', data: cfg.data, value: 12, palette: cfg.palette }] };
		const engine = createLivelineEngine(host, cfg, environment(host.document));
		const container = host.container as unknown as FakeElement;
		container.dispatch('mousemove', { clientX: reason === 'candle-gap' ? 220 : 250, clientY: 80 });
		engine.update(cfg);
		expect(onHover.mock.lastCall?.[0]).not.toBeNull();
		onHover.mockClear();
		if (reason === 'padding') container.dispatch('mousemove', { clientX: 2, clientY: 80 });
		if (reason === 'above') container.dispatch('mousemove', { clientX: 250, clientY: 2 });
		if (reason === 'before-data') container.dispatch('mousemove', { clientX: 20, clientY: 80 });
		if (reason === 'candle-gap') container.dispatch('mousemove', { clientX: 270, clientY: 80 });
		if (reason === 'empty') cfg = { ...cfg, data: [] };
		if (reason === 'outside')
			cfg = {
				...cfg,
				data: [
					{ time: 100, value: 1 },
					{ time: 110, value: 2 },
				],
			};
		if (reason === 'hidden-series') cfg = { ...cfg, hiddenSeriesIds: new Set(['a']) };
		engine.update(cfg);
		engine.update(cfg);
		expect(onHover).toHaveBeenCalledExactlyOnceWith(null);
		engine.destroy();
	});

	it('reserves positive plot width for long multi-series labels', () => {
		const host = setup();
		const onHover = vi.fn();
		const cfg = config({
			onHover,
			isMultiSeries: true,
			multiSeries: [{ id: 'a', label: 'Long label '.repeat(100), data: config().data, value: 12, palette: config().palette }],
		});
		const engine = createLivelineEngine(host, cfg, environment(host.document));
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 140, clientY: 80 });
		engine.update(cfg);
		expect(onHover.mock.lastCall?.[0]?.x).toBeGreaterThan(12);
		expect(onHover.mock.lastCall?.[0]?.time).toBeGreaterThan(990);
		engine.destroy();
	});
	it('renders synchronously without ResizeObserver or requestAnimationFrame and destroys idempotently', () => {
		const host = setup();
		const onHover = vi.fn();
		const engine = createLivelineEngine(host, config({ onHover }), environment(host.document));

		expect(host.canvas.width).toBe(400);
		expect((host.container as unknown as FakeElement).children).toHaveLength(1);
		expect(host.value.textContent).toBe('12.00');

		expect(() => {
			engine.destroy();
			engine.destroy();
		}).not.toThrow();
		expect((host.container as unknown as FakeElement).children).toHaveLength(0);
		expect(onHover).toHaveBeenLastCalledWith(null);
	});

	it('uses fresh callbacks after update and reports candle hover', () => {
		const host = setup();
		const stale = vi.fn();
		const fresh = vi.fn();
		const candleConfig = config({
			mode: 'candle',
			data: [],
			value: 0,
			candleWidth: 10,
			candles: [
				{ time: 980, open: 10, high: 13, low: 9, close: 12 },
				{ time: 990, open: 12, high: 15, low: 11, close: 14 },
			],
			onHover: stale,
		});
		const engine = createLivelineEngine(host, candleConfig, environment(host.document));
		engine.update({ ...candleConfig, onHover: fresh });
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 250 });
		engine.update({ ...candleConfig, onHover: fresh });

		expect(fresh).toHaveBeenCalledWith(expect.objectContaining({ value: expect.any(Number) }));
		expect(stale).not.toHaveBeenCalled();
		engine.destroy();
	});

	it('updates value DOM in candle and multi-series modes', () => {
		const candleHost = setup();
		const candleEngine = createLivelineEngine(
			candleHost,
			config({
				mode: 'candle',
				data: [],
				value: 0,
				candleWidth: 10,
				lineMode: true,
				candles: [
					{ time: 980, open: 10, high: 13, low: 9, close: 12 },
					{ time: 990, open: 12, high: 15, low: 11, close: 14 },
				],
				liveCandle: { time: 990, open: 12, high: 15, low: 11, close: 14 },
			}),
			environment(candleHost.document),
		);
		expect(candleHost.value.textContent).toBe('14.00');
		candleEngine.destroy();

		const multiHost = setup();
		const multiEngine = createLivelineEngine(
			multiHost,
			config({
				isMultiSeries: true,
				multiSeries: [
					{
						id: 'primary',
						data: [
							{ time: 990, value: 20 },
							{ time: 995, value: 24 },
						],
						value: 24,
						palette: resolveTheme('#ef4444', 'dark'),
					},
				],
			}),
			environment(multiHost.document),
		);
		expect(multiHost.value.textContent).toBe('24.00');
		multiEngine.destroy();
	});

	it('dynamically detaches and reattaches the configured value element', () => {
		const host = setup();
		const attached = host.document.makeElement() as unknown as HTMLElement;
		const engine = createLivelineEngine(host, config(), environment(host.document));

		engine.update(config({ value: 13, valueElement: null }));
		expect(host.value.textContent).toBe('12.00');

		engine.update(config({ value: 14, valueElement: attached, formatValue: (value) => `attached:${value.toFixed(2)}` }));
		expect(attached.textContent).toMatch(/^attached:/);
		expect(host.value.textContent).toBe('12.00');
		engine.destroy();
	});

	it('shows the value from the first series visible in the current window', () => {
		const host = setup();
		const engine = createLivelineEngine(
			host,
			config({
				isMultiSeries: true,
				multiSeries: [
					{
						id: 'stale',
						data: [
							{ time: 100, value: 1 },
							{ time: 110, value: 2 },
						],
						value: 2,
						palette: resolveTheme('#ef4444', 'dark'),
					},
					{
						id: 'visible',
						data: [
							{ time: 990, value: 20 },
							{ time: 995, value: 24 },
						],
						value: 24,
						palette: resolveTheme('#22c55e', 'dark'),
					},
				],
			}),
			environment(host.document),
		);

		expect(host.value.textContent).toBe('24.00');
		engine.destroy();
	});

	it('clears active scrub state when scrub is disabled', () => {
		const host = setup();
		const onHover = vi.fn();
		const engine = createLivelineEngine(host, config({ onHover }), environment(host.document));
		(host.container as unknown as FakeElement).dispatch('mousemove', { clientX: 250 });
		engine.update(config({ onHover }));
		expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ value: expect.any(Number) }));

		onHover.mockClear();
		engine.update(config({ scrub: false, onHover }));
		expect(onHover).toHaveBeenCalledOnce();
		expect(onHover).toHaveBeenCalledWith(null);
		engine.destroy();
	});

	it('locks touch scrub to horizontal gestures and preserves vertical scrolling', () => {
		const host = setup();
		const engine = createLivelineEngine(host, config(), environment(host.document));
		const container = host.container as unknown as FakeElement;
		expect(container.style.touchAction).toBe('pan-y');

		const verticalPrevent = vi.fn();
		container.dispatch('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
		container.dispatch('touchmove', { touches: [{ clientX: 102, clientY: 120 }], preventDefault: verticalPrevent });
		expect(verticalPrevent).not.toHaveBeenCalled();

		const horizontalPrevent = vi.fn();
		container.dispatch('touchend', {});
		container.dispatch('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
		container.dispatch('touchmove', { touches: [{ clientX: 120, clientY: 102 }], preventDefault: horizontalPrevent });
		expect(horizontalPrevent).toHaveBeenCalledOnce();
		engine.destroy();
	});

	it('uses DPR from the owner document view or the explicit environment', () => {
		const ownerHost = setup();
		ownerHost.document.defaultView = { devicePixelRatio: 2 };
		const ownerEngine = createLivelineEngine(ownerHost, config(), environment(ownerHost.document));
		expect(ownerHost.canvas.width).toBe(800);
		ownerEngine.destroy();

		const environmentHost = setup();
		const environmentEngine = createLivelineEngine(environmentHost, config(), {
			...environment(environmentHost.document),
			devicePixelRatio: 3,
		});
		expect(environmentHost.canvas.width).toBe(1200);
		environmentEngine.destroy();
	});

	it.each([
		{
			name: 'one completed candle',
			candles: [{ time: 990, open: 10, high: 13, low: 9, close: 12 }],
			liveCandle: undefined,
		},
		{
			name: 'only a live candle',
			candles: [],
			liveCandle: { time: 990, open: 10, high: 13, low: 9, close: 12 },
		},
	])('renders candle mode with $name', ({ candles, liveCandle }) => {
		const host = setup();
		const engine = createLivelineEngine(host, config({ mode: 'candle', data: [], value: 0, candleWidth: 10, candles, liveCandle }), environment(host.document));
		expect(host.context.fillText).not.toHaveBeenCalledWith('No data to display', expect.any(Number), expect.any(Number));
		engine.destroy();
	});

	it.each([
		{
			mode: 'line' as const,
			data: [
				{ time: 100, value: 1 },
				{ time: 110, value: 2 },
			],
		},
		{ mode: 'candle' as const, data: [] },
	])('draws an explicit empty state when $mode data is outside the window', ({ mode, data }) => {
		const host = setup();
		const engine = createLivelineEngine(
			host,
			config({
				mode,
				data,
				value: 2,
				candleWidth: mode === 'candle' ? 10 : undefined,
				candles: mode === 'candle' ? [{ time: 100, open: 1, high: 2, low: 0, close: 2 }] : undefined,
			}),
			environment(host.document),
		);
		expect(host.context.fillText).toHaveBeenCalledWith('No data to display', expect.any(Number), expect.any(Number));
		engine.destroy();
	});

	it('sanitizes non-finite data and non-positive windows', () => {
		const host = setup();
		expect(() =>
			createLivelineEngine(
				host,
				config({
					windowSecs: 0,
					value: Number.NaN,
					data: [
						{ time: Number.NaN, value: 1 },
						{ time: 990, value: Number.POSITIVE_INFINITY },
					],
				}),
				environment(host.document),
			).destroy(),
		).not.toThrow();
	});
});

describe('drawCandleFrame', () => {
	it('keeps distinct grid ticks for sub-mill precision ranges', () => {
		const host = setup();
		const state = { interval: 0, labels: new Map<number, number>() };
		const format = vi.fn(String);
		drawGrid(
			host.context,
			{
				w: 400,
				h: 200,
				pad: { top: 0, right: 80, bottom: 0, left: 0 },
				chartW: 320,
				chartH: 200,
				leftEdge: 0,
				rightEdge: 30,
				minVal: 0.00001,
				maxVal: 0.00002,
				valRange: 0.00001,
				toX: (t) => t,
				toY: (v) => 200 - ((v - 0.00001) / 0.00001) * 200,
			},
			config().palette,
			format,
			state,
			16,
		);
		expect(state.labels.size).toBeGreaterThan(3);
		expect(new Set(format.mock.calls.map(([v]) => v)).size).toBeGreaterThan(1);
		for (const value of state.labels.keys()) {
			expect(value).toBeGreaterThanOrEqual(0.00001);
			expect(value).toBeLessThanOrEqual(0.00002);
		}
	});

	it.each(['flat', 'small'] as const)('rearms particle bursts after a %s period even during cooldown', (calm) => {
		const state = createParticleState();
		for (let i = 0; i < 3; i++) expect(spawnOnSwing(state, 'up', 10, 10, 0.1, '#fff', 400)).toBeGreaterThan(0);
		expect(spawnOnSwing(state, 'up', 10, 10, 0.1, '#fff', 0)).toBe(0);
		expect(spawnOnSwing(state, calm === 'flat' ? 'flat' : 'up', 10, 10, calm === 'flat' ? 0.1 : 0.01, '#fff', 16)).toBe(0);
		expect(state.burstCount).toBe(0);
		expect(spawnOnSwing(state, 'up', 10, 10, 0.1, '#fff', 400)).toBe(1);
	});

	const createDraw = (overrides: Partial<CandleDrawOptions>) => {
		const host = setup();
		const palette = resolveTheme('#3b82f6', 'dark');
		const options: CandleDrawOptions = {
			candles: [],
			displayCandleWidth: 10,
			oldCandles: [],
			oldWidth: 10,
			morphT: -1,
			liveTime: -1,
			liveBirthAlpha: 1,
			liveBullBlend: 1,
			lineModeProg: 1,
			chartReveal: 1,
			now_ms: 750,
			now: 1000,
			pauseProgress: 0,
			showGrid: false,
			showPulse: true,
			scrubAmount: 0,
			hoverX: null,
			hoverValue: null,
			hoverTime: null,
			hoveredCandle: null,
			formatValue: String,
			formatTime: String,
			gridState: { interval: 0, labels: new Map() },
			timeAxisState: { labels: new Map() },
			dt: 16,
			targetWindowSecs: 30,
			tooltipY: 14,
			tooltipOutline: true,
			lineVisible: [
				{ time: 990, value: 10 },
				{ time: 995, value: 12 },
			],
			lineSmoothValue: 12,
			loadingAlpha: 0,
			showEmptyOverlay: false,
			...overrides,
		};
		drawCandleFrame(
			host.context,
			{
				w: 400,
				h: 200,
				pad: { top: 12, right: 80, bottom: 28, left: 12 },
				chartW: 308,
				chartH: 160,
				leftEdge: 970,
				rightEdge: 1000,
				minVal: 9,
				maxVal: 13,
				valRange: 4,
				toX: (time) => 12 + ((time - 970) / 30) * 308,
				toY: (value) => 12 + (1 - (value - 9) / 4) * 160,
			},
			palette,
			options,
		);
		return host.context;
	};

	it('draws the line-mode pulse ring only when pulse is enabled', () => {
		expect(createDraw({ showPulse: false }).arc).toHaveBeenCalledTimes(2);
		expect(createDraw({ showPulse: true }).arc).toHaveBeenCalledTimes(3);
	});

	it.each([
		{ name: 'pulse is disabled', options: { showPulse: false }, expected: [0.12, 0.12] },
		{ name: 'reduced motion is enabled', options: { showPulse: true, reducedMotion: true }, expected: [0.12, 0.12] },
		{ name: 'pulse is enabled', options: { showPulse: true }, expected: [0.12, 0.2] },
	])('uses the expected live candle glow when $name', ({ options, expected }) => {
		const glowAlpha = (now_ms: number) => {
			const context = createDraw({
				...options,
				candles: [{ time: 990, open: 10, high: 13, low: 9, close: 12 }],
				liveCandle: { time: 990, open: 10, high: 13, low: 9, close: 12 },
				lineModeProg: 0,
				now_ms,
			});
			return (context as CanvasRenderingContext2D & { fillAlphas: number[] }).fillAlphas[1];
		};

		expect(glowAlpha(0)).toBeCloseTo(expected[0], 10);
		expect(glowAlpha(Math.PI / 0.008)).toBeCloseTo(expected[1], 10);
	});
});
