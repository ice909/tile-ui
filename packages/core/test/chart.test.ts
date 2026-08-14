import { describe, expect, it } from 'vitest';

import {
	CHART_DEFAULT_COLORS,
	CHART_DEFAULT_PADDING,
	CHART_INITIAL_DIMENSION,
	buildChartThemeCss,
	computeChartLayout,
	findChartNearestIndex,
	getChartAreaPathD,
	getChartBarRects,
	getChartConfigColor,
	getChartCssVarName,
	getChartDefaultSeries,
	getChartExtents,
	getChartLegendItems,
	getChartPathD,
	getChartSeriesColor,
	getChartSeriesName,
	getChartStepSize,
	getChartTooltipEntries,
	getChartTooltipPosition,
	getChartYAxisLayout,
	getNiceChartTicks,
	mapChartValue,
} from '../src';

describe('图表布局', () => {
	const config = { desktop: { label: 'Desktop', color: '#3b82f6' }, mobile: { label: 'Mobile', color: '#22c55e' } };
	const data = [
		{ month: 'Jan', desktop: 10, mobile: 20 },
		{ month: 'Feb', desktop: 30, mobile: 10 },
	];
	const series = [{ key: 'desktop' }, { key: 'mobile' }];

	it('getChartExtents', () => {
		expect(getChartExtents(data, ['desktop', 'mobile'])).toEqual({ min: 10, max: 30 });
		expect(getChartExtents([], ['desktop'])).toEqual({ min: 0, max: 1 });
	});

	it('getChartStepSize / getNiceChartTicks', () => {
		expect(getChartStepSize(100, 5)).toBe(50);
		const ticks = getNiceChartTicks(0, 100, 5);
		expect(ticks[0]).toBe(0);
		expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
	});

	it('getChartYAxisLayout / mapChartValue', () => {
		const { yTickY, yMin, yMax } = getChartYAxisLayout([0, 50, 100], 0, 100, 100, 0);
		expect(yTickY).toHaveLength(3);
		expect(yMin).toBe(0);
		expect(yMax).toBe(100);
		expect(mapChartValue(50, 0, 100, 100, 0)).toBe(50);
	});

	it('computeChartLayout', () => {
		const layout = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200 });
		expect(layout.series).toHaveLength(2);
		expect(layout.series[0].points).toHaveLength(2);
		expect(layout.xLabels).toEqual(['Jan', 'Feb']);
		expect(layout.innerWidth).toBe(320 - CHART_DEFAULT_PADDING.left - CHART_DEFAULT_PADDING.right);
	});

	it('getChartDefaultSeries 按 config 生成', () => {
		expect(getChartDefaultSeries(config)).toHaveLength(2);
		expect(getChartDefaultSeries(config)[0].key).toBe('desktop');
	});

	it('getChartPathD / getChartAreaPathD', () => {
		const points = [
			{ index: 0, x: 0, y: 10, value: 10 },
			{ index: 1, x: 100, y: 20, value: 20 },
		];
		expect(getChartPathD(points)).toBe('M0,10 L100,20');
		expect(getChartAreaPathD(points, 50)).toBe('M0,10 L100,20 L100,50 L0,50 Z');
	});

	it('findChartNearestIndex', () => {
		const layout = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200 });
		expect(findChartNearestIndex(layout, layout.xTickX[1])).toBe(1);
	});

	it('getChartBarRects', () => {
		const layout = computeChartLayout({ config, data, series: [{ key: 'desktop' }], xKey: 'month', type: 'bar', width: 320, height: 200 });
		expect(getChartBarRects(layout, 0, 1)).toHaveLength(2);
	});

	it('getChartTooltipEntries', () => {
		const layout = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200 });
		expect(getChartTooltipEntries(layout, config, data, 0)).toHaveLength(2);
		expect(getChartTooltipEntries(layout, config, data, null)).toHaveLength(0);
	});

	it('getChartLegendItems', () => {
		const layout = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200 });
		const items = getChartLegendItems(layout);
		expect(items).toHaveLength(2);
		expect(items[0].name).toBe('Desktop');
	});

	it('getChartConfigColor / getChartSeriesColor / getChartSeriesName', () => {
		const themeConfig = { a: { theme: { light: '#111', dark: '#222' } } };
		expect(getChartConfigColor(themeConfig.a, 'light')).toBe('#111');
		expect(getChartConfigColor(themeConfig.a, 'dark')).toBe('#222');
		expect(getChartConfigColor({ label: 'x' })).toBeUndefined();
		expect(getChartSeriesColor(config, series[0], 0)).toBe('#3b82f6');
		expect(getChartSeriesColor({}, { key: 'x' }, 1)).toBe(CHART_DEFAULT_COLORS[1]);
		expect(getChartSeriesName(config, series[0])).toBe('Desktop');
	});

	it('getChartCssVarName / buildChartThemeCss', () => {
		expect(getChartCssVarName('desktop')).toBe('--color-desktop');
		const css = buildChartThemeCss('chart-1', { a: { theme: { light: '#111', dark: '#222' } } });
		expect(css).toContain('--color-a: #111');
		expect(css).toContain('--color-a: #222');
		expect(buildChartThemeCss('x', { a: { label: 'n' } })).toBe('');
	});

	it('getChartTooltipPosition 限制在容器内', () => {
		const layout = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 200, height: 100 });
		const pos = getChartTooltipPosition(layout, 199, 99);
		expect(pos.left).toBeGreaterThanOrEqual(0);
		expect(pos.top).toBeGreaterThanOrEqual(0);
	});

	it('常量', () => {
		expect(CHART_INITIAL_DIMENSION).toEqual({ width: 320, height: 200 });
		expect(CHART_DEFAULT_COLORS).toHaveLength(6);
		expect(CHART_DEFAULT_PADDING).toEqual({ top: 16, right: 16, bottom: 32, left: 40 });
	});
});
