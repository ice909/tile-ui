/** OTP 输入模式 */
export type InputOtpMode = 'numeric' | 'alphanumeric' | 'text';

/**
 * 框架无关的 InputOTP 基础 Props (仅包含组件库自定义属性)
 */
export interface InputOtpBaseProps {
	/** 当前值 (受控字符串) */
	value?: string;
	/** 默认值 (非受控) */
	defaultValue?: string;
	/** 最大长度 (槽位数) */
	maxLength?: number;
	/** 是否禁用 */
	disabled?: boolean;
	/** 值变化回调 */
	onChange?: (value: string) => void;
	/** 输入完成 (填满所有槽位) 回调 */
	onComplete?: (value: string) => void;
	/** 输入模式 */
	mode?: InputOtpMode;
	/** 粘贴/输入时是否过滤非法字符 */
	allowPaste?: boolean;
}

/**
 * 框架无关的 InputOTPSlot 基础 Props (仅包含组件库自定义属性)
 */
export interface InputOtpSlotBaseProps {
	/** 槽位索引 (从 0 开始) */
	index: number;
}
