export type RadioGroupState = 'checked' | 'unchecked';

/**
 * 根据选中状态获取 RadioGroup 的状态标识
 */
export function getRadioState(checked: boolean): RadioGroupState {
	return checked ? 'checked' : 'unchecked';
}

/**
 * RadioGroup 组件样式类名键
 */
export const radioGroupStyleKeys = {
	root: 'root',
	label: 'label',
	input: 'input',
	item: 'item',
	indicator: 'indicator',
	dot: 'dot',
} as const;
