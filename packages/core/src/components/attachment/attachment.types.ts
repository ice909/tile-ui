/**
 * 附件上传/展示状态
 */
export type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';

/**
 * 附件尺寸
 */
export type AttachmentSize = 'default' | 'sm' | 'xs';

/**
 * 附件排版方向
 */
export type AttachmentOrientation = 'horizontal' | 'vertical';

/**
 * 附件媒体区变体
 */
export type AttachmentMediaVariant = 'icon' | 'image';

/**
 * 附件文件类型（用于图标映射）
 */
export type AttachmentFileKind = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'code' | 'generic';

/**
 * 框架无关的 Attachment 基础 Props
 */
export interface AttachmentBaseProps {
	state?: AttachmentState;
	size?: AttachmentSize;
	orientation?: AttachmentOrientation;
}

/**
 * 框架无关的 AttachmentCard Props
 */
export interface AttachmentCardBaseProps {
	name?: string;
	size?: number;
	state?: AttachmentState;
	orientation?: AttachmentOrientation;
	downloading?: boolean;
}
