import React from 'react';
import { emptyStyleKeys, getEmptyMediaVariantKey } from '@tile-ui/core';
import type { EmptyMediaBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/empty.module.scss';

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="empty" className={`${styles[emptyStyleKeys.root]} ${className}`} {...props}>
			{children}
		</div>
	);
});
Empty.displayName = 'Empty';

export interface EmptyHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyHeader = React.forwardRef<HTMLDivElement, EmptyHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="empty-header" className={`${styles[emptyStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
EmptyHeader.displayName = 'EmptyHeader';

export interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement>, EmptyMediaBaseProps {}

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(({ className = '', variant = 'muted', children, ...props }, ref) => {
	const variantKey = getEmptyMediaVariantKey(variant);
	const classes = [styles[emptyStyleKeys.media], styles[variantKey], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} data-slot="empty-icon" data-variant={variant} className={classes} {...props}>
			{children}
		</div>
	);
});
EmptyMedia.displayName = 'EmptyMedia';

export interface EmptyTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyTitle = React.forwardRef<HTMLDivElement, EmptyTitleProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="empty-title" className={`${styles[emptyStyleKeys.title]} ${className}`} {...props}>
			{children}
		</div>
	);
});
EmptyTitle.displayName = 'EmptyTitle';

export interface EmptyDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyDescription = React.forwardRef<HTMLDivElement, EmptyDescriptionProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="empty-description" className={`${styles[emptyStyleKeys.description]} ${className}`} {...props}>
			{children}
		</div>
	);
});
EmptyDescription.displayName = 'EmptyDescription';

export interface EmptyContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyContent = React.forwardRef<HTMLDivElement, EmptyContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="empty-content" className={`${styles[emptyStyleKeys.content]} ${className}`} {...props}>
			{children}
		</div>
	);
});
EmptyContent.displayName = 'EmptyContent';

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };
export default Empty;
