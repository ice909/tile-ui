/** 消息行水平对齐方式 */
export type MessageAlign = 'start' | 'end';

/**
 * 框架无关的 Message 基础 Props (仅包含组件库自定义属性)
 */
export interface MessageBaseProps {
	/** 水平对齐方式 */
	align?: MessageAlign;
}
