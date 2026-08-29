import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { alertStyleKeys, getAlertStyleKeys } from '@tile-ui/core';
import type { AlertBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/alert.module.scss';

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement>, AlertBaseProps {}

export function Alert(props: ParentProps<AlertProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const keys = () => getAlertStyleKeys(local.variant ?? 'default');
	return (
		<div
			{...rest}
			role={rest.role ?? 'alert'}
			data-slot="alert"
			data-variant={local.variant ?? 'default'}
			class={`${styles[keys().base]} ${styles[keys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface AlertTitleProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function AlertTitle(props: ParentProps<AlertTitleProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="alert-title" class={`${styles[alertStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface AlertDescriptionProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function AlertDescription(props: ParentProps<AlertDescriptionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="alert-description" class={`${styles[alertStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export default Alert;
