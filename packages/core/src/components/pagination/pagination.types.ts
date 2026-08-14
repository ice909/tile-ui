export type PaginationSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * 框架无关的 Pagination 基础 Props (仅包含组件库自定义属性)
 */
export interface PaginationBaseProps {}

export interface PaginationContentBaseProps {}
export interface PaginationItemBaseProps {}

export interface PaginationLinkBaseProps {
	isActive?: boolean;
	size?: PaginationSize;
}

export interface PaginationEllipsisBaseProps {}
