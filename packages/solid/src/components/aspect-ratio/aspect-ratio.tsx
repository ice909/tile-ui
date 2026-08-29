import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { aspectRatioStyleKeys, getAspectRatioPadding } from '@tile-ui/core';
import type { AspectRatioBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/aspect-ratio.module.scss';

export interface AspectRatioProps extends JSX.HTMLAttributes<HTMLDivElement>, AspectRatioBaseProps {}
export function AspectRatio(props: ParentProps<AspectRatioProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ratio', 'style']);
	return (
		<div
			{...rest}
			data-slot="aspect-ratio"
			data-layout="solid"
			class={`${styles[aspectRatioStyleKeys.root]} ${local.class ?? ''}`}
			style={
				typeof local.style === 'string'
					? `${local.style};--tile-aspect-ratio-padding:${getAspectRatioPadding(local.ratio ?? 1)}%`
					: { ...local.style, '--tile-aspect-ratio-padding': `${getAspectRatioPadding(local.ratio ?? 1)}%` }
			}>
			<div class={styles[aspectRatioStyleKeys.content]}>{local.children}</div>
		</div>
	);
}
export default AspectRatio;
