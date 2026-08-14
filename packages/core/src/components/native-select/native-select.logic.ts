export type NativeSelectState = 'empty' | 'selected';

/**
 * 根据当前值获取 NativeSelect 的状态标识
 */
export function getNativeSelectState(value?: string): NativeSelectState {
	return value ? 'selected' : 'empty';
}

/**
 * NativeSelect 组件样式类名键
 */
export const nativeSelectStyleKeys = {
	wrapper: 'wrapper',
	select: 'select',
	icon: 'icon',
	option: 'option',
	optGroup: 'optGroup',
} as const;
