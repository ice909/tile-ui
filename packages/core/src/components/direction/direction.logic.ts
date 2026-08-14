import type { DirectionValue } from './direction.types';

/**
 * Direction 组件样式类名键 (方向切换通常无需样式，仅保留占位)
 */
export const directionStyleKeys = {
	root: 'root',
} as const;

/**
 * 规范化阅读方向 (非法值回退到 ltr)
 */
export function normalizeDirection(dir: DirectionValue | undefined): DirectionValue {
	return dir === 'rtl' ? 'rtl' : 'ltr';
}
