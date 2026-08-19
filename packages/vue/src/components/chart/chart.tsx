import {
	computed,
	defineComponent,
	h,
	inject,
	onBeforeUnmount,
	onMounted,
	provide,
	ref,
	reactive,
	useId,
	type ComputedRef,
	type InjectionKey,
	type PropType,
	type VNode,
} from 'vue';
import {
	CHART_INITIAL_DIMENSION,
	buildChartThemeCss,
	chartStyleKeys,
	computeChartLayout,
	findChartNearestIndex,
	getChartAreaPathD,
	getChartBarRects,
	getChartLegendItems,
	getChartPathD,
	getChartTooltipEntries,
	getChartTooltipPosition,
} from '@tile-ui/core';
import type { ChartConfig, ChartDatum, ChartLayout, ChartLegendItem, ChartSeriesItem, ChartTooltipEntry, ChartType } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/chart.module.scss';

interface ChartContextValue {
	config: ChartConfig;
	layout: ChartLayout;
	data: ChartDatum[];
	activeIndex: number | null;
}

type ChartContext = ComputedRef<ChartContextValue>;

const ChartContextKey: InjectionKey<ChartContext> = Symbol('tile-chart');

/**
 * 读取图表上下文 (必须在 ChartContainer 内使用)
 */
function useChart(): ChartContext {
	const context = inject(ChartContextKey);
	if (!context) {
		throw new Error('图表子组件必须在 <ChartContainer /> 内使用');
	}
	return context;
}

export const ChartStyle = defineComponent({
	name: 'ChartStyle',
	props: {
		id: { type: String, required: true },
		config: { type: Object as PropType<ChartConfig>, required: true },
	},
	setup(props) {
		const css = computed(() => buildChartThemeCss(props.id, props.config));

		return () => {
			if (!css.value) {
				return null;
			}
			return h('style', { innerHTML: css.value });
		};
	},
});

