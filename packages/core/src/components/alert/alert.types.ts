export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

/**
 * 框架无关的 Alert 基础 Props（仅包含组件库自定义属性）
 */
export interface AlertBaseProps {
	/**
	 * 提示样式变体
	 */
	variant?: AlertVariant;
}
