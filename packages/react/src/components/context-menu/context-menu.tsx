import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { contextMenuStyleKeys, getContextMenuCheckState, getContextMenuPosition, getContextMenuState } from '@tile-ui/core';
import type {
	ContextMenuBaseProps,
	ContextMenuCheckboxItemBaseProps,
	ContextMenuItemBaseProps,
	ContextMenuLabelBaseProps,
	ContextMenuPosition,
	ContextMenuRadioGroupBaseProps,
	ContextMenuRadioItemBaseProps,
	ContextMenuSubBaseProps,
	ContextMenuSubTriggerBaseProps,
	ContextMenuTriggerBaseProps,
} from '@tile-ui/core';
import { PortalProvider, usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/context-menu.module.scss';

interface ContextMenuContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	position: ContextMenuPosition | null;
	setPosition: (position: ContextMenuPosition) => void;
	closeAll: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(): ContextMenuContextValue {
	const context = useContext(ContextMenuContext);
	if (!context) {
		throw new Error('ContextMenu 子组件必须位于 <ContextMenu> 内部。');
	}
	return context;
}

interface ContextMenuContentContextValue {
	itemsRef: React.RefObject<HTMLElement[]>;
	close: () => void;
}

const ContextMenuContentContext = createContext<ContextMenuContentContextValue | null>(null);

function useContextMenuContentContext(): ContextMenuContentContextValue {
	const context = useContext(ContextMenuContentContext);
	if (!context) {
		throw new Error('ContextMenu 菜单项必须位于 <ContextMenuContent> 或 <ContextMenuSubContent> 内部。');
	}
	return context;
}

interface ContextMenuSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
}

const ContextMenuSubContext = createContext<ContextMenuSubContextValue | null>(null);

function useContextMenuSubContext(): ContextMenuSubContextValue {
	const context = useContext(ContextMenuSubContext);
	if (!context) {
		throw new Error('ContextMenu 子菜单组件必须位于 <ContextMenuSub> 内部。');
	}
	return context;
}

interface ContextMenuRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

const ContextMenuRadioGroupContext = createContext<ContextMenuRadioGroupContextValue | null>(null);

function useContextMenuRadioGroupContext(): ContextMenuRadioGroupContextValue {
	const context = useContext(ContextMenuRadioGroupContext);
	if (!context) {
		throw new Error('ContextMenuRadioItem 必须位于 <ContextMenuRadioGroup> 内部。');
	}
	return context;
}

