import { createContext, createMemo, createSignal, createUniqueId, For, onCleanup, onMount, Show, splitProps, useContext, type JSX } from 'solid-js';
import {
	CHART_INITIAL_DIMENSION,
	buildChartThemeCss,
	chartStyleKeys,
	computeChartLayout,
	findChartNearestIndex,
	getChartAreaPathD,
	getChartBaselineY,
	getChartBarRects,
	getChartLegendItems,
	getChartPathD,
	getChartTooltipEntries,
	getChartTooltipPosition,
} from '@tile-ui/core';
import type { ChartConfig, ChartContainerBaseProps, ChartDatum, ChartLayout, ChartLegendItem, ChartTooltipEntry } from '@tile-ui/core';
import { invokeEventHandler, type CallbackRef } from '../../utils';
import styles from '@tile-ui/styles/scss/components/chart.module.scss';

export interface ChartContextValue {
	readonly config: ChartConfig;
	readonly layout: ChartLayout;
	readonly data: ChartDatum[];
	readonly activeIndex: number | null;
}

const ChartContext = createContext<ChartContextValue>();

function useChart(): ChartContextValue {
	const context = useContext(ChartContext);
	if (!context) throw new Error('Chart subcomponents must be used within <ChartContainer>.');
	return context;
}

export interface ChartStyleProps extends Omit<JSX.StyleHTMLAttributes<HTMLStyleElement>, 'children' | 'id'> {
	id: string;
	config: ChartConfig;
	ref?: CallbackRef<HTMLStyleElement>;
}

/** 为当前图表输出隔离的亮色及暗色主题变量。 */
export function ChartStyle(props: ChartStyleProps) {
	const [local, rest] = splitProps(props, ['id', 'config', 'ref']);
	const css = createMemo(() => buildChartThemeCss(local.id, local.config));
	return <Show when={css()}>{(value) => <style {...rest} ref={local.ref} innerHTML={value()} />}</Show>;
}

