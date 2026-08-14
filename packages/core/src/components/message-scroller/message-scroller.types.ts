/** 滚动按钮方向 */
export type MessageScrollerDirection = 'start' | 'end';

/**
 * 框架无关的 MessageScrollerItem 基础 Props (仅包含组件库自定义属性)
 */
export interface MessageScrollerItemBaseProps {
	/** 是否作为滚动锚点 (新消息到来时保持视口锚定在该条目) */
	scrollAnchor?: boolean;
}

/**
 * 框架无关的 MessageScrollerButton 基础 Props (仅包含组件库自定义属性)
 */
export interface MessageScrollerButtonBaseProps {
	/** 滚动方向 */
	direction?: MessageScrollerDirection;
}
