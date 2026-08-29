import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { buttonGroupStyleKeys, getButtonGroupStyleKeys } from '@tile-ui/core';
import type { ButtonGroupBaseProps, ButtonGroupSeparatorBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/button-group.module.scss';

export interface ButtonGroupProps extends JSX.HTMLAttributes<HTMLDivElement>, ButtonGroupBaseProps {}

export function ButtonGroup(props: ParentProps<ButtonGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'orientation']);
	const orientation = () => local.orientation ?? 'horizontal';
	const styleKeys = () => getButtonGroupStyleKeys(orientation());

	return (
		<div
			{...rest}
			role="group"
			data-slot="button-group"
			data-orientation={orientation()}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().orientation]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface ButtonGroupTextProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function ButtonGroupText(props: ParentProps<ButtonGroupTextProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} class={`${styles[buttonGroupStyleKeys.text]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface ButtonGroupSeparatorProps extends JSX.HTMLAttributes<HTMLDivElement>, ButtonGroupSeparatorBaseProps {}

export function ButtonGroupSeparator(props: ButtonGroupSeparatorProps) {
	const [local, rest] = splitProps(props, ['class', 'orientation']);
	return (
		<div
			{...rest}
			role="none"
			aria-hidden="true"
			data-slot="button-group-separator"
			data-orientation={local.orientation ?? 'vertical'}
			class={`${styles[buttonGroupStyleKeys.separator]} ${local.class ?? ''}`}
		/>
	);
}

export default ButtonGroup;
