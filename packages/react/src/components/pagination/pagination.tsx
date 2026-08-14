import React from 'react';
import { getPaginationSizeKey, paginationStyleKeys } from '@tile-ui/core';
import type { PaginationLinkBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/pagination.module.scss';

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
			<path d="m15 18-6-6 6-6" />
		</svg>
	);
}

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

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(({ className = '', children, ...props }, ref) => {
	return (
		<nav ref={ref} role="navigation" aria-label="pagination" className={`${styles[paginationStyleKeys.root]} ${className}`} {...props}>
			{children}
		</nav>
	);
});
Pagination.displayName = 'Pagination';

export interface PaginationContentProps extends React.HTMLAttributes<HTMLUListElement> {}

const PaginationContent = React.forwardRef<HTMLUListElement, PaginationContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<ul ref={ref} className={`${styles[paginationStyleKeys.content]} ${className}`} {...props}>
			{children}
		</ul>
	);
});
PaginationContent.displayName = 'PaginationContent';

export interface PaginationItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>(({ className = '', children, ...props }, ref) => {
	return (
		<li ref={ref} className={`${styles[paginationStyleKeys.item]} ${className}`} {...props}>
			{children}
		</li>
	);
});
PaginationItem.displayName = 'PaginationItem';

export interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, PaginationLinkBaseProps {}

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(({ className = '', isActive = false, size = 'icon', children, ...props }, ref) => {
	const classes = [styles[paginationStyleKeys.link], styles[getPaginationSizeKey(size)], isActive ? styles.isActive : '', className].filter(Boolean).join(' ');

	return (
		<a ref={ref} aria-current={isActive ? 'page' : undefined} data-active={isActive} className={classes} {...props}>
			{children}
		</a>
	);
});
PaginationLink.displayName = 'PaginationLink';

export interface PaginationPreviousProps extends Omit<PaginationLinkProps, 'size'> {}

const PaginationPrevious = React.forwardRef<HTMLAnchorElement, PaginationPreviousProps>(({ className = '', children, ...props }, ref) => {
	return (
		<PaginationLink ref={ref} aria-label="Go to previous page" size="default" className={`${styles.gapSm} ${className}`} {...props}>
			<ChevronLeftIcon />
			<span className={styles.paginationHideSm}>{children ?? 'Previous'}</span>
		</PaginationLink>
	);
});
PaginationPrevious.displayName = 'PaginationPrevious';

export interface PaginationNextProps extends Omit<PaginationLinkProps, 'size'> {}

const PaginationNext = React.forwardRef<HTMLAnchorElement, PaginationNextProps>(({ className = '', children, ...props }, ref) => {
	return (
		<PaginationLink ref={ref} aria-label="Go to next page" size="default" className={`${styles.gapSm} ${className}`} {...props}>
			<span className={styles.paginationHideSm}>{children ?? 'Next'}</span>
			<ChevronRightIcon />
		</PaginationLink>
	);
});
PaginationNext.displayName = 'PaginationNext';

export interface PaginationEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {}

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, PaginationEllipsisProps>(({ className = '', ...props }, ref) => {
	return (
		<span ref={ref} aria-hidden="true" className={`${styles[paginationStyleKeys.ellipsis]} ${className}`} {...props}>
			<MoreHorizontalIcon className={styles[paginationStyleKeys.ellipsisIcon]} />
			<span className={styles[paginationStyleKeys.srOnly]}>More pages</span>
		</span>
	);
});
PaginationEllipsis.displayName = 'PaginationEllipsis';

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis };
export default Pagination;
