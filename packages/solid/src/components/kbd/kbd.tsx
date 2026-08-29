import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { kbdStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/kbd.module.scss';
export interface KbdProps extends JSX.HTMLAttributes<HTMLElement> {}
export function Kbd(props: ParentProps<KbdProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<kbd {...rest} class={`${styles[kbdStyleKeys.base]} ${local.class ?? ''}`}>
			{local.children}
		</kbd>
	);
}
export interface KbdGroupProps extends JSX.HTMLAttributes<HTMLElement> {}
export function KbdGroup(props: ParentProps<KbdGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<kbd {...rest} class={`${styles[kbdStyleKeys.group]} ${local.class ?? ''}`}>
			{local.children}
		</kbd>
	);
}
export default Kbd;
