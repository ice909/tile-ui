import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { buttonGroupStyleKeys, getButtonGroupStyleKeys } from '@tile-ui/core';
import type { ButtonGroupBaseProps, ButtonGroupTextBaseProps, ButtonGroupSeparatorBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/button-group.module.scss';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement>, ButtonGroupBaseProps {}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(({ className = '', orientation = 'horizontal', children, ...props }, ref) => {
	const styleKeys = getButtonGroupStyleKeys(orientation);
	const classes = [styles[styleKeys.base], styles[styleKeys.orientation], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} role="group" data-slot="button-group" data-orientation={orientation} className={classes} {...props}>
			{children}
		</div>
	);
});
ButtonGroup.displayName = 'ButtonGroup';

export interface ButtonGroupTextProps extends React.HTMLAttributes<HTMLDivElement>, ButtonGroupTextBaseProps {}

const ButtonGroupText = React.forwardRef<HTMLDivElement, ButtonGroupTextProps>(({ className = '', asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div';

	return (
		<Comp ref={ref} className={`${styles[buttonGroupStyleKeys.text]} ${className}`} {...props}>
			{children}
		</Comp>
	);
});
ButtonGroupText.displayName = 'ButtonGroupText';

export interface ButtonGroupSeparatorProps extends React.HTMLAttributes<HTMLDivElement>, ButtonGroupSeparatorBaseProps {}

const ButtonGroupSeparator = React.forwardRef<HTMLDivElement, ButtonGroupSeparatorProps>(({ className = '', orientation = 'vertical', ...props }, ref) => {
	return (
		<div
			ref={ref}
			role="none"
			aria-hidden="true"
			data-slot="button-group-separator"
			data-orientation={orientation}
			className={`${styles[buttonGroupStyleKeys.separator]} ${className}`}
			{...props}
		/>
	);
});
ButtonGroupSeparator.displayName = 'ButtonGroupSeparator';

export { ButtonGroup, ButtonGroupText, ButtonGroupSeparator };
export default ButtonGroup;
