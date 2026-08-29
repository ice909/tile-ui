import { Show, createRenderEffect, createUniqueId, onCleanup, onMount, splitProps, type JSX } from 'solid-js';
import { getTextareaAriaProps, getTextareaIds } from '@tile-ui/core';
import type { TextareaBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import { createFormResetBinding, setInitialNativeValue } from '../../utils/form-control';
import styles from '@tile-ui/styles/scss/components/textarea.module.scss';

export interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, TextareaBaseProps {
	/** 非受控初始值；Solid JSX 未声明原生 defaultValue 属性。 */
	defaultValue?: string;
	/** 值变化回调；受控状态由原生 value 属性决定。 */
	onChangeValue?: (value: string) => void;
}

/** SolidJS Textarea：复用 core 的 ID/ARIA 推导，并与 Input 保持相同值契约。 */
export function Textarea(props: TextareaProps) {
	const [local, rest] = splitProps(props, [
		'label',
		'error',
		'helperText',
		'required',
		'id',
		'value',
		'defaultValue',
		'onChangeValue',
		'onInput',
		'class',
		'ref',
		'children',
		'aria-describedby',
		'aria-invalid',
	]);
	const fallbackId = `tile-solid-textarea-${createUniqueId()}`;
	const textareaId = () => local.id ?? fallbackId;
	const ids = () => getTextareaIds(textareaId());
	const aria = () => getTextareaAriaProps(ids(), local.error, local.helperText);
	const initialValue = String(local.value ?? local.defaultValue ?? local.children ?? '');
	let textarea: HTMLTextAreaElement | undefined;
	const resetBinding = createFormResetBinding(() => {
		queueMicrotask(() => {
			if (textarea && local.value !== undefined) textarea.value = String(local.value);
		});
	});
	const assignTextarea = (element: HTMLTextAreaElement) => {
		textarea = element;
		if (typeof local.ref === 'function') local.ref(element);
	};
	const describedBy = () => [...new Set([local['aria-describedby'], aria()['aria-describedby']].filter((value): value is string => Boolean(value)))].join(' ') || undefined;
	const invalid = () => (local.error ? true : local['aria-invalid']);

	createRenderEffect(() => {
		const controlledValue = local.value;
		if (textarea && controlledValue !== undefined) textarea.value = String(controlledValue);
	});

	onMount(() => {
		if (!textarea) return;
		setInitialNativeValue(textarea, initialValue);
		textarea.value = local.value === undefined ? initialValue : String(local.value);
		resetBinding.bind(textarea);
	});
	onCleanup(() => resetBinding.cleanup());

	return (
		<div class={styles.textareaWrapper}>
			<Show when={local.label}>
				<label for={textareaId()} class={`${styles.label} ${local.required ? styles.required : ''}`}>
					{local.label}
				</label>
			</Show>
			<textarea
				{...rest}
				ref={assignTextarea}
				id={textareaId()}
				class={`${styles.textarea} ${local.error ? styles.error : ''} ${local.class ?? ''}`}
				required={local.required}
				aria-invalid={invalid()}
				aria-describedby={describedBy()}
				onInput={(event) => {
					const next = event.currentTarget.value;
					invokeEventHandler(local.onInput, event);
					if (local.value !== undefined) event.currentTarget.value = String(local.value);
					if (!event.defaultPrevented) local.onChangeValue?.(next);
				}}>
				{initialValue}
			</textarea>
			<Show when={local.error}>
				<span id={ids().error} class={styles.errorText}>
					{local.error}
				</span>
			</Show>
			<Show when={!local.error && local.helperText}>
				<span id={ids().helper} class={styles.helperText}>
					{local.helperText}
				</span>
			</Show>
		</div>
	);
}

export default Textarea;
