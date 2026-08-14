/** 聊天气泡样式变体 */
export type BubbleVariant = 'default' | 'secondary' | 'muted' | 'tinted' | 'outline' | 'ghost' | 'destructive';

/** 气泡水平对齐方式 */
export type BubbleAlign = 'start' | 'end';

/** 气泡反应气泡的垂直位置 */
export type BubbleReactionsSide = 'top' | 'bottom';

/**
 * 框架无关的 Bubble 基础 Props (仅包含组件库自定义属性)
 */
export interface BubbleBaseProps {
	/** 气泡样式变体 */
	variant?: BubbleVariant;
	/** 水平对齐方式 */
	align?: BubbleAlign;
}

/**
 * 框架无关的 BubbleContent 基础 Props (仅包含组件库自定义属性)
 */
export interface BubbleContentBaseProps {
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 框架无关的 BubbleReactions 基础 Props (仅包含组件库自定义属性)
 */
export interface BubbleReactionsBaseProps {
	/** 相对气泡的垂直位置 */
	side?: BubbleReactionsSide;
	/** 水平对齐方式 */
	align?: BubbleAlign;
}
