/**
 * Drawer 弹出方向
 */
export type DrawerDirection = 'top' | 'bottom' | 'left' | 'right';

/**
 * 框架无关的 Drawer 基础 Props (仅包含组件库自定义属性)
 */
export interface DrawerBaseProps {
	/**
	 * 弹出方向
	 */
	direction?: DrawerDirection;
	/**
	 * 是否模态 (模态时展示遮罩并拦截遮罩点击关闭)
	 */
	modal?: boolean;
	/**
	 * 受控打开状态
	 */
	open?: boolean;
	/**
	 * 非受控初始打开状态
	 */
	defaultOpen?: boolean;
	/**
	 * 打开状态变化回调
	 */
	onOpenChange?: (open: boolean) => void;
}
