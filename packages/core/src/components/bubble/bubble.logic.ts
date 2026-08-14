import type { BubbleVariant } from './bubble.types';
import { capitalize } from '../../utils/helpers';

/**
 * Bubble 组件样式类名键
 */
export const bubbleStyleKeys = {
	group: 'group',
	root: 'bubble',
	content: 'content',
	reactions: 'reactions',
} as const;

/**
 * 获取 Bubble 根节点样式类名键
 */
export function getBubbleStyleKeys(variant: BubbleVariant = 'default') {
	return {
		base: bubbleStyleKeys.root,
		variant: `variant${capitalize(variant)}`,
	};
}
