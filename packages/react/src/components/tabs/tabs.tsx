import React, { createContext, useContext, useState } from 'react';
import { getTabsState, tabsStyleKeys } from '@tile-ui/core';
import type { TabsBaseProps, TabsTriggerBaseProps, TabsContentBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/tabs.module.scss';

interface TabsContextValue {
	value: string;
	orientation: 'horizontal' | 'vertical';
	select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error('Tabs sub-components must be used within <Tabs>.');
	}
	return context;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>, TabsBaseProps {}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className = '', value, defaultValue = '', orientation = 'horizontal', onValueChange, children, ...props }, ref) => {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const currentValue = value !== undefined ? value : internalValue;

	function select(next: string) {
		if (value === undefined) {
			setInternalValue(next);
		}
		onValueChange?.(next);
	}

	return (
		<TabsContext.Provider value={{ value: currentValue, orientation, select }}>
			<div ref={ref} data-orientation={orientation} className={`${styles[tabsStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</TabsContext.Provider>
	);
});
Tabs.displayName = 'Tabs';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className = '', children, onKeyDown, ...props }, ref) => {
	const context = useTabsContext();

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		onKeyDown?.(event);
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
			return;
		}

		const triggers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]')).filter((trigger) => !trigger.disabled);

		if (triggers.length === 0) {
			return;
		}

		const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
		const direction = event.key === 'ArrowRight' ? 1 : -1;
		const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;

		triggers[nextIndex]?.focus();
		event.preventDefault();
	}

	return (
		<div ref={ref} role="tablist" data-orientation={context.orientation} onKeyDown={handleKeyDown} className={`${styles[tabsStyleKeys.list]} ${className}`} {...props}>
			{children}
		</div>
	);
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'>, TabsTriggerBaseProps {
	value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className = '', value, disabled = false, children, onClick, ...props }, ref) => {
	const context = useTabsContext();
	const active = context.value === value;
	const state = getTabsState(active);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		context.select(value);
		onClick?.(event);
	}

	return (
		<button
			ref={ref}
			type="button"
			role="tab"
			aria-selected={active}
			tabIndex={active ? 0 : -1}
			disabled={disabled}
			data-state={state}
			data-orientation={context.orientation}
			className={`${styles[tabsStyleKeys.trigger]} ${className}`}
			onClick={handleClick}
			{...props}>
			{children}
		</button>
	);
});
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement>, TabsContentBaseProps {
	value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className = '', value, children, ...props }, ref) => {
	const context = useTabsContext();
	const active = context.value === value;
	const state = getTabsState(active);

	return (
		<div
			{...props}
			ref={ref}
			role="tabpanel"
			data-state={state}
			data-orientation={context.orientation}
			hidden={!active}
			className={`${styles[tabsStyleKeys.content]} ${className}`}>
			{children}
		</div>
	);
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
