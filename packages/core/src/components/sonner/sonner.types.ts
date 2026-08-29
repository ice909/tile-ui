/** 提示条展示位置 */
export type SonnerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

/** 提示条类型 */
export type SonnerType = 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading';

/** 提示条主题 */
export type SonnerTheme = 'light' | 'dark' | 'system';

/**
 * 单个提示条实例
 */
export interface SonnerToast {
	id: string;
	type: SonnerType;
	title?: string;
	description?: string;
	position?: SonnerPosition;
	duration?: number;
	dismissible?: boolean;
	richColors?: boolean;
	/** 是否正在消失 (用于退出动画) */
	dismissing?: boolean;
}

/** 提示条可更新字段；实例 ID 与消失状态由存储生命周期管理。 */
export type SonnerToastUpdate = Partial<Omit<SonnerToast, 'id' | 'dismissing'>>;

/**
 * 创建提示条的输入参数
 */
export interface SonnerAddInput {
	id?: string;
	type?: SonnerType;
	title?: string;
	description?: string;
	position?: SonnerPosition;
	duration?: number;
	dismissible?: boolean;
	richColors?: boolean;
}

/**
 * 框架无关的 Toaster 基础 Props (仅包含组件库自定义属性)
 */
export interface SonnerToasterBaseProps {
	/** 默认展示位置 */
	position?: SonnerPosition;
	/** 默认自动消失时长 (ms) */
	duration?: number;
	/** 是否显示关闭按钮 */
	closeButton?: boolean;
	/** 是否使用富色 (按类型着色) */
	richColors?: boolean;
	/** 主题；未指定时继承宿主主题 */
	theme?: SonnerTheme;
}
