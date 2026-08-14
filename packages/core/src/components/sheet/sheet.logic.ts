import type { SheetSide } from './sheet.types';

/**
 * Sheet 组件样式类名键
 */
export const sheetStyleKeys = {
	overlay: 'overlay',
	content: 'content',
	close: 'close',
	header: 'header',
	footer: 'footer',
	title: 'title',
	description: 'description',
	xIcon: 'xIcon',
} as const;

/**
 * Sheet 弹层开关状态
 */
export type SheetState = 'open' | 'closed';

/**
 * 根据开关状态获取弹层状态标识 (open | closed)
 */
export function getSheetState(open: boolean): SheetState {
	return open ? 'open' : 'closed';
}

/**
 * 根据弹出方向获取 Sheet 内容初始位移动画 (transform) 值
 */
export function getSheetTranslateStyle(side: SheetSide): string {
	switch (side) {
		case 'left':
			return 'translateX(-100%)';
		case 'right':
			return 'translateX(100%)';
		case 'top':
			return 'translateY(-100%)';
		case 'bottom':
			return 'translateY(100%)';
	}
}
