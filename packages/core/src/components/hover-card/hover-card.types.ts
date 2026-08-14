export type HoverCardSide = 'top' | 'right' | 'bottom' | 'left';

export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardState = 'open' | 'closed';

/**
 * 框架无关的 HoverCard 基础 Props (仅包含组件库自定义属性)
 */
export interface HoverCardBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** hover/focus 后延迟打开的毫秒数 */
	openDelay?: number;
	/** 移出后延迟关闭的毫秒数 */
	closeDelay?: number;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 框架无关的 HoverCardTrigger 基础 Props (仅包含组件库自定义属性)
 */
export interface HoverCardTriggerBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 HoverCardContent 基础 Props (仅包含组件库自定义属性)
 */
export interface HoverCardContentBaseProps {
	/** 弹出方向 */
	side?: HoverCardSide;
	/** 与触发元素主轴方向的对齐方式 */
	align?: HoverCardAlign;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
}
