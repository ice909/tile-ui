import React, { createContext, useContext, useId, useState } from 'react';
import { getRadioState, radioGroupStyleKeys } from '@tile-ui/core';
import type { RadioGroupBaseProps, RadioGroupItemBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/radio-group.module.scss';

interface RadioGroupContextValue {
	value: string;
	name: string;
	disabled: boolean;
	select: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(): RadioGroupContextValue {
	const context = useContext(RadioGroupContext);
	if (!context) {
		throw new Error('RadioGroup sub-components must be used within <RadioGroup>.');
	}
	return context;
}

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>, RadioGroupBaseProps {}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
	({ className = '', value, defaultValue = '', onValueChange, orientation = 'vertical', name = '', disabled = false, children, ...props }, ref) => {
		const [internalValue, setInternalValue] = useState(defaultValue);
		const currentValue = value !== undefined ? value : internalValue;

		function select(next: string) {
			if (disabled) {
				return;
			}
			if (value === undefined) {
				setInternalValue(next);
			}
			onValueChange?.(next);
		}

		return (
			<RadioGroupContext.Provider value={{ value: currentValue, name, disabled, select }}>
				<div
					ref={ref}
					role="radiogroup"
					aria-orientation={orientation}
					data-orientation={orientation}
					className={`${styles[radioGroupStyleKeys.root]} ${className}`}
					{...props}>
					{children}
				</div>
			</RadioGroupContext.Provider>
		);
	},
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'checked'>, RadioGroupItemBaseProps {
	value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(({ className = '', value, disabled = false, onChange, children, ...props }, ref) => {
	const context = useRadioGroupContext();
	const checked = context.value === value;
	const state = getRadioState(checked);
	const inputId = useId();

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		context.select(value);
		onChange?.(event);
	}

	return (
		<label htmlFor={inputId} className={`${styles[radioGroupStyleKeys.label]} ${className}`}>
			<input
				{...props}
				ref={ref}
				id={inputId}
				type="radio"
				name={context.name}
				value={value}
				checked={checked}
				disabled={disabled || context.disabled}
				onChange={handleChange}
				className={styles[radioGroupStyleKeys.input]}
			/>
			<span aria-hidden data-state={state} className={styles[radioGroupStyleKeys.item]}>
				<span className={styles[radioGroupStyleKeys.indicator]}>
					<span className={styles[radioGroupStyleKeys.dot]} />
				</span>
			</span>
			{children}
		</label>
	);
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
export default RadioGroup;
