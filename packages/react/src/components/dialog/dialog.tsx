import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { dialogStyleKeys, getDialogState } from '@tile-ui/core';
import type { DialogBaseProps } from '@tile-ui/core';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/dialog.module.scss';

interface DialogContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('Dialog sub-components must be used within <Dialog>.');
	}
	return context;
}

export interface DialogProps extends DialogBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
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

	return <DialogContext.Provider value={{ open: isOpen, setOpen, close, titleId, descriptionId }}>{children}</DialogContext.Provider>;
}

Dialog.displayName = 'Dialog';

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useDialogContext();
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
DialogTrigger.displayName = 'DialogTrigger';

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useDialogContext();
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
DialogClose.displayName = 'DialogClose';

export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(({ className = '', onClick, ...props }, ref) => {
	const context = useDialogContext();

	if (!context.open) {
		return null;
	}

	return (
		<div
			ref={ref}
			data-state={getDialogState(context.open)}
			className={`${styles[dialogStyleKeys.overlay]} ${className}`}
			onClick={(event: React.MouseEvent<HTMLDivElement>) => {
				onClick?.(event);
				context.close();
			}}
			{...props}
		/>
	);
});
DialogOverlay.displayName = 'DialogOverlay';

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
	showCloseButton?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className = '', showCloseButton = true, children, ...props }, ref) => {
	const { open, close, titleId, descriptionId } = useDialogContext();
	const contentRef = useRef<HTMLDivElement | null>(null);

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
				return;
			}

			if (event.key === 'Tab') {
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
	}, [close, open]);

	if (!open) {
		return null;
	}

	return createPortal(
		<>
			<DialogOverlay />
			<div
				ref={setContentRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				data-state={getDialogState(open)}
				className={`${styles[dialogStyleKeys.content]} ${className}`}
				{...props}>
				{children}
				{showCloseButton && (
					<button type="button" aria-label="关闭" className={styles[dialogStyleKeys.close]} onClick={() => close()}>
						<svg
							className={styles[dialogStyleKeys.xIcon]}
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
DialogContent.displayName = 'DialogContent';

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[dialogStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
DialogHeader.displayName = 'DialogHeader';

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
	/** 是否在底部渲染一个「关闭」按钮 */
	showCloseButton?: boolean;
}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(({ className = '', showCloseButton = false, children, ...props }, ref) => {
	const context = useDialogContext();

	return (
		<div ref={ref} className={`${styles[dialogStyleKeys.footer]} ${className}`} {...props}>
			{children}
			{showCloseButton && (
				<Button type="button" variant="outline" onClick={() => context.close()}>
					Close
				</Button>
			)}
		</div>
	);
});
DialogFooter.displayName = 'DialogFooter';

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(({ className = '', children, ...props }, ref) => {
	const context = useDialogContext();

	return (
		<h2 ref={ref} id={context.titleId} className={`${styles[dialogStyleKeys.title]} ${className}`} {...props}>
			{children}
		</h2>
	);
});
DialogTitle.displayName = 'DialogTitle';

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(({ className = '', children, ...props }, ref) => {
	const context = useDialogContext();

	return (
		<p ref={ref} id={context.descriptionId} className={`${styles[dialogStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogTrigger, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
export default Dialog;
