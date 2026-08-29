import { describe, expect, it } from 'vitest';

import {
	CHART_DEFAULT_COLORS,
	CHART_DEFAULT_PADDING,
	CHART_INITIAL_DIMENSION,
	buildChartThemeCss,
	computeChartLayout,
	findChartNearestIndex,
	getChartAreaPathD,
	getChartBaselineY,
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
		expect(layout.xTickX).toEqual([layout.padding.left + layout.innerWidth / 4, layout.padding.left + (layout.innerWidth * 3) / 4]);
		expect(layout.series.every((item) => item.points.every((point, index) => point.x === layout.xTickX[index]))).toBe(true);
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

	it('getChartBaselineY 将零线限制在绘图区内', () => {
		const createLayout = (values: number[]) =>
			computeChartLayout({
				config: { value: { label: 'Value' } },
				data: values.map((value, index) => ({ category: String(index), value })),
				series: [{ key: 'value', type: 'area' }],
				xKey: 'category',
				type: 'area',
				width: 320,
				height: 200,
			});
		const positive = createLayout([2, 8]);
		const negative = createLayout([-8, -2]);
		const mixed = createLayout([-4, 6]);

		expect(getChartBaselineY(positive)).toBe(positive.padding.top + positive.innerHeight);
		expect(getChartBaselineY(negative)).toBe(negative.padding.top);
		expect(getChartBaselineY(mixed)).toBe(mapChartValue(0, mixed.yMin, mixed.yMax, mixed.innerHeight, mixed.padding.top));
	});

	it('findChartNearestIndex 使用分类中心和相邻中心中点选择分类', () => {
		const nearestData = [
			{ month: 'Jan', desktop: 10 },
			{ month: 'Feb', desktop: 20 },
			{ month: 'Mar', desktop: 30 },
		];
		const layout = computeChartLayout({ config, data: nearestData, series: [{ key: 'desktop' }], xKey: 'month', type: 'line', width: 320, height: 200 });
		const firstBoundary = (layout.xTickX[0] + layout.xTickX[1]) / 2;

		expect(findChartNearestIndex(layout, layout.padding.left)).toBe(0);
		expect(findChartNearestIndex(layout, firstBoundary - 0.001)).toBe(0);
		expect(findChartNearestIndex(layout, firstBoundary + 0.001)).toBe(1);
		expect(findChartNearestIndex(layout, layout.width - layout.padding.right)).toBe(2);
	});

	it('getChartBarRects', () => {
		const layout = computeChartLayout({ config, data, series: [{ key: 'desktop' }], xKey: 'month', type: 'bar', width: 320, height: 200 });
		expect(getChartBarRects(layout, 0, 1)).toHaveLength(2);
	});

	it('getChartBarRects 使用零线并按柱系列序号分组', () => {
		const mixedData = [
			{ month: 'Jan', line: 8, debit: -4, credit: 6 },
			{ month: 'Feb', line: 4, debit: 3, credit: -2 },
		];
		const mixedConfig = { line: { label: 'Line' }, debit: { label: 'Debit' }, credit: { label: 'Credit' } };
		const layout = computeChartLayout({
			config: mixedConfig,
			data: mixedData,
			series: [
				{ key: 'line', type: 'line' },
				{ key: 'debit', type: 'bar' },
				{ key: 'credit', type: 'bar' },
			],
			xKey: 'month',
			type: 'line',
			width: 320,
			height: 200,
		});
		const debit = getChartBarRects(layout, 1, 2);
		const credit = getChartBarRects(layout, 2, 2);
		const zeroY = mapChartValue(0, layout.yMin, layout.yMax, layout.innerHeight, layout.padding.top);

		expect(debit[0].x).toBeLessThan(credit[0].x);
		expect(debit[0].y).toBe(zeroY);
		expect(debit[0].height).toBeGreaterThan(0);
		expect(credit[0].y).toBeLessThan(zeroY);
		expect(credit[0].y + credit[0].height).toBe(zeroY);
	});

	it('getChartBarRects 将首尾柱组限制在绘图区并支持单分类', () => {
		const boundsConfig = { line: { label: 'Line' }, debit: { label: 'Debit' }, credit: { label: 'Credit' } };
		const boundsLayout = computeChartLayout({
			config: boundsConfig,
			data: [
				{ month: 'Jan', line: 2, debit: 3, credit: 4 },
				{ month: 'Feb', line: 4, debit: 5, credit: 6 },
				{ month: 'Mar', line: 6, debit: 7, credit: 8 },
			],
			series: [
				{ key: 'line', type: 'line' },
				{ key: 'debit', type: 'bar' },
				{ key: 'credit', type: 'bar' },
			],
			xKey: 'month',
			type: 'line',
			width: 320,
			height: 200,
		});
		const allRects = [...getChartBarRects(boundsLayout, 1, 2), ...getChartBarRects(boundsLayout, 2, 2)];
		const debitRects = getChartBarRects(boundsLayout, 1, 2);
		const creditRects = getChartBarRects(boundsLayout, 2, 2);
		const plotRight = boundsLayout.width - boundsLayout.padding.right;

		expect(Math.min(...allRects.map((rect) => rect.x))).toBeGreaterThanOrEqual(boundsLayout.padding.left);
		expect(Math.max(...allRects.map((rect) => rect.x + rect.width))).toBeLessThanOrEqual(plotRight);
		expect(boundsLayout.series[0].points.map((point) => point.x)).toEqual(boundsLayout.xTickX);
		for (const [index, tick] of boundsLayout.xTickX.entries()) {
			expect((debitRects[index].x + creditRects[index].x + creditRects[index].width) / 2).toBe(tick);
			expect(boundsLayout.series[0].points[index].x).toBe(tick);
		}

		const singleLayout = computeChartLayout({
			config: { debit: { label: 'Debit' }, credit: { label: 'Credit' } },
			data: [{ month: 'Only', debit: 3, credit: -2 }],
			series: [
				{ key: 'debit', type: 'bar' },
				{ key: 'credit', type: 'bar' },
			],
			xKey: 'month',
			type: 'bar',
			width: 320,
			height: 200,
		});
		const singleRects = [...getChartBarRects(singleLayout, 0, 2), ...getChartBarRects(singleLayout, 1, 2)];

		expect(singleLayout.xTickX).toEqual([singleLayout.padding.left + singleLayout.innerWidth / 2]);
		expect(Math.min(...singleRects.map((rect) => rect.x))).toBeGreaterThanOrEqual(singleLayout.padding.left);
		expect(Math.max(...singleRects.map((rect) => rect.x + rect.width))).toBeLessThanOrEqual(singleLayout.width - singleLayout.padding.right);
		expect((singleRects[0].x + singleRects[1].x + singleRects[1].width) / 2).toBe(singleLayout.xTickX[0]);
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
		expect(getChartSeriesColor(config, series[0], 0)).toBe('var(--color-desktop, #3b82f6)');
		expect(getChartSeriesColor({}, { key: 'x' }, 1)).toBe('var(--color-x, var(--chart-2, #22c55e))');
		expect(getChartSeriesColor(themeConfig, { key: 'a' }, 0, 'dark', 'chart-1')).toBe('var(--chart-chart-1-color-a, #222)');
		expect(getChartSeriesColor(config, { key: 'desktop', color: 'tomato' }, 0)).toBe('tomato');
		expect(getChartSeriesColor({}, { key: 'x' }, 5)).toBe('var(--color-x, var(--chart-1, #3b82f6))');
		expect(getChartSeriesName(config, series[0])).toBe('Desktop');
	});

	it('getChartCssVarName / buildChartThemeCss', () => {
		expect(getChartCssVarName('desktop')).toBe('--color-desktop');
		expect(getChartCssVarName('desktop', 'chart-1')).toBe('--chart-chart-1-color-desktop');
		expect(getChartCssVarName('sales / 收入')).toBe('--color-sales_u20__u2f__u20__u6536__u5165_');
		const css = buildChartThemeCss('chart-1', { a: { theme: { light: '#111', dark: '#222' } } });
		expect(css).toContain('--chart-chart-1-color-a: #111');
		expect(css).toContain('--chart-chart-1-color-a: #222');
		expect(css).toContain('.light, [data-theme="light"]');
		expect(css).toContain('.dark, [data-theme="dark"]');
		expect(buildChartThemeCss('x"] { color: red; }', { a: { color: '#111' } })).not.toContain('x"] { color: red; }');
		expect(buildChartThemeCss('x', { a: { color: 'red; } body { color: red' } })).not.toContain('body');
		expect(buildChartThemeCss('x', { a: { label: 'n' } })).toBe('');
	});

	it('buildChartThemeCss 依靠最近的 light/dark 边界继承主题变量', () => {
		const css = buildChartThemeCss('nested', { a: { theme: { light: '#111', dark: '#222' } } });

		// 浏览器对自定义属性使用普通继承，因此 .light .dark 取内层 dark，.dark .light 取内层 light。
		expect(css).toContain('.light, [data-theme="light"] {\n  --chart-nested-color-a: #111;\n}');
		expect(css).toContain('.dark, [data-theme="dark"] {\n  --chart-nested-color-a: #222;\n}');
		expect(css).not.toMatch(/\.(?:light|dark)\s+\[data-chart/);
	});

	it('图表作用域变量不会从外层图表泄漏', () => {
		const outer = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200, cssVariableScope: 'outer' });
		const inner = computeChartLayout({ config, data, series, xKey: 'month', type: 'line', width: 320, height: 200, cssVariableScope: 'inner' });

		expect(outer.series[0].color).toBe('var(--chart-outer-color-desktop, #3b82f6)');
		expect(inner.series[0].color).toBe('var(--chart-inner-color-desktop, #3b82f6)');
	});

	it('buildChartThemeCss 不允许配置值或 id 结束 style 元素', () => {
		const payloads = ['</style><script>alert(1)</script>', '</StYlE ><img src=x onerror=alert(1)>', 'url("data:image/svg+xml,<svg></style></svg>")'];

		for (const payload of payloads) {
			const css = buildChartThemeCss(payload, { attack: { color: payload, theme: { light: payload, dark: payload } } });
			expect(css.toLowerCase()).not.toContain('</style');
			expect(css).not.toContain('<script');
			expect(css).not.toContain('<img');
			expect(css).toContain('\\3c ');
		}
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
