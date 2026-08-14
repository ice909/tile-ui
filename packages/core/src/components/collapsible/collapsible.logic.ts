export type CollapsibleState = 'open' | 'closed';

/**
 * 根据布尔值获取 Collapsible 的状态标识
 */
export function getCollapsibleState(open: boolean): CollapsibleState {
	return open ? 'open' : 'closed';
}

/**
 * 计算切换后的展开状态
 */
export function getNextCollapsibleOpen(open: boolean): boolean {
	return !open;
}

/**
 * Collapsible 组件样式类名键
 */
export const collapsibleStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	content: 'content',
	contentInner: 'contentInner',
} as const;
