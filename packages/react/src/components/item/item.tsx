import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { getItemVariantKey, itemStyleKeys } from '@tile-ui/core';
import type { ItemBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/item.module.scss';

export interface ItemGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemGroup = React.forwardRef<HTMLDivElement, ItemGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} role="list" data-slot="item-group" className={`${styles[itemStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemGroup.displayName = 'ItemGroup';

export interface ItemSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemSeparator = React.forwardRef<HTMLDivElement, ItemSeparatorProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} role="separator" aria-orientation="horizontal" data-slot="item-separator" className={`${styles[itemStyleKeys.separator]} ${className}`} {...props} />;
});
ItemSeparator.displayName = 'ItemSeparator';

export interface ItemProps extends React.HTMLAttributes<HTMLDivElement>, ItemBaseProps {}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(({ className = '', variant = 'neutral', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div';
	const variantKey = getItemVariantKey(variant);
	const classes = [styles[itemStyleKeys.item], styles[variantKey], className].filter(Boolean).join(' ');

	return (
		<Comp ref={ref} data-slot="item" data-variant={variant} className={classes} {...props}>
			{children}
		</Comp>
	);
});
Item.displayName = 'Item';

export interface ItemMediaProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemMedia = React.forwardRef<HTMLDivElement, ItemMediaProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-media" className={`${styles[itemStyleKeys.media]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemMedia.displayName = 'ItemMedia';

export interface ItemContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemContent = React.forwardRef<HTMLDivElement, ItemContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-content" className={`${styles[itemStyleKeys.content]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemContent.displayName = 'ItemContent';

export interface ItemTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemTitle = React.forwardRef<HTMLDivElement, ItemTitleProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-title" className={`${styles[itemStyleKeys.title]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemTitle.displayName = 'ItemTitle';

export interface ItemDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ItemDescription = React.forwardRef<HTMLParagraphElement, ItemDescriptionProps>(({ className = '', children, ...props }, ref) => {
	return (
		<p ref={ref} data-slot="item-description" className={`${styles[itemStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
ItemDescription.displayName = 'ItemDescription';

export interface ItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemActions = React.forwardRef<HTMLDivElement, ItemActionsProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-actions" className={`${styles[itemStyleKeys.actions]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemActions.displayName = 'ItemActions';

export interface ItemHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemHeader = React.forwardRef<HTMLDivElement, ItemHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-header" className={`${styles[itemStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemHeader.displayName = 'ItemHeader';

export interface ItemFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ItemFooter = React.forwardRef<HTMLDivElement, ItemFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="item-footer" className={`${styles[itemStyleKeys.footer]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ItemFooter.displayName = 'ItemFooter';

export { Item, ItemMedia, ItemContent, ItemActions, ItemGroup, ItemSeparator, ItemTitle, ItemDescription, ItemHeader, ItemFooter };
export default Item;
