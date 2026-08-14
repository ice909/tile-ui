export type AccordionState = 'open' | 'closed';

/**
 * 根据展开状态获取 Accordion 的状态标识
 */
export function getAccordionState(open: boolean): AccordionState {
	return open ? 'open' : 'closed';
}

/**
 * 在列表中切换某个值（存在则移除，不存在则追加）
 */
export function getAccordionNextValues(value: string, list: string[]): string[] {
	if (list.includes(value)) {
		return list.filter((item) => item !== value);
	}
	return [...list, value];
}

/**
 * Accordion 组件样式类名键
 */
export const accordionStyleKeys = {
	root: 'root',
	item: 'item',
	header: 'header',
	trigger: 'trigger',
	chevron: 'chevron',
	content: 'content',
	contentInner: 'contentInner',
} as const;
