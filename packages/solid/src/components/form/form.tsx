import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, splitProps, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { createFormStore, formStyleKeys, getFormFieldIds, normalizeFormValue, FormStore } from '@tile-ui/core';
import type { FormBaseProps, FormControllerField, FormFieldError, FormRegisterOptions, FormSnapshot } from '@tile-ui/core';
import { createFormStoreSnapshot, useRequiredContext } from '../../utils';
import { Label } from '../label';
import styles from '@tile-ui/styles/scss/components/form.module.scss';

interface FormContextValue {
	store: FormStore;
	snapshot: Accessor<FormSnapshot>;
}

interface FormFieldContextValue {
	name: Accessor<string>;
	required: Accessor<boolean>;
}

interface FormItemContextValue {
	id: Accessor<string>;
	declaredDescriptionId: Accessor<string | undefined>;
	declaredMessageId: Accessor<string | undefined>;
	descriptionIds: Accessor<string[]>;
	messageIds: Accessor<string[]>;
	registerDescription: (id: Accessor<string>) => () => void;
	registerMessage: (id: Accessor<string>) => () => void;
}

const FormContext = createContext<FormContextValue>();
const FormFieldContext = createContext<FormFieldContextValue>();
const FormItemContext = createContext<FormItemContextValue>();

export interface FormResult {
	/** 底层 FormStore；提交、重置和命令式操作均通过它完成。 */
	store: FormStore;
	/** 响应式表单快照。 */
	snapshot: Accessor<FormSnapshot>;
}

/** 读取当前 Form provider 的存储与响应式快照。 */
export function useForm(): FormResult {
	return useRequiredContext(FormContext, 'useForm');
}

export interface FormFieldResult {
	id: Accessor<string>;
	name: Accessor<string>;
	formItemId: Accessor<string>;
	formDescriptionId: Accessor<string>;
	formMessageId: Accessor<string>;
	error: Accessor<FormFieldError | undefined>;
	isTouched: Accessor<boolean>;
	isDirty: Accessor<boolean>;
	isRequired: Accessor<boolean>;
	descriptionIds: Accessor<string[]>;
	messageIds: Accessor<string[]>;
}

/** 读取当前字段的响应式状态与稳定 ARIA ID。 */
export function useFormField(): FormFieldResult {
	const form = useRequiredContext(FormContext, 'useFormField');
	const field = useRequiredContext(FormFieldContext, 'useFormField');
	const item = useRequiredContext(FormItemContext, 'useFormField');
	const ids = () => getFormFieldIds(item.id());
	const state = () => {
		void form.snapshot();
		return form.store.getFieldState(field.name());
	};

	return {
		id: () => ids().id,
		name: field.name,
		formItemId: () => ids().formItemId,
		formDescriptionId: () => ids().formDescriptionId,
		formMessageId: () => ids().formMessageId,
		error: () => state().error,
		isTouched: () => state().isTouched,
		isDirty: () => state().isDirty,
		isRequired: field.required,
		descriptionIds: item.descriptionIds,
		messageIds: item.messageIds,
	};
}

export interface FormProps extends FormBaseProps {
	form?: FormStore;
	children?: JSX.Element;
}

/**
 * 表单状态 provider。该组件不渲染原生 form；提交语义由使用方的 <form> 提供。
 */
export function Form(props: FormProps) {
	const defaultValues = props.defaultValues ?? {};
	const store = props.form ?? createFormStore(defaultValues, props.resolver);
	const value: FormContextValue = {
		store,
		snapshot: createFormStoreSnapshot(store),
	};

	return <FormContext.Provider value={value}>{props.children}</FormContext.Provider>;
}

export interface FormFieldProps extends FormRegisterOptions {
	name: string;
	children?: (props: { field: FormControllerField }) => JSX.Element;
	render?: (props: { field: FormControllerField }) => JSX.Element;
}

/** 注册字段，并通过 render function 提供响应式字段控制器。 */
export function FormField(props: FormFieldProps) {
	const form = useRequiredContext(FormContext, 'FormField');
	const [local, options] = splitProps(props, ['name', 'children', 'render']);
	const required = () => !!options.required;

	createEffect(() => {
		const name = local.name;
		const registrationOptions: FormRegisterOptions = { ...options };
		const registration = form.store.registerField(name, registrationOptions);
		onCleanup(registration.unregister);
	});

	const field: FormControllerField = {
		get name() {
			return local.name;
		},
		get value() {
			void form.snapshot();
			return form.store.getValue(local.name);
		},
		onChange: (value: unknown) => {
			form.store.setValue(local.name, normalizeFormValue(value, options.valueAsNumber), { shouldDirty: true });
		},
		onBlur: () => form.store.blurField(local.name),
		get ref() {
			return local.name;
		},
	};

	const content = () => (local.render ?? local.children)?.({ field });
	return <FormFieldContext.Provider value={{ name: () => local.name, required }}>{content()}</FormFieldContext.Provider>;
}

export interface FormItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
	/** SSR 时预声明已渲染的描述节点 ID；同时作为 FormDescription 的默认 ID。 */
	descriptionId?: string;
	/** SSR 时预声明错误消息节点 ID；同时作为 FormMessage 的默认 ID。 */
	messageId?: string;
}

