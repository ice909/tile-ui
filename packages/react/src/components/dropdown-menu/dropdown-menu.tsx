import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { dropdownMenuStyleKeys, getDropdownMenuCheckState, getDropdownMenuPosition, getDropdownMenuState } from '@tile-ui/core';
import type {
	DropdownMenuBaseProps,
	DropdownMenuCheckboxItemBaseProps,
	DropdownMenuContentBaseProps,
	DropdownMenuItemBaseProps,
	DropdownMenuLabelBaseProps,
	DropdownMenuPosition,
	DropdownMenuRadioGroupBaseProps,
	DropdownMenuRadioItemBaseProps,
	DropdownMenuSubBaseProps,
	DropdownMenuSubTriggerBaseProps,
	DropdownMenuTriggerBaseProps,
} from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/dropdown-menu.module.scss';

interface DropdownMenuContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	closeAll: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(): DropdownMenuContextValue {
	const context = useContext(DropdownMenuContext);
	if (!context) {
		throw new Error('DropdownMenu 子组件必须位于 <DropdownMenu> 内部。');
	}
	return context;
}

interface DropdownMenuContentContextValue {
	itemsRef: React.RefObject<HTMLElement[]>;
	close: () => void;
}

const DropdownMenuContentContext = createContext<DropdownMenuContentContextValue | null>(null);

function useDropdownMenuContentContext(): DropdownMenuContentContextValue {
	const context = useContext(DropdownMenuContentContext);
	if (!context) {
		throw new Error('DropdownMenu 菜单项必须位于 <DropdownMenuContent> 或 <DropdownMenuSubContent> 内部。');
	}
	return context;
}

interface DropdownMenuSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuSubContext = createContext<DropdownMenuSubContextValue | null>(null);

function useDropdownMenuSubContext(): DropdownMenuSubContextValue {
	const context = useContext(DropdownMenuSubContext);
	if (!context) {
		throw new Error('DropdownMenu 子菜单组件必须位于 <DropdownMenuSub> 内部。');
	}
	return context;
}

interface DropdownMenuRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

const DropdownMenuRadioGroupContext = createContext<DropdownMenuRadioGroupContextValue | null>(null);

function useDropdownMenuRadioGroupContext(): DropdownMenuRadioGroupContextValue {
	const context = useContext(DropdownMenuRadioGroupContext);
	if (!context) {
		throw new Error('DropdownMenuRadioItem 必须位于 <DropdownMenuRadioGroup> 内部。');
	}
	return context;
}