function ContextMenuCheckIcon() {
	return (
		<svg
			className={styles[contextMenuStyleKeys.checkIcon]}
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
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function ContextMenuRadioIcon() {
	return (
		<svg
			className={styles[contextMenuStyleKeys.radioIcon]}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true">
			<circle cx="12" cy="12" r="6" />
		</svg>
	);
}

function ContextMenuChevronIcon() {
	return (
		<svg
			className={styles[contextMenuStyleKeys.chevron]}
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
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

export interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement>, ContextMenuBaseProps {}

const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(({ className = '', open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const isOpen = open !== undefined ? open : internalOpen;
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentId = useId();
	const [position, setPosition] = useState<ContextMenuPosition | null>(null);

	const setOpen = useCallback(
		(next: boolean) => {
			if (open === undefined) {
				setInternalOpen(next);
			}
			onOpenChange?.(next);
		},
		[open, onOpenChange],
	);

	const closeAll = useCallback(() => {
		setOpen(false);
	}, [setOpen]);

	return (
		<ContextMenuContext.Provider value={{ open: isOpen, setOpen, triggerRef, contentId, position, setPosition, closeAll }}>
			<div ref={ref} className={`${styles[contextMenuStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</ContextMenuContext.Provider>
	);
});
ContextMenu.displayName = 'ContextMenu';

export interface ContextMenuPortalProps {
	container?: PortalContainer;
	children?: React.ReactNode;
}

const ContextMenuPortal = ({ container, children }: ContextMenuPortalProps) => {
	return <PortalProvider container={container}>{children}</PortalProvider>;
};
ContextMenuPortal.displayName = 'ContextMenuPortal';

export interface ContextMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ContextMenuTriggerBaseProps {}

const ContextMenuTrigger = React.forwardRef<HTMLButtonElement, ContextMenuTriggerProps>(
	({ className = '', asChild = false, children, onContextMenu, onKeyDown, ...props }, ref) => {
		const context = useContextMenuContext();

		function setRef(element: HTMLElement | null) {
			context.triggerRef.current = element;
			if (typeof ref === 'function') {
				ref(element as HTMLButtonElement | null);
			} else if (ref) {
				ref.current = element as HTMLButtonElement | null;
			}
		}

		function handleContextMenu(event: React.MouseEvent<HTMLButtonElement>) {
			onContextMenu?.(event);
			if (event.defaultPrevented) {
				return;
			}
			event.preventDefault();
			context.setPosition({ top: event.clientY, left: event.clientX });
			context.setOpen(true);
		}

		function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
			onKeyDown?.(event);
			if (event.defaultPrevented) {
				return;
			}
			if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
				event.preventDefault();
				const rect = event.currentTarget.getBoundingClientRect();
				context.setPosition({ top: rect.bottom, left: rect.left });
				context.setOpen(true);
			}
		}

		const Comp = asChild ? Slot : 'button';
		const state = getContextMenuState(context.open);

		return (
			<Comp
				ref={setRef}
				type={asChild ? undefined : 'button'}
				data-state={state}
				aria-haspopup="menu"
				aria-expanded={context.open}
				aria-controls={context.contentId}
				className={asChild ? undefined : `${styles[contextMenuStyleKeys.trigger]} ${className}`}
				onContextMenu={handleContextMenu}
				onKeyDown={handleKeyDown}
				{...props}>
				{children}
			</Comp>
		);
	},
);
ContextMenuTrigger.displayName = 'ContextMenuTrigger';

export interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
	container?: PortalContainer;
}

const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(({ className = '', container, children, ...props }, ref) => {
	const { open, position, setPosition, triggerRef, closeAll, contentId } = useContextMenuContext();
	const portalContainer = usePortalContainer(container);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const itemsRef = useRef<HTMLElement[]>([]);
	const latestPositionRef = useRef(position);
	latestPositionRef.current = position;

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
			const content = contentRef.current;
			if (!content) {
				return;
			}
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			const base = latestPositionRef.current ?? { top: 0, left: 0 };
			setPosition(getContextMenuPosition({ x: base.left, y: base.top, contentSize, viewport }));
		}

		updatePosition();
		window.addEventListener('resize', updatePosition);
		document.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, setPosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const items = itemsRef.current;
		if (items.length === 0) {
			return;
		}
		items.forEach((item) => item.removeAttribute('data-highlighted'));
		items[0].setAttribute('data-highlighted', 'true');
		items[0].focus();
	}, [open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node | null;
			if (!target) {
				return;
			}
			const content = contentRef.current;
			if (content && content.contains(target)) {
				return;
			}
			closeAll();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				closeAll();
				triggerRef.current?.focus();
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, closeAll, triggerRef]);

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const items = itemsRef.current.filter((item) => item.getAttribute('data-disabled') !== 'true');
		if (items.length === 0) {
			return;
		}

		const currentIndex = items.findIndex((item) => item.getAttribute('data-highlighted') === 'true');

		const highlight = (next: number) => {
			items.forEach((item) => item.removeAttribute('data-highlighted'));
			items[next].setAttribute('data-highlighted', 'true');
			items[next].focus();
		};

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlight(currentIndex < 0 ? 0 : (currentIndex + 1) % items.length);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlight(currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
				break;
			case 'Home':
				event.preventDefault();
				highlight(0);
				break;
			case 'End':
				event.preventDefault();
				highlight(items.length - 1);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
				break;
		}
	}

	const state = getContextMenuState(open);
	const classes = [styles[contextMenuStyleKeys.content], className].filter(Boolean).join(' ');

	const content = (
		<ContextMenuContentContext.Provider value={{ itemsRef, close: closeAll }}>
			<div
				ref={setRef}
				id={contentId}
				role="menu"
				tabIndex={-1}
				data-state={state}
				className={classes}
				style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
				onKeyDown={handleKeyDown}
				{...props}>
				{children}
			</div>
		</ContextMenuContentContext.Provider>
	);

	if (!open || !portalContainer) {
		return null;
	}

	return createPortal(content, portalContainer);
});
ContextMenuContent.displayName = 'ContextMenuContent';

export interface ContextMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const ContextMenuGroup = React.forwardRef<HTMLDivElement, ContextMenuGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} role="group" className={`${styles[contextMenuStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
ContextMenuGroup.displayName = 'ContextMenuGroup';

export interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement>, ContextMenuLabelBaseProps {}

const ContextMenuLabel = React.forwardRef<HTMLDivElement, ContextMenuLabelProps>(({ className = '', inset = false, children, ...props }, ref) => {
	const classes = [styles[contextMenuStyleKeys.label], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} data-inset={inset} className={classes} {...props}>
			{children}
		</div>
	);
});
ContextMenuLabel.displayName = 'ContextMenuLabel';

export interface ContextMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const ContextMenuSeparator = React.forwardRef<HTMLDivElement, ContextMenuSeparatorProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[contextMenuStyleKeys.separator], className].filter(Boolean).join(' ');
	return <div ref={ref} role="separator" className={classes} {...props} />;
});
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

export interface ContextMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ContextMenuShortcut = React.forwardRef<HTMLSpanElement, ContextMenuShortcutProps>(({ className = '', children, ...props }, ref) => {
	const classes = [styles[contextMenuStyleKeys.shortcut], className].filter(Boolean).join(' ');
	return (
		<span ref={ref} className={classes} {...props}>
			{children}
		</span>
	);
});
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export interface ContextMenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, ContextMenuItemBaseProps {}

const ContextMenuItem = React.forwardRef<HTMLDivElement, ContextMenuItemProps>(
	({ className = '', inset = false, variant = 'default', disabled = false, onSelect, children, ...props }, ref) => {
		const { itemsRef, close } = useContextMenuContentContext();
		const itemRef = useRef<HTMLDivElement | null>(null);

		useEffect(() => {
			const element = itemRef.current;
			if (!element) {
				return;
			}
			itemsRef.current.push(element);
			return () => {
				itemsRef.current = itemsRef.current.filter((item) => item !== element);
			};
		}, [itemsRef]);

		function setRef(element: HTMLDivElement | null) {
			itemRef.current = element;
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}

		function handleClick(event: React.MouseEvent<HTMLDivElement>) {
			if (disabled) {
				return;
			}
			onSelect?.(event.nativeEvent);
			close();
		}

		const classes = [styles[contextMenuStyleKeys.item], className].filter(Boolean).join(' ');
		return (
			<div ref={setRef} role="menuitem" tabIndex={-1} data-inset={inset} data-variant={variant} data-disabled={disabled} className={classes} onClick={handleClick} {...props}>
				{children}
			</div>
		);
	},
);
ContextMenuItem.displayName = 'ContextMenuItem';

export interface ContextMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement>, ContextMenuCheckboxItemBaseProps {}

const ContextMenuCheckboxItem = React.forwardRef<HTMLDivElement, ContextMenuCheckboxItemProps>(
	({ className = '', checked, defaultChecked = false, onCheckedChange, disabled = false, children, ...props }, ref) => {
		const { itemsRef } = useContextMenuContentContext();
		const itemRef = useRef<HTMLDivElement | null>(null);
		const [internalChecked, setInternalChecked] = useState(defaultChecked);
		const isChecked = checked !== undefined ? checked : internalChecked;

		useEffect(() => {
			const element = itemRef.current;
			if (!element) {
				return;
			}
			itemsRef.current.push(element);
			return () => {
				itemsRef.current = itemsRef.current.filter((item) => item !== element);
			};
		}, [itemsRef]);

		function setRef(element: HTMLDivElement | null) {
			itemRef.current = element;
			if (typeof ref === 'function') {
				ref(element);
			} else if (ref) {
				ref.current = element;
			}
		}

		function handleClick() {
			if (disabled) {
				return;
			}
			const next = !isChecked;
			if (checked === undefined) {
				setInternalChecked(next);
			}
			onCheckedChange?.(next);
		}

		const classes = [styles[contextMenuStyleKeys.checkboxItem], className].filter(Boolean).join(' ');
		return (
			<div
				ref={setRef}
				role="menuitemcheckbox"
				tabIndex={-1}
				aria-checked={isChecked}
				data-checked={getContextMenuCheckState(isChecked)}
				data-disabled={disabled}
				className={classes}
				onClick={handleClick}
				{...props}>
				<span className={styles[contextMenuStyleKeys.indicator]}>{isChecked && <ContextMenuCheckIcon />}</span>
				{children}
			</div>
		);
	},
);
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

export interface ContextMenuRadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>, ContextMenuRadioGroupBaseProps {}

const ContextMenuRadioGroup = React.forwardRef<HTMLDivElement, ContextMenuRadioGroupProps>(({ className = '', value, defaultValue, onValueChange, children, ...props }, ref) => {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const resolvedValue = value !== undefined ? value : internalValue;

	const setValue = useCallback(
		(next: string) => {
			if (value === undefined) {
				setInternalValue(next);
			}
			onValueChange?.(next);
		},
		[value, onValueChange],
	);

	const classes = [styles[contextMenuStyleKeys.radioGroup], className].filter(Boolean).join(' ');
	return (
		<ContextMenuRadioGroupContext.Provider value={{ value: resolvedValue, setValue }}>
			<div ref={ref} role="group" className={classes} {...props}>
				{children}
			</div>
		</ContextMenuRadioGroupContext.Provider>
	);
});
ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup';

export interface ContextMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement>, ContextMenuRadioItemBaseProps {}

const ContextMenuRadioItem = React.forwardRef<HTMLDivElement, ContextMenuRadioItemProps>(({ className = '', value, disabled = false, children, ...props }, ref) => {
	const { itemsRef } = useContextMenuContentContext();
	const { value: groupValue, setValue } = useContextMenuRadioGroupContext();
	const itemRef = useRef<HTMLDivElement | null>(null);
	const isChecked = groupValue === value;

	useEffect(() => {
		const element = itemRef.current;
		if (!element) {
			return;
		}
		itemsRef.current.push(element);
		return () => {
			itemsRef.current = itemsRef.current.filter((item) => item !== element);
		};
	}, [itemsRef]);

	function setRef(element: HTMLDivElement | null) {
		itemRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleClick() {
		if (disabled) {
			return;
		}
		setValue(value);
	}

	const classes = [styles[contextMenuStyleKeys.radioItem], className].filter(Boolean).join(' ');
	return (
		<div
			ref={setRef}
			role="menuitemradio"
			tabIndex={-1}
			aria-checked={isChecked}
			data-checked={getContextMenuCheckState(isChecked)}
			data-disabled={disabled}
			className={classes}
			onClick={handleClick}
			{...props}>
			<span className={styles[contextMenuStyleKeys.indicator]}>{isChecked && <ContextMenuRadioIcon />}</span>
			{children}
		</div>
	);
});
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

export interface ContextMenuSubProps extends ContextMenuSubBaseProps {
	children?: React.ReactNode;
}

const ContextMenuSub = ({ open, defaultOpen = false, onOpenChange, children }: ContextMenuSubProps) => {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const isOpen = open !== undefined ? open : internalOpen;
	const triggerRef = useRef<HTMLElement | null>(null);

	const setOpen = useCallback(
		(next: boolean) => {
			if (open === undefined) {
				setInternalOpen(next);
			}
			onOpenChange?.(next);
		},
		[open, onOpenChange],
	);

	return <ContextMenuSubContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>{children}</ContextMenuSubContext.Provider>;
};
ContextMenuSub.displayName = 'ContextMenuSub';

export interface ContextMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement>, ContextMenuSubTriggerBaseProps {}

const ContextMenuSubTrigger = React.forwardRef<HTMLDivElement, ContextMenuSubTriggerProps>(({ className = '', inset = false, disabled = false, children, ...props }, ref) => {
	const { itemsRef } = useContextMenuContentContext();
	const { open, setOpen, triggerRef } = useContextMenuSubContext();
	const itemRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const element = itemRef.current;
		if (!element) {
			return;
		}
		itemsRef.current.push(element);
		return () => {
			itemsRef.current = itemsRef.current.filter((item) => item !== element);
		};
	}, [itemsRef]);

	function setRef(element: HTMLDivElement | null) {
		itemRef.current = element;
		triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleMouseEnter() {
		if (disabled) {
			return;
		}
		setOpen(true);
	}

	function handleClick() {
		if (disabled) {
			return;
		}
		setOpen(!open);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (disabled) {
			return;
		}
		if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setOpen(true);
		}
	}

	const state = getContextMenuState(open);
	const classes = [styles[contextMenuStyleKeys.subTrigger], className].filter(Boolean).join(' ');
	return (
		<div
			ref={setRef}
			role="menuitem"
			tabIndex={-1}
			aria-haspopup="menu"
			aria-expanded={open}
			data-state={state}
			data-inset={inset}
			data-disabled={disabled}
			className={classes}
			onMouseEnter={handleMouseEnter}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
			<ContextMenuChevronIcon />
		</div>
	);
});
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

export interface ContextMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
	container?: PortalContainer;
}

const ContextMenuSubContent = React.forwardRef<HTMLDivElement, ContextMenuSubContentProps>(({ className = '', container, children, ...props }, ref) => {
	const { open, setOpen, triggerRef } = useContextMenuSubContext();
	const portalContainer = usePortalContainer(container);
	const [position, setPosition] = useState<ContextMenuPosition | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const itemsRef = useRef<HTMLElement[]>([]);

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
			setPosition(getContextMenuPosition({ x: triggerRect.right, y: triggerRect.top, contentSize, viewport }));
		}

		updatePosition();
		window.addEventListener('resize', updatePosition);
		document.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, triggerRef]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node | null;
			if (!target) {
				return;
			}
			const content = contentRef.current;
			const trigger = triggerRef.current;
			if (content && content.contains(target)) {
				return;
			}
			if (trigger && trigger.contains(target)) {
				return;
			}
			setOpen(false);
		}

		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, [open, triggerRef, setOpen]);

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const items = itemsRef.current.filter((item) => item.getAttribute('data-disabled') !== 'true');

		if (event.key === 'Escape' || event.key === 'ArrowLeft') {
			event.preventDefault();
			setOpen(false);
			triggerRef.current?.focus();
			return;
		}

		if (items.length === 0) {
			return;
		}

		const currentIndex = items.findIndex((item) => item.getAttribute('data-highlighted') === 'true');
		const highlight = (next: number) => {
			items.forEach((item) => item.removeAttribute('data-highlighted'));
			items[next].setAttribute('data-highlighted', 'true');
			items[next].focus();
		};

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlight(currentIndex < 0 ? 0 : (currentIndex + 1) % items.length);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlight(currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
				break;
		}
	}

	const state = getContextMenuState(open);
	const classes = [styles[contextMenuStyleKeys.subContent], className].filter(Boolean).join(' ');

	const content = (
		<ContextMenuContentContext.Provider value={{ itemsRef, close: () => setOpen(false) }}>
			<div
				ref={setRef}
				role="menu"
				tabIndex={-1}
				data-state={state}
				className={classes}
				style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
				onKeyDown={handleKeyDown}
				{...props}>
				{children}
			</div>
		</ContextMenuContentContext.Provider>
	);

	if (!open || !portalContainer) {
		return null;
	}

	return createPortal(content, portalContainer);
});
ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export {
	ContextMenu,
	ContextMenuPortal,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuLabel,
	ContextMenuItem,
	ContextMenuCheckboxItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubTrigger,
	ContextMenuSubContent,
};
export default ContextMenu;
