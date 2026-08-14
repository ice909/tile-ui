import React from 'react';
import { tableStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/table.module.scss';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div className={styles[tableStyleKeys.container]}>
			<table ref={ref} className={`${styles[tableStyleKeys.table]} ${className}`} {...props}>
				{children}
			</table>
		</div>
	);
});
Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<thead ref={ref} className={`${styles[tableStyleKeys.header]} ${className}`} {...props}>
			{children}
		</thead>
	);
});
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(({ className = '', children, ...props }, ref) => {
	return (
		<tbody ref={ref} className={`${styles[tableStyleKeys.body]} ${className}`} {...props}>
			{children}
		</tbody>
	);
});
TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<tfoot ref={ref} className={`${styles[tableStyleKeys.footer]} ${className}`} {...props}>
			{children}
		</tfoot>
	);
});
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className = '', children, ...props }, ref) => {
	return (
		<tr ref={ref} className={`${styles[tableStyleKeys.row]} ${className}`} {...props}>
			{children}
		</tr>
	);
});
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className = '', children, ...props }, ref) => {
	return (
		<th ref={ref} className={`${styles[tableStyleKeys.head]} ${className}`} {...props}>
			{children}
		</th>
	);
});
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className = '', children, ...props }, ref) => {
	return (
		<td ref={ref} className={`${styles[tableStyleKeys.cell]} ${className}`} {...props}>
			{children}
		</td>
	);
});
TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({ className = '', children, ...props }, ref) => {
	return (
		<caption ref={ref} className={`${styles[tableStyleKeys.caption]} ${className}`} {...props}>
			{children}
		</caption>
	);
});
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption };
export default Table;
