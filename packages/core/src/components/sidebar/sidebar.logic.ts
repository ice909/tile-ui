import type { SidebarActiveIndexResult, SidebarMenuItemDef, SidebarMenuButtonSize, SidebarMenuButtonVariant, SidebarState, SidebarVariant } from './sidebar.types';
import { capitalize } from '../../utils/helpers';

/**
 * 侧边栏键盘快捷键事件描述 (纯结构，便于跨框架复用)
 */
export interface SidebarShortcutEvent {
	/** 按键名 */
	key: string;
	/** 是否按下 Meta (Cmd) 键 */
	metaKey?: boolean;
	/** 是否按下 Ctrl 键 */
	ctrlKey?: boolean;
}

/**
 * 侧边栏相关常量
 */
export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '3rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
export const SIDEBAR_MOBILE_BREAKPOINT = 768;
export const SIDEBAR_MEDIA_QUERY = `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`;

/**
 * 侧边栏样式类名键
 */
export const sidebarStyleKeys = {
	wrapper: 'wrapper',
	sidebar: 'sidebar',
	gap: 'gap',
	container: 'container',
	inner: 'inner',
	content: 'content',
	header: 'header',
	footer: 'footer',
	group: 'group',
	groupLabel: 'groupLabel',
	groupAction: 'groupAction',
	groupContent: 'groupContent',
	menu: 'menu',
	menuItem: 'menuItem',
	menuButton: 'menuButton',
	menuAction: 'menuAction',
	menuBadge: 'menuBadge',
	menuSub: 'menuSub',
	menuSubItem: 'menuSubItem',
	menuSubButton: 'menuSubButton',
	trigger: 'trigger',
	rail: 'rail',
	inset: 'inset',
	separator: 'separator',
	input: 'input',
	link: 'link',
	skeleton: 'skeleton',
	skeletonIcon: 'skeletonIcon',
	skeletonText: 'skeletonText',
	sheetOverlay: 'sheetOverlay',
	sheetContent: 'sheetContent',
	srOnly: 'srOnly',
} as const;

/**
 * 根据布尔值获取侧边栏状态
 */
export function getSidebarState(open: boolean): SidebarState {
	return open ? 'expanded' : 'collapsed';
}

/**
 * 判断视口宽度是否为移动端
 */
export function isMobileViewport(width: number, breakpoint: number = SIDEBAR_MOBILE_BREAKPOINT): boolean {
	return width < breakpoint;
}

/**
 * 判断键盘事件是否触发侧边栏折叠快捷键 (Cmd/Ctrl + b)
 */
export function matchesSidebarToggleShortcut(event: SidebarShortcutEvent): boolean {
	return event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT && Boolean(event.metaKey || event.ctrlKey);
}

/**
 * 创建媒体查询监听器 (框架无关；返回取消订阅函数)
 */
export function createMediaQueryWatcher(query: string, onChange: (matches: boolean) => void): () => void {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		onChange(false);
		return () => {};
	}

	const media = window.matchMedia(query);
	const listener = (event: MediaQueryListEvent) => {
		onChange(event.matches);
	};
	media.addEventListener('change', listener);
	onChange(media.matches);

	return () => {
		media.removeEventListener('change', listener);
	};
}

/**
 * 获取 Sidebar 主体样式类名键 (按变体)
 */
export function getSidebarStyleKeys(variant: SidebarVariant = 'sidebar') {
	return {
		base: 'sidebar',
		variant: `variant${capitalize(variant)}`,
	};
}

/**
 * 获取 SidebarMenuButton 样式类名键
 */
export function getSidebarMenuButtonStyleKeys(variant: SidebarMenuButtonVariant = 'default', size: SidebarMenuButtonSize = 'default') {
	return {
		base: 'menuButton',
		variant: `variant${capitalize(variant)}`,
		size: `size${capitalize(size)}`,
	};
}

/**
 * 获取 SidebarMenuSubButton 样式类名键
 */
export function getSidebarMenuSubButtonStyleKeys(size: 'sm' | 'md' = 'md') {
	return {
		base: 'menuSubButton',
		size: `size${capitalize(size)}`,
	};
}

/**
 * 在嵌套菜单中查找激活项索引
 */
export function findSidebarActiveIndex(items: SidebarMenuItemDef[], activeValue: string): SidebarActiveIndexResult {
	const result: SidebarActiveIndexResult = { itemIndex: -1, subIndex: -1, activeSub: false };

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		const item = items[itemIndex];
		if (item.value === activeValue) {
			result.itemIndex = itemIndex;
			return result;
		}
		const children = item.children ?? [];
		for (let subIndex = 0; subIndex < children.length; subIndex++) {
			if (children[subIndex].value === activeValue) {
				result.itemIndex = itemIndex;
				result.subIndex = subIndex;
				result.activeSub = true;
				return result;
			}
		}
	}

	return result;
}
