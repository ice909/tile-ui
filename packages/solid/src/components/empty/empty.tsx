import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { emptyStyleKeys, getEmptyMediaVariantKey } from '@tile-ui/core';
import type { EmptyMediaBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/empty.module.scss';

function primitive(key: keyof typeof emptyStyleKeys, slot: string) {
	return (props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>) => {
		const [local, rest] = splitProps(props, ['class', 'children']);
		return (
			<div {...rest} data-slot={slot} class={`${styles[emptyStyleKeys[key]]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		);
	};
}
export interface EmptyProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const Empty = primitive('root', 'empty');
export interface EmptyHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const EmptyHeader = primitive('header', 'empty-header');
export interface EmptyTitleProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const EmptyTitle = primitive('title', 'empty-title');
export interface EmptyDescriptionProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const EmptyDescription = primitive('description', 'empty-description');
export interface EmptyContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const EmptyContent = primitive('content', 'empty-content');
export interface EmptyMediaProps extends JSX.HTMLAttributes<HTMLDivElement>, EmptyMediaBaseProps {}
export function EmptyMedia(props: ParentProps<EmptyMediaProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	return (
		<div {...rest} data-slot="empty-icon" data-variant={variant()} class={`${styles[emptyStyleKeys.media]} ${styles[getEmptyMediaVariantKey(variant())]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export default Empty;
