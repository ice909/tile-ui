export type ItemVariant = 'default' | 'outline' | 'muted';
export type ItemSize = 'default' | 'sm';
export type ItemMediaVariant = 'default' | 'icon' | 'image';

/**
 * 框架无关的 Item 基础 Props（仅包含组件库自定义属性）
 */
export interface ItemBaseProps {
	/**
	 * 条目样式变体
	 */
	variant?: ItemVariant;
	/**
	 * 条目尺寸
	 */
	size?: ItemSize;
	/**
	 * 是否将根元素渲染为子元素（Slot 模式）
	 */
	asChild?: boolean;
}

/**
 * 框架无关的 ItemMedia 基础 Props（仅包含组件库自定义属性）
 */
export interface ItemMediaBaseProps {
	/**
	 * 媒体区变体
	 */
	variant?: ItemMediaVariant;
}
