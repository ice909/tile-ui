/**
 * Carousel 滚动方向
 */
export type CarouselOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 Carousel 基础 Props (仅包含组件库自定义属性)
 */
export interface CarouselBaseProps {
	/** 滚动方向，默认 'horizontal' */
	orientation?: CarouselOrientation;
}
