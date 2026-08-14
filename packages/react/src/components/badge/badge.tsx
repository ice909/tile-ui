import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { getBadgeStyleKeys } from '@tile-ui/core';
import type { BadgeBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/badge.module.scss';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, BadgeBaseProps {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className = '', variant = 'default', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'span';
	const styleKeys = getBadgeStyleKeys(variant);

	const classes = [styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ');

	return (
		<Comp ref={ref} className={classes} {...props}>
			{children}
		</Comp>
	);
});

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
