export type AccordionType = 'single' | 'multiple';

/**
 * 框架无关的 Accordion 基础 Props (仅包含组件库自定义属性)
 */
export interface AccordionBaseProps {
	type?: AccordionType;
	value?: string | string[];
	defaultValue?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	collapsible?: boolean;
}

export interface AccordionItemBaseProps {
	value?: string;
	disabled?: boolean;
}

export interface AccordionTriggerBaseProps {}
export interface AccordionContentBaseProps {}
