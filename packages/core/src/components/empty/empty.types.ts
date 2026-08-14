export type EmptyMediaVariant = 'muted' | 'bordered';

/**
 * 框架无关的 EmptyMedia 基础 Props（仅包含组件库自定义属性）
 */
export interface EmptyMediaBaseProps {
	/**
	 * 媒体区（图标容器）变体
	 */
	variant?: EmptyMediaVariant;
}
