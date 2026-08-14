import type { DrawerDirection } from './drawer.types';
import { capitalize } from '../../utils/helpers';

/**
 * Drawer 组件样式类名键
 */
export const drawerStyleKeys = {
	overlay: 'overlay',
	content: 'content',
	handle: 'handle',
	header: 'header',
	footer: 'footer',
	title: 'title',
	description: 'description',
	close: 'close',
	xIcon: 'xIcon',
} as const;

/**
 * Drawer 弹层开关状态
 */
export type DrawerState = 'open' | 'closed';

/**
 * 根据开关状态获取弹层状态标识 (open | closed)
 */
export function getDrawerState(open: boolean): DrawerState {
	return open ? 'open' : 'closed';
}

/**
 * 根据弹出方向获取 Drawer 内容初始位移动画 (transform) 值
 */
export function getDrawerTranslateStyle(direction: DrawerDirection): string {
	switch (direction) {
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

/**
 * 获取 Drawer 内容样式类名键 (按方向变体)
 */
export function getDrawerStyleKeys(direction: DrawerDirection = 'right') {
	return {
		base: 'content',
		variant: `direction${capitalize(direction)}`,
	};
}
