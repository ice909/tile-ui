import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMenubarCheckState, getMenubarPosition, getMenubarState, menubarStyleKeys } from '@tile-ui/core';
import type {
	MenubarBaseProps,
	MenubarCheckboxItemBaseProps,
	MenubarContentBaseProps,
	MenubarItemBaseProps,
	MenubarLabelBaseProps,
	MenubarMenuBaseProps,
	MenubarPosition,
	MenubarRadioGroupBaseProps,
	MenubarRadioItemBaseProps,
	MenubarSubBaseProps,
	MenubarSubTriggerBaseProps,
	MenubarTriggerBaseProps,
} from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/menubar.module.scss';

interface MenubarContextValue {
	activeValue: string | undefined;
	setActiveValue: (value: string | undefined) => void;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

function useMenubarContext(): MenubarContextValue {
	const context = useContext(MenubarContext);
	if (!context) {
		throw new Error('Menubar 子组件必须位于 <Menubar> 内部。');
	}
	return context;
}

interface MenubarMenuContextValue {
	value: string;
	open: boolean;
	triggerRef: React.RefObject<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);

function useMenubarMenuContext(): MenubarMenuContextValue {
	const context = useContext(MenubarMenuContext);
	if (!context) {
		throw new Error('Menubar 菜单子组件必须位于 <MenubarMenu> 内部。');
	}
	return context;
}

interface MenubarContentContextValue {
	itemsRef: React.RefObject<HTMLElement[]>;
	close: () => void;
}

const MenubarContentContext = createContext<MenubarContentContextValue | null>(null);

function useMenubarContentContext(): MenubarContentContextValue {
	const context = useContext(MenubarContentContext);
	if (!context) {
		throw new Error('Menubar 菜单项必须位于 <MenubarContent> 或 <MenubarSubContent> 内部。');
	}
	return context;
}

interface MenubarSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
}

const MenubarSubContext = createContext<MenubarSubContextValue | null>(null);

function useMenubarSubContext(): MenubarSubContextValue {
	const context = useContext(MenubarSubContext);
	if (!context) {
		throw new Error('Menubar 子菜单组件必须位于 <MenubarSub> 内部。');
	}
	return context;
}

interface MenubarRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

const MenubarRadioGroupContext = createContext<MenubarRadioGroupContextValue | null>(null);

function useMenubarRadioGroupContext(): MenubarRadioGroupContextValue {
	const context = useContext(MenubarRadioGroupContext);
	if (!context) {
		throw new Error('MenubarRadioItem 必须位于 <MenubarRadioGroup> 内部。');
	}
	return context;
}

