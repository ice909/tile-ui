import type { MessageScrollerDirection } from './message-scroller.types';

/**
 * MessageScroller 组件样式类名键
 */
export const messageScrollerStyleKeys = {
	root: 'root',
	viewport: 'viewport',
	content: 'content',
	item: 'item',
	button: 'button',
} as const;

/**
 * 获取 MessageScrollerButton 方向样式类名键
 */
export function getMessageScrollerButtonStyleKeys(direction: MessageScrollerDirection = 'end') {
	return {
		base: messageScrollerStyleKeys.button,
		direction: `direction${direction === 'start' ? 'Start' : 'End'}`,
	};
}

/**
 * 判断视口是否接近底部 (用于自动吸底与按钮显隐)
 */
export function isScrollerNearBottom(element: HTMLElement, threshold: number = 80): boolean {
	const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
	return distance <= threshold;
}

/**
 * 滚动视口到底部
 */
export function scrollScrollerToEnd(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
	element.scrollTo({ top: element.scrollHeight, behavior });
}

/**
 * 滚动视口到顶部
 */
export function scrollScrollerToStart(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
	element.scrollTo({ top: 0, behavior });
}
