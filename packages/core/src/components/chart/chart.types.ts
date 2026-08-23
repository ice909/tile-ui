/**
 * 支持的图表类型
 */
export type ChartType = 'line' | 'bar' | 'area';

/**
 * 主题色 (亮色 / 暗色)
 */
export interface ChartThemeColor {
	light: string;
	dark: string;
}

/**
 * ChartConfig 中单个数据项配置
 */
export interface ChartConfigItem {
	/** 展示名称 */
	label?: string;
	/** 固定颜色 */
	color?: string;
	/** 按主题区分的颜色 (优先于 color) */
	theme?: ChartThemeColor;
}

/**
 * 图表配置：键名对应数据字段名
 */
export type ChartConfig = Record<string, ChartConfigItem>;

/**
 * 系列配置：指定要绘制的数据字段
 */
export interface ChartSeriesItem {
	/** 数据字段名 (对应 ChartConfig 中的键) */
	key: string;
	/** 覆盖系列名称 (默认取 config.label) */
	name?: string;
	/** 覆盖系列颜色 (默认取 config.color/theme) */
	color?: string;
	/** 覆盖系列类型 (默认取容器 type) */
	type?: ChartType;
}

/**
 * 图表数据行：字段值为数字或分类值 (x 轴分类允许为字符串)
 */
export type ChartDatum = Record<string, number | string>;

/**
 * 图表内边距
 */
export interface ChartPadding {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

/**
 * 图表布局计算入参
 */
export interface ChartLayoutOptions {
	/** 图表配置 */
	config: ChartConfig;
	/** 数据 */
	data: ChartDatum[];
	/** 系列配置 */
	series: ChartSeriesItem[];
	/** X 轴分类字段 */
	xKey: string;
	/** 图表类型 (line/bar/area) */
	type: ChartType;
	/** 画布宽度 */
	width: number;
	/** 画布高度 */
	height: number;
	/** 内边距 */
	padding?: ChartPadding;
	/** Y 轴刻度数量 */
	yTickCount?: number;
	/** 是否仅显示整数刻度 */
	integerOnly?: boolean;
	/** 当前主题 (light/dark，用于取 theme 颜色) */
	theme?: 'light' | 'dark';
	/** 图表专属 CSS 变量作用域，避免嵌套图表之间继承颜色 */
	cssVariableScope?: string;
}

/**
 * 单个映射后的数据点坐标
 */
export interface ChartPoint {
	/** 数据索引 */
	index: number;
	/** X 坐标 */
	x: number;
	/** Y 坐标 */
	y: number;
	/** 原始数值 */
	value: number;
}

/**
 * 系列布局结果
 */
export interface ChartSeriesLayout {
	/** 数据字段名 */
	key: string;
	/** 展示名称 */
	name: string;
	/** 颜色 */
	color: string;
	/** 类型 */
	type: ChartType;
	/** 映射后的点 */
	points: ChartPoint[];
}

/**
 * 图表完整布局结果
 */
export interface ChartLayout {
	/** 画布宽度 */
	width: number;
	/** 画布高度 */
	height: number;
	/** 有效绘图区域 */
	innerWidth: number;
	innerHeight: number;
	padding: Required<ChartPadding>;
	/** X 轴分类标签 */
	xLabels: Array<number | string>;
	/** X 轴刻度 X 坐标 */
	xTickX: number[];
	/** Y 轴数值刻度 */
	yTicks: number[];
	/** Y 轴刻度 Y 坐标 */
	yTickY: number[];
	/** 数值范围 */
	yMin: number;
	yMax: number;
	/** 各系列映射结果 */
	series: ChartSeriesLayout[];
}

/**
 * Tooltip 中单个条目
 */
export interface ChartTooltipEntry {
	/** 系列名 */
	name: string;
	/** 数据字段 */
	dataKey: string;
	/** 数值 */
	value: number;
	/** 颜色 */
	color: string;
	/** 原始数据行 */
	payload: ChartDatum;
}

/**
 * 柱状图单个矩形条
 */
export interface ChartBarRect {
	/** 数据索引 */
	index: number;
	/** 矩形左上角 X */
	x: number;
	/** 矩形左上角 Y */
	y: number;
	/** 矩形宽度 */
	width: number;
	/** 矩形高度 */
	height: number;
	/** 原始数值 */
	value: number;
}

/**
 * 图例条目
 */
export interface ChartLegendItem {
	/** 数据字段名 */
	key: string;
	/** 展示名称 */
	name: string;
	/** 颜色 */
	color: string;
}

/**
 * ChartContainer 基础 Props (框架无关部分)
 */
export interface ChartContainerBaseProps {
	/** 图表配置 */
	config: ChartConfig;
	/** 图表数据 */
	data?: ChartDatum[];
	/** 数据行中的分类字段 */
	xKey?: string;
	/** 系列配置 (缺省时根据 config 自动生成) */
	series?: ChartSeriesItem[];
	/** 图表类型 */
	type?: ChartType;
	/** 初始尺寸 (容器未测量时的兜底值) */
	initialDimension?: { width: number; height: number };
	/** 是否显示图例 */
	showLegend?: boolean;
	/** 是否显示 Tooltip */
	showTooltip?: boolean;
	/** 是否显示网格线 */
	showGrid?: boolean;
	/** 是否显示坐标轴刻度 */
	showAxis?: boolean;
}
