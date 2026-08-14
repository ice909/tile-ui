/**
 * NavigationMenu 开关状态
 */
export type NavigationMenuState = 'open' | 'closed';

/**
 * NavigationMenu 激活状态
 */
export type NavigationMenuActiveState = 'active' | 'inactive';

/**
 * 框架无关的 NavigationMenu 基础 Props (仅包含组件库自定义属性)
 */
export interface NavigationMenuBaseProps {
	/** 是否使用集中式视口 (默认 true；false 时内容直接渲染在菜单项下方) */
	viewport?: boolean;
	/** 当前激活的菜单项值 */
	value?: string;
	/** 默认激活的菜单项值 (非受控) */
	defaultValue?: string;
	/** 激活的菜单项值变化时的回调 */
	onValueChange?: (value: string | undefined) => void;
}

/**
 * 框架无关的 NavigationMenuItem 基础 Props
 */
export interface NavigationMenuItemBaseProps {
	/** 菜单项标识值 */
	value: string;
}

/**
 * 框架无关的 NavigationMenuLink 基础 Props
 */
export interface NavigationMenuLinkBaseProps {
	/** 是否为激活链接 */
	active?: boolean;
	/** 是否合并渲染到子元素上 (需唯一根节点) */
	asChild?: boolean;
}

/**
 * 导航菜单内容尺寸 (由框架测量传入，用于视口动画)
 */
export interface NavigationMenuContentSize {
	width: number;
	height: number;
}

/**
 * 导航菜单触发器位置 (相对根节点，用于指示器定位)
 */
export interface NavigationMenuTriggerRect {
	left: number;
	width: number;
}
