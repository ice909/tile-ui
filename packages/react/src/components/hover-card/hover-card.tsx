import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { getHoverCardPosition, getHoverCardState, hoverCardStyleKeys } from '@tile-ui/core';
import type { HoverCardBaseProps, HoverCardContentBaseProps, HoverCardPosition, HoverCardTriggerBaseProps } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/hover-card.module.scss';

interface HoverCardContextValue {
	open: boolean;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	openDelay: number;
	closeDelay: number;
	setOpen: (open: boolean) => void;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(): HoverCardContextValue {
	const context = useContext(HoverCardContext);
	if (!context) {
		throw new Error('HoverCard sub-components must be used within <HoverCard>.');
	}
	return context;
}

export interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement>, HoverCardBaseProps {}

const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
	({ className = '', open, defaultOpen = false, openDelay = 200, closeDelay = 300, onOpenChange, children, ...props }, ref) => {
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
			<HoverCardContext.Provider value={{ open: isOpen, triggerRef, contentId, openDelay, closeDelay, setOpen }}>
				<div ref={ref} className={`${styles[hoverCardStyleKeys.root]} ${className}`} {...props}>
					{children}
				</div>
			</HoverCardContext.Provider>
		);
	},
);
HoverCard.displayName = 'HoverCard';

export interface HoverCardTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, HoverCardTriggerBaseProps {}

const HoverCardTrigger = React.forwardRef<HTMLButtonElement, HoverCardTriggerProps>(({ className = '', asChild = false, children, onKeyDown, ...props }, ref) => {
	const context = useHoverCardContext();
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
		openTimer.current = setTimeout(() => context.setOpen(true), context.openDelay);
	}

	function scheduleClose() {
		clearCloseTimer();
		closeTimer.current = setTimeout(() => context.setOpen(false), context.closeDelay);
	}

	function handlePointerEnter() {
		clearCloseTimer();
		scheduleOpen();
	}

	function handlePointerLeave() {
		clearOpenTimer();
		scheduleClose();
	}

	function handleFocus() {
		clearCloseTimer();
		scheduleOpen();
	}

	function handleBlur() {
		clearOpenTimer();
		scheduleClose();
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
	const state = getHoverCardState(context.open);

	return (
		<Comp
			ref={setRef}
			data-state={state}
			className={asChild ? undefined : `${styles[hoverCardStyleKeys.trigger]} ${className}`}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
		</Comp>
	);
});
HoverCardTrigger.displayName = 'HoverCardTrigger';

export interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement>, HoverCardContentBaseProps {
	container?: PortalContainer;
}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
	({ className = '', side = 'bottom', align = 'center', sideOffset = 4, container, children, ...props }, ref) => {
		const { open, triggerRef, contentId, closeDelay, setOpen } = useHoverCardContext();
		const portalContainer = usePortalContainer(container);
		const [position, setPosition] = useState<HoverCardPosition | null>(null);
		const contentRef = useRef<HTMLDivElement | null>(null);
		const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

		function setRef(element: HTMLDivElement | null) {
			contentRef.current = element;
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}

		function clearCloseTimer() {
			if (closeTimer.current) {
				clearTimeout(closeTimer.current);
				closeTimer.current = null;
			}
		}

		function scheduleClose() {
			clearCloseTimer();
			closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
		}

		function handlePointerEnter() {
			clearCloseTimer();
		}

		function handlePointerLeave() {
			scheduleClose();
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
				setPosition(getHoverCardPosition({ triggerRect, contentSize, side, align, sideOffset, viewport }));
			}

			updatePosition();
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

			function handleKeyDown(event: KeyboardEvent) {
				if (event.key === 'Escape') {
					clearCloseTimer();
					setOpen(false);
				}
			}

			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}, [open, setOpen]);

		const state = getHoverCardState(open);
		const classes = [styles[hoverCardStyleKeys.content], className].filter(Boolean).join(' ');

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
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
				{...props}>
				{children}
			</div>
		);

		if (!open || !portalContainer) {
			return null;
		}

		return createPortal(content, portalContainer);
	},
);
HoverCardContent.displayName = 'HoverCardContent';

export { HoverCard, HoverCardTrigger, HoverCardContent };
export default HoverCard;
