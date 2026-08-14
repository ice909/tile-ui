export type ButtonGroupVariant = 'default' | 'outline' | 'ghost';
export type ButtonGroupSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * 框架无关的 ButtonGroup 基础 Props（仅包含组件库自定义属性）
 */
export interface ButtonGroupBaseProps {
	/**
	 * 按钮组样式变体
	 */
	variant?: ButtonGroupVariant;
	/**
	 * 按钮组尺寸
	 */
	size?: ButtonGroupSize;
	/**
	 * 是否将根元素渲染为子元素（Slot 模式）
	 */
	asChild?: boolean;
}

/**
 * 框架无关的 ButtonGroupText 基础 Props（仅包含组件库自定义属性）
 */
export interface ButtonGroupTextBaseProps {
	/**
	 * 是否将根元素渲染为子元素（Slot 模式）
	 */
	asChild?: boolean;
}

/**
 * 框架无关的 ButtonGroupSeparator 基础 Props（仅包含组件库自定义属性）
 */
export interface ButtonGroupSeparatorBaseProps {}
