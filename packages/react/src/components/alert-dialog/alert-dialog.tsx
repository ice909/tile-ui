import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import type { ButtonSize, ButtonVariant } from '@tile-ui/core';
import { alertDialogStyleKeys, getAlertDialogState } from '@tile-ui/core';
import type { AlertDialogBaseProps, AlertDialogSize } from '@tile-ui/core';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/alert-dialog.module.scss';

interface AlertDialogContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	close: () => void;
	titleId: string;
	descriptionId: string;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(): AlertDialogContextValue {
	const context = useContext(AlertDialogContext);
	if (!context) {
		throw new Error('AlertDialog sub-components must be used within <AlertDialog>.');
	}
	return context;
}

export interface AlertDialogProps extends AlertDialogBaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

function AlertDialog({ open, defaultOpen = false, onOpenChange, children }: AlertDialogProps) {
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

	return <AlertDialogContext.Provider value={{ open: isOpen, setOpen, close, titleId, descriptionId }}>{children}</AlertDialogContext.Provider>;
}

AlertDialog.displayName = 'AlertDialog';

export interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(({ asChild = false, className = '', children, onClick, ...props }, ref) => {
	const context = useAlertDialogContext();
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
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

export interface AlertDialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogOverlay = React.forwardRef<HTMLDivElement, AlertDialogOverlayProps>(({ className = '', onClick, ...props }, ref) => {
	const context = useAlertDialogContext();

	if (!context.open) {
		return null;
	}

	return (
		<div
			ref={ref}
			data-state={getAlertDialogState(context.open)}
			className={`${styles[alertDialogStyleKeys.overlay]} ${className}`}
			onClick={(event: React.MouseEvent<HTMLDivElement>) => {
				onClick?.(event);
				context.close();
			}}
			{...props}
		/>
	);
});
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: AlertDialogSize;
}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(({ className = '', size = 'default', children, ...props }, ref) => {
	const { open, close, titleId, descriptionId } = useAlertDialogContext();
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
			<AlertDialogOverlay />
			<div
				ref={setContentRef}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				data-state={getAlertDialogState(open)}
				data-size={size}
				className={`${styles[alertDialogStyleKeys.content]} ${className}`}
				{...props}>
				{children}
			</div>
		</>,
		document.body,
	);
});
AlertDialogContent.displayName = 'AlertDialogContent';

export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogHeader = React.forwardRef<HTMLDivElement, AlertDialogHeaderProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[alertDialogStyleKeys.header]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AlertDialogHeader.displayName = 'AlertDialogHeader';

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogFooter = React.forwardRef<HTMLDivElement, AlertDialogFooterProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} className={`${styles[alertDialogStyleKeys.footer]} ${className}`} {...props}>
			{children}
		</div>
	);
});
AlertDialogFooter.displayName = 'AlertDialogFooter';

export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(({ className = '', children, ...props }, ref) => {
	const context = useAlertDialogContext();

	return (
		<h2 ref={ref} id={context.titleId} className={`${styles[alertDialogStyleKeys.title]} ${className}`} {...props}>
			{children}
		</h2>
	);
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(({ className = '', children, ...props }, ref) => {
	const context = useAlertDialogContext();

	return (
		<p ref={ref} id={context.descriptionId} className={`${styles[alertDialogStyleKeys.description]} ${className}`} {...props}>
			{children}
		</p>
	);
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
	({ className = '', variant = 'default', size = 'default', children, onClick, ...props }, ref) => {
		const context = useAlertDialogContext();

		return (
			<Button
				ref={ref}
				type="button"
				variant={variant}
				size={size}
				className={className}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
					onClick?.(event);
					context.close();
				}}
				{...props}>
				{children}
			</Button>
		);
	},
);
AlertDialogAction.displayName = 'AlertDialogAction';

export interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
	({ className = '', variant = 'outline', size = 'default', children, onClick, ...props }, ref) => {
		const context = useAlertDialogContext();

		return (
			<Button
				ref={ref}
				type="button"
				variant={variant}
				size={size}
				className={className}
				onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
					onClick?.(event);
					context.close();
				}}
				{...props}>
				{children}
			</Button>
		);
	},
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogOverlay,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
export default AlertDialog;
