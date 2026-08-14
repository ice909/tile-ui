import React from 'react';
import { getSeparatorStyleKeys } from '@tile-ui/core';
import type { SeparatorBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/separator.module.scss';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement>, SeparatorBaseProps {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({ className = '', orientation = 'horizontal', decorative = true, ...props }, ref) => {
	const styleKeys = getSeparatorStyleKeys(orientation);
	const classes = [styles[styleKeys.base], styles[styleKeys.orientation], className].filter(Boolean).join(' ');

	return <div ref={ref} role={decorative ? 'none' : 'separator'} aria-orientation={decorative ? undefined : orientation} className={classes} {...props} />;
});

Separator.displayName = 'Separator';

export { Separator };
export default Separator;
