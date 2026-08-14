/**
 * 头像图片加载状态
 */
export type AvatarImageStatus = 'loading' | 'loaded' | 'error';

/**
 * Avatar 组件样式类名键
 */
export const avatarStyleKeys = {
	root: 'root',
	image: 'image',
	fallback: 'fallback',
	badge: 'badge',
	group: 'group',
	groupCount: 'groupCount',
} as const;

/**
 * 根据图片加载状态判断是否显示 Fallback
 */
export function shouldShowAvatarFallback(status: AvatarImageStatus | undefined, hasImage: boolean): boolean {
	return !hasImage || status !== 'loaded';
}
