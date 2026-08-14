export type AvatarSize = 'default' | 'sm' | 'lg';

/**
 * 框架无关的 Avatar 基础 Props (仅包含组件库自定义属性)
 */
export interface AvatarBaseProps {
	size?: AvatarSize;
}

export interface AvatarImageBaseProps {
	alt?: string;
}

export interface AvatarFallbackBaseProps {}
export interface AvatarBadgeBaseProps {}
export interface AvatarGroupBaseProps {}
export interface AvatarGroupCountBaseProps {}
