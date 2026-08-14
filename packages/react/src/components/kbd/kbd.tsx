import React from 'react';
import { kbdStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/kbd.module.scss';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className = '', children, ...props }, ref) => {
	return (
		<kbd ref={ref} className={`${styles[kbdStyleKeys.base]} ${className}`} {...props}>
			{children}
		</kbd>
	);
});
Kbd.displayName = 'Kbd';

export interface KbdGroupProps extends React.HTMLAttributes<HTMLElement> {}

const KbdGroup = React.forwardRef<HTMLElement, KbdGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<kbd ref={ref} className={`${styles[kbdStyleKeys.group]} ${className}`} {...props}>
			{children}
		</kbd>
	);
});
KbdGroup.displayName = 'KbdGroup';

export { Kbd, KbdGroup };
export default Kbd;
