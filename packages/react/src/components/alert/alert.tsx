import React from 'react';
import { alertStyleKeys, getAlertStyleKeys } from '@tile-ui/core';
import type { AlertBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/alert.module.scss';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, AlertBaseProps {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className = '', variant = 'default', children, ...props }, ref) => {
	const styleKeys = getAlertStyleKeys(variant);
	const classes = [styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} role="alert" data-slot="alert" data-variant={variant} className={classes} {...props}>
			{children}
		</div>
	);
});
Alert.displayName = 'Alert';

export interface AlertTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="alert-title" className={`${styles[alertStyleKeys.title]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} data-slot="alert-description" className={`${styles[alertStyleKeys.description]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
export default Alert;
