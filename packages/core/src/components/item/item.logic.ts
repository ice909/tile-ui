import type { ItemVariant } from './item.types';
import { capitalize } from '../../utils/helpers';

/**
 * Item 组件样式类名键
 */
export const itemStyleKeys = {
	group: 'group',
	separator: 'separator',
	item: 'item',
	media: 'media',
	content: 'content',
	title: 'title',
	description: 'description',
	actions: 'actions',
	header: 'header',
	footer: 'footer',
} as const;

/**
 * 获取 Item 的变体类名键
 */
export function getItemVariantKey(variant: ItemVariant = 'neutral'): string {
	return `variant${capitalize(variant)}`;
}
