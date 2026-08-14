export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

/**
 * 框架无关的 Badge 基础 Props (仅包含组件库自定义属性)
 */
export interface BadgeBaseProps {
	variant?: BadgeVariant;
	asChild?: boolean;
}
