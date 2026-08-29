import { splitProps, type JSX, type ParentProps } from 'solid-js';
import {
	attachmentStyleKeys,
	formatAttachmentSize,
	getAttachmentFileKind,
	getAttachmentMediaStyleKeys,
	getAttachmentStyleKeys,
	isAttachmentActionable,
	truncateAttachmentName,
} from '@tile-ui/core';
import type { AttachmentBaseProps, AttachmentCardBaseProps, AttachmentFileKind, AttachmentMediaVariant } from '@tile-ui/core';
import { invokeEventHandler, type SolidEventHandler } from '../../utils/events';
import { Button, type ButtonProps } from '../button';
import styles from '@tile-ui/styles/scss/components/attachment.module.scss';

export function AttachmentFileIcon(props: { kind: AttachmentFileKind; class?: string }) {
	const common = {
		class: props.class,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': 2,
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round',
		'aria-hidden': 'true',
	} as const;
	if (props.kind === 'image')
		return (
			<svg {...common}>
				<rect width="18" height="18" x="3" y="3" rx="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3-3a2 2 0 0 0-3 0l-9 9" />
			</svg>
		);
	if (props.kind === 'video')
		return (
			<svg {...common}>
				<path d="m22 8-6 4 6 4V8Z" />
				<rect width="14" height="12" x="2" y="6" rx="2" />
			</svg>
		);
	if (props.kind === 'audio')
		return (
			<svg {...common}>
				<path d="M11 5 6 9H2v6h4l5 4V5Z" />
				<path d="M16 8a5 5 0 0 1 0 8" />
			</svg>
		);
	if (props.kind === 'pdf')
		return (
			<svg {...common}>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<path d="M14 2v6h6" />
				<path d="M9 15c-.5-1 .5-3 2-3s2 2 2 3 0 2-1 2-2.5-.5-3-2Z" />
			</svg>
		);
	if (props.kind === 'spreadsheet')
		return (
			<svg {...common}>
				<rect width="18" height="18" x="3" y="3" rx="2" />
				<path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
			</svg>
		);
	if (props.kind === 'presentation')
		return (
			<svg {...common}>
				<rect width="18" height="10" x="3" y="3" rx="2" />
				<path d="M12 13v5M8 21l4-3 4 3M7 6h10" />
			</svg>
		);
	if (props.kind === 'archive')
		return (
			<svg {...common}>
				<rect width="20" height="5" x="2" y="3" rx="1" />
				<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
			</svg>
		);
	if (props.kind === 'code')
		return (
			<svg {...common}>
				<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
			</svg>
		);
	return (
		<svg {...common}>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<path d="M14 2v6h6" />
		</svg>
	);
}
function DownloadIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
		</svg>
	);
}
function TrashIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4h8v2" />
		</svg>
	);
}

