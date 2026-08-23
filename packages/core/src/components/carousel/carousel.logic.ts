import type { CarouselOrientation } from './carousel.types';

/**
 * Carousel 组件样式类名键
 */
export const carouselStyleKeys = {
	root: 'root',
	viewport: 'viewport',
	container: 'container',
	item: 'item',
	previous: 'previous',
	next: 'next',
} as const;

/**
 * 获取滚动容器当前的滚动位置 (水平: scrollLeft / 垂直: scrollTop)
 */
export function getCarouselScrollPosition(element: HTMLElement, orientation: CarouselOrientation): number {
	return orientation === 'horizontal' ? element.scrollLeft : element.scrollTop;
}

/**
 * 获取滚动容器单页尺寸 (水平: clientWidth / 垂直: clientHeight)
 */
export function getCarouselScrollSize(element: HTMLElement, orientation: CarouselOrientation): number {
	return orientation === 'horizontal' ? element.clientWidth : element.clientHeight;
}

/**
 * 获取 item 相对首个 item 的滚动目标位置，保持容器 gutter 一致
 */
export function getCarouselItemScrollPosition(firstItem: HTMLElement, item: HTMLElement, orientation: CarouselOrientation): number {
	const firstItemRect = firstItem.getBoundingClientRect();
	const itemRect = item.getBoundingClientRect();
	return orientation === 'horizontal' ? itemRect.left - firstItemRect.left : itemRect.top - firstItemRect.top;
}

/**
 * 获取滚动容器最大可滚动距离
 */
export function getCarouselMaxScroll(element: HTMLElement, orientation: CarouselOrientation): number {
	return orientation === 'horizontal' ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
}

/**
 * 判断是否可以向前滚动 (位置大于 0)
 */
export function getCarouselCanScrollPrev(position: number): boolean {
	return position > 0;
}

/**
 * 判断是否可以向后滚动 (位置小于最大滚动距离)
 */
export function getCarouselCanScrollNext(position: number, maxScroll: number): boolean {
	return position < maxScroll;
}

/**
 * 根据滚动位置与单页尺寸计算当前激活的 item 索引
 */
export function getCarouselSelectedIndex(position: number, itemSize: number): number {
	if (itemSize <= 0) {
		return 0;
	}
	return Math.round(position / itemSize);
}

/**
 * 将滚动位置限制在 [0, maxScroll] 区间内
 */
export function clampCarouselScroll(position: number, maxScroll: number): number {
	return Math.max(0, Math.min(position, maxScroll));
}
