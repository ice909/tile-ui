import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getMarkerVariantKey, markerStyleKeys } from '@tile-ui/core';
import type { MarkerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/marker.module.scss';
export interface MarkerProps extends JSX.HTMLAttributes<HTMLDivElement>, Omit<MarkerBaseProps, 'asChild'> {}
export function Marker(props: ParentProps<MarkerProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	const classes = () => [styles[markerStyleKeys.root], styles[getMarkerVariantKey(variant())], local.class].filter(Boolean).join(' ');
	return (
		<div {...rest} data-slot="marker" data-variant={variant()} class={classes()}>
			{local.children}
		</div>
	);
}
export interface MarkerIconProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function MarkerIcon(props: ParentProps<MarkerIconProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="marker-icon" aria-hidden="true" class={[styles[markerStyleKeys.icon], local.class].filter(Boolean).join(' ')}>
			{local.children ?? (
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
		<span {...rest} data-slot="marker-content" class={[styles[markerStyleKeys.content], local.class].filter(Boolean).join(' ')}>
			{local.children}
		</span>
	);
}
export default Marker;
