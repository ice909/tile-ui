export type FieldMessageVariant = 'default' | 'error' | 'warning' | 'success' | 'info';

/**
 * 框架无关的 Field 基础 Props（仅包含组件库自定义属性）
 */
export interface FieldBaseProps {
	/**
	 * 字段名称，用于生成稳定的辅助 ID
	 */
	name?: string;
	/**
	 * 是否处于无效状态
	 */
	invalid?: boolean;
	/**
	 * 是否必填
	 */
	required?: boolean;
}

/**
 * 框架无关的 FieldLabel 基础 Props（仅包含组件库自定义属性）
 */
export interface FieldLabelBaseProps {
	/**
	 * 标签关联的控件 ID，默认使用 Field 生成的 ID
	 */
	htmlFor?: string;
}

/**
 * 框架无关的 FieldDescription 基础 Props（仅包含组件库自定义属性）
 */
export interface FieldDescriptionBaseProps {}

/**
 * 框架无关的 FieldMessage 基础 Props（仅包含组件库自定义属性）
 */
export interface FieldMessageBaseProps {
	/**
	 * 消息样式变体
	 */
	variant?: FieldMessageVariant;
}
