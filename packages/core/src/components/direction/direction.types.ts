/** 文档阅读方向 */
export type DirectionValue = 'ltr' | 'rtl';

/**
 * 框架无关的 DirectionProvider 基础 Props (仅包含组件库自定义属性)
 */
export interface DirectionBaseProps {
	/** 阅读方向 */
	dir?: DirectionValue;
}
