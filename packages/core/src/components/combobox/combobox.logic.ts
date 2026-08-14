import type { ComboboxItem } from './combobox.types';

/**
 * Combobox 组件样式类名键
 */
export const comboboxStyleKeys = {
	root: 'root',
	trigger: 'trigger',
	triggerValue: 'triggerValue',
	triggerIcon: 'triggerIcon',
	content: 'content',
	list: 'list',
	item: 'item',
	itemIndicator: 'itemIndicator',
	empty: 'empty',
	group: 'group',
	label: 'label',
	separator: 'separator',
	search: 'search',
	searchInput: 'searchInput',
} as const;

/** 默认最大展示条数 */
export const COMBOBOX_DEFAULT_MAX_ITEMS = 8;

/**
 * 归一化搜索查询 (去空白、转小写)
 */
export function normalizeComboboxQuery(query: string): string {
	return query.trim().toLowerCase();
}

/**
 * 默认匹配函数：标签、值、关键字包含即匹配
 */
export function matchComboboxItem(item: ComboboxItem, query: string): boolean {
	if (!query) {
		return true;
	}
	const normalized = normalizeComboboxQuery(query);
	if (item.label.toLowerCase().includes(normalized)) {
		return true;
	}
	if (item.value.toLowerCase().includes(normalized)) {
		return true;
	}
	return (item.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(normalized));
}

/**
 * 过滤候选项 (支持自定义 filter，受 maxItems 限制)
 */
export function filterComboboxItems(
	items: ComboboxItem[],
	query: string,
	maxItems: number = COMBOBOX_DEFAULT_MAX_ITEMS,
	filter?: (item: ComboboxItem, query: string) => boolean,
): ComboboxItem[] {
	const predicate = filter ?? matchComboboxItem;
	return items.filter((item) => predicate(item, query)).slice(0, maxItems);
}

/**
 * 统计匹配总数
 */
export function countComboboxMatches(items: ComboboxItem[], query: string, filter?: (item: ComboboxItem, query: string) => boolean): number {
	const predicate = filter ?? matchComboboxItem;
	if (!query) {
		return items.length;
	}
	return items.filter((item) => predicate(item, query)).length;
}

/**
 * 计算键盘导航下一个索引 (支持环绕)
 */
export function moveComboboxIndex(current: number, direction: 1 | -1, length: number, wrap: boolean = true): number {
	if (length === 0) {
		return -1;
	}
	if (current === -1) {
		return direction === 1 ? 0 : length - 1;
	}
	const next = current + direction;
	if (next < 0) {
		return wrap ? length - 1 : 0;
	}
	if (next >= length) {
		return wrap ? 0 : length - 1;
	}
	return next;
}
