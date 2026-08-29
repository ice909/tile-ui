import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getMarkerVariantKey, markerStyleKeys } from '@tile-ui/core';
import type { MarkerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/marker.module.scss';
export interface MarkerProps extends JSX.HTMLAttributes<HTMLDivElement>, Omit<MarkerBaseProps, 'asChild'> {}
export function Marker(props: ParentProps<MarkerProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	return (
		<div {...rest} data-slot="marker" data-variant={variant()} class={`${styles[markerStyleKeys.root]} ${styles[getMarkerVariantKey(variant())]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface MarkerIconProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function MarkerIcon(props: ParentProps<MarkerIconProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="marker-icon" aria-hidden="true" class={`${styles[markerStyleKeys.icon]} ${local.class ?? ''}`}>
			{local.children ?? (
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<circle cx="12" cy="12" r="6" />
				</svg>
			)}
		</span>
	);
}
export interface MarkerContentProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function MarkerContent(props: ParentProps<MarkerContentProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="marker-content" class={`${styles[markerStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export default Marker;
