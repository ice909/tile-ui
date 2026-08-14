/**
 * DropdownMenu 弹出方向
 */
export type DropdownMenuSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * DropdownMenu 与触发元素主轴方向的对齐方式
 */
export type DropdownMenuAlign = 'start' | 'center' | 'end';

/**
 * DropdownMenu 开关状态
 */
export type DropdownMenuState = 'open' | 'closed';

/**
 * DropdownMenu 选中/勾选状态
 */
export type DropdownMenuCheckState = 'checked' | 'unchecked';

/**
 * DropdownMenu 菜单项样式变体
 */
export type DropdownMenuItemVariant = 'default' | 'destructive';

/**
 * 框架无关的 DropdownMenu 基础 Props (仅包含组件库自定义属性)
 */
export interface DropdownMenuBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 DropdownMenuTrigger 基础 Props
 */
export interface DropdownMenuTriggerBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 DropdownMenuContent 基础 Props
 */
export interface DropdownMenuContentBaseProps {
	/** 弹出方向 */
	side?: DropdownMenuSide;
	/** 与触发元素主轴方向的对齐方式 */
	align?: DropdownMenuAlign;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
	/** 对齐方向上的额外偏移 (px) */
	alignOffset?: number;
}

/**
 * 框架无关的 DropdownMenuItem 基础 Props
 */
export interface DropdownMenuItemBaseProps {
	/** 是否缩进 (配合前置图标使用) */
	inset?: boolean;
	/** 样式变体 */
	variant?: DropdownMenuItemVariant;
	/** 是否禁用 */
	disabled?: boolean;
	/** 选中触发时的回调 */
	onSelect?: (event: Event) => void;
}

/**
 * 框架无关的 DropdownMenuCheckboxItem 基础 Props
 */
export interface DropdownMenuCheckboxItemBaseProps {
	/** 是否受控勾选 */
	checked?: boolean;
	/** 默认是否勾选 (非受控) */
	defaultChecked?: boolean;
	/** 勾选状态变化时的回调 */
	onCheckedChange?: (checked: boolean) => void;
	/** 是否禁用 */
	disabled?: boolean;
	/** 选中触发时的回调 */
	onSelect?: (event: Event) => void;
}

/**
 * 框架无关的 DropdownMenuRadioGroup 基础 Props
 */
export interface DropdownMenuRadioGroupBaseProps {
	/** 受控选中值 */
	value?: string;
	/** 默认选中值 (非受控) */
	defaultValue?: string;
	/** 选中值变化时的回调 */
	onValueChange?: (value: string) => void;
}

/**
 * 框架无关的 DropdownMenuRadioItem 基础 Props
 */
export interface DropdownMenuRadioItemBaseProps {
	/** 该项对应的值 */
	value: string;
	/** 是否禁用 */
	disabled?: boolean;
	/** 选中触发时的回调 */
	onSelect?: (event: Event) => void;
}

/**
 * 框架无关的 DropdownMenuLabel 基础 Props
 */
export interface DropdownMenuLabelBaseProps {
	/** 是否缩进 */
	inset?: boolean;
}

/**
 * 框架无关的 DropdownMenuSub 基础 Props
 */
export interface DropdownMenuSubBaseProps {
	/** 是否受控展开 */
	open?: boolean;
	/** 默认是否展开 (非受控) */
	defaultOpen?: boolean;
	/** 展开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 DropdownMenuSubTrigger 基础 Props
 */
export interface DropdownMenuSubTriggerBaseProps {
	/** 是否缩进 */
	inset?: boolean;
	/** 是否禁用 */
	disabled?: boolean;
}
