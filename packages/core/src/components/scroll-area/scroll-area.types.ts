export type ScrollBarOrientation = 'vertical' | 'horizontal';

/**
 * 框架无关的 ScrollArea 基础 Props (仅包含组件库自定义属性)
 */
export interface ScrollAreaBaseProps {}

export interface ScrollBarBaseProps {
	orientation?: ScrollBarOrientation;
}
