import type { InputGroupVariant } from './input-group.types';
import { capitalize } from '../../utils/helpers';

/**
 * InputGroup 组件样式类名键
 */
export const inputGroupStyleKeys = {
	base: 'inputGroup',
	addon: 'addon',
	button: 'button',
	text: 'text',
	input: 'input',
	textarea: 'textarea',
} as const;

/**
 * 获取 InputGroup 的样式类名键（含变体）
 */
export function getInputGroupStyleKeys(variant: InputGroupVariant = 'default') {
	return {
		base: 'inputGroup',
		variant: `variant${capitalize(variant)}`,
	};
}

/**
 * 获取 InputGroupAddon 的样式类名键（含变体）
 */
export function getInputGroupAddonStyleKeys(variant: InputGroupVariant = 'default') {
	return {
		base: 'addon',
		variant: `variant${capitalize(variant)}`,
	};
}
