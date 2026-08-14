export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export type TooltipState = 'open' | 'closed';

/**
 * 框架无关的 TooltipProvider 基础 Props (仅包含组件库自定义属性)
 */
export interface TooltipProviderBaseProps {
	/** 延迟打开的毫秒数 (hover/focus 后多久显示) */
	delayDuration?: number;
}

/**
 * 框架无关的 Tooltip 基础 Props (仅包含组件库自定义属性)
 */
export interface TooltipBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 TooltipTrigger 基础 Props (仅包含组件库自定义属性)
 */
export interface TooltipTriggerBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 TooltipContent 基础 Props (仅包含组件库自定义属性)
 */
export interface TooltipContentBaseProps {
	/** 弹出方向 */
	side?: TooltipSide;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
}