export const ChartContainer = defineComponent({
	name: 'ChartContainer',
	props: {
		config: { type: Object as PropType<ChartConfig>, required: true },
		data: { type: Array as PropType<ChartDatum[]>, default: () => [] },
		xKey: { type: String, default: 'x' },
		series: { type: Array as PropType<ChartSeriesItem[]>, default: undefined },
		type: { type: String as PropType<ChartType>, default: 'line' },
		initialDimension: { type: Object as PropType<{ width: number; height: number }>, default: undefined },
		showLegend: { type: Boolean, default: true },
		showTooltip: { type: Boolean, default: true },
		showGrid: { type: Boolean, default: true },
		showAxis: { type: Boolean, default: true },
	},
	setup(props, { slots, attrs }) {
		const containerRef = ref<HTMLElement | null>(null);
		const size = reactive({ width: props.initialDimension?.width ?? CHART_INITIAL_DIMENSION.width, height: props.initialDimension?.height ?? CHART_INITIAL_DIMENSION.height });
		const activeIndex = ref<number | null>(null);
		const mousePosition = reactive({ x: 0, y: 0 });
		const chartId = `chart-${useId()}`;

		let observer: ResizeObserver | null = null;

		onMounted(() => {
			const element = containerRef.value;
			if (!element) {
				return;
			}
			observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width } = entry.contentRect;
					if (width > 0) {
						// 高度固定：容器高度由 SVG 内容撑开，若跟随容器高度会形成正反馈循环导致无限放大
						size.width = width;
					}
				}
			});
			observer.observe(element);
		});

		onBeforeUnmount(() => {
			observer?.disconnect();
			observer = null;
		});

		const layout = computed(() =>
			computeChartLayout({
				config: props.config,
				data: props.data,
				series: props.series ?? [],
				xKey: props.xKey,
				type: props.type,
				width: size.width,
				height: size.height,
			}),
		);

		const context = computed<ChartContextValue>(() => ({
			config: props.config,
			layout: layout.value,
			data: props.data,
			activeIndex: activeIndex.value,
		}));

		provide(ChartContextKey, context);

		const entries = computed(() => getChartTooltipEntries(layout.value, props.config, props.data, activeIndex.value));
		const legendItems = computed(() => getChartLegendItems(layout.value));
		const tooltipX = computed(() => (activeIndex.value !== null ? (layout.value.xTickX[activeIndex.value] ?? 0) : 0));
		const tooltipLabel = computed(() => (activeIndex.value !== null ? layout.value.xLabels[activeIndex.value] : null));

		function handleMouseMove(event: MouseEvent) {
			const svg = event.currentTarget as SVGSVGElement;
			const rect = svg.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * layout.value.width;
			const y = ((event.clientY - rect.top) / rect.height) * layout.value.height;
			mousePosition.x = x;
			mousePosition.y = y;
			activeIndex.value = findChartNearestIndex(layout.value, x);
		}

		function handleMouseLeave() {
			activeIndex.value = null;
		}

		return () => {
			const l = layout.value;
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const children: any[] = [h(ChartStyle, { id: chartId, config: props.config })];

			const svgChildren: any[] = [];

			if (props.showGrid) {
				for (const y of l.yTickY) {
					svgChildren.push(h('line', { key: `y-${y}`, class: styles[chartStyleKeys.gridLine], x1: l.padding.left, x2: l.width - l.padding.right, y1: y, y2: y }));
				}
				for (const x of l.xTickX) {
					svgChildren.push(h('line', { key: `x-${x}`, class: styles[chartStyleKeys.gridLine], x1: x, x2: x, y1: l.padding.top, y2: l.height - l.padding.bottom }));
				}
			}

			if (props.showAxis) {
				l.xLabels.forEach((label, index) => {
					svgChildren.push(
						h(
							'text',
							{
								key: `label-${index}`,
								x: l.xTickX[index],
								y: l.height - l.padding.bottom / 2,
								'text-anchor': 'middle',
								'dominant-baseline': 'middle',
								'font-size': '10',
							},
							String(label),
						),
					);
				});
			}

			l.series.forEach((item, seriesIndex) => {
				if (item.type === 'bar') {
					const barSeriesCount = l.series.filter((s) => s.type === 'bar').length;
					const rects = getChartBarRects(l, seriesIndex, barSeriesCount);
					const bars = rects.map((rect) => h('rect', { key: rect.index, x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: item.color, rx: '2' }));
					svgChildren.push(h('g', { key: item.key }, bars));
					return;
				}

				const path = item.type === 'area' ? getChartAreaPathD(item.points, l.padding.top + l.innerHeight) : getChartPathD(item.points);
				const group: any[] = [];
				if (item.type === 'area') {
					group.push(h('path', { d: path, fill: item.color, 'fill-opacity': '0.2' }));
				}
				group.push(
					h('path', { d: getChartPathD(item.points), fill: 'none', stroke: item.color, 'stroke-width': '2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
				);
				for (const point of item.points) {
					group.push(h('circle', { key: point.index, cx: point.x, cy: point.y, r: '2.5', fill: item.color }));
				}
				svgChildren.push(h('g', { key: item.key }, group));
			});

			if (props.showTooltip && activeIndex.value !== null) {
				svgChildren.push(
					h('line', {
						x1: tooltipX.value,
						x2: tooltipX.value,
						y1: l.padding.top,
						y2: l.height - l.padding.bottom,
						stroke: 'currentColor',
						'stroke-dasharray': '3 3',
						opacity: '0.4',
					}),
				);
			}

			children.push(
				h(
					'svg',
					{
						class: styles[chartStyleKeys.surface],
						width: l.width,
						height: l.height,
						viewBox: `0 0 ${l.width} ${l.height}`,
						role: 'img',
						onMousemove: handleMouseMove,
						onMouseleave: handleMouseLeave,
					},
					svgChildren,
				),
			);

			if (props.showTooltip && activeIndex.value !== null) {
				children.push(
					h(ChartTooltipContent, {
						active: true,
						payload: entries.value,
						label: tooltipLabel.value,
						class: styles[chartStyleKeys.tooltip],
						style: {
							position: 'absolute',
							...Object.fromEntries(Object.entries(getChartTooltipPosition(layout.value, mousePosition.x, mousePosition.y)).map(([k, v]) => [k, `${v}px`])),
						},
					}),
				);
			}

			if (props.showLegend) {
				children.push(h(ChartLegendContent, { payload: legendItems.value }));
			}

			if (slots.default) {
				children.push(slots.default(context.value));
			}

			return h('div', { ...restAttrs, ref: containerRef, 'data-slot': 'chart', 'data-chart': chartId, class: [styles[chartStyleKeys.root], userClass] }, children);
		};
	},
});

