/**
 * Dialog 组件样式类名键
 */
export const dialogStyleKeys = {
	overlay: 'overlay',
	content: 'content',
	close: 'close',
	header: 'header',
	footer: 'footer',
	title: 'title',
	description: 'description',
	xIcon: 'xIcon',
} as const;

/**
 * Dialog 弹层开关状态
 */
export type DialogState = 'open' | 'closed';

/**
 * 根据开关状态获取弹层状态标识 (open | closed)
 */
export function getDialogState(open: boolean): DialogState {
	return open ? 'open' : 'closed';
}
