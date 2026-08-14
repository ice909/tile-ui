import React, { useState } from 'react';
import { getNativeSelectState, nativeSelectStyleKeys } from '@tile-ui/core';
import type { NativeSelectBaseProps, NativeSelectOptionBaseProps, NativeSelectOptGroupBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/native-select.module.scss';

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'defaultValue'>, NativeSelectBaseProps {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
	({ className = '', size = 'default', value, defaultValue = '', onValueChange, onChange, children, ...props }, ref) => {
		const [internalValue, setInternalValue] = useState(defaultValue);
		const currentValue = value !== undefined ? value : internalValue;
		const state = getNativeSelectState(currentValue);

		function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
			const next = event.target.value;

			if (value === undefined) {
				setInternalValue(next);
			}

			onValueChange?.(next);
			onChange?.(event);
		}

		return (
			<div className={styles[nativeSelectStyleKeys.wrapper]}>
				<select
					ref={ref}
					data-slot="native-select"
					data-size={size}
					data-state={state}
					value={currentValue}
					onChange={handleChange}
					className={`${styles[nativeSelectStyleKeys.select]} ${className}`}
					{...props}>
					{children}
				</select>
				<svg
					className={styles[nativeSelectStyleKeys.icon]}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					data-slot="native-select-icon">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
		);
	},
);
NativeSelect.displayName = 'NativeSelect';

export interface NativeSelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement>, NativeSelectOptionBaseProps {}

const NativeSelectOption = React.forwardRef<HTMLOptionElement, NativeSelectOptionProps>(({ className = '', ...props }, ref) => {
	return <option ref={ref} data-slot="native-select-option" className={`${styles[nativeSelectStyleKeys.option]} ${className}`} {...props} />;
});
NativeSelectOption.displayName = 'NativeSelectOption';

export interface NativeSelectOptGroupProps extends React.OptgroupHTMLAttributes<HTMLOptGroupElement>, NativeSelectOptGroupBaseProps {}

const NativeSelectOptGroup = React.forwardRef<HTMLOptGroupElement, NativeSelectOptGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<optgroup ref={ref} data-slot="native-select-optgroup" className={`${styles[nativeSelectStyleKeys.optGroup]} ${className}`} {...props}>
			{children}
		</optgroup>
	);
});
NativeSelectOptGroup.displayName = 'NativeSelectOptGroup';

export { NativeSelect, NativeSelectOption, NativeSelectOptGroup };
export default NativeSelect;
