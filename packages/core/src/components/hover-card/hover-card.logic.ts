import type { HoverCardAlign, HoverCardSide, HoverCardState } from './hover-card.types';

/**
 * HoverCard 组件样式类名键
 */
export const hoverCardStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	content: 'content',
} as const;

/** 触发元素矩形信息 (与 DOMRect 结构兼容，由框架测量传入) */
export interface HoverCardRect {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
}

/** 内容尺寸 */
export interface HoverCardSize {
	width: number;
	height: number;
}

/** 视口尺寸 */
export interface HoverCardViewport {
	width: number;
	height: number;
}

/** 定位输入参数 */
export interface HoverCardPositionInput {
	triggerRect: HoverCardRect;
	contentSize: HoverCardSize;
	side: HoverCardSide;
	align?: HoverCardAlign;
	sideOffset: number;
	viewport: HoverCardViewport;
	/** 是否处于 RTL 文档 (用于 start/end 对齐互换) */
	rtl?: boolean;
}

/** 定位结果 (position: fixed 坐标) */
export interface HoverCardPosition {
	top: number;
	left: number;
}

/** 内容与视口边缘的最小间距 */
export const HOVER_CARD_VIEWPORT_MARGIN = 8;

/**
 * 根据 RTL 解析物理方向 (RTL 下左右互换)
 */
export function resolveHoverCardSide(side: HoverCardSide, rtl: boolean = false): HoverCardSide {
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
export function getHoverCardSideOffsetPlacement(side: HoverCardSide): { x: number; y: number } {
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
 * 根据布尔值获取 HoverCard 的状态标识
 */
export function getHoverCardState(open: boolean): HoverCardState {
	return open ? 'open' : 'closed';
}

/**
 * 计算主轴为水平方向时内容的对齐坐标
 */
function resolveHorizontalAlign(rect: HoverCardRect, contentWidth: number, align: HoverCardAlign, rtl: boolean): number {
	if (align === 'center') {
		return rect.left + rect.width / 2 - contentWidth / 2;
	}
	if (rtl) {
		return align === 'start' ? rect.right - contentWidth : rect.left;
	}
	return align === 'start' ? rect.left : rect.right - contentWidth;
}

/**
 * 计算主轴为垂直方向时内容的对齐坐标
 */
function resolveVerticalAlign(rect: HoverCardRect, contentHeight: number, align: HoverCardAlign): number {
	if (align === 'center') {
		return rect.top + rect.height / 2 - contentHeight / 2;
	}
	return align === 'start' ? rect.top : rect.bottom - contentHeight;
}

/**
 * 计算 HoverCard 内容定位 (fixed 坐标，支持 side + align + sideOffset)
 */
export function getHoverCardPosition(input: HoverCardPositionInput): HoverCardPosition {
	const { triggerRect, contentSize, side, sideOffset, viewport } = input;
	const align = input.align ?? 'center';
	const rtl = input.rtl ?? false;

	let top = 0;
	let left = 0;

	switch (side) {
		case 'top':
			top = triggerRect.top - contentSize.height - sideOffset;
			left = resolveHorizontalAlign(triggerRect, contentSize.width, align, rtl);
			break;
		case 'bottom':
			top = triggerRect.bottom + sideOffset;
			left = resolveHorizontalAlign(triggerRect, contentSize.width, align, rtl);
			break;
		case 'left':
			left = triggerRect.left - contentSize.width - sideOffset;
			top = resolveVerticalAlign(triggerRect, contentSize.height, align);
			break;
		case 'right':
			left = triggerRect.right + sideOffset;
			top = resolveVerticalAlign(triggerRect, contentSize.height, align);
			break;
	}

	const margin = HOVER_CARD_VIEWPORT_MARGIN;
	const maxLeft = Math.max(margin, viewport.width - contentSize.width - margin);
	const maxTop = Math.max(margin, viewport.height - contentSize.height - margin);

	return {
		left: Math.min(Math.max(left, margin), maxLeft),
		top: Math.min(Math.max(top, margin), maxTop),
	};
}