function MenubarCheckIcon() {
	return (
		<svg
			className={styles[menubarStyleKeys.checkIcon]}
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

function MenubarRadioIcon() {
	return (
		<svg className={styles[menubarStyleKeys.radioIcon]} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<circle cx="12" cy="12" r="6" />
		</svg>
	);
}

function MenubarChevronIcon() {
	return (
		<svg
			className={styles[menubarStyleKeys.chevron]}
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

export interface MenubarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>, MenubarBaseProps {}

const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(({ className = '', value, defaultValue, onValueChange, children, ...props }, ref) => {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const activeValue = value !== undefined ? value : internalValue;

	const setActiveValue = useCallback(
		(next: string | undefined) => {
			if (value === undefined) {
				setInternalValue(next);
			}
			onValueChange?.(next);
		},
		[value, onValueChange],
	);

	return (
		<MenubarContext.Provider value={{ activeValue, setActiveValue }}>
			<div ref={ref} className={`${styles[menubarStyleKeys.root]} ${className}`} {...props}>
				{children}
			</div>
		</MenubarContext.Provider>
	);
});
Menubar.displayName = 'Menubar';

export interface MenubarPortalProps {
	children?: React.ReactNode;
}

const MenubarPortal = ({ children }: MenubarPortalProps) => {
	return <>{children}</>;
};
MenubarPortal.displayName = 'MenubarPortal';

export interface MenubarMenuProps extends MenubarMenuBaseProps {
	children?: React.ReactNode;
}

const MenubarMenu = ({ value, children }: MenubarMenuProps) => {
	const { activeValue, setActiveValue } = useMenubarContext();
	const open = activeValue === value;
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentId = useId();

	const setOpen = useCallback(
		(next: boolean) => {
			setActiveValue(next ? value : undefined);
		},
		[value, setActiveValue],
	);

	return (
		<MenubarMenuContext.Provider value={{ value, open, triggerRef, contentId, setOpen }}>
			<div className={styles[menubarStyleKeys.menu]}>{children}</div>
		</MenubarMenuContext.Provider>
	);
};
MenubarMenu.displayName = 'MenubarMenu';

export interface MenubarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, MenubarTriggerBaseProps {}

const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(({ className = '', disabled = false, children, onClick, onKeyDown, ...props }, ref) => {
	const context = useMenubarMenuContext();

	function setRef(element: HTMLButtonElement | null) {
		context.triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		onClick?.(event);
		if (disabled) {
			return;
		}
		context.setOpen(!context.open);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		onKeyDown?.(event);
		if (event.defaultPrevented || disabled) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			context.setOpen(true);
		}
	}

	const state = getMenubarState(context.open);

	return (
		<button
			ref={setRef}
			type="button"
			aria-haspopup="menu"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={state}
			data-disabled={disabled}
			className={`${styles[menubarStyleKeys.trigger]} ${className}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...props}>
			{children}
		</button>
	);
});
MenubarTrigger.displayName = 'MenubarTrigger';

export interface MenubarContentProps extends React.HTMLAttributes<HTMLDivElement>, MenubarContentBaseProps {}

const MenubarContent = React.forwardRef<HTMLDivElement, MenubarContentProps>(
	({ className = '', side = 'bottom', align = 'start', sideOffset = 8, alignOffset = -4, children, ...props }, ref) => {
		const { open, triggerRef, contentId, setOpen } = useMenubarMenuContext();
		const [position, setPosition] = useState<MenubarPosition | null>(null);
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
				setPosition(getMenubarPosition({ triggerRect, contentSize, side, align, sideOffset, alignOffset, viewport }));
			}

			function highlightFirst() {
				const items = itemsRef.current;
				if (items.length === 0) {
					return;
				}
				items.forEach((item) => item.removeAttribute('data-highlighted'));
				items[0].setAttribute('data-highlighted', 'true');
			}

			updatePosition();
			highlightFirst();
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
			if (items.length === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					setOpen(false);
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
					setOpen(false);
					triggerRef.current?.focus();
					break;
			}
		}

		const state = getMenubarState(open);
		const classes = [styles[menubarStyleKeys.content], className].filter(Boolean).join(' ');

		const content = (
			<MenubarContentContext.Provider value={{ itemsRef, close: () => setOpen(false) }}>
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
			</MenubarContentContext.Provider>
		);

		if (!open || typeof document === 'undefined') {
			return null;
		}

		return createPortal(content, document.body);
	},
);
MenubarContent.displayName = 'MenubarContent';

export interface MenubarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const MenubarGroup = React.forwardRef<HTMLDivElement, MenubarGroupProps>(({ className = '', children, ...props }, ref) => {
	return (
		<div ref={ref} role="group" className={`${styles[menubarStyleKeys.group]} ${className}`} {...props}>
			{children}
		</div>
	);
});
MenubarGroup.displayName = 'MenubarGroup';

export interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement>, MenubarLabelBaseProps {}

const MenubarLabel = React.forwardRef<HTMLDivElement, MenubarLabelProps>(({ className = '', inset = false, children, ...props }, ref) => {
	const classes = [styles[menubarStyleKeys.label], className].filter(Boolean).join(' ');
	return (
		<div ref={ref} data-inset={inset} className={classes} {...props}>
			{children}
		</div>
	);
});
MenubarLabel.displayName = 'MenubarLabel';

export interface MenubarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const MenubarSeparator = React.forwardRef<HTMLDivElement, MenubarSeparatorProps>(({ className = '', ...props }, ref) => {
	const classes = [styles[menubarStyleKeys.separator], className].filter(Boolean).join(' ');
	return <div ref={ref} role="separator" className={classes} {...props} />;
});
MenubarSeparator.displayName = 'MenubarSeparator';

export interface MenubarShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

const MenubarShortcut = React.forwardRef<HTMLSpanElement, MenubarShortcutProps>(({ className = '', children, ...props }, ref) => {
	const classes = [styles[menubarStyleKeys.shortcut], className].filter(Boolean).join(' ');
	return (
		<span ref={ref} className={classes} {...props}>
			{children}
		</span>
	);
});
MenubarShortcut.displayName = 'MenubarShortcut';

export interface MenubarItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, MenubarItemBaseProps {}

const MenubarItem = React.forwardRef<HTMLDivElement, MenubarItemProps>(
	({ className = '', inset = false, variant = 'default', disabled = false, onSelect, children, ...props }, ref) => {
		const { itemsRef, close } = useMenubarContentContext();
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

		const classes = [styles[menubarStyleKeys.item], className].filter(Boolean).join(' ');
		return (
			<div ref={setRef} role="menuitem" tabIndex={-1} data-inset={inset} data-variant={variant} data-disabled={disabled} className={classes} onClick={handleClick} {...props}>
				{children}
			</div>
		);
	},
);
MenubarItem.displayName = 'MenubarItem';

export interface MenubarCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement>, MenubarCheckboxItemBaseProps {}

const MenubarCheckboxItem = React.forwardRef<HTMLDivElement, MenubarCheckboxItemProps>(
	({ className = '', checked, defaultChecked = false, onCheckedChange, disabled = false, children, ...props }, ref) => {
		const { itemsRef } = useMenubarContentContext();
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

		const classes = [styles[menubarStyleKeys.checkboxItem], className].filter(Boolean).join(' ');
		return (
			<div
				ref={setRef}
				role="menuitemcheckbox"
				tabIndex={-1}
				aria-checked={isChecked}
				data-checked={getMenubarCheckState(isChecked)}
				data-disabled={disabled}
				className={classes}
				onClick={handleClick}
				{...props}>
				<span className={styles[menubarStyleKeys.indicator]}>{isChecked && <MenubarCheckIcon />}</span>
				{children}
			</div>
		);
	},
);
MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';

export interface MenubarRadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>, MenubarRadioGroupBaseProps {}

const MenubarRadioGroup = React.forwardRef<HTMLDivElement, MenubarRadioGroupProps>(({ className = '', value, defaultValue, onValueChange, children, ...props }, ref) => {
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

	const classes = [styles[menubarStyleKeys.radioGroup], className].filter(Boolean).join(' ');
	return (
		<MenubarRadioGroupContext.Provider value={{ value: resolvedValue, setValue }}>
			<div ref={ref} role="group" className={classes} {...props}>
				{children}
			</div>
		</MenubarRadioGroupContext.Provider>
	);
});
MenubarRadioGroup.displayName = 'MenubarRadioGroup';

export interface MenubarRadioItemProps extends React.HTMLAttributes<HTMLDivElement>, MenubarRadioItemBaseProps {}

const MenubarRadioItem = React.forwardRef<HTMLDivElement, MenubarRadioItemProps>(({ className = '', value, disabled = false, children, ...props }, ref) => {
	const { itemsRef } = useMenubarContentContext();
	const { value: groupValue, setValue } = useMenubarRadioGroupContext();
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

	const classes = [styles[menubarStyleKeys.radioItem], className].filter(Boolean).join(' ');
	return (
		<div
			ref={setRef}
			role="menuitemradio"
			tabIndex={-1}
			aria-checked={isChecked}
			data-checked={getMenubarCheckState(isChecked)}
			data-disabled={disabled}
			className={classes}
			onClick={handleClick}
			{...props}>
			<span className={styles[menubarStyleKeys.indicator]}>{isChecked && <MenubarRadioIcon />}</span>
			{children}
		</div>
	);
});
MenubarRadioItem.displayName = 'MenubarRadioItem';

export interface MenubarSubProps extends MenubarSubBaseProps {
	children?: React.ReactNode;
}

const MenubarSub = ({ open, defaultOpen = false, onOpenChange, children }: MenubarSubProps) => {
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

	return <MenubarSubContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>{children}</MenubarSubContext.Provider>;
};
MenubarSub.displayName = 'MenubarSub';

export interface MenubarSubTriggerProps extends React.HTMLAttributes<HTMLDivElement>, MenubarSubTriggerBaseProps {}

const MenubarSubTrigger = React.forwardRef<HTMLDivElement, MenubarSubTriggerProps>(({ className = '', inset = false, disabled = false, children, ...props }, ref) => {
	const { itemsRef } = useMenubarContentContext();
	const { open, setOpen, triggerRef } = useMenubarSubContext();
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

	const state = getMenubarState(open);
	const classes = [styles[menubarStyleKeys.subTrigger], className].filter(Boolean).join(' ');
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
			<MenubarChevronIcon />
		</div>
	);
});
MenubarSubTrigger.displayName = 'MenubarSubTrigger';

export interface MenubarSubContentProps extends React.HTMLAttributes<HTMLDivElement>, MenubarContentBaseProps {}

const MenubarSubContent = React.forwardRef<HTMLDivElement, MenubarSubContentProps>(
	({ className = '', side = 'right', align = 'start', sideOffset = 0, alignOffset = 0, children, ...props }, ref) => {
		const { open, setOpen, triggerRef } = useMenubarSubContext();
		const [position, setPosition] = useState<MenubarPosition | null>(null);
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
				setPosition(getMenubarPosition({ triggerRect, contentSize, side, align, sideOffset, alignOffset, viewport }));
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

		const state = getMenubarState(open);
		const classes = [styles[menubarStyleKeys.subContent], className].filter(Boolean).join(' ');

		const content = (
			<MenubarContentContext.Provider value={{ itemsRef, close: () => setOpen(false) }}>
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
			</MenubarContentContext.Provider>
		);

		if (!open || typeof document === 'undefined') {
			return null;
		}

		return createPortal(content, document.body);
	},
);
MenubarSubContent.displayName = 'MenubarSubContent';

export {
	Menubar,
	MenubarPortal,
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarGroup,
	MenubarLabel,
	MenubarItem,
	MenubarCheckboxItem,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubTrigger,
	MenubarSubContent,
};
export default Menubar;
