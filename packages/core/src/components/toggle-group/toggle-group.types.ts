import type { ToggleVariant, ToggleSize } from '../toggle/toggle.types';

export type ToggleGroupType = 'single' | 'multiple';

/**
 * 框架无关的 ToggleGroup 基础 Props（仅包含组件库自定义属性）
 */
export interface ToggleGroupBaseProps {
	/**
	 * 选择模式：单选或多选
	 */
	type?: ToggleGroupType;
}

/**
 * 框架无关的 ToggleGroupItem 基础 Props（仅包含组件库自定义属性）
 */
export interface ToggleGroupItemBaseProps {
	/**
	 * 选项值
	 */
	value: string;
	/**
	 * 选项样式变体
	 */
	variant?: ToggleVariant;
	/**
	 * 选项尺寸
	 */
	size?: ToggleSize;
}
