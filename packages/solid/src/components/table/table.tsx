import { splitProps, type JSX, type ParentProps } from 'solid-js';
import { tableStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/table.module.scss';
export interface TableProps extends JSX.HTMLAttributes<HTMLTableElement> {
	containerClass?: string;
	containerProps?: JSX.HTMLAttributes<HTMLDivElement>;
}
export function Table(props: ParentProps<TableProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'containerClass', 'containerProps']);
	const [containerLocal, containerRest] = splitProps(local.containerProps ?? {}, ['class']);
	return (
		<div {...containerRest} class={`${styles[tableStyleKeys.container]} ${containerLocal.class ?? ''} ${local.containerClass ?? ''}`}>
			<table {...rest} class={`${styles[tableStyleKeys.table]} ${local.class ?? ''}`}>
				{local.children}
			</table>
		</div>
	);
}
export interface TableHeaderProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {}
export function TableHeader(props: ParentProps<TableHeaderProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<thead {...rest} class={`${styles[tableStyleKeys.header]} ${local.class ?? ''}`}>
			{local.children}
		</thead>
	);
}
export interface TableBodyProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {}
export function TableBody(props: ParentProps<TableBodyProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<tbody {...rest} class={`${styles[tableStyleKeys.body]} ${local.class ?? ''}`}>
			{local.children}
		</tbody>
	);
}
export interface TableFooterProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {}
export function TableFooter(props: ParentProps<TableFooterProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<tfoot {...rest} class={`${styles[tableStyleKeys.footer]} ${local.class ?? ''}`}>
			{local.children}
		</tfoot>
	);
}
export interface TableRowProps extends JSX.HTMLAttributes<HTMLTableRowElement> {}
export function TableRow(props: ParentProps<TableRowProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<tr {...rest} class={`${styles[tableStyleKeys.row]} ${local.class ?? ''}`}>
			{local.children}
		</tr>
	);
}
export interface TableHeadProps extends JSX.ThHTMLAttributes<HTMLTableCellElement> {}
export function TableHead(props: ParentProps<TableHeadProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<th {...rest} class={`${styles[tableStyleKeys.head]} ${local.class ?? ''}`}>
			{local.children}
		</th>
	);
}
export interface TableCellProps extends JSX.TdHTMLAttributes<HTMLTableCellElement> {}
export function TableCell(props: ParentProps<TableCellProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<td {...rest} class={`${styles[tableStyleKeys.cell]} ${local.class ?? ''}`}>
			{local.children}
		</td>
	);
}
export interface TableCaptionProps extends JSX.HTMLAttributes<HTMLTableCaptionElement> {}
export function TableCaption(props: ParentProps<TableCaptionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<caption {...rest} class={`${styles[tableStyleKeys.caption]} ${local.class ?? ''}`}>
			{local.children}
		</caption>
	);
}
export default Table;
