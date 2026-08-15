import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { getTooltipPosition, getTooltipState, tooltipStyleKeys, TOOLTIP_CLOSE_DELAY_MS } from '@tile-ui/core';
import type { TooltipBaseProps, TooltipContentBaseProps, TooltipPosition, TooltipProviderBaseProps, TooltipTriggerBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/tooltip.module.scss';

interface TooltipContextValue {
	open: boolean;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(): TooltipContextValue {
	const context = useContext(TooltipContext);
	if (!context) {
		throw new Error('Tooltip sub-components must be used within <Tooltip>.');
	}
	return context;
}

interface TooltipProviderContextValue {
	delayDuration: number;
}

const TooltipProviderContext = createContext<TooltipProviderContextValue>({ delayDuration: 0 });

export interface TooltipProviderProps extends TooltipProviderBaseProps {
	children?: React.ReactNode;
}

function TooltipProvider({ delayDuration = 0, children }: TooltipProviderProps) {
	return <TooltipProviderContext.Provider value={{ delayDuration }}>{children}</TooltipProviderContext.Provider>;
}

TooltipProvider.displayName = 'TooltipProvider';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement>, TooltipBaseProps {}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(({ className = '', open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
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
		<TooltipContext.Provider value={{ open: isOpen, triggerRef, contentId, setOpen }}>
			<div ref={ref} className={`${styles[tooltipStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</TooltipContext.Provider>
	);
});
Tooltip.displayName = 'Tooltip';

export interface TooltipTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, TooltipTriggerBaseProps {}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(({ className = '', asChild = false, children, onKeyDown, ...props }, ref) => {
	const context = useTooltipContext();
	const provider = useContext(TooltipProviderContext);
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function clearOpenTimer() {
		if (openTimer.current) {
			clearTimeout(openTimer.current);
			openTimer.current = null;
		}
	}

	function clearCloseTimer() {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	}

	function scheduleOpen() {
		clearOpenTimer();
		openTimer.current = setTimeout(() => context.setOpen(true), provider.delayDuration);
	}

	function scheduleClose() {
		clearCloseTimer();
		closeTimer.current = setTimeout(() => context.setOpen(false), TOOLTIP_CLOSE_DELAY_MS);
	}

	function handleMouseEnter() {
		clearCloseTimer();
		scheduleOpen();
	}

	function handleMouseLeave() {
		clearOpenTimer();
		scheduleClose();
	}

	function handleFocus() {
		clearCloseTimer();
		scheduleOpen();
	}

	function handleBlur() {
		clearOpenTimer();
		clearCloseTimer();
		context.setOpen(false);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (event.key === 'Escape') {
			clearOpenTimer();
			clearCloseTimer();
			context.setOpen(false);
		}
		onKeyDown?.(event);
	}

	useEffect(() => {
		return () => {
			clearOpenTimer();
			clearCloseTimer();
		};
	}, []);

	function setRef(element: HTMLElement | null) {
		context.triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element as HTMLButtonElement | null);
		} else if (ref) {
			ref.current = element as HTMLButtonElement | null;
		}
	}

	const Comp = asChild ? Slot : 'button';
	const state = getTooltipState(context.open);

	return (
		<Comp
			ref={setRef}
			aria-describedby={context.open ? context.contentId : undefined}
			data-state={state}
			className={asChild ? undefined : `${styles[tooltipStyleKeys.trigger]} ${className}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
		</Comp>
	);
});
TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement>, TooltipContentBaseProps {}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(({ className = '', side = 'top', sideOffset = 0, children, ...props }, ref) => {
	const { open, triggerRef, contentId, setOpen } = useTooltipContext();
	const [position, setPosition] = useState<TooltipPosition | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function clearCloseTimer() {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	}

	function handlePointerEnter() {
		clearCloseTimer();
		setOpen(true);
	}

	function handlePointerLeave() {
		clearCloseTimer();
		closeTimer.current = setTimeout(() => setOpen(false), TOOLTIP_CLOSE_DELAY_MS);
	}

	useEffect(() => {
		return () => {
			clearCloseTimer();
		};
	}, []);

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
			setPosition(getTooltipPosition({ triggerRect, contentSize, side, sideOffset, viewport }));
		}

		updatePosition();
		window.addEventListener('resize', updatePosition);
		document.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, side, sideOffset, triggerRef]);

	function setRef(element: HTMLDivElement | null) {
		contentRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	const state = getTooltipState(open);
	const classes = [styles[tooltipStyleKeys.content], className].filter(Boolean).join(' ');

	const content = (
		<div
			ref={setRef}
			id={contentId}
			role="tooltip"
			data-state={state}
			data-side={side}
			className={classes}
			style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			{...props}>
			{children}
			<span className={styles[tooltipStyleKeys.arrow]} aria-hidden="true" />
		</div>
	);

	if (!open || typeof document === 'undefined') {
		return null;
	}

	return createPortal(content, document.body);
});
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
export default Tooltip;
