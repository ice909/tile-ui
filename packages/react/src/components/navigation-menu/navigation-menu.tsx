import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import { getNavigationMenuActiveState, getNavigationMenuState, navigationMenuStyleKeys } from '@tile-ui/core';
import type { NavigationMenuBaseProps, NavigationMenuItemBaseProps, NavigationMenuLinkBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/navigation-menu.module.scss';

interface NavigationMenuContextValue {
	activeValue: string | undefined;
	setActiveValue: (value: string | undefined) => void;
	viewportEnabled: boolean;
	viewportRef: React.RefObject<HTMLDivElement | null>;
	setIndicatorRect: (rect: { left: number; width: number } | null) => void;
	indicatorRect: { left: number; width: number } | null;
}

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);

function useNavigationMenuContext(): NavigationMenuContextValue {
	const context = useContext(NavigationMenuContext);
	if (!context) {
		throw new Error('NavigationMenu 子组件必须位于 <NavigationMenu> 内部。');
	}
	return context;
}

interface NavigationMenuItemContextValue {
	value: string;
	isActive: boolean;
	triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);

function useNavigationMenuItemContext(): NavigationMenuItemContextValue {
	const context = useContext(NavigationMenuItemContext);
	if (!context) {
		throw new Error('NavigationMenu 触发器/内容必须位于 <NavigationMenuItem> 内部。');
	}
	return context;
}

function NavigationMenuChevronIcon() {
	return (
		<svg
			className={styles[navigationMenuStyleKeys.chevron]}
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
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

export interface NavigationMenuProps extends Omit<React.HTMLAttributes<HTMLElement>, 'defaultValue'>, NavigationMenuBaseProps {}

const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(({ className = '', viewport = true, value, defaultValue, onValueChange, children, ...props }, ref) => {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const activeValue = value !== undefined ? value : internalValue;
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const [indicatorRect, setIndicatorRect] = useState<{ left: number; width: number } | null>(null);

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
		<NavigationMenuContext.Provider value={{ activeValue, setActiveValue, viewportEnabled: viewport, viewportRef, setIndicatorRect, indicatorRect }}>
			<nav ref={ref} data-viewport={viewport} className={`${styles[navigationMenuStyleKeys.root]} ${className}`} {...props}>
				{children}
				{viewport && <NavigationMenuViewport />}
			</nav>
		</NavigationMenuContext.Provider>
	);
});
NavigationMenu.displayName = 'NavigationMenu';

export interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {}

const NavigationMenuList = React.forwardRef<HTMLUListElement, NavigationMenuListProps>(({ className = '', children, onKeyDown, ...props }, ref) => {
	function handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
		onKeyDown?.(event);

		const isNext = event.key === 'ArrowRight';
		const isPrev = event.key === 'ArrowLeft';
		const isHome = event.key === 'Home';
		const isEnd = event.key === 'End';
		if (!isNext && !isPrev && !isHome && !isEnd) {
			return;
		}

		const triggers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button')).filter((trigger) => !trigger.disabled);
		if (triggers.length === 0) {
			return;
		}

		const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
		let nextIndex: number;
		if (isHome) {
			nextIndex = 0;
		} else if (isEnd) {
			nextIndex = triggers.length - 1;
		} else {
			const direction = isNext ? 1 : -1;
			nextIndex = (currentIndex + direction + triggers.length) % triggers.length;
		}

		triggers[nextIndex]?.focus();
		event.preventDefault();
	}

	return (
		<ul ref={ref} onKeyDown={handleKeyDown} className={`${styles[navigationMenuStyleKeys.list]} ${className}`} {...props}>
			{children}
		</ul>
	);
});
NavigationMenuList.displayName = 'NavigationMenuList';

export interface NavigationMenuItemProps extends React.HTMLAttributes<HTMLLIElement>, NavigationMenuItemBaseProps {}

const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(({ className = '', value, children, ...props }, ref) => {
	const { activeValue } = useNavigationMenuContext();
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const isActive = activeValue === value;

	return (
		<NavigationMenuItemContext.Provider value={{ value, isActive, triggerRef }}>
			<li ref={ref} className={`${styles[navigationMenuStyleKeys.item]} ${className}`} {...props}>
				{children}
			</li>
		</NavigationMenuItemContext.Provider>
	);
});
NavigationMenuItem.displayName = 'NavigationMenuItem';

