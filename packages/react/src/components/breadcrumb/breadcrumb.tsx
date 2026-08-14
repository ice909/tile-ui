import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { breadcrumbStyleKeys } from '@tile-ui/core';
import type { BreadcrumbLinkBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/breadcrumb.module.scss';

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

function MoreHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
			<circle cx="12" cy="12" r="1" />
			<circle cx="19" cy="12" r="1" />
			<circle cx="5" cy="12" r="1" />
		</svg>
	);
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(({ className = '', children, ...props }, ref) => {
	return (
		<nav ref={ref} aria-label="breadcrumb" className={`${styles[breadcrumbStyleKeys.root]} ${className}`} {...props}>
			{children}
		</nav>
	);
});
Breadcrumb.displayName = 'Breadcrumb';

export interface BreadcrumbListProps extends React.HTMLAttributes<HTMLOListElement> {}

const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(({ className = '', children, ...props }, ref) => {
	return (
		<ol ref={ref} className={`${styles[breadcrumbStyleKeys.list]} ${className}`} {...props}>
			{children}
		</ol>
	);
});
BreadcrumbList.displayName = 'BreadcrumbList';

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(({ className = '', children, ...props }, ref) => {
	return (
		<li ref={ref} className={`${styles[breadcrumbStyleKeys.item]} ${className}`} {...props}>
			{children}
		</li>
	);
});
BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, BreadcrumbLinkBaseProps {}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(({ className = '', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'a';

	return (
		<Comp ref={ref} className={`${styles[breadcrumbStyleKeys.link]} ${className}`} {...props}>
			{children}
		</Comp>
	);
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

export interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} role="link" aria-disabled="true" aria-current="page" className={`${styles[breadcrumbStyleKeys.page]} ${className}`} {...props}>
			{children}
		</span>
	);
});
BreadcrumbPage.displayName = 'BreadcrumbPage';

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {}

const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(({ className = '', children, ...props }, ref) => {
	return (
		<li ref={ref} role="presentation" aria-hidden="true" className={`${styles[breadcrumbStyleKeys.separator]} ${className}`} {...props}>
			{children ?? <ChevronRightIcon />}
		</li>
	);
});
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(({ className = '', ...props }, ref) => {
	return (
		<span ref={ref} role="presentation" aria-hidden="true" className={`${styles[breadcrumbStyleKeys.ellipsis]} ${className}`} {...props}>
			<MoreHorizontalIcon className={styles[breadcrumbStyleKeys.ellipsisIcon]} />
			<span className={styles[breadcrumbStyleKeys.srOnly]}>More</span>
		</span>
	);
});
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
export default Breadcrumb;
