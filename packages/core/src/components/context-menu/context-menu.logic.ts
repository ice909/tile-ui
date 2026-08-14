import type { ContextMenuCheckState, ContextMenuState } from './context-menu.types';

/**
 * ContextMenu 组件样式类名键
 */
export const contextMenuStyleKeys = {
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
 * 根据布尔值获取 ContextMenu 的开关状态
 */
export function getContextMenuState(open: boolean): ContextMenuState {
	return open ? 'open' : 'closed';
}

/**
 * 根据勾选状态获取 ContextMenu 的勾选标识
 */
export function getContextMenuCheckState(checked: boolean): ContextMenuCheckState {
	return checked ? 'checked' : 'unchecked';
}

/**
 * 计算菜单内键盘导航的下一个索引 (支持循环)
 * @param currentIndex 当前聚焦项索引
 * @param itemCount 可导航项总数
 * @param direction 方向 (1 向下/右, -1 向上/左)
 * @param loop 是否循环 (越界时回到另一端)
 */
export function getContextMenuNextIndex(currentIndex: number, itemCount: number, direction: 1 | -1, loop: boolean = true): number {
	if (itemCount <= 0) {
		return -1;
	}
	if (loop) {
		return (currentIndex + direction + itemCount) % itemCount;
	}
	return Math.min(Math.max(currentIndex + direction, 0), itemCount - 1);
}

/** 右键菜单打开位置 (来自 contextmenu 事件坐标) */
export interface ContextMenuPosition {
	top: number;
	left: number;
}

/**
 * 将 contextmenu 事件坐标限制在视口内
 * @param x 事件 clientX
 * @param y 事件 clientY
 * @param contentSize 内容尺寸
 * @param viewport 视口尺寸
 */
export function getContextMenuPosition(input: {
	x: number;
	y: number;
	contentSize: { width: number; height: number };
	viewport: { width: number; height: number };
}): ContextMenuPosition {
	const { x, y, contentSize, viewport } = input;
	const margin = 8;
	const maxLeft = Math.max(margin, viewport.width - contentSize.width - margin);
	const maxTop = Math.max(margin, viewport.height - contentSize.height - margin);

	return {
		left: Math.min(Math.max(x, margin), maxLeft),
		top: Math.min(Math.max(y, margin), maxTop),
	};
}