function DropdownMenuCheckIcon() {
	return (
		<svg
			className={styles[dropdownMenuStyleKeys.checkIcon]}
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

function DropdownMenuRadioIcon() {
	return (
		<svg
			className={styles[dropdownMenuStyleKeys.radioIcon]}
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

function DropdownMenuChevronIcon() {
	return (
		<svg
			className={styles[dropdownMenuStyleKeys.chevron]}
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

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement>, DropdownMenuBaseProps {}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(({ className = '', open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
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

	const closeAll = useCallback(() => {
		setOpen(false);
	}, [setOpen]);

	return (
		<DropdownMenuContext.Provider value={{ open: isOpen, setOpen, triggerRef, contentId, closeAll }}>
			<div ref={ref} className={`${styles[dropdownMenuStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</DropdownMenuContext.Provider>
	);
});
DropdownMenu.displayName = 'DropdownMenu';

export interface DropdownMenuPortalProps {
	children?: React.ReactNode;
}

const DropdownMenuPortal = ({ children }: DropdownMenuPortalProps) => {
	return <>{children}</>;
};
DropdownMenuPortal.displayName = 'DropdownMenuPortal';

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, DropdownMenuTriggerBaseProps {}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(({ className = '', asChild = false, children, onClick, onKeyDown, ...props }, ref) => {
	const context = useDropdownMenuContext();

	function setRef(element: HTMLElement | null) {
		context.triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element as HTMLButtonElement | null);
		} else if (ref) {
			ref.current = element as HTMLButtonElement | null;
		}
	}

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		onClick?.(event);
		context.setOpen(!context.open);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			context.setOpen(true);
		}
	}

	const Comp = asChild ? Slot : 'button';
	const state = getDropdownMenuState(context.open);

	return (
		<Comp
			ref={setRef}
			type={asChild ? undefined : 'button'}
			aria-haspopup="menu"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={state}
			className={asChild ? undefined : `${styles[dropdownMenuStyleKeys.trigger]} ${className}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
		</Comp>
	);
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement>, DropdownMenuContentBaseProps {}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
	({ className = '', side = 'bottom', align = 'center', sideOffset = 4, alignOffset = 0, children, ...props }, ref) => {
		const { open, triggerRef, contentId, closeAll } = useDropdownMenuContext();
		const [position, setPosition] = useState<DropdownMenuPosition | null>(null);
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
				setPosition(getDropdownMenuPosition({ triggerRect, contentSize, side, align, sideOffset, alignOffset, viewport }));
			}

			updatePosition();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			return () => {
				window.removeEventListener('resize', updatePosition);
				document.removeEventListener('scroll', updatePosition, true);
			};
		}, [open, side, align, sideOffset, alignOffset, triggerRef]);

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
				const trigger = triggerRef.current;
				if (content && content.contains(target)) {
					return;
				}
				if (trigger && trigger.contains(target)) {
					return;
				}
				closeAll();
			}

			document.addEventListener('pointerdown', handlePointerDown);
			return () => document.removeEventListener('pointerdown', handlePointerDown);
		}, [open, triggerRef, closeAll]);

		function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
			const items = itemsRef.current.filter((item) => item.getAttribute('data-disabled') !== 'true');
			if (items.length === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					closeAll();
				}
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
				case 'Escape':
					event.preventDefault();
					closeAll();
					triggerRef.current?.focus();
					break;
			}
		}

		const state = getDropdownMenuState(open);
		const classes = [styles[dropdownMenuStyleKeys.content], className].filter(Boolean).join(' ');

		const content = (
			<DropdownMenuContentContext.Provider value={{ itemsRef, close: closeAll }}>
				<div
					ref={setRef}
					id={contentId}
					role="menu"
					tabIndex={-1}
					data-state={state}
					data-side={side}
					data-align={align}
					className={classes}
					style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
					onKeyDown={handleKeyDown}
					{...props}>
					{children}
				</div>
			</DropdownMenuContentContext.Provider>
		);

		if (!open || typeof document === 'undefined') {
			return null;
		}

		return createPortal(content, document.body);
	},
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuGroup = React.forwardRef<HTMLDivElement, DropdownMenuGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} role="group" className={`${styles[dropdownMenuStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
DropdownMenuGroup.displayName = 'DropdownMenuGroup';

export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement>, DropdownMenuLabelBaseProps {}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(({ className = '', inset = false, children, ...props }, ref) => {
	const classes = [styles[dropdownMenuStyleKeys.label], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} data-inset={inset} className={classes} {...props}>
			{children}
		</div>
	);
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[dropdownMenuStyleKeys.separator], className].filter(Boolean).join(' ');
	return <div ref={ref} role="separator" className={classes} {...props} />;
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

const DropdownMenuShortcut = React.forwardRef<HTMLSpanElement, DropdownMenuShortcutProps>(({ className = '', children, ...props }, ref) => {
	const classes = [styles[dropdownMenuStyleKeys.shortcut], className].filter(Boolean).join(' ');
	return (
		<span ref={ref} className={classes} {...props}>
			{children}
		</span>
	);
});
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export interface DropdownMenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, DropdownMenuItemBaseProps {}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
	({ className = '', inset = false, variant = 'default', disabled = false, onSelect, children, ...props }, ref) => {
		const { itemsRef, close } = useDropdownMenuContentContext();
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

		const classes = [styles[dropdownMenuStyleKeys.item], className].filter(Boolean).join(' ');
		return (
			<div ref={setRef} role="menuitem" tabIndex={-1} data-inset={inset} data-variant={variant} data-disabled={disabled} className={classes} onClick={handleClick} {...props}>
				{children}
			</div>
		);
	},
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export interface DropdownMenuCheckboxItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, DropdownMenuCheckboxItemBaseProps {}

const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
	({ className = '', checked, defaultChecked = false, onCheckedChange, disabled = false, onSelect, children, ...props }, ref) => {
		const { itemsRef } = useDropdownMenuContentContext();
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

		function handleClick(event: React.MouseEvent<HTMLDivElement>) {
			if (disabled) {
				return;
			}
			const next = !isChecked;
			if (checked === undefined) {
				setInternalChecked(next);
			}
			onCheckedChange?.(next);
			onSelect?.(event.nativeEvent);
		}

		const classes = [styles[dropdownMenuStyleKeys.checkboxItem], className].filter(Boolean).join(' ');
		return (
			<div
				ref={setRef}
				role="menuitemcheckbox"
				tabIndex={-1}
				aria-checked={isChecked}
				data-checked={getDropdownMenuCheckState(isChecked)}
				data-disabled={disabled}
				className={classes}
				onClick={handleClick}
				{...props}>
				<span className={styles[dropdownMenuStyleKeys.indicator]}>{isChecked && <DropdownMenuCheckIcon />}</span>
				{children}
			</div>
		);
	},
);
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export interface DropdownMenuRadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>, DropdownMenuRadioGroupBaseProps {}

const DropdownMenuRadioGroup = React.forwardRef<HTMLDivElement, DropdownMenuRadioGroupProps>(({ className = '', value, defaultValue, onValueChange, children, ...props }, ref) => {
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

	const classes = [styles[dropdownMenuStyleKeys.radioGroup], className].filter(Boolean).join(' ');
	return (
		<DropdownMenuRadioGroupContext.Provider value={{ value: resolvedValue, setValue }}>
			<div ref={ref} role="group" className={classes} {...props}>
				{children}
			</div>
		</DropdownMenuRadioGroupContext.Provider>
	);
});
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

export interface DropdownMenuRadioItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, DropdownMenuRadioItemBaseProps {}

const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>(({ className = '', value, disabled = false, onSelect, children, ...props }, ref) => {
	const { itemsRef } = useDropdownMenuContentContext();
	const { value: groupValue, setValue } = useDropdownMenuRadioGroupContext();
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

	function handleClick(event: React.MouseEvent<HTMLDivElement>) {
		if (disabled) {
			return;
		}
		setValue(value);
		onSelect?.(event.nativeEvent);
	}

	const classes = [styles[dropdownMenuStyleKeys.radioItem], className].filter(Boolean).join(' ');
	return (
		<div
			ref={setRef}
			role="menuitemradio"
			tabIndex={-1}
			aria-checked={isChecked}
			data-checked={getDropdownMenuCheckState(isChecked)}
			data-disabled={disabled}
			className={classes}
			onClick={handleClick}
			{...props}>
			<span className={styles[dropdownMenuStyleKeys.indicator]}>{isChecked && <DropdownMenuRadioIcon />}</span>
			{children}
		</div>
	);
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export interface DropdownMenuSubProps extends DropdownMenuSubBaseProps {
	children?: React.ReactNode;
}

const DropdownMenuSub = ({ open, defaultOpen = false, onOpenChange, children }: DropdownMenuSubProps) => {
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

	return <DropdownMenuSubContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>{children}</DropdownMenuSubContext.Provider>;
};
DropdownMenuSub.displayName = 'DropdownMenuSub';

export interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement>, DropdownMenuSubTriggerBaseProps {}

const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>(({ className = '', inset = false, disabled = false, children, ...props }, ref) => {
	const { itemsRef } = useDropdownMenuContentContext();
	const { open, setOpen, triggerRef } = useDropdownMenuSubContext();
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

	const state = getDropdownMenuState(open);
	const classes = [styles[dropdownMenuStyleKeys.subTrigger], className].filter(Boolean).join(' ');
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
			<DropdownMenuChevronIcon />
		</div>
	);
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement>, DropdownMenuContentBaseProps {}

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
	({ className = '', side = 'right', align = 'start', sideOffset = 0, alignOffset = 0, children, ...props }, ref) => {
		const { open, setOpen, triggerRef } = useDropdownMenuSubContext();
		const [position, setPosition] = useState<DropdownMenuPosition | null>(null);
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
				setPosition(getDropdownMenuPosition({ triggerRect, contentSize, side, align, sideOffset, alignOffset, viewport }));
			}

			updatePosition();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			return () => {
				window.removeEventListener('resize', updatePosition);
				document.removeEventListener('scroll', updatePosition, true);
			};
		}, [open, side, align, sideOffset, alignOffset, triggerRef]);

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

		const state = getDropdownMenuState(open);
		const classes = [styles[dropdownMenuStyleKeys.subContent], className].filter(Boolean).join(' ');

		const content = (
			<DropdownMenuContentContext.Provider value={{ itemsRef, close: () => setOpen(false) }}>
				<div
					ref={setRef}
					role="menu"
					tabIndex={-1}
					data-state={state}
					data-side={side}
					data-align={align}
					className={classes}
					style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
					onKeyDown={handleKeyDown}
					{...props}>
					{children}
				</div>
			</DropdownMenuContentContext.Provider>
		);

		if (!open || typeof document === 'undefined') {
			return null;
		}

		return createPortal(content, document.body);
	},
);
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
export default DropdownMenu;
