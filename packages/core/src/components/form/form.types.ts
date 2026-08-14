/**
 * 表单字段值集合
 */
export type FormValues = Record<string, unknown>;

/**
 * 表单字段错误信息
 */
export interface FormFieldError {
	/** 错误类型 */
	type?: string;
	/** 错误消息 */
	message?: string;
}

/**
 * 表单错误集合 (键为字段路径)
 */
export type FormErrors = Record<string, FormFieldError>;

/**
 * 单个校验规则
 */
export interface FormValidationRule<T = unknown> {
	/** 规则值 */
	value: T;
	/** 错误消息 */
	message?: string;
}

/**
 * 自定义校验函数 (返回 string 表示错误消息，boolean 表示通过；支持异步)
 */
export type FormValidateFunction = (value: unknown, values: FormValues) => string | boolean | Promise<string | boolean>;

/**
 * 字段注册选项
 */
export interface FormRegisterOptions {
	/** 必填校验 */
	required?: string | boolean;
	/** 正则校验 */
	pattern?: FormValidationRule<RegExp>;
	/** 最小长度 */
	minLength?: FormValidationRule<number>;
	/** 最大长度 */
	maxLength?: FormValidationRule<number>;
	/** 最小值 */
	min?: FormValidationRule<number>;
	/** 最大值 */
	max?: FormValidationRule<number>;
	/** 自定义校验 */
	validate?: FormValidateFunction | Record<string, FormValidateFunction>;
	/** 依赖字段 (变更时触发本字段重校验) */
	deps?: string[];
	/** 将输入转为数字 */
	valueAsNumber?: boolean;
}

/**
 * 字段注册结果 (框架无关)
 */
export interface FormRegistration {
	name: string;
	/** 变更处理器 (入参为事件对象或原始值) */
	onChange: (value: unknown) => void;
	/** 失焦处理器 */
	onBlur: () => void;
	/** 字段名称 (框架可据此生成 DOM ref) */
	ref: string;
}

/**
 * 字段状态
 */
export interface FormFieldState {
	/** 当前错误 */
	error?: FormFieldError;
	/** 是否已触碰 */
	isTouched: boolean;
	/** 是否已修改 */
	isDirty: boolean;
	/** 字段值 */
	value: unknown;
}

/**
 * 表单快照 (供 React useSyncExternalStore / Vue reactive 使用)
 */
export interface FormSnapshot {
	values: FormValues;
	errors: FormErrors;
	touched: Record<string, boolean>;
	dirty: Record<string, boolean>;
	isSubmitting: boolean;
	isSubmitted: boolean;
	submitCount: number;
	version: number;
}

/**
 * formState 派生状态 (与 react-hook-form formState 对齐)
 */
export interface FormFormState {
	errors: FormErrors;
	/** 已触碰字段集合 */
	touched: Record<string, boolean>;
	/** 已修改字段集合 */
	dirty: Record<string, boolean>;
	isSubmitting: boolean;
	isSubmitted: boolean;
	/** 是否存在已修改字段 */
	isDirty: boolean;
	/** 当前是否有错误 */
	isValid: boolean;
	submitCount: number;
}

/**
 * setValue 选项
 */
export interface FormSetValueOptions {
	shouldValidate?: boolean;
	shouldDirty?: boolean;
	shouldTouch?: boolean;
}

/**
 * reset 选项
 */
export interface FormResetOptions {
	/** 保留当前值 */
	keepValues?: boolean;
	keepErrors?: boolean;
	keepDirty?: boolean;
	keepTouched?: boolean;
	/** 保留已提交标记 */
	keepIsSubmitted?: boolean;
	/** 保留提交次数 */
	keepSubmitCount?: boolean;
}

/**
 * setError 选项
 */
export interface FormSetErrorOptions {
	/** 是否聚焦到出错的字段 (需要框架提供元素引用) */
	shouldFocus?: boolean;
}

/**
 * handleSubmit 参数 (与 react-hook-form 兼容)
 */
export interface FormSubmitHandler {
	/** 校验通过时的回调 */
	onValid: (values: FormValues, event?: unknown) => void | Promise<void>;
	/** 校验失败时的回调 */
	onInvalid?: (errors: FormErrors, event?: unknown) => void;
}

/**
 * 表单字段 ID 集合
 */
export interface FormFieldIds {
	/** 表单项根 ID */
	id: string;
	/** 控件 ID */
	formItemId: string;
	/** 描述 ID */
	formDescriptionId: string;
	/** 消息 ID */
	formMessageId: string;
}

/**
 * Form 基础 Props (框架无关部分)
 */
export interface FormBaseProps {
	/** 初始值 */
	defaultValues?: FormValues;
	/** 校验解析器 (整体校验，返回错误集合；支持异步) */
	resolver?: (values: FormValues) => FormErrors | Promise<FormErrors>;
	/** 表单实例 */
	form?: unknown;
}

/**
 * useForm 配置
 */
export interface UseFormOptions<TValues extends FormValues = FormValues> {
	/** 初始值 (支持惰性初始化) */
	defaultValues?: TValues | (() => TValues);
	/** 整体校验解析器 (支持异步) */
	resolver?: (values: TValues) => FormErrors | Promise<FormErrors>;
}

/**
 * 数组字段条目 (带稳定 id，供渲染 key 使用)
 */
export interface FormFieldArrayItem {
	/** 稳定 id */
	id: string;
	/** 数组元素原始值 (对象元素通过展开字段呈现) */
	value?: unknown;
	/** 对象元素的字段 (若原始值是对象则展开) */
	[key: string]: unknown;
}

/**
 * 控制器字段渲染入参 (供 React render prop / Vue 作用域插槽使用)
 */
export interface FormControllerField {
	name: string;
	value: unknown;
	onChange: (value: unknown) => void;
	onBlur: () => void;
	/** 字段名称 (框架据此生成 DOM ref) */
	ref: string;
}
