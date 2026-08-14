import type { MessageAlign } from './message.types';
import { capitalize } from '../../utils/helpers';

/**
 * Message 组件样式类名键
 */
export const messageStyleKeys = {
	group: 'group',
	root: 'message',
	avatar: 'avatar',
	content: 'content',
	header: 'header',
	footer: 'footer',
} as const;

/**
 * 获取 Message 根节点对齐样式类名键
 */
export function getMessageStyleKeys(align: MessageAlign = 'start') {
	return {
		base: messageStyleKeys.root,
		align: `align${capitalize(align)}`,
	};
}
