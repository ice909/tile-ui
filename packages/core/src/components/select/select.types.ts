/**
 * Select 弹出方向
 */
export type SelectSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Select 与触发元素主轴方向的对齐方式
 */
export type SelectAlign = 'start' | 'center' | 'end';

/**
 * Select 开关状态
 */
export type SelectState = 'open' | 'closed';

/**
 * Select 选中/勾选状态
 */
export type SelectCheckState = 'checked' | 'unchecked';

/**
 * Select 触发按钮尺寸
 */
export type SelectTriggerSize = 'sm' | 'default';

/**
 * Select 内容定位策略
 */
export type SelectPosition = 'item-aligned' | 'popper';

/**
 * 框架无关的 Select 基础 Props (仅包含组件库自定义属性)
 */
export interface SelectBaseProps {
	/** 是否受控打开 */
	open?: boolean;
	/** 默认是否打开 (非受控) */
	defaultOpen?: boolean;
	/** 打开状态变化时的回调 */
	onOpenChange?: (open: boolean) => void;
	/** 受控选中值 */
	value?: string;
	/** 默认选中值 (非受控) */
	defaultValue?: string;
	/** 选中值变化时的回调 */
	onValueChange?: (value: string) => void;
}

/**
 * 框架无关的 SelectTrigger 基础 Props
 */
export interface SelectTriggerBaseProps {
	/** 触发按钮尺寸 */
	size?: SelectTriggerSize;
}

/**
 * 框架无关的 SelectContent 基础 Props
 */
export interface SelectContentBaseProps {
	/** 定位策略 (item-aligned 将选中项对齐到触发元素，popper 锚定触发元素) */
	position?: SelectPosition;
	/** 与触发元素主轴方向的对齐方式 */
	align?: SelectAlign;
	/** 与触发元素之间的间距 (px) */
	sideOffset?: number;
}

/**
 * 框架无关的 SelectItem 基础 Props
 */
export interface SelectItemBaseProps {
	/** 该项对应的值 */
	value: string;
	/** 是否禁用 */
	disabled?: boolean;
}
