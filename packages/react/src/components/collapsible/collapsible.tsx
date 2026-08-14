import React, { createContext, useCallback, useContext, useId, useState } from 'react';
import { collapsibleStyleKeys, getCollapsibleState } from '@tile-ui/core';
import type { CollapsibleBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/collapsible.module.scss';

interface CollapsibleContextValue {
	open: boolean;
	disabled: boolean;
	contentId: string;
	toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(): CollapsibleContextValue {
	const context = useContext(CollapsibleContext);
	if (!context) {
		throw new Error('Collapsible sub-components must be used within <Collapsible>.');
	}
	return context;
}

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement>, CollapsibleBaseProps {
	onOpenChange?: (open: boolean) => void;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(({ className = '', open, defaultOpen = false, disabled = false, onOpenChange, children, ...props }, ref) => {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const isOpen = open !== undefined ? open : internalOpen;
	const contentId = useId();

	const toggle = useCallback(() => {
		if (disabled) {
			return;
		}

		const next = !isOpen;

		if (open === undefined) {
			setInternalOpen(next);
		}

		onOpenChange?.(next);
	}, [disabled, isOpen, open, onOpenChange]);

	return (
		<CollapsibleContext.Provider value={{ open: isOpen, disabled, contentId, toggle }}>
			<div ref={ref} className={`${styles[collapsibleStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</CollapsibleContext.Provider>
	);
});
Collapsible.displayName = 'Collapsible';

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(({ className = '', children, ...props }, ref) => {
	const context = useCollapsibleContext();
	const state = getCollapsibleState(context.open);

	return (
		<button
			ref={ref}
			type="button"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={state}
			disabled={context.disabled}
			className={`${styles[collapsibleStyleKeys.trigger]} ${className}`}
			onClick={context.toggle}
			{...props}>
			{children}
		</button>
	);
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(({ className = '', children, ...props }, ref) => {
	const context = useCollapsibleContext();
	const state = getCollapsibleState(context.open);

	return (
		<div ref={ref} id={context.contentId} data-state={state} className={`${styles[collapsibleStyleKeys.content]} ${className}`} {...props}>
			<div className={styles[collapsibleStyleKeys.contentInner]}>{children}</div>
		</div>
	);
});
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
export default Collapsible;
