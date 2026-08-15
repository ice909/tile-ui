export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 ButtonGroup 基础 Props（仅包含组件库自定义属性）
 */
export interface ButtonGroupBaseProps {
	/**
	 * 按钮组排列方向
	 */
	orientation?: ButtonGroupOrientation;
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
export interface ButtonGroupSeparatorBaseProps {
	/**
	 * 分隔线方向
	 */
	orientation?: ButtonGroupOrientation;
}
