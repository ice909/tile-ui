import { capitalize } from '../../utils/helpers';
import type { TabsListVariant } from './tabs.types';

export type TabsState = 'active' | 'inactive';

/**
 * 根据激活状态获取 Tabs 的状态标识
 */
export function getTabsState(active: boolean): TabsState {
	return active ? 'active' : 'inactive';
}

/**
 * 获取 TabsList 的变体类名键
 */
export function getTabsListVariantKey(variant: TabsListVariant = 'default'): string {
	return `variant${capitalize(variant)}`;
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
