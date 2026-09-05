import { createApp, defineComponent, h, nextTick, reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({ update: vi.fn(), destroy: vi.fn() }));
const createLivelineEngine = vi.hoisted(() => vi.fn((_elements: { canvas: HTMLCanvasElement; container: HTMLElement }, _config: Record<string, unknown>) => engine));

vi.mock('@tile-ui/core/liveline', async (importOriginal) => ({
	...(await importOriginal<typeof import('@tile-ui/core/liveline')>()),
	createLivelineEngine,
}));

import type { LivelineEngineConfig } from '@tile-ui/core/liveline';
import { Liveline, type LivelineProps } from '../src/components/liveline/liveline';

const apps: Array<ReturnType<typeof createApp>> = [];
const data = [
	{ time: 1, value: 10 },
	{ time: 2, value: 12 },
];

beforeEach(() => {
	engine.update.mockClear();
	engine.destroy.mockClear();
	createLivelineEngine.mockClear();
});

afterEach(() => {
	for (const app of apps.splice(0)) app.unmount();
	document.body.innerHTML = '';
});

function mount(props: LivelineProps & Record<string, unknown>) {
	const state = reactive(props);
	const container = document.createElement('div');
	document.body.appendChild(container);
	const app = createApp(defineComponent({ setup: () => () => h(Liveline, state as LivelineProps) }));
	apps.push(app);
	app.mount(container);
	return { container, state, app };
}

