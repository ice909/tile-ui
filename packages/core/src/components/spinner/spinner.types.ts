export type SpinnerSize = 'sm' | 'default' | 'lg';

/**
 * 框架无关的 Spinner 基础 Props（仅包含组件库自定义属性）
 */
export interface SpinnerBaseProps {
	/**
	 * 加载指示器尺寸
	 */
	size?: SpinnerSize;
}