export interface NavigationMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(({ className = '', children, onClick, ...props }, ref) => {
	const { activeValue, setActiveValue, setIndicatorRect } = useNavigationMenuContext();
	const { value, isActive, triggerRef } = useNavigationMenuItemContext();

	function setRef(element: HTMLButtonElement | null) {
		triggerRef.current = element;
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	useLayoutEffect(() => {
		if (!isActive || !triggerRef.current) {
			return;
		}
		const root = triggerRef.current.closest('nav');
		const rootRect = root?.getBoundingClientRect();
		const triggerRect = triggerRef.current.getBoundingClientRect();
		if (!rootRect) {
			return;
		}
		setIndicatorRect({ left: triggerRect.left - rootRect.left, width: triggerRect.width });
	}, [isActive, setIndicatorRect, activeValue, triggerRef]);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		onClick?.(event);
		setActiveValue(isActive ? undefined : value);
	}

	function handleMouseEnter() {
		setActiveValue(value);
	}

	const state = getNavigationMenuState(isActive);

	return (
		<button
			ref={setRef}
			type="button"
			aria-expanded={isActive}
			data-state={state}
			className={`${styles[navigationMenuStyleKeys.trigger]} ${className}`}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			{...props}>
			{children}
			<NavigationMenuChevronIcon />
		</button>
	);
});
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

export interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(({ className = '', children, ...props }, ref) => {
	const { viewportEnabled, viewportRef } = useNavigationMenuContext();
	const { isActive } = useNavigationMenuItemContext();

	const state = getNavigationMenuState(isActive);
	const classes = [styles[navigationMenuStyleKeys.content], className].filter(Boolean).join(' ');

	const content = (
		<div ref={ref} data-state={state} data-viewport={viewportEnabled} className={classes} {...props}>
			{children}
		</div>
	);

	if (!viewportEnabled) {
		return isActive ? content : null;
	}

	if (typeof document === 'undefined' || !viewportRef.current) {
		return null;
	}

	return isActive ? createPortal(content, viewportRef.current) : null;
});
NavigationMenuContent.displayName = 'NavigationMenuContent';

export interface NavigationMenuViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const NavigationMenuViewport = React.forwardRef<HTMLDivElement, NavigationMenuViewportProps>(({ className = '', children, ...props }, ref) => {
	const { activeValue, viewportRef } = useNavigationMenuContext();
	const state = getNavigationMenuState(activeValue !== undefined);
	const classes = [styles[navigationMenuStyleKeys.viewport], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} data-state={state} className={classes} {...props}>
			<div ref={viewportRef} className={styles[navigationMenuStyleKeys.viewportInner]}>
				{children}
			</div>
		</div>
	);
});
NavigationMenuViewport.displayName = 'NavigationMenuViewport';

export interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
	style?: React.CSSProperties;
}

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, NavigationMenuIndicatorProps>(({ className = '', style, ...props }, ref) => {
	const { indicatorRect } = useNavigationMenuContext();
	const visible = indicatorRect !== null;
	const state = visible ? 'visible' : 'hidden';
	const classes = [styles[navigationMenuStyleKeys.indicator], className].filter(Boolean).join(' ');

	return (
		<div ref={ref} data-state={state} className={classes} style={style} {...props}>
			<div className={styles[navigationMenuStyleKeys.indicatorArrow]} />
		</div>
	);
});
NavigationMenuIndicator.displayName = 'NavigationMenuIndicator';

export interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, NavigationMenuLinkBaseProps {}

const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(({ className = '', active = false, asChild = false, children, ...props }, ref) => {
	const Comp = asChild ? Slot : 'a';
	const state = getNavigationMenuActiveState(active);

	return (
		<Comp ref={ref} data-active={state} className={asChild ? undefined : `${styles[navigationMenuStyleKeys.link]} ${className}`} {...props}>
			{children}
		</Comp>
	);
});
NavigationMenuLink.displayName = 'NavigationMenuLink';

export {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuViewport,
	NavigationMenuIndicator,
	NavigationMenuLink,
};
export default NavigationMenu;
