export type InputGroupVariant = 'default' | 'outline';
export type InputGroupAddonAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

/**
 * 框架无关的 InputGroup 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupBaseProps {
	/**
	 * 输入组样式变体
	 */
	variant?: InputGroupVariant;
}

/**
 * 框架无关的 InputGroupAddon 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupAddonBaseProps {
	/**
	 * 附加内容样式变体
	 */
	variant?: InputGroupVariant;
	/**
	 * 附加内容对齐方式
	 */
	align?: InputGroupAddonAlign;
}

/**
 * 框架无关的 InputGroupButton 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupButtonBaseProps {}

/**
 * 框架无关的 InputGroupText 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupTextBaseProps {}

/**
 * 框架无关的 InputGroupInput 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupInputBaseProps {}

/**
 * 框架无关的 InputGroupTextarea 基础 Props（仅包含组件库自定义属性）
 */
export interface InputGroupTextareaBaseProps {}
