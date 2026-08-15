import React, { useState } from 'react';
import { getToggleState, getToggleStyleKeys } from '@tile-ui/core';
import type { ToggleBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/toggle.module.scss';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ToggleBaseProps {
	pressed?: boolean;
	defaultPressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
	({ className = '', variant = 'default', size = 'default', pressed, defaultPressed = false, disabled, onPressedChange, children, ...props }, ref) => {
		const [internalPressed, setInternalPressed] = useState(defaultPressed);
		const isPressed = pressed !== undefined ? pressed : internalPressed;
		const state = getToggleState(isPressed);
		const styleKeys = getToggleStyleKeys(variant, size);
		const classes = [styles[styleKeys.base], styles[styleKeys.variant], styles[styleKeys.size], className].filter(Boolean).join(' ');

		function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
			const next = !isPressed;

			if (pressed === undefined) {
				setInternalPressed(next);
			}

			onPressedChange?.(next);
			props.onClick?.(event);
		}

		return (
			<button
				ref={ref}
				type="button"
				role="button"
				aria-pressed={isPressed}
				data-state={state}
				data-variant={variant}
				data-size={size}
				disabled={disabled}
				className={classes}
				{...props}
				onClick={handleClick}>
				{children}
			</button>
		);
	},
);
Toggle.displayName = 'Toggle';

export { Toggle };
export default Toggle;
