export type MarkerVariant = 'neutral' | 'green' | 'yellow' | 'red' | 'blue';

/**
 * 框架无关的 Marker 基础 Props（仅包含组件库自定义属性）
 */
export interface MarkerBaseProps {
	/**
	 * 标记颜色变体
	 */
	variant?: MarkerVariant;
	/**
	 * 是否将根元素渲染为子元素（Slot 模式）
	 */
	asChild?: boolean;
}
