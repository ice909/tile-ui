import type { ScrollBarOrientation } from './scroll-area.types';

/**
 * 滚动条尺寸键（对应 SCSS 中的尺寸类名）
 */
export type ScrollBarSizeKey = 'vertical' | 'horizontal';

/**
 * 根据滚动条方向获取尺寸键
 */
export function getScrollBarSizeKey(orientation: ScrollBarOrientation): ScrollBarSizeKey {
	return orientation;
}

/**
 * ScrollArea 组件样式类名键
 */
export const scrollAreaStyleKeys = {
	root: 'root',
	viewport: 'viewport',
	scrollbar: 'scrollbar',
	thumb: 'thumb',
	vertical: 'vertical',
	horizontal: 'horizontal',
} as const;