/** 提供稳定字段 ID，并渲染字段布局容器。 */
export function FormItem(props: ParentProps<FormItemProps>) {
	const [local, rest] = splitProps(props, ['id', 'class', 'children', 'descriptionId', 'messageId']);
	const fallbackId = `tile-solid-form-${createUniqueId()}`;
	const id = () => local.id ?? fallbackId;
	const [presenceVersion, setPresenceVersion] = createSignal(0);
	const descriptions = new Map<symbol, Accessor<string>>();
	const messages = new Map<symbol, Accessor<string>>();
	if (local.descriptionId) descriptions.set(Symbol(), () => local.descriptionId as string);
	if (local.messageId) messages.set(Symbol(), () => local.messageId as string);
	const register = (registrations: Map<symbol, Accessor<string>>, registeredId: Accessor<string>) => {
		const key = Symbol();
		registrations.set(key, registeredId);
		setPresenceVersion((version) => version + 1);
		let active = true;
		return () => {
			if (!active) return;
			active = false;
			registrations.delete(key);
			setPresenceVersion((version) => version + 1);
		};
	};
	const context: FormItemContextValue = {
		id,
		declaredDescriptionId: () => local.descriptionId,
		declaredMessageId: () => local.messageId,
		descriptionIds: () => {
			void presenceVersion();
			return [...new Set([...descriptions.values()].map((registeredId) => registeredId()))];
		},
		messageIds: () => {
			void presenceVersion();
			return [...new Set([...messages.values()].map((registeredId) => registeredId()))];
		},
		registerDescription: (registeredId) => register(descriptions, registeredId),
		registerMessage: (registeredId) => register(messages, registeredId),
	};

	return (
		<FormItemContext.Provider value={context}>
			<div {...rest} id={local.id} data-slot="form-item" class={`${styles[formStyleKeys.item]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</FormItemContext.Provider>
	);
}

export interface FormLabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {}

export function FormLabel(props: ParentProps<FormLabelProps>) {
	const field = useFormField();
	const [local, rest] = splitProps(props, ['class', 'children', 'for']);

	return (
		<Label
			{...rest}
			data-slot="form-label"
			data-error={field.error() ? '' : undefined}
			for={local.for ?? field.formItemId()}
			required={field.isRequired()}
			class={`${styles[formStyleKeys.label]} ${local.class ?? ''}`}>
			{local.children}
		</Label>
	);
}

export interface FormControlRenderProps {
	id: string;
	name: string;
	'aria-describedby': string | undefined;
	'aria-invalid': boolean;
	'aria-required': boolean | undefined;
	required: boolean | undefined;
	'data-slot': 'form-control';
}

export interface FormControlProps {
	children: (props: FormControlRenderProps) => JSX.Element;
}

/** 将字段 ARIA 属性显式传给真实控件，避免 JSX 克隆或伪 asChild。 */
export function FormControl(props: FormControlProps) {
	const field = useFormField();
	const controlProps: FormControlRenderProps = {
		get id() {
			return field.formItemId();
		},
		get name() {
			return field.name();
		},
		get 'aria-describedby'() {
			const ids = [...field.descriptionIds()];
			if (field.error()) ids.push(...field.messageIds());
			return ids.length > 0 ? ids.join(' ') : undefined;
		},
		get 'aria-invalid'() {
			return !!field.error();
		},
		get 'aria-required'() {
			return field.isRequired() || undefined;
		},
		get required() {
			return field.isRequired() || undefined;
		},
		'data-slot': 'form-control',
	};

	return props.children(controlProps);
}

export interface FormDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}

export function FormDescription(props: ParentProps<FormDescriptionProps>) {
	const field = useFormField();
	const item = useRequiredContext(FormItemContext, 'FormDescription');
	const [local, rest] = splitProps(props, ['id', 'class', 'children']);
	const effectiveId = () => local.id ?? item.declaredDescriptionId() ?? field.formDescriptionId();
	const unregister = item.registerDescription(effectiveId);
	onCleanup(unregister);

	return (
		<p {...rest} data-slot="form-description" id={effectiveId()} class={`${styles[formStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export interface FormMessageProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}

export function FormMessage(props: ParentProps<FormMessageProps>) {
	const field = useFormField();
	const item = useRequiredContext(FormItemContext, 'FormMessage');
	const [local, rest] = splitProps(props, ['id', 'class', 'children']);
	const body = () => {
		const error = field.error();
		return error ? String(error.message ?? '') : local.children;
	};
	const effectiveId = () => local.id ?? item.declaredMessageId() ?? field.formMessageId();
	let unregisterMessage = body() ? item.registerMessage(effectiveId) : undefined;
	createEffect(() => {
		if (body() && !unregisterMessage) unregisterMessage = item.registerMessage(effectiveId);
		else if (!body() && unregisterMessage) {
			unregisterMessage();
			unregisterMessage = undefined;
		}
	});
	onCleanup(() => unregisterMessage?.());

	return (
		<Show when={body()}>
			<p {...rest} data-slot="form-message" id={effectiveId()} class={`${styles[formStyleKeys.message]} ${local.class ?? ''}`}>
				{body()}
			</p>
		</Show>
	);
}

export default Form;