export interface ChartContainerProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'title'>, ChartContainerBaseProps {
	/** SVG 可访问标题，同时生成 aria-label 与 title 元素。 */
	title?: string;
	children?: (state: ChartContextValue) => JSX.Element;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Chart：共享 core 布局数学，并提供响应式 render-function 上下文。 */
export function ChartContainer(props: ChartContainerProps) {
	const [local, rest] = splitProps(props, [
		'config',
		'data',
		'xKey',
		'series',
		'type',
		'initialDimension',
		'showLegend',
		'showTooltip',
		'showGrid',
		'showAxis',
		'title',
		'aria-label',
		'aria-labelledby',
		'aria-describedby',
		'class',
		'children',
		'ref',
		'onKeyDown',
	]);
	const chartId = `chart-${createUniqueId()}`;
	const initialDimension = local.initialDimension ?? CHART_INITIAL_DIMENSION;
	const [width, setWidth] = createSignal(initialDimension.width);
	const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
	const [keyboardActive, setKeyboardActive] = createSignal(false);
	const [pointerPosition, setPointerPosition] = createSignal({ x: 0, y: 0 });
	let root: HTMLDivElement | undefined;

	const data = () => local.data ?? [];
	const layout = createMemo(() =>
		computeChartLayout({
			config: local.config,
			data: data(),
			series: local.series ?? [],
			xKey: local.xKey ?? 'x',
			type: local.type ?? 'line',
			width: width(),
			height: local.initialDimension?.height ?? CHART_INITIAL_DIMENSION.height,
			cssVariableScope: chartId,
		}),
	);
	const context: ChartContextValue = {
		get config() {
			return local.config;
		},
		get layout() {
			return layout();
		},
		get data() {
			return data();
		},
		get activeIndex() {
			return activeIndex();
		},
	};
	const tooltipEntries = createMemo(() => getChartTooltipEntries(layout(), local.config, data(), activeIndex()));
	const legendItems = createMemo(() => getChartLegendItems(layout()));
	const svgLabel = () => local['aria-label'] ?? (local['aria-labelledby'] ? undefined : (local.title ?? 'Chart'));
	const areaBaseline = () => getChartBaselineY(layout());
	const statusText = () => {
		const index = activeIndex();
		if (!keyboardActive() || index === null) return '';
		const label = layout().xLabels[index];
		return [label, ...tooltipEntries().map((entry) => `${entry.name} ${entry.value.toLocaleString()}`)].join(', ');
	};
	const tooltipStyle = () => {
		const position = getChartTooltipPosition(layout(), pointerPosition().x, pointerPosition().y);
		return { position: 'absolute', left: `${position.left}px`, top: `${position.top}px` } as const;
	};

	onMount(() => {
		if (!root || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
			}
		});
		observer.observe(root);
		onCleanup(() => observer.disconnect());
	});

	function updatePointer(event: PointerEvent & { currentTarget: SVGSVGElement }) {
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const currentLayout = layout();
		const x = ((event.clientX - rect.left) / rect.width) * currentLayout.width;
		const y = ((event.clientY - rect.top) / rect.height) * currentLayout.height;
		setKeyboardActive(false);
		setPointerPosition({ x, y });
		setActiveIndex(findChartNearestIndex(currentLayout, x));
	}

	function handleKeyDown(event: KeyboardEvent) {
		invokeEventHandler(local.onKeyDown, event);
		if (event.defaultPrevented || !root || root.tabIndex < 0 || event.target !== event.currentTarget) return;
		if (event.key === 'Escape') {
			setKeyboardActive(false);
			setActiveIndex(null);
			return;
		}
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const count = layout().xLabels.length;
		if (count === 0) return;
		event.preventDefault();
		setKeyboardActive(true);
		setActiveIndex((current) => {
			if (current === null) return event.key === 'ArrowLeft' ? count - 1 : 0;
			return Math.min(count - 1, Math.max(0, current + (event.key === 'ArrowLeft' ? -1 : 1)));
		});
	}

	return (
		<ChartContext.Provider value={context}>
			<div
				{...rest}
				ref={(element) => {
					root = element;
					local.ref?.(element);
				}}
				data-slot="chart"
				data-chart={chartId}
				data-active-index={activeIndex() ?? undefined}
				class={`${styles[chartStyleKeys.root]} ${local.class ?? ''}`}
				title={local.title}
				aria-label={local['aria-label']}
				aria-labelledby={local['aria-labelledby']}
				aria-describedby={local['aria-describedby']}
				onKeyDown={handleKeyDown}>
				<ChartStyle id={chartId} config={local.config} />
				<svg
					class={styles[chartStyleKeys.surface]}
					width={layout().width}
					height={layout().height}
					viewBox={`0 0 ${layout().width} ${layout().height}`}
					role="img"
					aria-label={svgLabel()}
					aria-labelledby={local['aria-labelledby']}
					aria-describedby={local['aria-describedby']}
					onPointerMove={updatePointer}
					onPointerLeave={() => setActiveIndex(null)}
					onPointerCancel={() => setActiveIndex(null)}>
					<Show when={local.title}>{(title) => <title>{title()}</title>}</Show>
					<Show when={local.showGrid ?? true}>
						<For each={layout().yTickY}>
							{(y) => <line class={styles[chartStyleKeys.gridLine]} x1={layout().padding.left} x2={layout().width - layout().padding.right} y1={y} y2={y} />}
						</For>
						<For each={layout().xTickX}>
							{(x) => <line class={styles[chartStyleKeys.gridLine]} x1={x} x2={x} y1={layout().padding.top} y2={layout().height - layout().padding.bottom} />}
						</For>
					</Show>
					<Show when={local.showAxis ?? true}>
						<For each={layout().xLabels}>
							{(label, index) => (
								<text x={layout().xTickX[index()]} y={layout().height - layout().padding.bottom / 2} text-anchor="middle" dominant-baseline="middle" font-size="10">
									{String(label)}
								</text>
							)}
						</For>
					</Show>
					<For each={layout().series}>
						{(item, seriesIndex) => {
							const linePath = () => getChartPathD(item.points);
							const barCount = () => layout().series.filter((series) => series.type === 'bar').length;
							return (
								<g data-series={item.key} data-type={item.type}>
									<Show when={item.type === 'bar'}>
										<For each={getChartBarRects(layout(), seriesIndex(), barCount())}>
											{(rect) => <rect data-index={rect.index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={item.color} rx="2" />}
										</For>
									</Show>
									<Show when={item.type !== 'bar'}>
										<Show when={item.type === 'area'}>
											<path data-area d={getChartAreaPathD(item.points, areaBaseline())} fill={item.color} fill-opacity="0.2" />
										</Show>
										<path data-line d={linePath()} fill="none" stroke={item.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
										<For each={item.points}>{(point) => <circle data-index={point.index} cx={point.x} cy={point.y} r="2.5" fill={item.color} />}</For>
									</Show>
								</g>
							);
						}}
					</For>
					<Show when={(local.showTooltip ?? true) && activeIndex() !== null}>
						<line
							data-slot="chart-tooltip-cursor"
							x1={layout().xTickX[activeIndex()!] ?? 0}
							x2={layout().xTickX[activeIndex()!] ?? 0}
							y1={layout().padding.top}
							y2={layout().height - layout().padding.bottom}
							stroke="currentColor"
							stroke-dasharray="3 3"
							opacity="0.4"
						/>
					</Show>
				</svg>
				<Show when={(local.showTooltip ?? true) && activeIndex() !== null}>
					<ChartTooltipContent active payload={tooltipEntries()} label={layout().xLabels[activeIndex()!]} class={styles[chartStyleKeys.tooltip]} style={tooltipStyle()} />
				</Show>
				<Show when={local.showLegend ?? true}>
					<ChartLegendContent payload={legendItems()} />
				</Show>
				<div
					data-slot="chart-status"
					role="status"
					aria-live="polite"
					aria-atomic="true"
					style={{
						position: 'absolute',
						width: '1px',
						height: '1px',
						padding: '0',
						margin: '-1px',
						overflow: 'hidden',
						'clip-path': 'inset(50%)',
						'white-space': 'nowrap',
						border: '0',
					}}>
					{statusText()}
				</div>
				{local.children?.(context)}
			</div>
		</ChartContext.Provider>
	);
}

export interface ChartTooltipContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'color'> {
	active?: boolean;
	payload?: ChartTooltipEntry[];
	label?: JSX.Element;
	indicator?: 'line' | 'dot' | 'dashed';
	hideLabel?: boolean;
	hideIndicator?: boolean;
	labelFormatter?: (value: JSX.Element, payload: ChartTooltipEntry[]) => JSX.Element;
	formatter?: (value: number, name: string, item: ChartTooltipEntry, index: number) => JSX.Element;
	color?: string;
	nameKey?: string;
	labelKey?: string;
	labelClass?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

export function ChartTooltipContent(props: ChartTooltipContentProps) {
	const context = useChart();
	const [local, rest] = splitProps(props, [
		'active',
		'payload',
		'label',
		'indicator',
		'hideLabel',
		'hideIndicator',
		'labelFormatter',
		'formatter',
		'color',
		'nameKey',
		'labelKey',
		'labelClass',
		'class',
		'ref',
	]);
	const items = () => local.payload ?? [];
	const indicator = () => local.indicator ?? 'dot';
	const label = () => (local.labelKey && items()[0] ? (items()[0].payload[local.labelKey] ?? local.label) : local.label);
	return (
		<Show when={local.active && items().length > 0}>
			<div {...rest} ref={local.ref} data-slot="chart-tooltip-content" class={local.class ?? ''}>
				<Show when={!local.hideLabel && label() != null}>
					<div class={`${styles[chartStyleKeys.tooltipLabel]} ${local.labelClass ?? ''}`}>{local.labelFormatter ? local.labelFormatter(label(), items()) : label()}</div>
				</Show>
				<div class={styles[chartStyleKeys.tooltipGrid]}>
					<For each={items()}>
						{(item, index) => {
							const itemConfig = () => context.config[item.dataKey];
							const name = () => String(local.nameKey ? (item.payload[local.nameKey] ?? item.name) : (itemConfig()?.label ?? item.name));
							return (
								<div class={styles[chartStyleKeys.tooltipItem]} data-indicator={indicator()}>
									<Show when={!local.hideIndicator}>
										<span
											class={styles[chartStyleKeys.tooltipIndicator]}
											data-indicator={indicator()}
											style={{ 'background-color': local.color ?? item.color, 'border-color': local.color ?? item.color }}
										/>
									</Show>
									<div class={styles[chartStyleKeys.tooltipItemName]}>{name()}</div>
									{local.formatter ? (
										local.formatter(item.value, name(), item, index())
									) : (
										<div class={styles[chartStyleKeys.tooltipItemValue]}>{item.value.toLocaleString()}</div>
									)}
								</div>
							);
						}}
					</For>
				</div>
			</div>
		</Show>
	);
}

export interface ChartLegendContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
	payload?: ChartLegendItem[];
	hideIcon?: boolean;
	verticalAlign?: 'top' | 'bottom';
	formatter?: (value: string, item: ChartLegendItem, index: number) => JSX.Element;
	ref?: CallbackRef<HTMLDivElement>;
}

export function ChartLegendContent(props: ChartLegendContentProps) {
	const [local, rest] = splitProps(props, ['payload', 'hideIcon', 'verticalAlign', 'formatter', 'class', 'ref']);
	const items = () => local.payload ?? [];
	return (
		<Show when={items().length > 0}>
			<div
				{...rest}
				ref={local.ref}
				data-slot="chart-legend-content"
				data-align={local.verticalAlign ?? 'bottom'}
				class={`${styles[chartStyleKeys.legend]} ${local.class ?? ''}`}>
				<For each={items()}>
					{(item, index) => (
						<div class={styles[chartStyleKeys.legendItem]}>
							<Show when={!local.hideIcon}>
								<span class={styles[chartStyleKeys.legendSwatch]} style={{ 'background-color': item.color }} />
							</Show>
							{local.formatter ? local.formatter(item.name, item, index()) : item.name}
						</div>
					)}
				</For>
			</div>
		</Show>
	);
}

export interface ChartTooltipProps extends Omit<ChartTooltipContentProps, 'active' | 'payload' | 'label' | 'children'> {
	children?: (state: { active: boolean; payload: ChartTooltipEntry[]; label: JSX.Element }) => JSX.Element;
}

export function ChartTooltip(props: ChartTooltipProps) {
	const context = useChart();
	const [local, rest] = splitProps(props, ['children']);
	const entries = () => getChartTooltipEntries(context.layout, context.config, context.data, context.activeIndex);
	const label = () => (context.activeIndex === null ? null : context.layout.xLabels[context.activeIndex]);
	return local.children ? (
		local.children({
			get active() {
				return context.activeIndex !== null;
			},
			get payload() {
				return entries();
			},
			get label() {
				return label();
			},
		})
	) : (
		<ChartTooltipContent {...rest} active={context.activeIndex !== null} payload={entries()} label={label()} />
	);
}

export interface ChartLegendProps extends Omit<ChartLegendContentProps, 'payload'> {}

export function ChartLegend(props: ChartLegendProps) {
	const context = useChart();
	return <ChartLegendContent {...props} payload={getChartLegendItems(context.layout)} />;
}

export default ChartContainer;
