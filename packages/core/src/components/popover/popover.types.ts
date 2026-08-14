export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';

export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverState = 'open' | 'closed';

/**
 * 框架无关的 Popover 基础 Props (仅包含组件库自定义属性)
 */
export interface PopoverBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 PopoverTrigger 基础 Props (仅包含组件库自定义属性)
 */
export interface PopoverTriggerBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 PopoverContent 基础 Props (仅包含组件库自定义属性)
 */
export interface PopoverContentBaseProps {
	/** 弹出方向 */
	side?: PopoverSide;
	/** 与触发元素主轴方向的对齐方式 */
	align?: PopoverAlign;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
}
