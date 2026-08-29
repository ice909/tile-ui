import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getInputGroupAddonStyleKeys, getInputGroupStyleKeys, inputGroupStyleKeys } from '@tile-ui/core';
import type {
	ButtonSize,
	ButtonVariant,
	InputGroupAddonBaseProps,
	InputGroupBaseProps,
	InputGroupButtonBaseProps,
	InputGroupInputBaseProps,
	InputGroupTextareaBaseProps,
	InputGroupTextBaseProps,
} from '@tile-ui/core';
import { composeEventHandlers } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/input-group.module.scss';
import { Button, type ButtonProps } from '../button/button';

const INTERACTIVE_SELECTOR = 'button,a[href],input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])';

export interface InputGroupProps extends JSX.HTMLAttributes<HTMLDivElement>, InputGroupBaseProps {}

export function InputGroup(props: ParentProps<InputGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	const styleKeys = () => getInputGroupStyleKeys(variant());
	return (
		<div {...rest} role="group" data-slot="input-group" data-variant={variant()} class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface InputGroupAddonProps extends JSX.HTMLAttributes<HTMLDivElement>, InputGroupAddonBaseProps {}

export function InputGroupAddon(props: ParentProps<InputGroupAddonProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'align', 'onClick']);
	const variant = () => local.variant ?? 'default';
	const styleKeys = () => getInputGroupAddonStyleKeys(variant());
	const focusControl = (event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
		if (event.target.closest(INTERACTIVE_SELECTOR)) return;
		event.currentTarget.parentElement?.querySelector<HTMLElement>('[data-slot="input-group-control"]')?.focus();
	};

	return (
		<div
			{...rest}
			role="group"
			data-slot="input-group-addon"
			data-variant={variant()}
			data-align={local.align ?? 'inline-start'}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${local.class ?? ''}`}
			onClick={composeEventHandlers(local.onClick, focusControl)}>
			{local.children}
		</div>
	);
}

export interface InputGroupButtonProps extends Omit<ButtonProps, 'size' | 'variant'>, InputGroupButtonBaseProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function InputGroupButton(props: ParentProps<InputGroupButtonProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'size', 'type']);
	return (
		<Button
			{...rest}
			type={local.type ?? 'button'}
			variant={local.variant ?? 'ghost'}
			size={local.size ?? 'sm'}
			class={`${styles[inputGroupStyleKeys.button]} ${local.class ?? ''}`}>
			{local.children}
		</Button>
	);
}

export interface InputGroupTextProps extends JSX.HTMLAttributes<HTMLSpanElement>, InputGroupTextBaseProps {}

export function InputGroupText(props: ParentProps<InputGroupTextProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="input-group-text" class={`${styles[inputGroupStyleKeys.text]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}

export interface InputGroupInputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'size'>, InputGroupInputBaseProps {}

export function InputGroupInput(props: InputGroupInputProps) {
	const [local, rest] = splitProps(props, ['class']);
	return <input {...rest} data-slot="input-group-control" class={`${styles[inputGroupStyleKeys.input]} ${local.class ?? ''}`} />;
}

export interface InputGroupTextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, InputGroupTextareaBaseProps {}

export function InputGroupTextarea(props: ParentProps<InputGroupTextareaProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<textarea {...rest} data-slot="input-group-control" class={`${styles[inputGroupStyleKeys.textarea]} ${local.class ?? ''}`}>
			{local.children}
		</textarea>
	);
}

export default InputGroup;
