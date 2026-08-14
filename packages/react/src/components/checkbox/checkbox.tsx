import React, { useState } from 'react';
import { checkboxStyleKeys, getCheckboxState, getNextCheckboxState } from '@tile-ui/core';
import type { CheckboxCheckedState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/checkbox.module.scss';

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'defaultChecked'> {
	checked?: CheckboxCheckedState;
	defaultChecked?: CheckboxCheckedState;
	onCheckedChange?: (checked: CheckboxCheckedState) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(({ className = '', checked, defaultChecked = false, disabled, onCheckedChange, ...props }, ref) => {
	const [internalChecked, setInternalChecked] = useState<CheckboxCheckedState>(defaultChecked);
	const isChecked = checked !== undefined ? checked : internalChecked;
	const state = getCheckboxState(isChecked);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		const next = getNextCheckboxState(isChecked);

		if (checked === undefined) {
			setInternalChecked(next);
		}

		onCheckedChange?.(next);
		props.onClick?.(event);
	}

	const ariaChecked = state === 'checked' ? 'true' : state === 'mixed' ? 'mixed' : 'false';

	return (
		<button
			ref={ref}
			type="button"
			role="checkbox"
			aria-checked={ariaChecked}
			data-state={state}
			disabled={disabled}
			className={`${styles[checkboxStyleKeys.root]} ${className}`}
			onClick={handleClick}
			{...props}>
			<span className={styles[checkboxStyleKeys.indicator]}>
				{state === 'checked' && (
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20 6 9 17l-5-5" />
					</svg>
				)}
				{state === 'mixed' && (
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
						<path d="M5 12h14" />
					</svg>
				)}
			</span>
		</button>
	);
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
