import { execFileSync } from 'node:child_process';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JSX } from 'solid-js';
import { getChartBaselineY } from '@tile-ui/core';
import { ChartContainer, ChartLegend, ChartTooltip } from '../src/components/chart/chart';
import type { ChartLegendItem, ChartTooltipEntry } from '@tile-ui/solid';

const publicTypeImports: [ChartLegendItem, ChartTooltipEntry] | undefined = undefined;
void publicTypeImports;

const config = {
	line: { label: 'Line', color: '#0f766e' },
	barA: { label: 'Debit', color: '#ea580c' },
	barB: { label: 'Credit', color: '#2563eb' },
	area: { label: 'Area', theme: { light: '#65a30d', dark: '#bef264' } },
};
const data = [
	{ month: 'Jan', line: 4, barA: -3, barB: 5, area: 2 },
	{ month: 'Feb', line: 8, barA: 6, barB: -2, area: 7 },
	{ month: 'Mar', line: 3, barA: -1, barB: 4, area: 5 },
];
const disposers: Array<() => void> = [];
let observers: MockResizeObserver[] = [];

class MockResizeObserver {
	disconnected = false;
	constructor(private readonly callback: ResizeObserverCallback) {
		observers.push(this);
	}
	observe() {}
	disconnect() {
		this.disconnected = true;
	}
	resize(width: number, height: number) {
		this.callback([{ contentRect: { width, height } } as ResizeObserverEntry], this as unknown as ResizeObserver);
	}
}

function mount(node: () => JSX.Element) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	disposers.push(render(node, container));
	return container;
}

function pointer(element: Element, type: string, clientX: number, clientY: number) {
	const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
	Object.defineProperties(event, { clientX: { value: clientX }, clientY: { value: clientY }, pointerType: { value: 'mouse' } });
	element.dispatchEvent(event);
}

