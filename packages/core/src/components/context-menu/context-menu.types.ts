/**
 * ContextMenu 开关状态
 */
export type ContextMenuState = 'open' | 'closed';

/**
 * ContextMenu 选中/勾选状态
 */
export type ContextMenuCheckState = 'checked' | 'unchecked';

/**
 * ContextMenu 菜单项样式变体
 */
export type ContextMenuItemVariant = 'default' | 'destructive';

/**
 * 框架无关的 ContextMenu 基础 Props (仅包含组件库自定义属性)
 */
export interface ContextMenuBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 ContextMenuTrigger 基础 Props
 */
export interface ContextMenuTriggerBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 ContextMenuItem 基础 Props
 */
export interface ContextMenuItemBaseProps {
	/** 是否缩进 (配合前置图标使用) */
	inset?: boolean;
	/** 样式变体 */
	variant?: ContextMenuItemVariant;
	/** 是否禁用 */
	disabled?: boolean;
	/** 选中触发时的回调 */
	onSelect?: (event: Event) => void;
}

/**
 * 框架无关的 ContextMenuCheckboxItem 基础 Props
 */
export interface ContextMenuCheckboxItemBaseProps {
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
 * 框架无关的 ContextMenuRadioGroup 基础 Props
 */
export interface ContextMenuRadioGroupBaseProps {
	/** 受控选中值 */
	value?: string;
	/** 默认选中值 (非受控) */
	defaultValue?: string;
	/** 选中值变化时的回调 */
	onValueChange?: (value: string) => void;
}

/**
 * 框架无关的 ContextMenuRadioItem 基础 Props
 */
export interface ContextMenuRadioItemBaseProps {
	/** 该项对应的值 */
	value: string;
	/** 是否禁用 */
	disabled?: boolean;
}

/**
 * 框架无关的 ContextMenuLabel 基础 Props
 */
export interface ContextMenuLabelBaseProps {
	/** 是否缩进 */
	inset?: boolean;
}

/**
 * 框架无关的 ContextMenuSub 基础 Props
 */
export interface ContextMenuSubBaseProps {
	/** 是否受控展开 */
	open?: boolean;
	/** 默认是否展开 (非受控) */
	defaultOpen?: boolean;
	/** 展开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 ContextMenuSubTrigger 基础 Props
 */
export interface ContextMenuSubTriggerBaseProps {
	/** 是否缩进 */
	inset?: boolean;
	/** 是否禁用 */
	disabled?: boolean;
}
