import React, { useState } from 'react';
import { getSwitchState, switchStyleKeys } from '@tile-ui/core';
import type { SwitchBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/switch.module.scss';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>, SwitchBaseProps {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	({ className = '', size = 'default', checked, defaultChecked = false, disabled, onCheckedChange, ...props }, ref) => {
		const [internalChecked, setInternalChecked] = useState(defaultChecked);
		const isChecked = checked !== undefined ? checked : internalChecked;
		const state = getSwitchState(isChecked);

		function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
			const next = !isChecked;

			if (checked === undefined) {
				setInternalChecked(next);
			}

			onCheckedChange?.(next);
			props.onClick?.(event);
		}

		return (
			<button
				ref={ref}
				type="button"
				role="switch"
				aria-checked={isChecked}
				data-state={state}
				data-size={size}
				disabled={disabled}
				className={`${styles[switchStyleKeys.root]} ${className}`}
				onClick={handleClick}
				{...props}>
				<span className={styles[switchStyleKeys.thumb]} />
			</button>
		);
	},
);

Switch.displayName = 'Switch';

export { Switch };
export default Switch;
