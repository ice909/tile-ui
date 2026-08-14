import type { CheckboxCheckedState } from './checkbox.types';

export type CheckboxState = 'checked' | 'unchecked' | 'mixed';

/**
 * 根据选中状态获取 Checkbox 的状态标识
 */
export function getCheckboxState(checked: CheckboxCheckedState): CheckboxState {
	if (checked === 'indeterminate') {
		return 'mixed';
	}
	return checked ? 'checked' : 'unchecked';
}

/**
 * 计算点击后 Checkbox 的下一个选中状态
 */
export function getNextCheckboxState(checked: CheckboxCheckedState): CheckboxCheckedState {
	return checked === true ? false : true;
}

/**
 * Checkbox 组件样式类名键
 */
export const checkboxStyleKeys = {
	root: 'root',
	indicator: 'indicator',
} as const;
