import type { DropdownMenuAlign, DropdownMenuCheckState, DropdownMenuSide, DropdownMenuState } from './dropdown-menu.types';

/**
 * DropdownMenu 组件样式类名键
 */
export const dropdownMenuStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	content: 'content',
	group: 'group',
	item: 'item',
	checkboxItem: 'checkboxItem',
	radioGroup: 'radioGroup',
	radioItem: 'radioItem',
	indicator: 'indicator',
	label: 'label',
	separator: 'separator',
	shortcut: 'shortcut',
	subTrigger: 'subTrigger',
	subContent: 'subContent',
	chevron: 'chevron',
	checkIcon: 'checkIcon',
	radioIcon: 'radioIcon',
} as const;

/**
 * 根据布尔值获取 DropdownMenu 的开关状态
 */
export function getDropdownMenuState(open: boolean): DropdownMenuState {
	return open ? 'open' : 'closed';
}

/**
 * 根据勾选状态获取 DropdownMenu 的勾选标识
 */
export function getDropdownMenuCheckState(checked: boolean): DropdownMenuCheckState {
	return checked ? 'checked' : 'unchecked';
}

/**
 * 计算菜单内键盘导航的下一个索引 (支持循环)
 * @param currentIndex 当前聚焦项索引
 * @param itemCount 可导航项总数
 * @param direction 方向 (1 向下/右, -1 向上/左)
 * @param loop 是否循环 (越界时回到另一端)
 */
export function getDropdownMenuNextIndex(currentIndex: number, itemCount: number, direction: 1 | -1, loop: boolean = true): number {
	if (itemCount <= 0) {
		return -1;
	}
	if (loop) {
		return (currentIndex + direction + itemCount) % itemCount;
	}
	return Math.min(Math.max(currentIndex + direction, 0), itemCount - 1);
}

/** 触发元素矩形信息 (与 DOMRect 结构兼容，由框架测量传入) */
export interface DropdownMenuRect {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
}

/** 内容尺寸 */
export interface DropdownMenuSize {
	width: number;
	height: number;
}

/** 视口尺寸 */
export interface DropdownMenuViewport {
	width: number;
	height: number;
}

/** 定位输入参数 */
export interface DropdownMenuPositionInput {
	triggerRect: DropdownMenuRect;
	contentSize: DropdownMenuSize;
	side: DropdownMenuSide;
	align?: DropdownMenuAlign;
	sideOffset: number;
	alignOffset?: number;
	viewport: DropdownMenuViewport;
	/** 是否处于 RTL 文档 (用于 start/end 对齐互换) */
	rtl?: boolean;
}

/** 定位结果 (position: fixed 坐标) */
export interface DropdownMenuPosition {
	top: number;
	left: number;
}

/** 内容与视口边缘的最小间距 */
export const DROPDOWN_MENU_VIEWPORT_MARGIN = 8;

/**
 * 根据 RTL 解析物理方向 (RTL 下左右互换)
 */
export function resolveDropdownMenuSide(side: DropdownMenuSide, rtl: boolean = false): DropdownMenuSide {
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
 * 计算主轴为水平方向时内容的对齐坐标
 */
function resolveHorizontalAlign(rect: DropdownMenuRect, contentWidth: number, align: DropdownMenuAlign, alignOffset: number, rtl: boolean): number {
	if (align === 'center') {
		return rect.left + rect.width / 2 - contentWidth / 2;
	}
	if (rtl) {
		return align === 'start' ? rect.right - contentWidth - alignOffset : rect.left + alignOffset;
	}
	return align === 'start' ? rect.left + alignOffset : rect.right - contentWidth - alignOffset;
}

/**
 * 计算主轴为垂直方向时内容的对齐坐标
 */
function resolveVerticalAlign(rect: DropdownMenuRect, contentHeight: number, align: DropdownMenuAlign, alignOffset: number): number {
	if (align === 'center') {
		return rect.top + rect.height / 2 - contentHeight / 2;
	}
	return align === 'start' ? rect.top + alignOffset : rect.bottom - contentHeight - alignOffset;
}

/**
 * 计算 DropdownMenu 内容定位 (fixed 坐标，支持 side + align + sideOffset + alignOffset)
 */
export function getDropdownMenuPosition(input: DropdownMenuPositionInput): DropdownMenuPosition {
	const { triggerRect, contentSize, side, sideOffset, viewport } = input;
	const align = input.align ?? 'center';
	const alignOffset = input.alignOffset ?? 0;
	const rtl = input.rtl ?? false;

	let top = 0;
	let left = 0;

	switch (side) {
		case 'top':
			top = triggerRect.top - contentSize.height - sideOffset;
			left = resolveHorizontalAlign(triggerRect, contentSize.width, align, alignOffset, rtl);
			break;
		case 'bottom':
			top = triggerRect.bottom + sideOffset;
			left = resolveHorizontalAlign(triggerRect, contentSize.width, align, alignOffset, rtl);
			break;
		case 'left':
			left = triggerRect.left - contentSize.width - sideOffset;
			top = resolveVerticalAlign(triggerRect, contentSize.height, align, alignOffset);
			break;
		case 'right':
			left = triggerRect.right + sideOffset;
			top = resolveVerticalAlign(triggerRect, contentSize.height, align, alignOffset);
			break;
	}

	const margin = DROPDOWN_MENU_VIEWPORT_MARGIN;
	const maxLeft = Math.max(margin, viewport.width - contentSize.width - margin);
	const maxTop = Math.max(margin, viewport.height - contentSize.height - margin);

	return {
		left: Math.min(Math.max(left, margin), maxLeft),
		top: Math.min(Math.max(top, margin), maxTop),
	};
}
