import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
	attachmentStyleKeys,
	getAttachmentFileKind,
	getAttachmentMediaStyleKeys,
	getAttachmentStyleKeys,
	formatAttachmentSize,
	isAttachmentActionable,
	truncateAttachmentName,
} from '@tile-ui/core';
import type { AttachmentFileKind, AttachmentMediaVariant, AttachmentOrientation, AttachmentSize, AttachmentState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/attachment.module.scss';
import { Button } from '../button/button';

/**
 * 按文件类型渲染对应的内联 SVG 图标
 */
export function AttachmentFileIcon({ kind, className }: { kind: AttachmentFileKind; className?: string }) {
	const iconProps = {
		className,
		xmlns: 'http://www.w3.org/2000/svg',
		width: 16,
		height: 16,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		'aria-hidden': 'true' as const,
	};

	switch (kind) {
		case 'image':
			return (
				<svg {...iconProps}>
					<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
					<circle cx="9" cy="9" r="2" />
					<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
				</svg>
			);
		case 'video':
			return (
				<svg {...iconProps}>
					<path d="m22 8-6 4 6 4V8Z" />
					<rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
				</svg>
			);
		case 'audio':
			return (
				<svg {...iconProps}>
					<path d="M11 5 6 9H2v6h4l5 4V5Z" />
					<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
				</svg>
			);
		case 'pdf':
			return (
				<svg {...iconProps}>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<path d="M14 2v6h6" />
					<path d="M9 15c-.5-1 .5-3 2-3s2 2 2 3 0 2-1 2-2.5-.5-3-2Z" />
				</svg>
			);
		case 'spreadsheet':
			return (
				<svg {...iconProps}>
					<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
					<path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
				</svg>
			);
		case 'presentation':
			return (
				<svg {...iconProps}>
					<rect width="18" height="10" x="3" y="3" rx="2" ry="2" />
					<path d="M12 13v5M8 21l4-3 4 3M7 6h10" />
				</svg>
			);
		case 'archive':
			return (
				<svg {...iconProps}>
					<rect width="20" height="5" x="2" y="3" rx="1" />
					<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
				</svg>
			);
		case 'code':
			return (
				<svg {...iconProps}>
					<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
				</svg>
			);
		default:
			return (
				<svg {...iconProps}>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<path d="M14 2v6h6" />
				</svg>
			);
	}
}

/**
 * 下载 / 删除 图标的辅助函数
 */
function DownloadIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<path d="m7 10 5 5 5-5" />
			<path d="M12 15V3" />
		</svg>
	);
}

function TrashIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		</svg>
	);
}

export interface AttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
	state?: AttachmentState;
	size?: AttachmentSize;
	orientation?: AttachmentOrientation;
}

const Attachment = React.forwardRef<HTMLDivElement, AttachmentProps>(
	({ className = '', state = 'done', size = 'default', orientation = 'horizontal', children, ...props }, ref) => {
		const styleKeys = getAttachmentStyleKeys(size, orientation);

		return (
			<div
				ref={ref}
				data-slot="attachment"
				data-state={state}
				data-size={size}
				data-orientation={orientation}
				className={`${styles[styleKeys.base]} ${styles[styleKeys.size]} ${styles[styleKeys.orientation]} ${className}`}
				{...props}>
				{children}
			</div>
		);
	},
);
Attachment.displayName = 'Attachment';

