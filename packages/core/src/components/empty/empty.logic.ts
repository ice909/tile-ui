import type { EmptyMediaVariant } from './empty.types';
import { capitalize } from '../../utils/helpers';

/**
 * Empty 组件样式类名键
 */
export const emptyStyleKeys = {
	root: 'root',
	header: 'header',
	media: 'media',
	title: 'title',
	description: 'description',
	content: 'content',
} as const;

/**
 * 获取 EmptyMedia 的变体类名键
 */
export function getEmptyMediaVariantKey(variant: EmptyMediaVariant = 'default'): string {
	return `variant${capitalize(variant)}`;
}
