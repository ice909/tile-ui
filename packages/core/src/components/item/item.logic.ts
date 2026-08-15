import type { ItemVariant, ItemSize, ItemMediaVariant } from './item.types';
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
export function getItemVariantKey(variant: ItemVariant = 'default'): string {
	return `variant${capitalize(variant)}`;
}

/**
 * 获取 Item 的尺寸类名键
 */
export function getItemSizeKey(size: ItemSize = 'default'): string {
	return `size${capitalize(size)}`;
}

/**
 * 获取 ItemMedia 的变体类名键
 */
export function getItemMediaVariantKey(variant: ItemMediaVariant = 'default'): string {
	return `variant${capitalize(variant)}`;
}
