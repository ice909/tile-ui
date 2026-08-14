export type ItemVariant = 'neutral' | 'selected' | 'hoverable';

/**
 * 框架无关的 Item 基础 Props（仅包含组件库自定义属性）
 */
export interface ItemBaseProps {
	/**
	 * 条目样式变体
	 */
	variant?: ItemVariant;
	/**
	 * 是否将根元素渲染为子元素（Slot 模式）
	 */
	asChild?: boolean;
}
