import React, { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
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

const ChartContext = createContext<ChartContextValue | null>(null);

/**
 * 读取 ChartContainer 提供的图表上下文
 */
function useChart(): ChartContextValue {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error('useChart 必须在 <ChartContainer /> 内使用');
	}
	return context;
}

/**
 * 生成主题相关的 CSS 变量 (--color-<key>)
 */
export interface ChartStyleProps {
	id: string;
	config: ChartConfig;
}

const ChartStyle = React.forwardRef<HTMLStyleElement, ChartStyleProps>(({ id, config }, ref) => {
	const css = useMemo(() => buildChartThemeCss(id, config), [id, config]);

	if (!css) {
		return null;
	}

	return <style ref={ref} dangerouslySetInnerHTML={{ __html: css }} />;
});
ChartStyle.displayName = 'ChartStyle';

export interface ChartContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	config: ChartConfig;
	data?: ChartDatum[];
	xKey?: string;
	series?: ChartSeriesItem[];
	type?: ChartType;
	initialDimension?: { width: number; height: number };
	showLegend?: boolean;
	showTooltip?: boolean;
	showGrid?: boolean;
	showAxis?: boolean;
	children?: (state: ChartContextValue) => React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
	(
		{
			className = '',
			config,
			data = [],
			xKey = 'x',
			series,
			type = 'line',
			initialDimension,
			showLegend = true,
			showTooltip = true,
			showGrid = true,
			showAxis = true,
			children,
			...props
		},
		ref,
	) => {
		const uniqueId = useId();
		const chartId = `chart-${uniqueId.replace(/:/g, '')}`;
		const containerRef = useRef<HTMLDivElement | null>(null);
		const [size, setSize] = useState(initialDimension ?? CHART_INITIAL_DIMENSION);
		const [activeIndex, setActiveIndex] = useState<number | null>(null);
		const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

		useEffect(() => {
			const element = containerRef.current;
			if (!element) {
				return;
			}

			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width } = entry.contentRect;
					if (width > 0) {
						// 高度固定：容器高度由 SVG 内容撑开，若跟随容器高度会形成正反馈循环导致无限放大
						setSize((prev) => ({ ...prev, width }));
					}
				}
			});
			observer.observe(element);

			return () => observer.disconnect();
		}, []);

		const layout = useMemo(
			() => computeChartLayout({ config, data, series: series ?? [], xKey, type, width: size.width, height: size.height, cssVariableScope: chartId }),
			[config, data, series, xKey, type, size, chartId],
		);

		const contextValue = useMemo<ChartContextValue>(() => ({ config, layout, data, activeIndex }), [config, layout, data, activeIndex]);

		function setRef(element: HTMLDivElement | null) {
			containerRef.current = element;
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}

		function handleMouseMove(event: React.MouseEvent<SVGSVGElement>) {
			const svg = event.currentTarget;
			const rect = svg.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * layout.width;
			const y = ((event.clientY - rect.top) / rect.height) * layout.height;
			setMousePosition({ x, y });
			setActiveIndex(findChartNearestIndex(layout, x));
		}

		function handleMouseLeave() {
			setActiveIndex(null);
		}

		const entries = useMemo(() => getChartTooltipEntries(layout, config, data, activeIndex), [layout, config, data, activeIndex]);
		const legendItems = useMemo(() => getChartLegendItems(layout), [layout]);
		const tooltipX = activeIndex !== null ? (layout.xTickX[activeIndex] ?? 0) : 0;
		const tooltipLabel = activeIndex !== null ? layout.xLabels[activeIndex] : null;

		return (
			<ChartContext.Provider value={contextValue}>
				<div ref={setRef} data-slot="chart" data-chart={chartId} className={`${styles[chartStyleKeys.root]} ${className}`} {...props}>
					<ChartStyle id={chartId} config={config} />
					<svg
						className={styles[chartStyleKeys.surface]}
						width={layout.width}
						height={layout.height}
						viewBox={`0 0 ${layout.width} ${layout.height}`}
						role="img"
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}>
						{showGrid &&
							layout.yTickY.map((y, index) => (
								<line
									key={`y-${index}`}
									className={styles[chartStyleKeys.gridLine]}
									x1={layout.padding.left}
									x2={layout.width - layout.padding.right}
									y1={y}
									y2={y}
								/>
							))}
						{showGrid &&
							layout.xTickX.map((x, index) => (
								<line
									key={`x-${index}`}
									className={styles[chartStyleKeys.gridLine]}
									x1={x}
									x2={x}
									y1={layout.padding.top}
									y2={layout.height - layout.padding.bottom}
								/>
							))}
						{showAxis &&
							layout.xLabels.map((label, index) => (
								<text
									key={`label-${index}`}
									x={layout.xTickX[index]}
									y={layout.height - layout.padding.bottom / 2}
									textAnchor="middle"
									dominantBaseline="middle"
									fontSize="10">
									{String(label)}
								</text>
							))}
						{layout.series.map((item, seriesIndex) => {
							if (item.type === 'bar') {
								const rects = getChartBarRects(layout, seriesIndex, layout.series.filter((s) => s.type === 'bar').length);
								return (
									<g key={item.key}>
										{rects.map((rect) => (
											<rect key={rect.index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={item.color} rx={2} />
										))}
									</g>
								);
							}

							const path = item.type === 'area' ? getChartAreaPathD(item.points, layout.padding.top + layout.innerHeight) : getChartPathD(item.points);

							return (
								<g key={item.key}>
									{item.type === 'area' && <path d={path} fill={item.color} fillOpacity={0.2} />}
									<path d={getChartPathD(item.points)} fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
									{item.points.map((point) => (
										<circle key={point.index} cx={point.x} cy={point.y} r={2.5} fill={item.color} />
									))}
								</g>
							);
						})}
						{showTooltip && activeIndex !== null && (
							<line
								x1={tooltipX}
								x2={tooltipX}
								y1={layout.padding.top}
								y2={layout.height - layout.padding.bottom}
								stroke="currentColor"
								strokeDasharray="3 3"
								opacity={0.4}
							/>
						)}
					</svg>
					{showTooltip && activeIndex !== null && (
						<ChartTooltipContent
							active
							payload={entries}
							label={tooltipLabel}
							className={styles[chartStyleKeys.tooltip]}
							style={{
								position: 'absolute',
								...getChartTooltipPosition(layout, mousePosition.x, mousePosition.y),
							}}
						/>
					)}
					{showLegend && <ChartLegendContent payload={legendItems} />}
					{children?.(contextValue)}
				</div>
			</ChartContext.Provider>
		);
	},
);
ChartContainer.displayName = 'ChartContainer';

export interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
	active?: boolean;
	payload?: ChartTooltipEntry[];
	label?: React.ReactNode;
	indicator?: 'line' | 'dot' | 'dashed';
	hideLabel?: boolean;
	hideIndicator?: boolean;
	labelFormatter?: (value: React.ReactNode, payload: ChartTooltipEntry[]) => React.ReactNode;
	formatter?: (value: number, name: string, item: ChartTooltipEntry, index: number) => React.ReactNode;
	color?: string;
	nameKey?: string;
	labelKey?: string;
	labelClassName?: string;
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
	(
		{ active, payload, className = '', indicator = 'dot', hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName = '', formatter, color, ...props },
		ref,
	) => {
		const { config } = useChart();
		const items = payload ?? [];

		if (!active || items.length === 0) {
			return null;
		}

		const labelNode = !hideLabel && label != null && (
			<div className={`${styles[chartStyleKeys.tooltipLabel]} ${labelClassName}`}>{labelFormatter ? labelFormatter(label, items) : String(label)}</div>
		);

		return (
			<div ref={ref} className={className} {...props}>
				{labelNode}
				<div className={styles[chartStyleKeys.tooltipGrid]}>
					{items.map((item, index) => {
						const itemConfig = config[item.dataKey];
						const indicatorColor = color ?? item.color;

						return (
							<div key={index} className={styles[chartStyleKeys.tooltipItem]} data-indicator={indicator}>
								{!hideIndicator && (
									<span
										className={styles[chartStyleKeys.tooltipIndicator]}
										data-indicator={indicator}
										style={{ backgroundColor: indicatorColor, borderColor: indicatorColor }}
									/>
								)}
								<div className={styles[chartStyleKeys.tooltipItemName]}>{itemConfig?.label ?? item.name}</div>
								{formatter && item.value !== undefined ? (
									formatter(item.value, item.name, item, index)
								) : (
									<div className={styles[chartStyleKeys.tooltipItemValue]}>
										{typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	},
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

export interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
	payload?: ChartLegendItem[];
	hideIcon?: boolean;
	verticalAlign?: 'top' | 'bottom';
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(({ className = '', payload, hideIcon = false, verticalAlign = 'bottom', ...props }, ref) => {
	const items = payload ?? [];

	if (items.length === 0) {
		return null;
	}

	return (
		<div ref={ref} data-align={verticalAlign} className={`${styles[chartStyleKeys.legend]} ${className}`} {...props}>
			{items.map((item, index) => (
				<div key={index} className={styles[chartStyleKeys.legendItem]}>
					{!hideIcon && <span className={styles[chartStyleKeys.legendSwatch]} style={{ backgroundColor: item.color }} />}
					{item.name}
				</div>
			))}
		</div>
	);
});
ChartLegendContent.displayName = 'ChartLegendContent';

export interface ChartTooltipProps {
	className?: string;
	children?: (state: { active: boolean; payload: ChartTooltipEntry[]; label: React.ReactNode }) => React.ReactNode;
}

const ChartTooltip = ({ className = '', children }: ChartTooltipProps) => {
	const { layout, config, data, activeIndex } = useChart();
	const entries = getChartTooltipEntries(layout, config, data, activeIndex);
	const label = activeIndex !== null ? layout.xLabels[activeIndex] : null;

	if (children) {
		return <>{children({ active: activeIndex !== null, payload: entries, label })}</>;
	}

	return <ChartTooltipContent className={className} active={activeIndex !== null} payload={entries} label={label} />;
};
ChartTooltip.displayName = 'ChartTooltip';

export interface ChartLegendProps extends Omit<ChartLegendContentProps, 'payload'> {}

const ChartLegend = (props: ChartLegendProps) => {
	const { layout } = useChart();
	return <ChartLegendContent {...props} payload={getChartLegendItems(layout)} />;
};
ChartLegend.displayName = 'ChartLegend';

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
export default ChartContainer;
