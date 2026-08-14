import type { TooltipSide, TooltipState } from './tooltip.types';

/**
 * Tooltip 组件样式类名键
 */
export const tooltipStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	content: 'content',
	arrow: 'arrow',
} as const;

/** 触发元素矩形信息 (与 DOMRect 结构兼容，由框架测量传入) */
export interface TooltipRect {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
}

/** 内容尺寸 */
export interface TooltipSize {
	width: number;
	height: number;
}

/** 视口尺寸 */
export interface TooltipViewport {
	width: number;
	height: number;
}

/** 定位输入参数 */
export interface TooltipPositionInput {
	triggerRect: TooltipRect;
	contentSize: TooltipSize;
	side: TooltipSide;
	sideOffset: number;
	viewport: TooltipViewport;
}

/** 定位结果 (position: fixed 坐标) */
export interface TooltipPosition {
	top: number;
	left: number;
}

/** 内容与视口边缘的最小间距 */
export const TOOLTIP_VIEWPORT_MARGIN = 4;

/** 指针移出触发元素/内容后延迟关闭的毫秒数 (用于平滑过渡到内容悬停) */
export const TOOLTIP_CLOSE_DELAY_MS = 100;

/**
 * 根据 RTL 解析物理方向 (RTL 下左右互换)
 */
export function resolveTooltipSide(side: TooltipSide, rtl: boolean = false): TooltipSide {
	if (!rtl) {
		return side;
	}
	if (side === 'left') {
		return 'right';
	}
	if (side === 'right') {
		return 'left';
	}
	return side;
}

/**
 * 获取 side 对应的方向向量 (x 表示水平偏移方向，y 表示垂直偏移方向)
 */
export function getTooltipSideOffsetPlacement(side: TooltipSide): { x: number; y: number } {
	switch (side) {
		case 'top':
			return { x: 0, y: -1 };
		case 'right':
			return { x: 1, y: 0 };
		case 'bottom':
			return { x: 0, y: 1 };
		case 'left':
			return { x: -1, y: 0 };
	}
}

/**
 * 根据布尔值获取 Tooltip 的状态标识
 */
export function getTooltipState(open: boolean): TooltipState {
	return open ? 'open' : 'closed';
}

/**
 * 计算 Tooltip 内容定位 (fixed 坐标，基于触发元素矩形居中放置)
 */
export function getTooltipPosition(input: TooltipPositionInput): TooltipPosition {
	const { triggerRect, contentSize, side, sideOffset, viewport } = input;

	let top = 0;
	let left = 0;

	switch (side) {
		case 'top':
			top = triggerRect.top - contentSize.height - sideOffset;
			left = triggerRect.left + triggerRect.width / 2 - contentSize.width / 2;
			break;
		case 'right':
			left = triggerRect.right + sideOffset;
			top = triggerRect.top + triggerRect.height / 2 - contentSize.height / 2;
			break;
		case 'bottom':
			top = triggerRect.bottom + sideOffset;
			left = triggerRect.left + triggerRect.width / 2 - contentSize.width / 2;
			break;
		case 'left':
			left = triggerRect.left - contentSize.width - sideOffset;
			top = triggerRect.top + triggerRect.height / 2 - contentSize.height / 2;
			break;
	}

	const margin = TOOLTIP_VIEWPORT_MARGIN;
	const maxLeft = Math.max(margin, viewport.width - contentSize.width - margin);
	const maxTop = Math.max(margin, viewport.height - contentSize.height - margin);

	return {
		left: Math.min(Math.max(left, margin), maxLeft),
		top: Math.min(Math.max(top, margin), maxTop),
	};
}
