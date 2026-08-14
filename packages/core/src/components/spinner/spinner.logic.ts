import type { SpinnerSize } from './spinner.types';

/**
 * Spinner 组件样式类名键
 */
export const spinnerStyleKeys = {
	root: 'root',
} as const;

/**
 * 归一化 Spinner 尺寸
 */
export function getSpinnerSize(size: SpinnerSize = 'default'): SpinnerSize {
	return size;
}
