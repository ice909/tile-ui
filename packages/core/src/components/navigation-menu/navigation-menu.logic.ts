import type { NavigationMenuActiveState, NavigationMenuState, NavigationMenuTriggerRect } from './navigation-menu.types';

/**
 * NavigationMenu 组件样式类名键
 */
export const navigationMenuStyleKeys = {
	root: 'root',
	list: 'list',
	item: 'item',
	trigger: 'trigger',
	content: 'content',
	link: 'link',
	viewport: 'viewport',
	viewportInner: 'viewportInner',
	indicator: 'indicator',
	indicatorArrow: 'indicatorArrow',
	chevron: 'chevron',
} as const;

/**
 * 根据布尔值获取 NavigationMenu 的开关状态
 */
export function getNavigationMenuState(open: boolean): NavigationMenuState {
	return open ? 'open' : 'closed';
}

/**
 * 根据布尔值获取 NavigationMenu 的激活标识
 */
export function getNavigationMenuActiveState(active: boolean): NavigationMenuActiveState {
	return active ? 'active' : 'inactive';
}

/**
 * 计算菜单内键盘导航的下一个索引 (支持循环)
 * @param currentIndex 当前聚焦项索引
 * @param itemCount 可导航项总数
 * @param direction 方向 (1 向下/右, -1 向上/左)
 * @param loop 是否循环 (越界时回到另一端)
 */
export function getNavigationMenuNextIndex(currentIndex: number, itemCount: number, direction: 1 | -1, loop: boolean = true): number {
	if (itemCount <= 0) {
		return -1;
	}
	if (loop) {
		return (currentIndex + direction + itemCount) % itemCount;
	}
	return Math.min(Math.max(currentIndex + direction, 0), itemCount - 1);
}

/**
 * 计算指示器的定位样式 (相对根节点的 left / translateX)
 */
export function getNavigationMenuIndicatorStyle(rect: NavigationMenuTriggerRect | null): { left: number; width: number } | null {
	if (!rect) {
		return null;
	}
	return {
		left: rect.left,
		width: rect.width,
	};
}
