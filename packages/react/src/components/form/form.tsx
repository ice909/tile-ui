import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { createFormStore, formStyleKeys, getFormFieldIds, normalizeFormValue, FormStore } from '@tile-ui/core';
import type { FormBaseProps, FormControllerField, FormFieldError, FormRegisterOptions, FormSnapshot } from '@tile-ui/core';
import { Label } from '../label';
import styles from '@tile-ui/styles/scss/components/form.module.scss';

const FormStoreContext = createContext<FormStore | null>(null);

function useFormStore(): FormStore {
	const store = useContext(FormStoreContext);
	if (!store) {
		throw new Error('Form sub-components must be used within <Form>.');
	}
	return store;
}

/**
 * 订阅表单存储快照，触发组件重渲染
 */
function useFormSnapshot(store: FormStore): FormSnapshot {
	return useSyncExternalStore(
		(listener) => store.subscribe(listener),
		() => store.getSnapshot(),
		() => store.getSnapshot(),
	);
}

/**
 * 返回当前表单实例 (FormStore)，可调用 handleSubmit / trigger / getValues 等
 */
export function useForm(): FormStore {
	return useFormStore();
}

const FormFieldContext = createContext<{ name: string }>({ name: '' });

interface FormItemContextValue {
	id: string;
	declaredDescriptionId: string | undefined;
	declaredMessageId: string | undefined;
	descriptionIds: () => string[];
	messageIds: () => string[];
	registerDescription: (id: string) => () => void;
	registerMessage: (id: string) => () => void;
}

const FormItemContext = createContext<FormItemContextValue>({
	id: '',
	declaredDescriptionId: undefined,
	declaredMessageId: undefined,
	descriptionIds: () => [],
	messageIds: () => [],
	registerDescription: () => () => {},
	registerMessage: () => () => {},
});

/**
 * 注册一个已挂载节点的 ID；返回值用于在卸载时注销。
 */
function registerPresence(registry: Set<string>, bump: () => void, registeredId: string) {
	registry.add(registeredId);
	bump();
	let active = true;
	return () => {
		if (!active) return;
		active = false;
		registry.delete(registeredId);
		bump();
	};
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface FormFieldResult {
	id: string;
	name: string;
	formItemId: string;
	formDescriptionId: string;
	formMessageId: string;
	error?: FormFieldError;
	isTouched: boolean;
	isDirty: boolean;
}

/**
 * 读取当前字段上下文 (name + 表单项 id + 错误信息)
 */
export function useFormField(): FormFieldResult {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const store = useFormStore();
	useFormSnapshot(store);

	if (!fieldContext.name) {
		throw new Error('useFormField should be used within <FormField>');
	}

	const ids = getFormFieldIds(itemContext.id);
	const fieldState = store.getFieldState(fieldContext.name);

	return {
		id: ids.id,
		name: fieldContext.name,
		formItemId: ids.formItemId,
		formDescriptionId: ids.formDescriptionId,
		formMessageId: ids.formMessageId,
		error: fieldState.error,
		isTouched: fieldState.isTouched,
		isDirty: fieldState.isDirty,
	};
}

export interface FormProps extends FormBaseProps {
	children?: React.ReactNode;
}

/**
 * 表单容器：创建并提供 FormStore 上下文
 */
function Form({ defaultValues = {}, resolver, form, children }: FormProps) {
	const [store] = useState<FormStore>(() => (form ? (form as FormStore) : createFormStore(defaultValues, resolver)));

	return <FormStoreContext.Provider value={store}>{children}</FormStoreContext.Provider>;
}

Form.displayName = 'Form';

export interface FormFieldProps {
	name: string;
	options?: FormRegisterOptions;
	render?: (props: { field: FormControllerField }) => React.ReactNode;
	children?: React.ReactNode;
}

/** 共享的空注册选项，避免默认值在每次渲染时产生新引用导致重复注册。 */
const EMPTY_REGISTER_OPTIONS: FormRegisterOptions = {};

/**
 * 表单字段：注册字段并提供字段渲染上下文
 */
function FormField({ name, options = EMPTY_REGISTER_OPTIONS, render, children }: FormFieldProps) {
	const store = useFormStore();
	useFormSnapshot(store);

	useEffect(() => {
		const registration = store.registerField(name, options);
		return registration.unregister;
	}, [store, name, options]);

	const field: FormControllerField = {
		name,
		value: store.getValue(name),
		onChange: (value: unknown) => store.setValue(name, normalizeFormValue(value, options.valueAsNumber)),
		onBlur: () => store.blurField(name),
		ref: name,
	};

	return <FormFieldContext.Provider value={{ name }}>{render ? render({ field }) : children}</FormFieldContext.Provider>;
}

FormField.displayName = 'FormField';

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
	/** SSR 时预声明已渲染的描述节点 ID；同时作为 FormDescription 的默认 ID。 */
	descriptionId?: string;
	/** SSR 时预声明错误消息节点 ID；同时作为 FormMessage 的默认 ID。 */
	messageId?: string;
}

