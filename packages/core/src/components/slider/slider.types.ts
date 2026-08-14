export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 Slider 基础 Props (仅包含组件库自定义属性)
 */
export interface SliderBaseProps {
	orientation?: SliderOrientation;
	min?: number;
	max?: number;
	step?: number;
	value?: number;
	defaultValue?: number;
	onValueChange?: (value: number) => void;
	disabled?: boolean;
}
