import type { PaginationSize } from './pagination.types';
import { capitalize } from '../../utils/helpers';

/**
 * 获取 Pagination 尺寸样式类名键
 */
export function getPaginationSizeKey(size: PaginationSize): string {
	return `size${capitalize(size)}`;
}

/**
 * Pagination 组件样式类名键
 */
export const paginationStyleKeys = {
	root: 'root',
	content: 'content',
	item: 'item',
	link: 'link',
	ellipsis: 'ellipsis',
	ellipsisIcon: 'ellipsisIcon',
	srOnly: 'srOnly',
} as const;