function FormItem({ className = '', descriptionId, messageId, ...props }: FormItemProps) {
	const id = useId();
	const descriptionIdsRef = useRef(new Set<string>(descriptionId === undefined ? [] : [descriptionId]));
	const messageIdsRef = useRef(new Set<string>(messageId === undefined ? [] : [messageId]));
	const [presence, setPresence] = useState(0);
	const bump = useCallback(() => setPresence((version) => version + 1), []);

	useIsomorphicLayoutEffect(() => {
		if (descriptionId === undefined) return;
		return registerPresence(descriptionIdsRef.current, bump, descriptionId);
	}, [descriptionId, bump]);

	useIsomorphicLayoutEffect(() => {
		if (messageId === undefined) return;
		return registerPresence(messageIdsRef.current, bump, messageId);
	}, [messageId, bump]);

	const registerDescription = useCallback((registeredId: string) => registerPresence(descriptionIdsRef.current, bump, registeredId), [bump]);
	const registerMessage = useCallback((registeredId: string) => registerPresence(messageIdsRef.current, bump, registeredId), [bump]);

	const context: FormItemContextValue = {
		id,
		declaredDescriptionId: descriptionId,
		declaredMessageId: messageId,
		descriptionIds: () => {
			void presence;
			return [...descriptionIdsRef.current];
		},
		messageIds: () => {
			void presence;
			return [...messageIdsRef.current];
		},
		registerDescription,
		registerMessage,
	};

	return (
		<FormItemContext.Provider value={context}>
			<div data-slot="form-item" className={`${styles[formStyleKeys.item]} ${className}`} {...props} />
		</FormItemContext.Provider>
	);
}

FormItem.displayName = 'FormItem';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function FormLabel({ className = '', ...props }: FormLabelProps) {
	const { error, formItemId } = useFormField();

	return <Label data-slot="form-label" data-error={!!error} className={`${styles[formStyleKeys.label]} ${className}`} htmlFor={formItemId} {...props} />;
}

FormLabel.displayName = 'FormLabel';

export interface FormControlProps extends React.ComponentProps<typeof Slot> {}

function FormControl({ ...props }: FormControlProps) {
	const { error, formItemId } = useFormField();
	const item = useContext(FormItemContext);

	const describedByIds = [...item.descriptionIds()];
	if (error) describedByIds.push(...item.messageIds());

	return <Slot data-slot="form-control" id={formItemId} aria-describedby={describedByIds.length > 0 ? describedByIds.join(' ') : undefined} aria-invalid={!!error} {...props} />;
}

FormControl.displayName = 'FormControl';

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormDescription({ className = '', ...props }: FormDescriptionProps) {
	const { formDescriptionId } = useFormField();
	const item = useContext(FormItemContext);
	const effectiveId = props.id ?? item.declaredDescriptionId ?? formDescriptionId;
	const { registerDescription } = item;

	useIsomorphicLayoutEffect(() => registerDescription(effectiveId), [registerDescription, effectiveId]);

	return <p data-slot="form-description" id={effectiveId} className={`${styles[formStyleKeys.description]} ${className}`} {...props} />;
}

FormDescription.displayName = 'FormDescription';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormMessage({ className = '', children, ...props }: FormMessageProps) {
	const { error, formMessageId } = useFormField();
	const item = useContext(FormItemContext);
	const effectiveId = props.id ?? item.declaredMessageId ?? formMessageId;
	const { registerMessage } = item;
	const hasBody = error ? !!String(error.message ?? '') : !!children;

	useIsomorphicLayoutEffect(() => {
		if (!hasBody) return;
		return registerMessage(effectiveId);
	}, [registerMessage, effectiveId, hasBody]);

	if (!hasBody) {
		return null;
	}

	const body = error ? String(error.message ?? '') : children;

	return (
		<p data-slot="form-message" id={effectiveId} className={`${styles[formStyleKeys.message]} ${className}`} {...props}>
			{body}
		</p>
	);
}

FormMessage.displayName = 'FormMessage';

export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
export default Form;
