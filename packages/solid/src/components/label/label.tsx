import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getLabelClassKeys } from '@tile-ui/core';
import type { LabelBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/label.module.scss';
export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement>, LabelBaseProps {}
export function Label(props: ParentProps<LabelProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'required']);
	const keys = () => getLabelClassKeys(local.required);
	return (
		<label {...rest} class={`${styles[keys().base]} ${keys().required ? styles[keys().required!] : ''} ${local.class ?? ''}`}>
			{local.children}
		</label>
	);
}
export default Label;
