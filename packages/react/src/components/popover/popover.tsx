import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { getPopoverPosition, getPopoverState, popoverStyleKeys } from '@tile-ui/core';
import type { PopoverBaseProps, PopoverContentBaseProps, PopoverPosition, PopoverTriggerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/popover.module.scss';

interface PopoverContextValue {
	open: boolean;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(): PopoverContextValue {
	const context = useContext(PopoverContext);
	if (!context) {
		throw new Error('Popover sub-components must be used within <Popover>.');
	}
	return context;
}

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement>, PopoverBaseProps {}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(({ className = '', open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const isOpen = open !== undefined ? open : internalOpen;
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentId = useId();

	const setOpen = useCallback(
		(next: boolean) => {
			if (open === undefined) {
				setInternalOpen(next);
			}
			onOpenChange?.(next);
		},
		[open, onOpenChange],
	);

	return (
		<PopoverContext.Provider value={{ open: isOpen, triggerRef, contentId, setOpen }}>
			<div ref={ref} className={`${styles[popoverStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</PopoverContext.Provider>
	);
});
Popover.displayName = 'Popover';

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, PopoverTriggerBaseProps {}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(({ className = '', asChild = false, children, onClick, ...props }, ref) => {
	const context = usePopoverContext();

	function setRef(element: HTMLElement | null) {
		context.triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element as HTMLButtonElement | null);
		} else if (ref) {
			ref.current = element as HTMLButtonElement | null;
		}
	}

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		context.setOpen(!context.open);
		onClick?.(event);
	}

	const Comp = asChild ? Slot : 'button';
	const state = getPopoverState(context.open);

	return (
		<Comp
			ref={setRef}
			aria-haspopup="dialog"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={state}
			className={asChild ? undefined : `${styles[popoverStyleKeys.trigger]} ${className}`}
			onClick={handleClick}
			{...props}>
			{children}
		</Comp>
	);
});
PopoverTrigger.displayName = 'PopoverTrigger';

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement>, PopoverContentBaseProps {}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(({ className = '', side = 'bottom', align = 'center', sideOffset = 4, children, ...props }, ref) => {
	const { open, triggerRef, contentId, setOpen } = usePopoverContext();
	const [position, setPosition] = useState<PopoverPosition | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);

	function setRef(element: HTMLDivElement | null) {
		contentRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	useLayoutEffect(() => {
		if (!open) {
			return;
		}

		function updatePosition() {
			const trigger = triggerRef.current;
			const content = contentRef.current;
			if (!trigger || !content) {
				return;
			}

			const triggerRect = trigger.getBoundingClientRect();
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			setPosition(getPopoverPosition({ triggerRect, contentSize, side, align, sideOffset, viewport }));
		}

		updatePosition();

		const content = contentRef.current;
		if (content && !content.contains(document.activeElement)) {
			content.focus();
		}

		window.addEventListener('resize', updatePosition);
		document.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, side, align, sideOffset, triggerRef]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node | null;
			const content = contentRef.current;
			const trigger = triggerRef.current;
			if (!target) {
				return;
			}
			if (content && content.contains(target)) {
				return;
			}
			if (trigger && trigger.contains(target)) {
				return;
			}
			setOpen(false);
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setOpen(false);
				triggerRef.current?.focus();
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, triggerRef, setOpen]);

	const state = getPopoverState(open);
	const classes = [styles[popoverStyleKeys.content], className].filter(Boolean).join(' ');

	const content = (
		<div
			ref={setRef}
			id={contentId}
			role="dialog"
			aria-modal="false"
			tabIndex={-1}
			data-state={state}
			data-side={side}
			data-align={align}
			className={classes}
			style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
			{...props}>
			{children}
		</div>
	);

	if (!open || typeof document === 'undefined') {
		return null;
	}

	return createPortal(content, document.body);
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
export default Popover;
