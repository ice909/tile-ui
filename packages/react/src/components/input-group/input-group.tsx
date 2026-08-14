import React from 'react';
import { getInputGroupAddonStyleKeys, getInputGroupStyleKeys, inputGroupStyleKeys } from '@tile-ui/core';
import type {
	InputGroupAddonBaseProps,
	InputGroupBaseProps,
	InputGroupButtonBaseProps,
	InputGroupInputBaseProps,
	InputGroupTextareaBaseProps,
	InputGroupTextBaseProps,
	ButtonVariant,
	ButtonSize,
} from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/input-group.module.scss';
import { Button } from '../button';

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement>, InputGroupBaseProps {}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(({ className = '', variant = 'default', children, ...props }, ref) => {
	const styleKeys = getInputGroupStyleKeys(variant);
	const classes = [styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} role="group" data-slot="input-group" data-variant={variant} className={classes} {...props}>
			{children}
		</div>
	);
});
InputGroup.displayName = 'InputGroup';

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement>, InputGroupAddonBaseProps {}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(({ className = '', variant = 'default', align = 'inline-start', onClick, ...props }, ref) => {
	const styleKeys = getInputGroupAddonStyleKeys(variant);
	const classes = [styles[styleKeys.base], styles[styleKeys.variant], className].filter(Boolean).join(' ');

	function handleClick(event: React.MouseEvent<HTMLDivElement>) {
		if ((event.target as HTMLElement).closest('button')) {
			return;
		}
		event.currentTarget.parentElement?.querySelector('input')?.focus();
		onClick?.(event);
	}

	return <div ref={ref} role="group" data-slot="input-group-addon" data-variant={variant} data-align={align} className={classes} onClick={handleClick} {...props} />;
});
InputGroupAddon.displayName = 'InputGroupAddon';

export interface InputGroupButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'size'>, InputGroupButtonBaseProps {
	type?: 'button' | 'submit' | 'reset';
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
	({ className = '', type = 'button', variant = 'ghost', size = 'sm', children, ...props }, ref) => {
		return (
			<Button ref={ref} type={type} variant={variant} size={size} className={`${styles[inputGroupStyleKeys.button]} ${className}`} {...props}>
				{children}
			</Button>
		);
	},
);
InputGroupButton.displayName = 'InputGroupButton';

export interface InputGroupTextProps extends React.HTMLAttributes<HTMLSpanElement>, InputGroupTextBaseProps {}

const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(({ className = '', children, ...props }, ref) => {
	return (
		<span ref={ref} data-slot="input-group-text" className={`${styles[inputGroupStyleKeys.text]} ${className}`} {...props}>
			{children}
		</span>
	);
});
InputGroupText.displayName = 'InputGroupText';

export interface InputGroupInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, InputGroupInputBaseProps {}

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(({ className = '', ...props }, ref) => {
	return <input ref={ref} data-slot="input-group-control" className={`${styles[inputGroupStyleKeys.input]} ${className}`} {...props} />;
});
InputGroupInput.displayName = 'InputGroupInput';

export interface InputGroupTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, InputGroupTextareaBaseProps {}

const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, InputGroupTextareaProps>(({ className = '', ...props }, ref) => {
	return <textarea ref={ref} data-slot="input-group-control" className={`${styles[inputGroupStyleKeys.textarea]} ${className}`} {...props} />;
});
InputGroupTextarea.displayName = 'InputGroupTextarea';

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea };
export default InputGroup;
