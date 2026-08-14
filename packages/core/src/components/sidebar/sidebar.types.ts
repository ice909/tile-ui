/**
 * 侧边栏展开状态
 */
export type SidebarState = 'expanded' | 'collapsed';

/**
 * 侧边栏位置
 */
export type SidebarSide = 'left' | 'right';

/**
 * 侧边栏变体
 */
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';

/**
 * 折叠方式
 */
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

/**
 * 菜单按钮尺寸
 */
export type SidebarMenuButtonSize = 'default' | 'sm' | 'lg';

/**
 * 菜单按钮变体
 */
export type SidebarMenuButtonVariant = 'default' | 'outline';

/**
 * 子菜单按钮尺寸
 */
export type SidebarMenuSubButtonSize = 'sm' | 'md';

/**
 * 嵌套菜单项
 */
export interface SidebarMenuItemDef {
	/** 唯一值 */
	value: string;
	/** 子项 */
	children?: SidebarMenuItemDef[];
}

/**
 * 侧边栏展开状态设置器 (支持函数式更新)
 */
export type SidebarSetOpen = (open: boolean | ((open: boolean) => boolean)) => void;

/**
 * 侧边栏上下文值 (框架无关部分)
 */
export interface SidebarContextValue {
	state: SidebarState;
	open: boolean;
	setOpen: SidebarSetOpen;
	isMobile: boolean;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	toggleSidebar: () => void;
}

/**
 * Sidebar 基础 Props (框架无关部分)
 */
export interface SidebarBaseProps {
	side?: SidebarSide;
	variant?: SidebarVariant;
	collapsible?: SidebarCollapsible;
}

/**
 * SidebarProvider 基础 Props
 */
export interface SidebarProviderBaseProps {
	/** 默认是否展开 (非受控) */
	defaultOpen?: boolean;
	/** 受控展开状态 */
	open?: boolean;
	/** 展开状态变化回调 */
	onOpenChange?: (open: boolean) => void;
}

/**
 * 当前激活项索引计算结果
 */
export interface SidebarActiveIndexResult {
	/** 一级项索引 (无命中为 -1) */
	itemIndex: number;
	/** 子项索引 (无子项命中为 -1) */
	subIndex: number;
	/** 是否命中子项 */
	activeSub: boolean;
}
