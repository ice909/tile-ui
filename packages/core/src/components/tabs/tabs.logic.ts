export type TabsState = 'active' | 'inactive';

/**
 * 根据激活状态获取 Tabs 的状态标识
 */
export function getTabsState(active: boolean): TabsState {
	return active ? 'active' : 'inactive';
}

/**
 * Tabs 组件样式类名键
 */
export const tabsStyleKeys = {
	root: 'root',
	list: 'list',
	trigger: 'trigger',
	content: 'content',
} as const;
