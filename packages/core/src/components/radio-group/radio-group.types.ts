export type RadioGroupOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 RadioGroup 基础 Props (仅包含组件库自定义属性)
 */
export interface RadioGroupBaseProps {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	orientation?: RadioGroupOrientation;
	name?: string;
	disabled?: boolean;
}

export interface RadioGroupItemBaseProps {
	value?: string;
	disabled?: boolean;
}
