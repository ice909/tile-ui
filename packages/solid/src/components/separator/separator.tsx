import { splitProps, type JSX } from 'solid-js';
import { getSeparatorStyleKeys } from '@tile-ui/core';
import type { SeparatorBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/separator.module.scss';

export interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement>, SeparatorBaseProps {}

/**
 * SolidJS Separator：复用 core 的样式 key，样式来自共享 SCSS。
 */
export function Separator(props: SeparatorProps) {
	const [local, rest] = splitProps(props, ['orientation', 'decorative', 'class', 'children']);
	const orientation = () => local.orientation ?? 'horizontal';
	const decorative = () => local.decorative ?? true;
	const styleKeys = () => getSeparatorStyleKeys(orientation());

	return (
		<div
			{...rest}
			role={decorative() ? 'none' : 'separator'}
			aria-orientation={decorative() ? undefined : orientation()}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().orientation]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export default Separator;
