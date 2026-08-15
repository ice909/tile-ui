import type { ButtonGroupOrientation } from './button-group.types';
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
 * 获取 ButtonGroup 的样式类名键（含排列方向）
 */
export function getButtonGroupStyleKeys(orientation: ButtonGroupOrientation = 'horizontal') {
	return {
		base: 'buttonGroup',
		orientation: `orientation${capitalize(orientation)}`,
	};
}
