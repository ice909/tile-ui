export type ToggleGroupItemState = 'on' | 'off';

/**
 * 根据选中状态获取 ToggleGroupItem 的状态标识
 */
export function getToggleGroupItemState(selected: boolean): ToggleGroupItemState {
	return selected ? 'on' : 'off';
}

/**
 * 在列表中添加或移除指定值（纯函数）
 */
export function toggleValueInList(value: string, list: string[]): string[] {
	return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * ToggleGroup 组件样式类名键
 */
export const toggleGroupStyleKeys = {
	root: 'root',
	item: 'item',
} as const;