describe('Vue Liveline', () => {
	it('retains fading series controls without exposing or focusing them', async () => {
		const onSeriesToggle = vi.fn();
		const series = ['a', 'b'].map((id) => ({ id, color: '#3b82f6', data, value: 12 }));
		const { container, state } = mount({ data, value: 12, series, onSeriesToggle });
		state.series = [];
		await nextTick();
		const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-slot="liveline-series-control"]'));
		expect(buttons).toHaveLength(2);
		expect(container.querySelector('[data-slot="liveline-series-controls"]')?.getAttribute('aria-hidden')).toBe('true');
		for (const button of buttons) {
			expect(button.disabled).toBe(true);
			button.focus();
			expect(document.activeElement).not.toBe(button);
			button.click();
		}
		expect(onSeriesToggle).not.toHaveBeenCalled();
		state.series = series;
		await nextTick();
		expect(buttons.every((button) => !button.disabled)).toBe(true);
	});

	it('renders the React-compatible DOM contract and forwards root attributes', () => {
		const { container } = mount({
			data,
			value: 12,
			class: 'consumer-class',
			style: { minHeight: '120px' },
			surfaceStyle: { height: '90px' },
			surfaceClassName: 'chart-only',
			id: 'market-chart',
			'aria-label': 'ETH live price',
			'aria-describedby': 'chart-help',
			showValue: true,
			scrub: false,
		});
		const root = container.querySelector<HTMLElement>('[data-slot="liveline"]')!;
		const canvas = container.querySelector<HTMLCanvasElement>('[data-slot="liveline-canvas"]')!;

		expect(root.id).toBe('market-chart');
		expect(root.classList).toContain('consumer-class');
		expect(root.style.minHeight).toBe('120px');
		const surface = container.querySelector<HTMLElement>('[data-slot="liveline-surface"]')!;
		expect(surface.style.height).toBe('90px');
		expect(surface.classList).toContain('chart-only');
		expect(root.classList).not.toContain('chart-only');
		expect(root.dataset.theme).toBe('dark');
		expect(container.querySelector('[data-slot="liveline-value"]')?.getAttribute('aria-hidden')).toBe('true');
		expect(canvas.getAttribute('role')).toBe('img');
		expect(canvas.getAttribute('aria-label')).toBe('ETH live price');
		expect(canvas.getAttribute('aria-describedby')).toBe('chart-help');
		expect(canvas.style.cursor).toBe('default');
	});

	it('tracks in-place nested data and reconciles dynamic adapter state', async () => {
		const onModeChange = vi.fn();
		const series = reactive([
			{ id: 'eth', label: 'Ethereum', color: '#00f', data: [...data], value: 12 },
			{ id: 'btc', label: 'Bitcoin', color: '#f00', data: [...data], value: 20 },
		]);
		const props = reactive({
			data: [...data],
			value: 12,
			mode: 'line' as 'line' | 'candle',
			lineMode: false,
			showValue: false,
			window: 15,
			windows: [{ label: '1m', secs: 60 }],
			candles: [{ time: 1, open: 1, high: 2, low: 0, close: 1 }],
			lineData: [...data],
			series,
			onModeChange,
		});
		const { container, state } = mount(props);
		expect(container.querySelector('[aria-label="Show line chart"]')?.getAttribute('aria-pressed')).toBe('true');
		state.data.push({ time: 3, value: 14 });
		state.candles![0].close = 2;
		state.lineData!.splice(0, 1);
		state.series![0].data.push({ time: 3, value: 14 });
		await nextTick();
		expect(engine.update).toHaveBeenLastCalledWith(
			expect.objectContaining({ data: expect.arrayContaining([{ time: 3, value: 14 }]), candles: [expect.objectContaining({ close: 2 })], lineData: [data[1]] }),
		);

		container.querySelector<HTMLButtonElement>('[aria-label="Hide Ethereum series"]')!.click();
		state.series!.splice(0, 2, { id: 'sol', label: 'Solana', color: '#0f0', data: [...data], value: 9 }, { id: 'xrp', label: 'XRP', color: '#0ff', data: [...data], value: 7 });
		state.windows = [];
		state.mode = 'candle';
		state.lineMode = true;
		state.showValue = true;
		await nextTick();
		expect(container.querySelector('[aria-label="Show line chart"]')?.getAttribute('aria-pressed')).toBe('true');
		expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ windowSecs: 15, hiddenSeriesIds: new Set(), valueElement: expect.any(HTMLElement) }));
		state.showValue = false;
		state.lineMode = false;
		state.windows = [{ label: '5m', secs: 300 }];
		await nextTick();
		expect(container.querySelector('[aria-label="Show candle chart"]')?.getAttribute('aria-pressed')).toBe('true');
		expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ windowSecs: 300, valueElement: undefined }));
		expect(container.querySelectorAll('[role="group"]')).toHaveLength(3);
	});

	it('creates the shared engine after mount, updates current config, and destroys it on unmount', async () => {
		const { state, app } = mount({ data, value: 12 });
		expect(createLivelineEngine).toHaveBeenCalledTimes(1);
		const [elements, initialConfig] = createLivelineEngine.mock.calls[0]!;
		expect(elements.canvas.dataset.slot).toBe('liveline-canvas');
		expect(elements.container.dataset.slot).toBe('liveline-surface');
		expect(initialConfig).toMatchObject({ windowSecs: 30, showGrid: true, showBadge: true, showFill: true, scrub: true, mode: 'line' });
		expect((initialConfig as unknown as LivelineEngineConfig).formatValue(12)).toBe('12.00');

		state.value = 15;
		state.loading = true;
		await nextTick();
		expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ value: 15, loading: true }));

		apps.splice(apps.indexOf(app), 1);
		app.unmount();
		expect(engine.destroy).toHaveBeenCalledTimes(1);
	});

	it('keeps window, mode, and series controls accessible and prevents hiding the final series', async () => {
		const onWindowChange = vi.fn();
		const onModeChange = vi.fn();
		const onSeriesToggle = vi.fn();
		const { container } = mount({
			data,
			value: 12,
			windows: [
				{ label: '30s', secs: 30 },
				{ label: '1m', secs: 60 },
			],
			onWindowChange,
			onModeChange,
			onSeriesToggle,
			series: [
				{ id: 'eth', label: 'Ethereum', color: '#627eea', data, value: 12 },
				{ id: 'btc', label: 'Bitcoin', color: '#f7931a', data, value: 20 },
			],
		});
		const windowButtons = container.querySelectorAll<HTMLButtonElement>('[data-slot="liveline-window-control"]');
		const modeButtons = container.querySelectorAll<HTMLButtonElement>('[data-slot="liveline-mode-control"]');
		const seriesButtons = container.querySelectorAll<HTMLButtonElement>('[data-slot="liveline-series-control"]');

		expect(container.querySelector('[data-slot="liveline-window-controls"]')?.getAttribute('aria-label')).toBe('Chart time range');
		expect(container.querySelector('[data-slot="liveline-window-controls"]')?.getAttribute('role')).toBe('group');
		expect(windowButtons[0].getAttribute('aria-pressed')).toBe('true');
		windowButtons[1].click();
		await nextTick();
		expect(onWindowChange).toHaveBeenCalledWith(60);
		expect(windowButtons[1].getAttribute('aria-pressed')).toBe('true');
		expect(modeButtons[0].getAttribute('aria-label')).toBe('Show line chart');
		modeButtons[0].click();
		expect(onModeChange).toHaveBeenCalledWith('line');

		expect(seriesButtons[0].getAttribute('aria-label')).toBe('Hide Ethereum series');
		seriesButtons[0].click();
		await nextTick();
		expect(onSeriesToggle).toHaveBeenCalledWith('eth', false);
		expect(seriesButtons[0].getAttribute('aria-label')).toBe('Show Ethereum series');
		seriesButtons[1].click();
		expect(onSeriesToggle).toHaveBeenCalledTimes(1);
	});
});
