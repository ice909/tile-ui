import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { drawerStyleKeys, getDrawerState, getDrawerTranslateStyle } from '@tile-ui/core';
import type { DrawerBaseProps, DrawerDirection } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/drawer.module.scss';

interface DrawerContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	direction: DrawerDirection;
	modal: boolean;
	titleId: string;
	descriptionId: string;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(): DrawerContextValue {
	const context = useContext(DrawerContext);
	if (!context) {
		throw new Error('Drawer sub-components must be used within <Drawer>.');
	}
	return context;
}

export interface DrawerProps extends DrawerBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

function Drawer({ direction = 'right', modal = true, open, defaultOpen = false, onOpenChange, children }: DrawerProps) {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const onOpenChangeRef = useRef(onOpenChange);

	useEffect(() => {
		onOpenChangeRef.current = onOpenChange;
	});

	const setOpen = useCallback(
		(next: boolean) => {
			if (open === undefined) {
				setInternalOpen(next);
			}

			onOpenChangeRef.current?.(next);
		},
		[open],
	);

	const close = useCallback(() => {
		setOpen(false);
	}, [setOpen]);

	const isOpen = open !== undefined ? open : internalOpen;
	const titleId = useId();
	const descriptionId = useId();

	return <DrawerContext.Provider value={{ open: isOpen, setOpen, close, direction, modal, titleId, descriptionId }}>{children}</DrawerContext.Provider>;
}

Drawer.displayName = 'Drawer';

export interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useDrawerContext();
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			ref={ref}
			type={asChild ? undefined : 'button'}
			className={className}
			onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);
				context.setOpen(true);
			}}
			{...props}>
			{children}
		</Comp>
	);
});
DrawerTrigger.displayName = 'DrawerTrigger';

export interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const DrawerClose = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useDrawerContext();
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			ref={ref}
			type={asChild ? undefined : 'button'}
			className={className}
			onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);
				context.close();
			}}
			{...props}>
			{children}
		</Comp>
	);
});
DrawerClose.displayName = 'DrawerClose';

export interface DrawerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerOverlay = React.forwardRef<HTMLDivElement, DrawerOverlayProps>(({ className = '', onClick, ...props }, ref) => {
	const context = useDrawerContext();

	if (!context.open || !context.modal) {
		return null;
	}

	return (
		<div
			ref={ref}
			data-state={getDrawerState(context.open)}
			className={`${styles[drawerStyleKeys.overlay]} ${className}`}
			onClick={(event: React.MouseEvent<HTMLDivElement>) => {
				onClick?.(event);
				context.close();
			}}
			{...props}
		/>
	);
});
DrawerOverlay.displayName = 'DrawerOverlay';

export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
	showCloseButton?: boolean;
	container?: PortalContainer;
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(({ className = '', showCloseButton = true, container, style, children, ...props }, ref) => {
	const { open, close, direction, modal, titleId, descriptionId } = useDrawerContext();
	const portalContainer = usePortalContainer(container);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	function setContentRef(element: HTMLDivElement | null) {
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

		const previouslyFocused = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		if (modal) {
			document.body.style.overflow = 'hidden';
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && modal) {
				close();
				return;
			}

			if (event.key === 'Tab' && modal) {
				const container = contentRef.current;
				if (!container) {
					return;
				}
				const focusables = Array.from(
					container.querySelectorAll<HTMLElement>(
						'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
					),
				).filter((el) => el.getClientRects().length > 0);
				if (focusables.length === 0) {
					event.preventDefault();
					return;
				}
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				const active = document.activeElement;

				if (event.shiftKey) {
					if (active === first || active === container || !container.contains(active)) {
						event.preventDefault();
						last.focus();
					}
				} else if (active === last || !container.contains(active)) {
					event.preventDefault();
					first.focus();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		const contentEl = contentRef.current;
		if (contentEl) {
			contentEl.focus();
		}

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', handleKeyDown);
			previouslyFocused?.focus();
		};
	}, [close, open, modal]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			setIsVisible(true);
		});

		return () => cancelAnimationFrame(frame);
	}, [open]);

	if (!open || !portalContainer) {
		return null;
	}

	return createPortal(
		<>
			{modal && <DrawerOverlay />}
			<div
				ref={setContentRef}
				role="dialog"
				aria-modal={modal ? 'true' : 'false'}
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				data-state={getDrawerState(open)}
				data-direction={direction}
				style={{ transform: isVisible ? '' : getDrawerTranslateStyle(direction), opacity: isVisible ? '' : 0, ...style }}
				className={`${styles[drawerStyleKeys.content]} ${className}`}
				{...props}>
				<div className={styles[drawerStyleKeys.handle]} />
				{children}
				{showCloseButton && (
					<button type="button" aria-label="关闭" className={styles[drawerStyleKeys.close]} onClick={() => close()}>
						<svg
							className={styles[drawerStyleKeys.xIcon]}
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				)}
			</div>
		</>,
		portalContainer,
	);
});
DrawerContent.displayName = 'DrawerContent';

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[drawerStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
DrawerHeader.displayName = 'DrawerHeader';

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[drawerStyleKeys.footer]} ${className}`} {...props}>
			{children}
		</div>
	);
});
DrawerFooter.displayName = 'DrawerFooter';

export interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DrawerTitle = React.forwardRef<HTMLHeadingElement, DrawerTitleProps>(({ className = '', children, ...props }, ref) => {
	const context = useDrawerContext();

	return (
		<h2 ref={ref} id={context.titleId} className={`${styles[drawerStyleKeys.title]} ${className}`} {...props}>
			{children}
		</h2>
	);
});
DrawerTitle.displayName = 'DrawerTitle';

export interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DrawerDescription = React.forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(({ className = '', children, ...props }, ref) => {
	const context = useDrawerContext();

	return (
		<p ref={ref} id={context.descriptionId} className={`${styles[drawerStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
DrawerDescription.displayName = 'DrawerDescription';

export { Drawer, DrawerTrigger, DrawerClose, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription };
export default Drawer;
