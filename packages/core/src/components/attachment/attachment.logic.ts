import type { AttachmentFileKind, AttachmentMediaVariant, AttachmentOrientation, AttachmentSize } from './attachment.types';
import { capitalize, formatBytes } from '../../utils/helpers';

/**
 * Attachment 组件样式类名键
 */
export const attachmentStyleKeys = {
	root: 'attachment',
	group: 'group',
	media: 'media',
	content: 'content',
	title: 'title',
	description: 'description',
	actions: 'actions',
	action: 'action',
	trigger: 'trigger',
	card: 'card',
} as const;

/**
 * 获取 Attachment 根节点样式类名键
 */
export function getAttachmentStyleKeys(size: AttachmentSize = 'default', orientation: AttachmentOrientation = 'horizontal') {
	return {
		base: attachmentStyleKeys.root,
		size: `size${capitalize(size)}`,
		orientation: `orientation${capitalize(orientation)}`,
	};
}

/**
 * 获取 AttachmentMedia 样式类名键
 */
export function getAttachmentMediaStyleKeys(variant: AttachmentMediaVariant = 'icon') {
	return {
		base: attachmentStyleKeys.media,
		variant: `variant${capitalize(variant)}`,
	};
}

/**
 * 按扩展名映射到文件类型
 */
const EXTENSION_KIND_MAP: Record<string, AttachmentFileKind> = {
	png: 'image',
	jpg: 'image',
	jpeg: 'image',
	gif: 'image',
	webp: 'image',
	svg: 'image',
	bmp: 'image',
	avif: 'image',
	ico: 'image',
	mp4: 'video',
	webm: 'video',
	mov: 'video',
	mkv: 'video',
	avi: 'video',
	m4v: 'video',
	mp3: 'audio',
	wav: 'audio',
	ogg: 'audio',
	flac: 'audio',
	m4a: 'audio',
	aac: 'audio',
	pdf: 'pdf',
	txt: 'document',
	md: 'document',
	doc: 'document',
	docx: 'document',
	rtf: 'document',
	odt: 'document',
	xls: 'spreadsheet',
	xlsx: 'spreadsheet',
	csv: 'spreadsheet',
	ppt: 'presentation',
	pptx: 'presentation',
	key: 'presentation',
	zip: 'archive',
	rar: 'archive',
	'7z': 'archive',
	tar: 'archive',
	gz: 'archive',
	bz2: 'archive',
	js: 'code',
	ts: 'code',
	tsx: 'code',
	jsx: 'code',
	html: 'code',
	css: 'code',
	scss: 'code',
	json: 'code',
	py: 'code',
	java: 'code',
	go: 'code',
	rs: 'code',
	c: 'code',
	cpp: 'code',
	h: 'code',
	sh: 'code',
};

/**
 * 按 MIME 前缀映射到文件类型
 */
const MIME_PREFIX_KIND_MAP: Array<[string, AttachmentFileKind]> = [
	['image/', 'image'],
	['video/', 'video'],
	['audio/', 'audio'],
	['application/pdf', 'pdf'],
	['text/plain', 'document'],
	['application/zip', 'archive'],
	['application/x-rar-compressed', 'archive'],
	['application/x-7z-compressed', 'archive'],
	['application/x-tar', 'archive'],
	['application/gzip', 'archive'],
];

/**
 * 提取文件名扩展名（小写、去掉点号）
 */
export function getAttachmentFileExtension(filename?: string): string {
	if (!filename) {
		return '';
	}
	const dot = filename.lastIndexOf('.');
	if (dot < 0) {
		return '';
	}
	return filename.slice(dot + 1).toLowerCase();
}

/**
 * 根据文件名 / MIME 类型推导附件文件类型
 */
export function getAttachmentFileKind(filename?: string, mimeType?: string): AttachmentFileKind {
	const byMime = mimeType ? MIME_PREFIX_KIND_MAP.find(([prefix]) => mimeType.toLowerCase().startsWith(prefix)) : undefined;
	if (byMime) {
		return byMime[1];
	}
	return EXTENSION_KIND_MAP[getAttachmentFileExtension(filename)] ?? 'generic';
}

/**
 * 格式化附件大小（字节 → 人类可读）
 */
export function formatAttachmentSize(bytes?: number): string {
	if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
		return '';
	}
	return formatBytes(bytes, 1);
}

/**
 * 截断附件名称，超长部分以省略号结尾
 */
export function truncateAttachmentName(name: string, maxLength: number = 40): string {
	const normalized = name.trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	const extension = getAttachmentFileExtension(normalized);
	const extSuffix = extension ? `.${extension}` : '';
	const keepLength = Math.max(maxLength - extSuffix.length - 1, 4);
	const stem = normalized.slice(0, normalized.length - extSuffix.length);
	return `${stem.slice(0, keepLength)}\u2026${extSuffix}`;
}

/**
 * 附件下载/操作状态
 */
export type AttachmentActionState = 'idle' | 'downloading' | 'error';

/**
 * 根据下载状态与错误状态推导操作状态
 */
export function getAttachmentActionState(downloading?: boolean, hasError?: boolean): AttachmentActionState {
	if (hasError) {
		return 'error';
	}
	if (downloading) {
		return 'downloading';
	}
	return 'idle';
}

/**
 * 附件是否可执行操作（非上传/处理中）
 */
export function isAttachmentActionable(state?: string): boolean {
	return state === undefined || state === 'done' || state === 'idle';
}
