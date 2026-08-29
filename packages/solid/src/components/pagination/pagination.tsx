import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { getPaginationSizeKey, paginationStyleKeys } from '@tile-ui/core';
import type { PaginationLinkBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/pagination.module.scss';

type CallbackRef<T> = (element: T) => void;

function assignRef<T>(ref: CallbackRef<T> | undefined, element: T) {
	ref?.(element);
}

function ChevronLeftIcon() {
	return (
		<svg
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round">
			<path d="m15 18-6-6 6-6" />
		</svg>
	);
}

function ChevronRightIcon() {
	return (
		<svg
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round">
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

function MoreHorizontalIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
			<circle cx="5" cy="12" r="1" />
			<circle cx="12" cy="12" r="1" />
			<circle cx="19" cy="12" r="1" />
		</svg>
	);
}

export interface PaginationProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'> {
	ref?: CallbackRef<HTMLElement>;
}

export function Pagination(props: ParentProps<PaginationProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<nav
			{...rest}
			ref={(element) => assignRef(local.ref, element)}
			role="navigation"
			aria-label={rest['aria-label'] ?? 'pagination'}
			class={`${styles[paginationStyleKeys.root]} ${local.class ?? ''}`}>
			{local.children}
		</nav>
	);
}

export interface PaginationContentProps extends Omit<JSX.HTMLAttributes<HTMLUListElement>, 'ref'> {
	ref?: CallbackRef<HTMLUListElement>;
}

export function PaginationContent(props: ParentProps<PaginationContentProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<ul {...rest} ref={(element) => assignRef(local.ref, element)} class={`${styles[paginationStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</ul>
	);
}

export interface PaginationItemProps extends Omit<JSX.LiHTMLAttributes<HTMLLIElement>, 'ref'> {
	ref?: CallbackRef<HTMLLIElement>;
}

export function PaginationItem(props: ParentProps<PaginationItemProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<li {...rest} ref={(element) => assignRef(local.ref, element)} class={`${styles[paginationStyleKeys.item]} ${local.class ?? ''}`}>
			{local.children}
		</li>
	);
}

export interface PaginationLinkProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'ref'>, PaginationLinkBaseProps {
	ref?: CallbackRef<HTMLAnchorElement>;
}

export function PaginationLink(props: ParentProps<PaginationLinkProps>) {
	const [local, rest] = splitProps(props, ['isActive', 'size', 'class', 'children', 'ref']);
	const active = () => local.isActive ?? false;
	const size = () => local.size ?? 'icon';
	return (
		<a
			{...rest}
			ref={(element) => assignRef(local.ref, element)}
			aria-current={active() ? 'page' : rest['aria-current']}
			data-active={active()}
			class={`${styles[paginationStyleKeys.link]} ${styles[getPaginationSizeKey(size())]} ${active() ? styles.isActive : ''} ${local.class ?? ''}`}>
			{local.children}
		</a>
	);
}

export interface PaginationPreviousProps extends Omit<PaginationLinkProps, 'size'> {}

export function PaginationPrevious(props: ParentProps<PaginationPreviousProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<PaginationLink {...rest} ref={local.ref} aria-label={rest['aria-label'] ?? 'Go to previous page'} size="default" class={`${styles.gapSm} ${local.class ?? ''}`}>
			<ChevronLeftIcon />
			<span class={styles.paginationHideSm}>{local.children ?? 'Previous'}</span>
		</PaginationLink>
	);
}

export interface PaginationNextProps extends Omit<PaginationLinkProps, 'size'> {}

export function PaginationNext(props: ParentProps<PaginationNextProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<PaginationLink {...rest} ref={local.ref} aria-label={rest['aria-label'] ?? 'Go to next page'} size="default" class={`${styles.gapSm} ${local.class ?? ''}`}>
			<span class={styles.paginationHideSm}>{local.children ?? 'Next'}</span>
			<ChevronRightIcon />
		</PaginationLink>
	);
}

export interface PaginationEllipsisProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
	ref?: CallbackRef<HTMLSpanElement>;
}

export function PaginationEllipsis(props: PaginationEllipsisProps) {
	const [local, rest] = splitProps(props, ['class', 'ref']);
	return (
		<span
			{...rest}
			ref={(element) => assignRef(local.ref, element)}
			role="presentation"
			aria-hidden="true"
			class={`${styles[paginationStyleKeys.ellipsis]} ${local.class ?? ''}`}>
			<MoreHorizontalIcon />
		</span>
	);
}

export default Pagination;