export interface AttachmentGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const AttachmentGroup = React.forwardRef<HTMLDivElement, AttachmentGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="attachment-group" className={`${styles[attachmentStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AttachmentGroup.displayName = 'AttachmentGroup';

export interface AttachmentMediaProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: AttachmentMediaVariant;
}

const AttachmentMedia = React.forwardRef<HTMLDivElement, AttachmentMediaProps>(({ className = '', variant = 'icon', children, ...props }, ref) => {
	const styleKeys = getAttachmentMediaStyleKeys(variant);

	return (
		<div ref={ref} data-slot="attachment-media" data-variant={variant} className={`${styles[styleKeys.base]} ${styles[styleKeys.variant]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AttachmentMedia.displayName = 'AttachmentMedia';

export interface AttachmentContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AttachmentContent = React.forwardRef<HTMLDivElement, AttachmentContentProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="attachment-content" className={`${styles[attachmentStyleKeys.content]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AttachmentContent.displayName = 'AttachmentContent';

export interface AttachmentTitleProps extends React.HTMLAttributes<HTMLSpanElement> {}

const AttachmentTitle = React.forwardRef<HTMLSpanElement, AttachmentTitleProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} data-slot="attachment-title" className={`${styles[attachmentStyleKeys.title]} ${className}`} {...props}>
			{children}
		</span>
	);
});
AttachmentTitle.displayName = 'AttachmentTitle';

export interface AttachmentDescriptionProps extends React.HTMLAttributes<HTMLSpanElement> {}

const AttachmentDescription = React.forwardRef<HTMLSpanElement, AttachmentDescriptionProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} data-slot="attachment-description" className={`${styles[attachmentStyleKeys.description]} ${className}`} {...props}>
			{children}
		</span>
	);
});
AttachmentDescription.displayName = 'AttachmentDescription';

export interface AttachmentActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const AttachmentActions = React.forwardRef<HTMLDivElement, AttachmentActionsProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="attachment-actions" className={`${styles[attachmentStyleKeys.actions]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AttachmentActions.displayName = 'AttachmentActions';

export interface AttachmentActionProps extends React.ComponentProps<typeof Button> {}

const AttachmentAction = React.forwardRef<HTMLButtonElement, AttachmentActionProps>(({ className = '', variant, size = 'icon-xs', children, ...props }, ref) => {
	return (
		<Button ref={ref} data-slot="attachment-action" variant={variant ?? 'ghost'} size={size} className={`${styles[attachmentStyleKeys.action]} ${className}`} {...props}>
			{children}
		</Button>
	);
});
AttachmentAction.displayName = 'AttachmentAction';

export interface AttachmentTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const AttachmentTrigger = React.forwardRef<HTMLButtonElement, AttachmentTriggerProps>(({ className = '', asChild = false, type, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp ref={ref} data-slot="attachment-trigger" type={asChild ? undefined : (type ?? 'button')} className={`${styles[attachmentStyleKeys.trigger]} ${className}`} {...props}>
			{children}
		</Comp>
	);
});
AttachmentTrigger.displayName = 'AttachmentTrigger';

export interface AttachmentCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	name?: string;
	size?: number;
	file?: File;
	state?: AttachmentState;
	orientation?: AttachmentOrientation;
	downloading?: boolean;
	action?: React.ReactNode;
	onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onDownload?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onPreview?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const AttachmentCard = React.forwardRef<HTMLDivElement, AttachmentCardProps>(
	({ className = '', name, size, file, state = 'done', orientation = 'horizontal', downloading = false, action, onRemove, onDownload, onPreview, onClick, ...props }, ref) => {
		const kind = getAttachmentFileKind(name, file?.type);
		const actionable = isAttachmentActionable(state);
		const displayName = name ? truncateAttachmentName(name) : '';
		const description = size !== undefined ? formatAttachmentSize(size) : state;

		return (
			<Attachment
				ref={ref}
				state={state}
				size="default"
				orientation={orientation}
				className={`${styles[attachmentStyleKeys.card]} ${className}`}
				onClick={(event: React.MouseEvent<HTMLDivElement>) => {
					onClick?.(event);
					onPreview?.(event);
				}}
				{...props}>
				<AttachmentMedia variant="icon">
					<AttachmentFileIcon kind={kind} />
				</AttachmentMedia>
				<AttachmentContent>
					{displayName && <AttachmentTitle>{displayName}</AttachmentTitle>}
					{description && <AttachmentDescription>{description}</AttachmentDescription>}
				</AttachmentContent>
				<AttachmentActions>
					{onDownload && (
						<AttachmentAction type="button" size="icon" aria-label="下载" disabled={!actionable || downloading} onClick={onDownload}>
							<DownloadIcon />
						</AttachmentAction>
					)}
					{action ??
						(onRemove && (
							<AttachmentAction type="button" size="icon" aria-label="删除" disabled={!actionable} onClick={onRemove}>
								<TrashIcon />
							</AttachmentAction>
						))}
				</AttachmentActions>
			</Attachment>
		);
	},
);
AttachmentCard.displayName = 'AttachmentCard';

export {
	Attachment,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentContent,
	AttachmentTitle,
	AttachmentDescription,
	AttachmentActions,
	AttachmentAction,
	AttachmentTrigger,
	AttachmentCard,
};
export default Attachment;