export const ChartTooltipContent = defineComponent({
	name: 'ChartTooltipContent',
	props: {
		active: { type: Boolean, default: false },
		payload: { type: Array as PropType<ChartTooltipEntry[]>, default: () => [] },
		indicator: { type: String as PropType<'line' | 'dot' | 'dashed'>, default: 'dot' },
		hideLabel: { type: Boolean, default: false },
		hideIndicator: { type: Boolean, default: false },
		label: { type: [String, Number, Object] as PropType<string | number | null>, default: null },
		color: { type: String, default: undefined },
		formatter: { type: Function as PropType<(value: number, name: string, item: ChartTooltipEntry, index: number) => VNode | string | number | null>, default: undefined },
		labelFormatter: { type: Function as PropType<(value: unknown, payload: ChartTooltipEntry[]) => VNode | string | number | null>, default: undefined },
	},
	setup(props, { attrs }) {
		const context = useChart();

		return () => {
			const items = props.payload ?? [];
			const config = context.value.config;

			if (!props.active || items.length === 0) {
				return null;
			}

			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const formattedLabel = props.labelFormatter ? props.labelFormatter(props.label, items) : String(props.label ?? '');
			const labelNode = !props.hideLabel && props.label != null ? h('div', { class: styles[chartStyleKeys.tooltipLabel] }, [formattedLabel]) : null;

			const itemNodes = items.map((item, index) => {
				const itemConfig = config[item.dataKey];
				const indicatorColor = props.color ?? item.color;

				const indicatorNode = props.hideIndicator
					? null
					: h('span', {
							class: styles[chartStyleKeys.tooltipIndicator],
							'data-indicator': props.indicator,
							style: { backgroundColor: indicatorColor, borderColor: indicatorColor },
						});

				const valueNode =
					props.formatter && item.value !== undefined
						? [props.formatter(item.value as number, item.name, item, index)]
						: [h('div', { class: styles[chartStyleKeys.tooltipItemValue] }, typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value))];

				return h('div', { key: index, class: styles[chartStyleKeys.tooltipItem], 'data-indicator': props.indicator }, [
					indicatorNode,
					h('div', { class: styles[chartStyleKeys.tooltipItemName] }, itemConfig?.label ?? item.name),
					valueNode,
				]);
			});

			return h('div', { ...restAttrs, class: [userClass] }, [labelNode, h('div', { class: styles[chartStyleKeys.tooltipGrid] }, itemNodes)]);
		};
	},
});

export const ChartLegendContent = defineComponent({
	name: 'ChartLegendContent',
	props: {
		payload: { type: Array as PropType<ChartLegendItem[]>, default: () => [] },
		hideIcon: { type: Boolean, default: false },
		verticalAlign: { type: String as PropType<'top' | 'bottom'>, default: 'bottom' },
	},
	setup(props, { attrs }) {
		return () => {
			const items = props.payload ?? [];
			if (items.length === 0) {
				return null;
			}

			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const itemNodes = items.map((item, index) =>
				h('div', { key: index, class: styles[chartStyleKeys.legendItem] }, [
					props.hideIcon ? null : h('span', { class: styles[chartStyleKeys.legendSwatch], style: { backgroundColor: item.color } }),
					item.name,
				]),
			);

			return h('div', { ...restAttrs, 'data-align': props.verticalAlign, class: [styles[chartStyleKeys.legend], userClass] }, itemNodes);
		};
	},
});

export const ChartTooltip = defineComponent({
	name: 'ChartTooltip',
	setup(_props, { slots, attrs }) {
		const context = useChart();

		return () => {
			const { layout, config, data, activeIndex } = context.value;
			const entries = getChartTooltipEntries(layout, config, data, activeIndex);
			const label = activeIndex !== null ? layout.xLabels[activeIndex] : null;

			if (slots.default) {
				return slots.default({ active: activeIndex !== null, payload: entries, label });
			}

			return h(ChartTooltipContent, { ...attrs, active: activeIndex !== null, payload: entries, label });
		};
	},
});

export const ChartLegend = defineComponent({
	name: 'ChartLegend',
	setup(_props, { attrs }) {
		const context = useChart();

		return () => h(ChartLegendContent, { ...attrs, payload: getChartLegendItems(context.value.layout) });
	},
});

export default ChartContainer;
