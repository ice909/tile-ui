import { createContext, createUniqueId, splitProps, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { fieldStyleKeys, getFieldIds, getFieldMessageStyleKeys } from '@tile-ui/core';
import type { FieldBaseProps, FieldDescriptionBaseProps, FieldLabelBaseProps, FieldMessageBaseProps } from '@tile-ui/core';
import { useRequiredContext } from '../../utils/context';
import styles from '@tile-ui/styles/scss/components/field.module.scss';

/** Field 子组件与原生控件可读取的稳定 ID 和校验状态。 */
export interface FieldContextValue {
	/** 原生控件应使用的 ID。 */
	id: string;
	/** FieldLabel 的 ID。 */
	labelId: string;
	/** FieldDescription 的 ID。 */
	descriptionId: string;
	/** FieldMessage 的 ID。 */
	messageId: string;
	/** Field 当前是否无效。 */
	invalid: Accessor<boolean>;
	/** Field 当前是否必填。 */
	required: Accessor<boolean>;
}

const FieldContext = createContext<FieldContextValue>();

/** 读取 Field 的稳定 ID 与状态，用于显式连接原生控件的 id/ARIA 属性。 */
export function useFieldContext(): FieldContextValue {
	return useRequiredContext(FieldContext, 'FieldContext');
}

export interface FieldProps extends JSX.HTMLAttributes<HTMLDivElement>, FieldBaseProps {}

export function Field(props: ParentProps<FieldProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'name', 'invalid', 'required']);
	const generatedId = `tile-solid-field-${createUniqueId()}`;
	const ids = getFieldIds(local.name ?? generatedId);
	const context: FieldContextValue = {
		...ids,
		invalid: () => local.invalid ?? false,
		required: () => local.required ?? false,
	};

	return (
		<FieldContext.Provider value={context}>
			<div
				{...rest}
				role="group"
				data-slot="field"
				data-invalid={context.invalid()}
				data-required={context.required()}
				class={`${styles[fieldStyleKeys.root]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</FieldContext.Provider>
	);
}

export interface FieldLabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement>, FieldLabelBaseProps {}

export function FieldLabel(props: ParentProps<FieldLabelProps>) {
	const context = useFieldContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'htmlFor', 'for']);
	return (
		<label {...rest} id={context.labelId} for={local.htmlFor ?? local.for ?? context.id} data-slot="field-label" class={`${styles[fieldStyleKeys.label]} ${local.class ?? ''}`}>
			{local.children}
		</label>
	);
}

export interface FieldDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement>, FieldDescriptionBaseProps {}

export function FieldDescription(props: ParentProps<FieldDescriptionProps>) {
	const context = useFieldContext();
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<p {...rest} id={context.descriptionId} data-slot="field-description" class={`${styles[fieldStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}

export interface FieldMessageProps extends JSX.HTMLAttributes<HTMLDivElement>, FieldMessageBaseProps {}

export function FieldMessage(props: ParentProps<FieldMessageProps>) {
	const context = useFieldContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	const styleKeys = () => getFieldMessageStyleKeys(variant());
	return (
		<div
			{...rest}
			id={context.messageId}
			role={variant() === 'error' ? 'alert' : undefined}
			data-slot="field-message"
			data-variant={variant()}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export default Field;
