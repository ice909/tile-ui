export type SwitchState = 'checked' | 'unchecked';

/**
 * 根据布尔值获取 Switch 的状态标识
 */
export function getSwitchState(checked: boolean): SwitchState {
	return checked ? 'checked' : 'unchecked';
}

/**
 * Switch 组件样式类名键
 */
export const switchStyleKeys = {
	root: 'root',
	thumb: 'thumb',
} as const;