beforeEach(() => {
	observers = [];
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose();
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Solid Chart Batch 5 lane', () => {
	it('renders line, bar, and area series together with negative bars around the zero baseline', () => {
		const container = mount(() => (
			<ChartContainer
				config={config}
				data={data}
				xKey="month"
				series={[
					{ key: 'line', type: 'line' },
					{ key: 'barA', type: 'bar' },
					{ key: 'barB', type: 'bar' },
					{ key: 'area', type: 'area' },
				]}
				initialDimension={{ width: 400, height: 240 }}>
				{(state) => <span data-area-baseline={getChartBaselineY(state.layout)} data-x-ticks={state.layout.xTickX.join(',')} />}
			</ChartContainer>
		));
		expect(container.querySelector('[data-series="line"] [data-line]')).not.toBeNull();
		expect(container.querySelector('[data-series="area"] [data-area]')).not.toBeNull();
		expect(container.querySelectorAll('[data-series="barA"] rect')).toHaveLength(3);
		expect(container.querySelectorAll('[data-series="barB"] rect')).toHaveLength(3);
		const debit = container.querySelector<SVGRectElement>('[data-series="barA"] rect[data-index="0"]')!;
		const credit = container.querySelector<SVGRectElement>('[data-series="barB"] rect[data-index="0"]')!;
		const area = container.querySelector<SVGPathElement>('[data-series="area"] [data-area]')!;
		const baseline = container.querySelector('[data-area-baseline]')?.getAttribute('data-area-baseline');
		expect(Number(debit.getAttribute('x'))).toBeLessThan(Number(credit.getAttribute('x')));
		expect(Number(debit.getAttribute('height'))).toBeGreaterThan(0);
		expect(Number(credit.getAttribute('height'))).toBeGreaterThan(0);
		expect(area.getAttribute('d')).toMatch(new RegExp(`L[^,]+,${baseline} L[^,]+,${baseline} Z$`));
		const ticks = container.querySelector('[data-x-ticks]')!.getAttribute('data-x-ticks')!.split(',').map(Number);
		for (const [index, tick] of ticks.entries()) {
			const linePoint = container.querySelector<SVGCircleElement>(`[data-series="line"] circle[data-index="${index}"]`)!;
			const label = Array.from(container.querySelectorAll<SVGTextElement>('svg text')).find((item) => item.textContent === data[index].month)!;
			const debitRect = container.querySelector<SVGRectElement>(`[data-series="barA"] rect[data-index="${index}"]`)!;
			const creditRect = container.querySelector<SVGRectElement>(`[data-series="barB"] rect[data-index="${index}"]`)!;
			const barGroupCenter = (Number(debitRect.getAttribute('x')) + Number(creditRect.getAttribute('x')) + Number(creditRect.getAttribute('width'))) / 2;

			expect(Number(linePoint.getAttribute('cx'))).toBe(tick);
			expect(Number(label.getAttribute('x'))).toBe(tick);
			expect(barGroupCenter).toBe(tick);
		}
	});

	it('uses initial dimensions, forwards SVG naming, resizes width only, and disconnects', () => {
		let dispose!: () => void;
		const container = document.createElement('div');
		document.body.appendChild(container);
		dispose = render(
			() => (
				<ChartContainer
					title="Quarterly totals"
					aria-label="Custom chart label"
					aria-describedby="chart-description"
					config={config}
					data={data}
					xKey="month"
					initialDimension={{ width: 500, height: 260 }}
				/>
			),
			container,
		);
		const svg = container.querySelector('svg')!;
		expect(svg.getAttribute('width')).toBe('500');
		expect(svg.getAttribute('height')).toBe('260');
		expect(svg.getAttribute('aria-label')).toBe('Custom chart label');
		expect(container.querySelector('[data-slot="chart"]')?.getAttribute('aria-label')).toBe('Custom chart label');
		expect(svg.getAttribute('aria-describedby')).toBe('chart-description');
		expect(container.querySelector('[data-slot="chart"]')?.getAttribute('aria-describedby')).toBe('chart-description');
		expect(svg.querySelector('title')?.textContent).toBe('Quarterly totals');
		observers[0].resize(720, 999);
		expect(svg.getAttribute('width')).toBe('720');
		expect(svg.getAttribute('height')).toBe('260');
		dispose();
		expect(observers[0].disconnected).toBe(true);
	});

	it('uses the React and Vue SVG accessible-name fallback policy', () => {
		const fallback = mount(() => <ChartContainer config={config} data={data} xKey="month" />);
		const fallbackRoot = fallback.querySelector('[data-slot="chart"]')!;
		const fallbackSvg = fallback.querySelector('svg')!;
		expect(fallbackRoot.getAttribute('aria-label')).toBeNull();
		expect(fallbackSvg.getAttribute('aria-label')).toBe('Chart');

		const externallyLabelled = mount(() => (
			<>
				<h2 id="external-chart-label">External chart label</h2>
				<ChartContainer aria-labelledby="external-chart-label" config={config} data={data} xKey="month" />
			</>
		));
		const labelledRoot = externallyLabelled.querySelector('[data-slot="chart"]')!;
		const labelledSvg = externallyLabelled.querySelector('svg')!;
		expect(labelledRoot.getAttribute('aria-label')).toBeNull();
		expect(labelledRoot.getAttribute('aria-labelledby')).toBe('external-chart-label');
		expect(labelledSvg.getAttribute('aria-label')).toBeNull();
		expect(labelledSvg.getAttribute('aria-labelledby')).toBe('external-chart-label');
	});

	it('activates and clears pointer tooltip entries and supports custom tooltip and legend formatters', () => {
		const container = mount(() => (
			<ChartContainer config={config} data={data} xKey="month" initialDimension={{ width: 400, height: 240 }} showLegend={false} showTooltip={false} tabIndex={0}>
				{(state) => (
					<>
						<ChartTooltip>
							{(tooltip) => (
								<output data-active={tooltip.active} data-count={tooltip.payload.length}>
									{tooltip.label}
								</output>
							)}
						</ChartTooltip>
						<ChartTooltip
							labelKey="month"
							labelFormatter={(label) => <em>{label}:formatted</em>}
							formatter={(value, name) => (
								<strong>
									{name}:{value * 10}
								</strong>
							)}
						/>
						<ChartLegend formatter={(name) => <span>{name.toUpperCase()}</span>} />
						<span data-context-index>{state.activeIndex ?? 'none'}</span>
					</>
				)}
			</ChartContainer>
		));
		const svg = container.querySelector('svg')!;
		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 240, width: 400, height: 240, toJSON: () => ({}) });
		pointer(svg, 'pointermove', 200, 100);
		expect(container.querySelector('output')?.dataset.active).toBe('true');
		expect(container.querySelector('output')?.dataset.count).toBe('4');
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('');
		expect(container.querySelector('[data-context-index]')?.textContent).toBe('1');
		expect(container.textContent).toContain('LINE');
		expect(container.textContent).toContain('Feb:formatted');
		expect(container.textContent).toContain('Line:80');
		pointer(svg, 'pointerleave', 200, 100);
		expect(container.querySelector('output')?.dataset.active).toBe('false');
		expect(container.querySelector('[data-context-index]')?.textContent).toBe('none');
	});

	it('moves the active category with Left and Right when the chart root is focusable', () => {
		const container = mount(() => <ChartContainer config={config} data={data} xKey="month" initialDimension={{ width: 400, height: 240 }} tabIndex={0} />);
		const root = container.querySelector<HTMLElement>('[data-slot="chart"]')!;
		root.focus();
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(root.dataset.activeIndex).toBe('0');
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('Jan, Line 4, Debit -3, Credit 5, Area 2');
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(root.dataset.activeIndex).toBe('1');
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('Feb, Line 8, Debit 6, Credit -2, Area 7');
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
		expect(root.dataset.activeIndex).toBe('0');
	});

	it('calls the user key handler first and Escape clears keyboard tooltip state unless prevented', () => {
		const calls: string[] = [];
		const container = mount(() => (
			<ChartContainer
				config={config}
				data={data}
				xKey="month"
				initialDimension={{ width: 400, height: 240 }}
				tabIndex={0}
				onKeyDown={(event) => {
					calls.push(`${event.key}:${event.currentTarget.dataset.activeIndex ?? 'none'}`);
					if (event.key === 'Escape' && calls.length === 2) event.preventDefault();
				}}
			/>
		));
		const root = container.querySelector<HTMLElement>('[data-slot="chart"]')!;
		root.focus();
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(calls).toEqual(['ArrowRight:none']);
		expect(root.dataset.activeIndex).toBe('0');
		expect(container.querySelector('[data-slot="chart-tooltip-content"]')).not.toBeNull();
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).not.toBe('');

		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		expect(calls).toEqual(['ArrowRight:none', 'Escape:0']);
		expect(root.dataset.activeIndex).toBe('0');

		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		expect(calls).toEqual(['ArrowRight:none', 'Escape:0', 'Escape:0']);
		expect(root.dataset.activeIndex).toBeUndefined();
		expect(container.querySelector('[data-slot="chart-tooltip-content"]')).toBeNull();
		expect(container.querySelector('[data-slot="chart-tooltip-cursor"]')).toBeNull();
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('');
	});

	it('does not enable keyboard category navigation on a non-focusable chart root', () => {
		const container = mount(() => <ChartContainer config={config} data={data} xKey="month" initialDimension={{ width: 400, height: 240 }} />);
		const root = container.querySelector<HTMLElement>('[data-slot="chart"]')!;
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
		expect(root.dataset.activeIndex).toBeUndefined();
		expect(container.querySelector('[data-slot="chart-status"]')?.textContent).toBe('');
	});

	it('has deterministic escaped SSR output and hydrates without replacing chart nodes', () => {
		expect(() => execFileSync(process.execPath, ['test/fixtures/batch5-chart-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
	}, 20_000);
});
