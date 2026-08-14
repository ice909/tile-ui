import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { getSheetState, getSheetTranslateStyle, sheetStyleKeys } from '@tile-ui/core';
import type { SheetBaseProps, SheetSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/sheet.module.scss';

interface SheetContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(): SheetContextValue {
	const context = useContext(SheetContext);
	if (!context) {
		throw new Error('Sheet sub-components must be used within <Sheet>.');
	}
	return context;
}

export interface SheetProps extends SheetBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

function Sheet({ open, defaultOpen = false, onOpenChange, children }: SheetProps) {
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

	return <SheetContext.Provider value={{ open: isOpen, setOpen, close, titleId, descriptionId }}>{children}</SheetContext.Provider>;
}

Sheet.displayName = 'Sheet';

export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useSheetContext();
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
SheetTrigger.displayName = 'SheetTrigger';

export interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useSheetContext();
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
SheetClose.displayName = 'SheetClose';

export interface SheetOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetOverlay = React.forwardRef<HTMLDivElement, SheetOverlayProps>(({ className = '', onClick, ...props }, ref) => {
	const context = useSheetContext();

	if (!context.open) {
		return null;
	}

	return (
		<div
			ref={ref}
			data-state={getSheetState(context.open)}
			className={`${styles[sheetStyleKeys.overlay]} ${className}`}
			onClick={(event: React.MouseEvent<HTMLDivElement>) => {
				onClick?.(event);
				context.close();
			}}
			{...props}
		/>
	);
});
SheetOverlay.displayName = 'SheetOverlay';

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
	side?: SheetSide;
	showCloseButton?: boolean;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(({ className = '', side = 'right', showCloseButton = true, style, children, ...props }, ref) => {
	const { open, close, titleId, descriptionId } = useSheetContext();
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
		document.body.style.overflow = 'hidden';

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				close();
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
	}, [close, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			setIsVisible(true);
		});

		return () => cancelAnimationFrame(frame);
	}, [open]);

	if (!open) {
		return null;
	}

	return createPortal(
		<>
			<SheetOverlay />
			<div
				ref={setContentRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				data-state={getSheetState(open)}
				data-side={side}
				style={{ transform: isVisible ? '' : getSheetTranslateStyle(side), opacity: isVisible ? '' : 0, ...style }}
				className={`${styles[sheetStyleKeys.content]} ${className}`}
				{...props}>
				{children}
				{showCloseButton && (
					<button type="button" aria-label="关闭" className={styles[sheetStyleKeys.close]} onClick={() => close()}>
						<svg
							className={styles[sheetStyleKeys.xIcon]}
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
		document.body,
	);
});
SheetContent.displayName = 'SheetContent';

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[sheetStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
SheetHeader.displayName = 'SheetHeader';

export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[sheetStyleKeys.footer]} ${className}`} {...props}>
			{children}
		</div>
	);
});
SheetFooter.displayName = 'SheetFooter';

export interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(({ className = '', children, ...props }, ref) => {
	const context = useSheetContext();

	return (
		<h2 ref={ref} id={context.titleId} className={`${styles[sheetStyleKeys.title]} ${className}`} {...props}>
			{children}
		</h2>
	);
});
SheetTitle.displayName = 'SheetTitle';

export interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(({ className = '', children, ...props }, ref) => {
	const context = useSheetContext();

	return (
		<p ref={ref} id={context.descriptionId} className={`${styles[sheetStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetTrigger, SheetClose, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
export default Sheet;
