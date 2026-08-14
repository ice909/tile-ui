import type { ToggleVariant, ToggleSize } from './toggle.types';
import { capitalize } from '../../utils/helpers';

export type ToggleState = 'on' | 'off';

/**
 * 根据按压状态获取 Toggle 的状态标识
 */
export function getToggleState(pressed: boolean): ToggleState {
	return pressed ? 'on' : 'off';
}

/**
 * Toggle 组件样式类名键
 */
export const toggleStyleKeys = {
	base: 'toggle',
} as const;

/**
 * 获取 Toggle 的样式类名键（含变体与尺寸）
 */
export function getToggleStyleKeys(variant: ToggleVariant = 'default', size: ToggleSize = 'default') {
	return {
		base: 'toggle',
		variant: `variant${capitalize(variant)}`,
		size: `size${capitalize(size)}`,
	};
}