export interface AttachmentProps extends JSX.HTMLAttributes<HTMLDivElement>, AttachmentBaseProps {}
export function Attachment(props: ParentProps<AttachmentProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'state', 'size', 'orientation']);
	const size = () => local.size ?? 'default';
	const orientation = () => local.orientation ?? 'horizontal';
	const keys = () => getAttachmentStyleKeys(size(), orientation());
	const classes = () => [styles[keys().base], styles[keys().size], styles[keys().orientation], local.class].filter(Boolean).join(' ');
	return (
		<div {...rest} data-slot="attachment" data-state={local.state ?? 'done'} data-size={size()} data-orientation={orientation()} class={classes()}>
			{local.children}
		</div>
	);
}
function divPrimitive(key: 'group' | 'content' | 'actions') {
	return (props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>) => {
		const [local, rest] = splitProps(props, ['class', 'children']);
		return (
			<div {...rest} data-slot={`attachment-${key}`} class={`${styles[attachmentStyleKeys[key]]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		);
	};
}
export interface AttachmentGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const AttachmentGroup = divPrimitive('group');
export interface AttachmentContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export const AttachmentContent = divPrimitive('content');
export interface AttachmentActionsProps extends JSX.HTMLAttributes<HTMLDivElement> {}
export function AttachmentActions(props: ParentProps<AttachmentActionsProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'onClick']);
	return (
		<div
			{...rest}
			data-slot="attachment-actions"
			class={`${styles[attachmentStyleKeys.actions]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				event.stopPropagation();
			}}>
			{local.children}
		</div>
	);
}
export interface AttachmentMediaProps extends JSX.HTMLAttributes<HTMLDivElement> {
	variant?: AttachmentMediaVariant;
}
export function AttachmentMedia(props: ParentProps<AttachmentMediaProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant']);
	const variant = () => local.variant ?? 'icon';
	const keys = () => getAttachmentMediaStyleKeys(variant());
	return (
		<div {...rest} data-slot="attachment-media" data-variant={variant()} class={`${styles[keys().base]} ${styles[keys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}
export interface AttachmentTitleProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function AttachmentTitle(props: ParentProps<AttachmentTitleProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="attachment-title" class={`${styles[attachmentStyleKeys.title]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export interface AttachmentDescriptionProps extends JSX.HTMLAttributes<HTMLSpanElement> {}
export function AttachmentDescription(props: ParentProps<AttachmentDescriptionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<span {...rest} data-slot="attachment-description" class={`${styles[attachmentStyleKeys.description]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}
export interface AttachmentActionProps extends ButtonProps {}
export function AttachmentAction(props: ParentProps<AttachmentActionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'size']);
	return (
		<Button
			{...rest}
			data-slot="attachment-action"
			variant={local.variant ?? 'ghost'}
			size={local.size ?? 'icon-xs'}
			class={`${styles[attachmentStyleKeys.action]} ${local.class ?? ''}`}>
			{local.children}
		</Button>
	);
}
export interface AttachmentTriggerProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {}
export function AttachmentTrigger(props: ParentProps<AttachmentTriggerProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'type']);
	return (
		<button {...rest} type={local.type ?? 'button'} data-slot="attachment-trigger" class={`${styles[attachmentStyleKeys.trigger]} ${local.class ?? ''}`}>
			{local.children}
		</button>
	);
}
export interface AttachmentCardProps extends JSX.HTMLAttributes<HTMLDivElement>, AttachmentCardBaseProps {
	file?: File;
	action?: JSX.Element;
	onRemove?: SolidEventHandler<HTMLButtonElement, MouseEvent>;
	onDownload?: SolidEventHandler<HTMLButtonElement, MouseEvent>;
	onPreview?: SolidEventHandler<HTMLDivElement, MouseEvent>;
}
export function AttachmentCard(props: AttachmentCardProps) {
	const [local, rest] = splitProps(props, [
		'class',
		'children',
		'name',
		'size',
		'file',
		'state',
		'orientation',
		'downloading',
		'action',
		'onRemove',
		'onDownload',
		'onPreview',
		'onClick',
	]);
	const kind = () => getAttachmentFileKind(local.name, local.file?.type);
	const actionable = () => isAttachmentActionable(local.state ?? 'done');
	return (
		<Attachment
			{...rest}
			state={local.state ?? 'done'}
			orientation={local.orientation ?? 'horizontal'}
			class={`${styles[attachmentStyleKeys.card]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) invokeEventHandler(local.onPreview, event);
			}}>
			<AttachmentMedia>
				<AttachmentFileIcon kind={kind()} />
			</AttachmentMedia>
			<AttachmentContent>
				{local.name && <AttachmentTitle>{truncateAttachmentName(local.name)}</AttachmentTitle>}
				<AttachmentDescription>{local.size !== undefined ? formatAttachmentSize(local.size) : (local.state ?? 'done')}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				{local.onDownload && (
					<AttachmentAction size="icon" aria-label="下载" disabled={!actionable() || local.downloading} onClick={local.onDownload}>
						<DownloadIcon />
					</AttachmentAction>
				)}
				{local.action ??
					(local.onRemove && (
						<AttachmentAction size="icon" aria-label="删除" disabled={!actionable()} onClick={local.onRemove}>
							<TrashIcon />
						</AttachmentAction>
					))}
			</AttachmentActions>
			{local.children}
		</Attachment>
	);
}
export default Attachment;
