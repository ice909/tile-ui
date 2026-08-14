import type { CommandFilterFn, CommandFilterResult, CommandGroupDef, CommandItemDef } from './command.types';

/**
 * Command 组件样式类名键
 */
export const commandStyleKeys = {
	root: 'root',
	inputWrapper: 'inputWrapper',
	input: 'input',
	inputIcon: 'inputIcon',
	list: 'list',
	empty: 'empty',
	group: 'group',
	groupLabel: 'groupLabel',
	groupContent: 'groupContent',
	item: 'item',
	separator: 'separator',
	shortcut: 'shortcut',
	dialogOverlay: 'dialogOverlay',
	dialogContent: 'dialogContent',
	dialogTitle: 'dialogTitle',
	dialogDescription: 'dialogDescription',
	dialogClose: 'dialogClose',
} as const;

/**
 * 默认匹配函数 (与 cmdk 语义一致：值/关键字包含即匹配)
 */
export function matchCommandItem(item: CommandItemDef, query: string): boolean {
	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		return true;
	}
	if (item.value.toLowerCase().includes(normalized)) {
		return true;
	}
	if ((item.label ?? '').toLowerCase().includes(normalized)) {
		return true;
	}
	return (item.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(normalized));
}

/**
 * 过滤命令项 (支持自定义 filter)
 */
export function filterCommandItems(items: CommandItemDef[], query: string, filter?: CommandFilterFn): CommandItemDef[] {
	const predicate: CommandFilterFn = filter ?? ((value, search, keywords) => matchCommandItem({ value, keywords }, search));
	return items.filter((item) => predicate(item.value, query, item.keywords));
}

/**
 * 过滤并分组 (返回分组结构与扁平项列表)
 */
export function filterCommandGroups(groups: CommandGroupDef[], query: string, filter?: CommandFilterFn): CommandFilterResult {
	const result: CommandFilterResult = { groups: [], items: [], empty: false };

	for (const group of groups) {
		const matchedItems = filterCommandItems(group.items, query, filter);
		if (matchedItems.length === 0) {
			continue;
		}
		result.groups.push({ ...group, items: matchedItems });
		result.items.push(...matchedItems);
	}

	result.empty = result.items.length === 0;
	return result;
}

/**
 * 扁平列表 (含分组标题，用于键盘导航索引计算)
 */
export function flattenCommandGroups(
	groups: CommandGroupDef[],
	query: string,
	filter?: CommandFilterFn,
): Array<{ type: 'group' | 'item'; item?: CommandItemDef; group?: CommandGroupDef }> {
	const filtered = filterCommandGroups(groups, query, filter);
	const flat: Array<{ type: 'group' | 'item'; item?: CommandItemDef; group?: CommandGroupDef }> = [];

	for (const group of filtered.groups) {
		flat.push({ type: 'group', group });
		for (const item of group.items) {
			flat.push({ type: 'item', item });
		}
	}

	return flat;
}

/**
 * 计算键盘导航下一个索引 (仅统计可聚焦项，支持环绕)
 */
export function moveCommandIndex(current: number, direction: 1 | -1, length: number, loop: boolean = true): number {
	if (length === 0) {
		return -1;
	}
	if (current === -1) {
		return direction === 1 ? 0 : length - 1;
	}
	const next = current + direction;
	if (next < 0) {
		return loop ? length - 1 : 0;
	}
	if (next >= length) {
		return loop ? 0 : length - 1;
	}
	return next;
}
