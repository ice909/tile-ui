export type TabsOrientation = 'horizontal' | 'vertical';

/**
 * 框架无关的 Tabs 基础 Props (仅包含组件库自定义属性)
 */
export interface TabsBaseProps {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	orientation?: TabsOrientation;
}

export interface TabsListBaseProps {}

export interface TabsTriggerBaseProps {
	value?: string;
	disabled?: boolean;
}

export interface TabsContentBaseProps {
	value?: string;
}
