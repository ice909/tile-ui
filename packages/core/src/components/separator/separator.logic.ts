import type { SeparatorOrientation } from './separator.types';

/**
 * 获取 Separator 的样式类名键
 */
export function getSeparatorStyleKeys(orientation: SeparatorOrientation = 'horizontal') {
	return {
		base: 'separator',
		orientation: `orientation${orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}`,
	};
}
