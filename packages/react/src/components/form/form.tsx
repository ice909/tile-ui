import React, { createContext, useContext, useEffect, useId, useState, useSyncExternalStore } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { createFormStore, formStyleKeys, getFormFieldIds, normalizeFormValue, FormStore } from '@tile-ui/core';
import type { FormBaseProps, FormControllerField, FormFieldError, FormSnapshot } from '@tile-ui/core';
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

const FormItemContext = createContext<{ id: string }>({ id: '' });

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
	render?: (props: { field: FormControllerField }) => React.ReactNode;
	children?: React.ReactNode;
}

/**
 * 表单字段：注册字段并提供字段渲染上下文
 */
function FormField({ name, render, children }: FormFieldProps) {
	const store = useFormStore();
	useFormSnapshot(store);

	useEffect(() => {
		store.registerField(name);
		return () => store.unregisterField(name);
	}, [store, name]);

	const field: FormControllerField = {
		name,
		value: store.getValue(name),
		onChange: (value: unknown) => store.setValue(name, normalizeFormValue(value)),
		onBlur: () => store.blurField(name),
		ref: name,
	};

	return <FormFieldContext.Provider value={{ name }}>{render ? render({ field }) : children}</FormFieldContext.Provider>;
}

FormField.displayName = 'FormField';

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

function FormItem({ className = '', ...props }: FormItemProps) {
	const id = useId();

	return (
		<FormItemContext.Provider value={{ id }}>
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
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

	return (
		<Slot data-slot="form-control" id={formItemId} aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`} aria-invalid={!!error} {...props} />
	);
}

FormControl.displayName = 'FormControl';

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormDescription({ className = '', ...props }: FormDescriptionProps) {
	const { formDescriptionId } = useFormField();

	return <p data-slot="form-description" id={formDescriptionId} className={`${styles[formStyleKeys.description]} ${className}`} {...props} />;
}

FormDescription.displayName = 'FormDescription';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormMessage({ className = '', children, ...props }: FormMessageProps) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error.message ?? '') : children;

	if (!body) {
		return null;
	}

	return (
		<p data-slot="form-message" id={formMessageId} className={`${styles[formStyleKeys.message]} ${className}`} {...props}>
			{body}
		</p>
	);
}

FormMessage.displayName = 'FormMessage';

export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
export default Form;
