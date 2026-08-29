import { createApp, defineComponent, h, nextTick } from 'vue';
import { computeChartLayout, getChartBaselineY } from '@tile-ui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChartContainer } from '../src/components/chart/chart';

const apps: Array<ReturnType<typeof createApp>> = [];

const mixedConfig = {
	line: { label: 'Line', color: '#0f766e' },
	debit: { label: 'Debit', color: '#ea580c' },
	credit: { label: 'Credit', color: '#2563eb' },
};
const mixedData = [
	{ month: 'Jan', line: 4, debit: -3, credit: 5 },
	{ month: 'Feb', line: 8, debit: 6, credit: -2 },
	{ month: 'Mar', line: 3, debit: -1, credit: 4 },
];

class MockResizeObserver {
	observe() {}
	disconnect() {}
}

afterEach(() => {
	for (const app of apps.splice(0)) app.unmount();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
});

function mount(props: Record<string, unknown>) {
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
	const container = document.createElement('div');
	document.body.appendChild(container);
	const app = createApp(defineComponent({ setup: () => () => h(ChartContainer, props) }));
	apps.push(app);
	app.mount(container);
	return container;
}

describe('Vue Chart area baseline', () => {
	it.each([
		['positive', [2, 8]],
		['negative', [-8, -2]],
		['mixed', [-4, 6]],
	] as const)('closes %s area data on the shared clamped zero baseline', (_name, values) => {
		vi.stubGlobal('ResizeObserver', MockResizeObserver);
		const config = { value: { label: 'Value', color: '#0f766e' } };
		const data = values.map((value, index) => ({ category: String(index), value }));
		const dimension = { width: 320, height: 200 };
		const layout = computeChartLayout({ config, data, series: [{ key: 'value', type: 'area' }], xKey: 'category', type: 'area', ...dimension });
		const container = document.createElement('div');
		document.body.appendChild(container);
		const app = createApp(
			defineComponent({
				setup: () => () => h(ChartContainer, { config, data, xKey: 'category', type: 'area', initialDimension: dimension }),
			}),
		);
		apps.push(app);
		app.mount(container);

		const path = container.querySelector('[data-series="value"] [data-area]')?.getAttribute('d');
		const baseline = getChartBaselineY(layout);
		expect(path).toMatch(new RegExp(`L[^,]+,${baseline} L[^,]+,${baseline} Z$`));
	});

	it('routes accessible naming to the SVG while preserving container attributes', () => {
		const container = mount({
			title: 'Quarterly totals',
			'aria-label': 'Custom chart label',
			'aria-labelledby': 'chart-heading',
			'aria-describedby': 'chart-description',
			config: mixedConfig,
			data: mixedData,
			xKey: 'month',
			initialDimension: { width: 400, height: 240 },
		});
		const root = container.querySelector('[data-slot="chart"]')!;
		const svg = container.querySelector('svg')!;

		expect(root.getAttribute('title')).toBe('Quarterly totals');
		expect(root.getAttribute('aria-label')).toBe('Custom chart label');
		expect(svg.getAttribute('aria-label')).toBe('Custom chart label');
		expect(svg.getAttribute('aria-labelledby')).toBe('chart-heading');
		expect(svg.getAttribute('aria-describedby')).toBe('chart-description');
		expect(svg.querySelector('title')?.textContent).toBe('Quarterly totals');
	});

	it('announces keyboard categories, clears on Escape, and keeps pointer updates silent', async () => {
		const container = mount({
			title: 'Monthly activity',
			'aria-label': 'Monthly activity chart',
			config: mixedConfig,
			data: mixedData,
			xKey: 'month',
			initialDimension: { width: 400, height: 240 },
			tabIndex: 0,
		});
		const root = container.querySelector<HTMLElement>('[data-slot="chart"]')!;
		const svg = container.querySelector<SVGSVGElement>('svg')!;
		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 240, width: 400, height: 240, toJSON: () => ({}) });
		expect(root.tabIndex).toBe(0);
		expect(root.title).toBe('Monthly activity');
		expect(root.getAttribute('aria-label')).toBe('Monthly activity chart');
		expect(svg.getAttribute('aria-label')).toBe('Monthly activity chart');

		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		await nextTick();
		expect(root.dataset.activeIndex).toBe('0');
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('Jan, Line 4, Debit -3, Credit 5');
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		await nextTick();
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('Feb, Line 8, Debit 6, Credit -2');
		svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 350, clientY: 100, bubbles: true }));
		await nextTick();
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('');
		expect(root.dataset.activeIndex).toBe('2');
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		await nextTick();
		expect(root.dataset.activeIndex).toBeUndefined();
	});

	it('aligns rendered line points, labels, and grouped bar centers with category ticks', () => {
		const dimension = { width: 400, height: 240 };
		const series = [
			{ key: 'line', type: 'line' as const },
			{ key: 'debit', type: 'bar' as const },
			{ key: 'credit', type: 'bar' as const },
		];
		const layout = computeChartLayout({ config: mixedConfig, data: mixedData, series, xKey: 'month', type: 'line', ...dimension });
		const container = mount({ config: mixedConfig, data: mixedData, series, xKey: 'month', initialDimension: dimension });

		for (const [index, tick] of layout.xTickX.entries()) {
			const point = container.querySelector<SVGCircleElement>(`[data-series="line"] circle[data-index="${index}"]`)!;
			const label = Array.from(container.querySelectorAll<SVGTextElement>('svg text')).find((item) => item.textContent === mixedData[index].month)!;
			const debit = container.querySelector<SVGRectElement>(`[data-series="debit"] rect[data-index="${index}"]`)!;
			const credit = container.querySelector<SVGRectElement>(`[data-series="credit"] rect[data-index="${index}"]`)!;
			const groupCenter = (Number(debit.getAttribute('x')) + Number(credit.getAttribute('x')) + Number(credit.getAttribute('width'))) / 2;

			expect(Number(point.getAttribute('cx'))).toBe(tick);
			expect(Number(label.getAttribute('x'))).toBe(tick);
			expect(groupCenter).toBe(tick);
		}
	});
});
