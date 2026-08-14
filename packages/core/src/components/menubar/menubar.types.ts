/**
 * Menubar 弹出方向
 */
export type MenubarSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Menubar 与触发元素主轴方向的对齐方式
 */
export type MenubarAlign = 'start' | 'center' | 'end';

/**
 * Menubar 开关状态
 */
export type MenubarState = 'open' | 'closed';

/**
 * Menubar 选中/勾选状态
 */
export type MenubarCheckState = 'checked' | 'unchecked';

/**
 * Menubar 菜单项样式变体
 */
export type MenubarItemVariant = 'default' | 'destructive';

/**
 * 框架无关的 Menubar 基础 Props (仅包含组件库自定义属性)
 */
export interface MenubarBaseProps {
	/** 当前打开的菜单值 */
	value?: string;
	/** 默认打开的菜单值 (非受控) */
	defaultValue?: string;
	/** 打开的菜单值变化时的回调 */
	onValueChange?: (value: string | undefined) => void;
}

/**
 * 框架无关的 MenubarMenu 基础 Props
 */
export interface MenubarMenuBaseProps {
	/** 菜单标识值 */
	value: string;
}

/**
 * 框架无关的 MenubarTrigger 基础 Props
 */
export interface MenubarTriggerBaseProps {
	/** 是否禁用 */
	disabled?: boolean;
}

/**
 * 框架无关的 MenubarContent 基础 Props
 */
export interface MenubarContentBaseProps {
	/** 弹出方向 */
	side?: MenubarSide;
	/** 与触发元素主轴方向的对齐方式 */
	align?: MenubarAlign;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
	/** 对齐方向上的额外偏移 (px) */
	alignOffset?: number;
}

/**
 * 框架无关的 MenubarItem 基础 Props
 */
export interface MenubarItemBaseProps {
	/** 是否缩进 (配合前置图标使用) */
	inset?: boolean;
	/** 样式变体 */
	variant?: MenubarItemVariant;
	/** 是否禁用 */
	disabled?: boolean;
	/** 选中触发时的回调 */
	onSelect?: (event: Event) => void;
}

/**
 * 框架无关的 MenubarCheckboxItem 基础 Props
 */
export interface MenubarCheckboxItemBaseProps {
	/** 是否受控勾选 */
	checked?: boolean;
	/** 默认是否勾选 (非受控) */
	defaultChecked?: boolean;
	/** 勾选状态变化时的回调 */
	onCheckedChange?: (checked: boolean) => void;
	/** 是否禁用 */
	disabled?: boolean;
}

/**
 * 框架无关的 MenubarRadioGroup 基础 Props
 */
export interface MenubarRadioGroupBaseProps {
	/** 受控选中值 */
	value?: string;
	/** 默认选中值 (非受控) */
	defaultValue?: string;
	/** 选中值变化时的回调 */
	onValueChange?: (value: string) => void;
}

/**
 * 框架无关的 MenubarRadioItem 基础 Props
 */
export interface MenubarRadioItemBaseProps {
	/** 该项对应的值 */
	value: string;
	/** 是否禁用 */
	disabled?: boolean;
}

/**
 * 框架无关的 MenubarLabel 基础 Props
 */
export interface MenubarLabelBaseProps {
	/** 是否缩进 */
	inset?: boolean;
}

/**
 * 框架无关的 MenubarSub 基础 Props
 */
export interface MenubarSubBaseProps {
	/** 是否受控展开 */
	open?: boolean;
	/** 默认是否展开 (非受控) */
	defaultOpen?: boolean;
	/** 展开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 MenubarSubTrigger 基础 Props
 */
export interface MenubarSubTriggerBaseProps {
	/** 是否缩进 */
	inset?: boolean;
	/** 是否禁用 */
	disabled?: boolean;
}
