import React, { createContext, useContext, useId, useState } from 'react';
import { accordionStyleKeys, getAccordionState, getAccordionNextValues } from '@tile-ui/core';
import type { AccordionBaseProps, AccordionItemBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/accordion.module.scss';

interface AccordionContextValue {
	type: 'single' | 'multiple';
	collapsible: boolean;
	value: string | string[];
	toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
	const context = useContext(AccordionContext);
	if (!context) {
		throw new Error('Accordion sub-components must be used within <Accordion>.');
	}
	return context;
}

interface AccordionItemContextValue {
	value: string;
	open: boolean;
	disabled: boolean;
	contentId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(): AccordionItemContextValue {
	const context = useContext(AccordionItemContext);
	if (!context) {
		throw new Error('AccordionItem sub-components must be used within <AccordionItem>.');
	}
	return context;
}

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>, AccordionBaseProps {}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
	({ className = '', type = 'single', collapsible = false, value, defaultValue, onValueChange, children, ...props }, ref) => {
		const [internalValue, setInternalValue] = useState<string | string[]>(() => {
			if (type === 'multiple') {
				return Array.isArray(defaultValue) ? defaultValue : [];
			}
			return typeof defaultValue === 'string' ? defaultValue : '';
		});
		const currentValue = value !== undefined ? value : internalValue;
		const normalized = type === 'multiple' ? (Array.isArray(currentValue) ? currentValue : []) : typeof currentValue === 'string' ? currentValue : '';

		function toggleItem(itemValue: string) {
			let next: string | string[];

			if (type === 'multiple') {
				const list = Array.isArray(normalized) ? normalized : [];
				next = getAccordionNextValues(itemValue, list);
			} else if (normalized === itemValue) {
				next = collapsible ? '' : normalized;
			} else {
				next = itemValue;
			}

			if (value === undefined) {
				setInternalValue(next);
			}

			onValueChange?.(next);
		}

		return (
			<AccordionContext.Provider value={{ type, collapsible, value: normalized, toggleItem }}>
				<div ref={ref} className={`${styles[accordionStyleKeys.root]} ${className}`} {...props}>
					{children}
				</div>
			</AccordionContext.Provider>
		);
	},
);
Accordion.displayName = 'Accordion';

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement>, AccordionItemBaseProps {
	value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(({ className = '', value, disabled = false, children, ...props }, ref) => {
	const accordion = useAccordionContext();
	const open = accordion.type === 'multiple' ? Array.isArray(accordion.value) && accordion.value.includes(value) : accordion.value === value;
	const state = getAccordionState(open);
	const contentId = useId();

	return (
		<AccordionItemContext.Provider value={{ value, open, disabled, contentId }}>
			<div ref={ref} data-state={state} className={`${styles[accordionStyleKeys.item]} ${className}`} {...props}>
				{children}
			</div>
		</AccordionItemContext.Provider>
	);
});
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(({ className = '', children, onClick, ...props }, ref) => {
	const accordion = useAccordionContext();
	const item = useAccordionItemContext();
	const state = getAccordionState(item.open);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		if (item.disabled) {
			return;
		}
		accordion.toggleItem(item.value);
		onClick?.(event);
	}

	return (
		<div className={styles[accordionStyleKeys.header]}>
			<button
				ref={ref}
				type="button"
				aria-expanded={item.open}
				aria-controls={item.contentId}
				data-state={state}
				disabled={item.disabled}
				className={`${styles[accordionStyleKeys.trigger]} ${className}`}
				onClick={handleClick}
				{...props}>
				{children}
				<svg
					className={styles[accordionStyleKeys.chevron]}
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
		</div>
	);
});
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(({ className = '', children, ...props }, ref) => {
	const item = useAccordionItemContext();
	const state = getAccordionState(item.open);

	return (
		<div ref={ref} id={item.contentId} data-state={state} className={`${styles[accordionStyleKeys.content]} ${className}`} {...props}>
			<div className={styles[accordionStyleKeys.contentInner]}>{children}</div>
		</div>
	);
});
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export default Accordion;
