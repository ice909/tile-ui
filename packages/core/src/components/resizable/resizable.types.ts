/**
 * Resizable 分割方向
 */
export type ResizableDirection = 'horizontal' | 'vertical';

/**
 * 框架无关的 ResizablePanelGroup 基础 Props
 */
export interface ResizablePanelGroupBaseProps {
	/** 分割方向，默认 'horizontal' */
	direction?: ResizableDirection;
	/** 可选持久化标识 (用于 localStorage 记住各面板尺寸) */
	id?: string;
}
