import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { breadcrumbStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/breadcrumb.module.scss';

export interface BreadcrumbProps extends JSX.HTMLAttributes<HTMLElement> {}
export function Breadcrumb(props: ParentProps<BreadcrumbProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<nav {...rest} aria-label={rest['aria-label'] ?? 'breadcrumb'} class={`${styles[breadcrumbStyleKeys.root]} ${local.class ?? ''}`}>
			{local.children}
		</nav>
	);
}
export interface BreadcrumbListProps extends JSX.OlHTMLAttributes<HTMLOListElement> {}
export function BreadcrumbList(props: ParentProps<BreadcrumbListProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<ol {...rest} class={`${styles[breadcrumbStyleKeys.list]} ${local.class ?? ''}`}>
			{local.children}
		</ol>
	);
}
export interface BreadcrumbItemProps extends JSX.LiHTMLAttributes<HTMLLIElement> {}
export function BreadcrumbItem(props: ParentProps<BreadcrumbItemProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<li {...rest} class={`${styles[breadcrumbStyleKeys.item]} ${local.class ?? ''}`}>
			{local.children}
		</li>
	);
}
export interface BreadcrumbLinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {}
export function BreadcrumbLink(props: ParentProps<BreadcrumbLinkProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<a {...rest} class={`${styles[breadcrumbStyleKeys.link]} ${local.class ?? ''}`}>
			{local.children}
		</a>
	);
}
export interface BreadcrumbPageProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function BreadcrumbPage(props: ParentProps<BreadcrumbPageProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} role="link" aria-disabled="true" aria-current="page" class={`${styles[breadcrumbStyleKeys.page]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export interface BreadcrumbSeparatorProps extends JSX.LiHTMLAttributes<HTMLLIElement> {}
export function BreadcrumbSeparator(props: ParentProps<BreadcrumbSeparatorProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<li {...rest} role="presentation" aria-hidden="true" class={`${styles[breadcrumbStyleKeys.separator]} ${local.class ?? ''}`}>
			{local.children ?? (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="m9 18 6-6-6-6" />
				</svg>
			)}
		</li>
	);
}
export interface BreadcrumbEllipsisProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function BreadcrumbEllipsis(props: BreadcrumbEllipsisProps) {
	const [local, rest] = splitProps(props, ['class']);
	return (
		<span {...rest} role="presentation" aria-hidden="true" class={`${styles[breadcrumbStyleKeys.ellipsis]} ${local.class ?? ''}`}>
			<svg class={styles[breadcrumbStyleKeys.ellipsisIcon]} viewBox="0 0 24 24" fill="currentColor">
				<circle cx="5" cy="12" r="1" />
				<circle cx="12" cy="12" r="1" />
				<circle cx="19" cy="12" r="1" />
			</svg>
			<span class={styles[breadcrumbStyleKeys.srOnly]}>More</span>
		</span>
	);
}
export default Breadcrumb;
