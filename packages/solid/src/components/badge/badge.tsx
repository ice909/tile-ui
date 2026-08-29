import { splitProps, type JSX } from 'solid-js';
import { getBadgeStyleKeys } from '@tile-ui/core';
import type { BadgeBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/badge.module.scss';

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement>, Omit<BadgeBaseProps, 'asChild'> {}

/**
 * SolidJS Badge：复用 core 的样式 key，样式来自共享 SCSS。
 */
export function Badge(props: BadgeProps) {
	const [local, rest] = splitProps(props, ['variant', 'class', 'children']);
	const styleKeys = () => getBadgeStyleKeys(local.variant);

	return (
		<span {...rest} class={`${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}

export default Badge;
