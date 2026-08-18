import React, { createContext, useContext, useState } from 'react';
import { getToggleGroupItemState, getToggleStyleKeys, toggleGroupStyleKeys, toggleValueInList } from '@tile-ui/core';
import type { ToggleGroupBaseProps, ToggleGroupItemBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/toggle-group.module.scss';

type ToggleGroupValue = string | string[];

interface ToggleGroupContextValue {
	type: 'single' | 'multiple';
	value: ToggleGroupValue;
	onItemClick: (itemValue: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext(): ToggleGroupContextValue {
	const context = useContext(ToggleGroupContext);
	if (!context) {
		throw new Error('ToggleGroupItem must be used within <ToggleGroup>.');
	}
	return context;
}

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement>, ToggleGroupBaseProps {
	value?: string | string[];
	defaultValue?: string | string[];
	onValueChange?: (value: string | string[]) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(({ className = '', type = 'single', value, defaultValue, onValueChange, children, ...props }, ref) => {
	const [internalValue, setInternalValue] = useState<ToggleGroupValue>(defaultValue ?? (type === 'single' ? '' : []));
	const currentValue = value !== undefined ? value : internalValue;

	function handleItemClick(itemValue: string) {
		let next: ToggleGroupValue;

		if (type === 'single') {
			next = currentValue === itemValue ? '' : itemValue;
		} else {
			const list = Array.isArray(currentValue) ? currentValue : [];
			next = toggleValueInList(itemValue, list);
		}

		if (value === undefined) {
			setInternalValue(next);
		}

		onValueChange?.(next);
	}

	const context: ToggleGroupContextValue = { type, value: currentValue, onItemClick: handleItemClick };

	return (
		<ToggleGroupContext.Provider value={context}>
			<div ref={ref} role="group" data-slot="toggle-group" data-type={type} className={`${styles[toggleGroupStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</ToggleGroupContext.Provider>
	);
});
ToggleGroup.displayName = 'ToggleGroup';

export interface ToggleGroupItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'>, ToggleGroupItemBaseProps {}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
	({ className = '', value, variant = 'default', size = 'default', disabled, children, ...props }, ref) => {
		const context = useToggleGroupContext();
		const selected = context.type === 'single' ? context.value === value : Array.isArray(context.value) ? context.value.includes(value) : false;
		const state = getToggleGroupItemState(selected);
		const styleKeys = getToggleStyleKeys(variant, size);
		const classes = [styles[toggleGroupStyleKeys.item], styles[styleKeys.variant], styles[styleKeys.size], className].filter(Boolean).join(' ');

		return (
			<button
				ref={ref}
				type="button"
				value={value}
				aria-pressed={selected}
				data-state={state}
				data-active={selected}
				disabled={disabled}
				className={classes}
				{...props}
				onClick={() => context.onItemClick(value)}>
				{children}
			</button>
		);
	},
);
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
export default ToggleGroup;
