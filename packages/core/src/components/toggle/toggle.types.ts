export type ToggleVariant = 'default' | 'outline' | 'ghost';
export type ToggleSize = 'sm' | 'default' | 'lg';

/**
 * 框架无关的 Toggle 基础 Props（仅包含组件库自定义属性）
 */
export interface ToggleBaseProps {
	/**
	 * 切换按钮样式变体
	 */
	variant?: ToggleVariant;
	/**
	 * 切换按钮尺寸
	 */
	size?: ToggleSize;
}
