import type { ButtonGroupVariant, ButtonGroupSize } from './button-group.types';
import { capitalize } from '../../utils/helpers';

/**
 * ButtonGroup 组件样式类名键
 */
export const buttonGroupStyleKeys = {
	base: 'buttonGroup',
	text: 'text',
	separator: 'separator',
} as const;

/**
 * 获取 ButtonGroup 的样式类名键（含变体与尺寸）
 */
export function getButtonGroupStyleKeys(variant: ButtonGroupVariant = 'default', size: ButtonGroupSize = 'default') {
	return {
		base: 'buttonGroup',
		variant: `variant${capitalize(variant)}`,
		size: `size${capitalize(size)}`,
	};
}
