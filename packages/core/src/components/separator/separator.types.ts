export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 Separator 基础 Props (仅包含组件库自定义属性)
 */
export interface SeparatorBaseProps {
	orientation?: SeparatorOrientation;
	decorative?: boolean;
}
