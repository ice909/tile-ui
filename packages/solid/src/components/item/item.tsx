import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getItemMediaVariantKey, getItemSizeKey, getItemVariantKey, itemStyleKeys } from '@tile-ui/core';
import type { ItemBaseProps, ItemMediaBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/item.module.scss';

export interface ItemGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function ItemGroup(props: ParentProps<ItemGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} role={rest.role ?? 'list'} data-slot="item-group" class={`${styles[itemStyleKeys.group]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface ItemSeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function ItemSeparator(props: ItemSeparatorProps) {
	const [local, rest] = splitProps(props, ['class']);
	return <div {...rest} role="separator" aria-orientation="horizontal" data-slot="item-separator" class={`${styles[itemStyleKeys.separator]} ${local.class ?? ''}`} />;
}
export interface ItemProps extends JSX.HTMLAttributes<HTMLDivElement>, Omit<ItemBaseProps, 'asChild'> {}
export function Item(props: ParentProps<ItemProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'size']);
	const variant = () => local.variant ?? 'default';
	const size = () => local.size ?? 'default';
	return (
		<div
			{...rest}
			data-slot="item"
			data-variant={variant()}
			data-size={size()}
			class={`${styles[itemStyleKeys.item]} ${styles[getItemVariantKey(variant())]} ${styles[getItemSizeKey(size())]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface ItemMediaProps extends JSX.HTMLAttributes<HTMLDivElement>, ItemMediaBaseProps {}
export function ItemMedia(props: ParentProps<ItemMediaProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'default';
	return (
		<div {...rest} data-slot="item-media" data-variant={variant()} class={`${styles[itemStyleKeys.media]} ${styles[getItemMediaVariantKey(variant())]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
function divPrimitive(key: keyof typeof itemStyleKeys, slot: string) {
	return (props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>) => {
		const [local, rest] = splitProps(props, ['class', 'children']);
		return (
			<div {...rest} data-slot={slot} class={`${styles[itemStyleKeys[key]]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		);
	};
}
export interface ItemContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const ItemContent = divPrimitive('content', 'item-content');
export interface ItemTitleProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const ItemTitle = divPrimitive('title', 'item-title');
export interface ItemActionsProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const ItemActions = divPrimitive('actions', 'item-actions');
export interface ItemHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const ItemHeader = divPrimitive('header', 'item-header');
export interface ItemFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const ItemFooter = divPrimitive('footer', 'item-footer');
export interface ItemDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}
export function ItemDescription(props: ParentProps<ItemDescriptionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<p {...rest} data-slot="item-description" class={`${styles[itemStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</p>
	);
}
export default Item;
