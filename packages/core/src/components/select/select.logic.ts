import type { SelectAlign, SelectCheckState, SelectState } from './select.types';

/**
 * Select 组件样式类名键
 */
export const selectStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	content: 'content',
	group: 'group',
	value: 'value',
	viewport: 'viewport',
	item: 'item',
	indicator: 'indicator',
	label: 'label',
	separator: 'separator',
	scrollButton: 'scrollButton',
	chevron: 'chevron',
	checkIcon: 'checkIcon',
} as const;

/**
 * 根据布尔值获取 Select 的开关状态
 */
export function getSelectState(open: boolean): SelectState {
	return open ? 'open' : 'closed';
}

/**
 * 根据勾选状态获取 Select 的勾选标识
 */
export function getSelectCheckState(checked: boolean): SelectCheckState {
	return checked ? 'checked' : 'unchecked';
}

/**
 * 计算下拉列表内键盘导航的下一个索引 (支持循环)
 * @param currentIndex 当前聚焦项索引
 * @param itemCount 可导航项总数
 * @param direction 方向 (1 向下, -1 向上)
 * @param loop 是否循环 (越界时回到另一端)
 */
export function getSelectNextIndex(currentIndex: number, itemCount: number, direction: 1 | -1, loop: boolean = true): number {
	if (itemCount <= 0) {
		return -1;
	}
	if (loop) {
		return (currentIndex + direction + itemCount) % itemCount;
	}
	return Math.min(Math.max(currentIndex + direction, 0), itemCount - 1);
}

/** 触发元素矩形信息 (与 DOMRect 结构兼容，由框架测量传入) */
export interface SelectRect {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
}

/** 内容尺寸 */
export interface SelectSize {
	width: number;
	height: number;
}

/** 视口尺寸 */
export interface SelectViewport {
	width: number;
	height: number;
}

/** 定位输入参数 */
export interface SelectPositionInput {
	triggerRect: SelectRect;
	contentSize: SelectSize;
	align?: SelectAlign;
	sideOffset: number;
	viewport: SelectViewport;
	/** 是否处于 RTL 文档 (用于 start/end 对齐互换) */
	rtl?: boolean;
}

/** 定位结果 (position: fixed 坐标) */
export interface SelectPositionResult {
	top: number;
	left: number;
}

/** 内容与视口边缘的最小间距 */
export const SELECT_VIEWPORT_MARGIN = 8;

/**
 * 计算 Select 内容定位 (fixed 坐标，默认 bottom + center 对齐)
 */
export function getSelectPosition(input: SelectPositionInput): SelectPositionResult {
	const { triggerRect, contentSize, sideOffset, viewport } = input;
	const align = input.align ?? 'center';
	const rtl = input.rtl ?? false;

	let top = triggerRect.bottom + sideOffset;
	let left = 0;

	if (align === 'center') {
		left = triggerRect.left + triggerRect.width / 2 - contentSize.width / 2;
	} else if (rtl) {
		left = align === 'start' ? triggerRect.right - contentSize.width : triggerRect.left;
	} else {
		left = align === 'start' ? triggerRect.left : triggerRect.right - contentSize.width;
	}

	const margin = SELECT_VIEWPORT_MARGIN;
	const maxLeft = Math.max(margin, viewport.width - contentSize.width - margin);
	const maxTop = Math.max(margin, viewport.height - contentSize.height - margin);

	return {
		left: Math.min(Math.max(left, margin), maxLeft),
		top: Math.min(Math.max(top, margin), maxTop),
	};
}
