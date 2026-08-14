/**
 * AlertDialog 组件样式类名键
 */
export const alertDialogStyleKeys = {
	overlay: 'overlay',
	content: 'content',
	header: 'header',
	footer: 'footer',
	title: 'title',
	description: 'description',
} as const;

/**
 * AlertDialog 弹层开关状态
 */
export type AlertDialogState = 'open' | 'closed';

/**
 * 根据开关状态获取弹层状态标识 (open | closed)
 */
export function getAlertDialogState(open: boolean): AlertDialogState {
	return open ? 'open' : 'closed';
}
