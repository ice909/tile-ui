import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
	createMediaQueryWatcher,
	getSidebarMenuButtonStyleKeys,
	getSidebarMenuSubButtonStyleKeys,
	getSidebarState,
	matchesSidebarToggleShortcut,
	SIDEBAR_MEDIA_QUERY,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_WIDTH_MOBILE,
	sidebarStyleKeys,
} from '@tile-ui/core';
import type { SidebarBaseProps, SidebarContextValue, SidebarMenuButtonSize, SidebarMenuButtonVariant, SidebarProviderBaseProps } from '@tile-ui/core';
import { Button } from '../button';
import { Input } from '../input';
import { Separator } from '../separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../sheet';
import { Skeleton } from '../skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import styles from '@tile-ui/styles/scss/components/sidebar.module.scss';

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar(): SidebarContextValue {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a <SidebarProvider>.');
	}
	return context;
}

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement>, SidebarProviderBaseProps {
	children?: React.ReactNode;
}

function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className = '', style, children, ...props }: SidebarProviderProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [openMobile, setOpenMobile] = useState(false);

	const [_open, _setOpen] = useState(defaultOpen);
	const open = openProp ?? _open;
	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === 'function' ? value(open) : value;
			if (setOpenProp) {
				setOpenProp(openState);
			} else {
				_setOpen(openState);
			}
		},
		[setOpenProp, open],
	);

	const toggleSidebar = useCallback(() => {
		return isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value);
	}, [isMobile, setOpen, setOpenMobile]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (matchesSidebarToggleShortcut({ key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey })) {
				event.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [toggleSidebar]);

	useEffect(() => {
		return createMediaQueryWatcher(SIDEBAR_MEDIA_QUERY, setIsMobile);
	}, []);

	const state = getSidebarState(open);

	const contextValue = useMemo<SidebarContextValue>(
		() => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
		[state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				<div
					data-slot="sidebar-wrapper"
					style={{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
					className={`${styles[sidebarStyleKeys.wrapper]} ${className}`}
					{...props}>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	);
}

SidebarProvider.displayName = 'SidebarProvider';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, SidebarBaseProps {}

function Sidebar({ side = 'left', variant = 'sidebar', collapsible = 'offcanvas', className = '', style, children, ...props }: SidebarProps) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

	if (collapsible === 'none') {
		return (
			<div data-slot="sidebar" data-side={side} className={`${styles[sidebarStyleKeys.sidebar]} ${className}`} {...props} style={style}>
				{children}
			</div>
		);
	}

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile}>
				<SheetContent
					data-slot="sidebar"
					data-mobile="true"
					side={side}
					className={`${styles[sidebarStyleKeys.sheetContent]} ${className}`}
					style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE, ...style } as React.CSSProperties}>
					<SheetHeader className={styles[sidebarStyleKeys.srOnly]}>
						<SheetTitle>Sidebar</SheetTitle>
						<SheetDescription>Displays the mobile sidebar.</SheetDescription>
					</SheetHeader>
					<div className={styles[sidebarStyleKeys.sidebar]}>{children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			data-slot="sidebar-container"
			data-state={state}
			data-collapsible={state === 'collapsed' ? collapsible : ''}
			data-variant={variant}
			data-side={side}
			className={styles[sidebarStyleKeys.container]}
			style={style}>
			<div data-slot="sidebar" className={`${styles[sidebarStyleKeys.sidebar]} ${className}`} {...props}>
				{children}
			</div>
		</div>
	);
}

Sidebar.displayName = 'Sidebar';

export interface SidebarTriggerProps extends React.ComponentProps<typeof Button> {}

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(({ className = '', onClick, children, ...props }, ref) => {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			ref={ref}
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			className={`${styles[sidebarStyleKeys.trigger]} ${className}`}
			onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}>
			{children ?? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true">
					<rect width="18" height="18" x="3" y="3" rx="2" />
					<path d="M9 3v18" />
				</svg>
			)}
			<span className={styles[sidebarStyleKeys.srOnly]}>Toggle Sidebar</span>
		</Button>
	);
});
SidebarTrigger.displayName = 'SidebarTrigger';

export interface SidebarRailProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SidebarRail = React.forwardRef<HTMLButtonElement, SidebarRailProps>(({ className = '', ...props }, ref) => {
	const { toggleSidebar } = useSidebar();

	return (
		<button
			ref={ref}
			data-slot="sidebar-rail"
			aria-label="Toggle Sidebar"
			tabIndex={-1}
			onClick={toggleSidebar}
			title="Toggle Sidebar"
			className={`${styles[sidebarStyleKeys.rail] ?? ''} ${className}`}
			{...props}
		/>
	);
});
SidebarRail.displayName = 'SidebarRail';

export interface SidebarInsetProps extends React.HTMLAttributes<HTMLElement> {}

const SidebarInset = React.forwardRef<HTMLElement, SidebarInsetProps>(({ className = '', ...props }, ref) => {
	return <main ref={ref} data-slot="sidebar-inset" className={`${styles[sidebarStyleKeys.inset]} ${className}`} {...props} />;
});
SidebarInset.displayName = 'SidebarInset';

export interface SidebarInputProps extends React.ComponentProps<typeof Input> {}

const SidebarInput = React.forwardRef<HTMLInputElement, SidebarInputProps>(({ className = '', ...props }, ref) => {
	return <Input ref={ref} data-slot="sidebar-input" className={`${styles[sidebarStyleKeys.input]} ${className}`} {...props} />;
});
SidebarInput.displayName = 'SidebarInput';

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-header" className={`${styles[sidebarStyleKeys.header]} ${className}`} {...props} />;
});
SidebarHeader.displayName = 'SidebarHeader';

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-footer" className={`${styles[sidebarStyleKeys.footer]} ${className}`} {...props} />;
});
SidebarFooter.displayName = 'SidebarFooter';

export interface SidebarSeparatorProps extends React.ComponentProps<typeof Separator> {}

const SidebarSeparator = React.forwardRef<React.ElementRef<typeof Separator>, SidebarSeparatorProps>(({ className = '', ...props }, ref) => {
	return <Separator ref={ref} data-slot="sidebar-separator" className={`${styles[sidebarStyleKeys.separator]} ${className}`} {...props} />;
});
SidebarSeparator.displayName = 'SidebarSeparator';

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-content" className={`${styles[sidebarStyleKeys.content]} ${className}`} {...props} />;
});
SidebarContent.displayName = 'SidebarContent';

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-group" className={`${styles[sidebarStyleKeys.group]} ${className}`} {...props} />;
});
SidebarGroup.displayName = 'SidebarGroup';

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
	asChild?: boolean;
}

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(({ className = '', asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div';

	return <Comp ref={ref} data-slot="sidebar-group-label" className={`${styles[sidebarStyleKeys.groupLabel]} ${className}`} {...props} />;
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export interface SidebarGroupActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

const SidebarGroupAction = React.forwardRef<HTMLButtonElement, SidebarGroupActionProps>(({ className = '', asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';

	return <Comp ref={ref} data-slot="sidebar-group-action" className={`${styles[sidebarStyleKeys.groupAction]} ${className}`} {...props} />;
});
SidebarGroupAction.displayName = 'SidebarGroupAction';

export interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarGroupContent = React.forwardRef<HTMLDivElement, SidebarGroupContentProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-group-content" className={`${styles[sidebarStyleKeys.groupContent]} ${className}`} {...props} />;
});
SidebarGroupContent.displayName = 'SidebarGroupContent';

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {}

const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(({ className = '', ...props }, ref) => {
	return <ul ref={ref} data-slot="sidebar-menu" className={`${styles[sidebarStyleKeys.menu]} ${className}`} {...props} />;
});
SidebarMenu.displayName = 'SidebarMenu';

export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(({ className = '', ...props }, ref) => {
	return <li ref={ref} data-slot="sidebar-menu-item" className={`${styles[sidebarStyleKeys.menuItem]} ${className}`} {...props} />;
});
SidebarMenuItem.displayName = 'SidebarMenuItem';

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	isActive?: boolean;
	tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	variant?: SidebarMenuButtonVariant;
	size?: SidebarMenuButtonSize;
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
	({ asChild = false, isActive = false, variant = 'default', size = 'default', tooltip, className = '', ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		const styleKeys = getSidebarMenuButtonStyleKeys(variant, size);

		const button = (
			<Comp
				ref={ref}
				data-slot="sidebar-menu-button"
				data-size={size}
				data-active={isActive}
				className={`${styles[styleKeys.base]} ${styles[styleKeys.variant]} ${styles[styleKeys.size]} ${className}`}
				{...props}
			/>
		);

		if (!tooltip) {
			return button;
		}

		const tooltipProps = typeof tooltip === 'string' ? { children: tooltip } : tooltip;

		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent side="right" {...tooltipProps} />
			</Tooltip>
		);
	},
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export interface SidebarMenuActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	showOnHover?: boolean;
}

const SidebarMenuAction = React.forwardRef<HTMLButtonElement, SidebarMenuActionProps>(({ className = '', asChild = false, showOnHover = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';

	return <Comp ref={ref} data-slot="sidebar-menu-action" data-show-on-hover={showOnHover} className={`${styles[sidebarStyleKeys.menuAction]} ${className}`} {...props} />;
});
SidebarMenuAction.displayName = 'SidebarMenuAction';

export interface SidebarMenuBadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, SidebarMenuBadgeProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} data-slot="sidebar-menu-badge" className={`${styles[sidebarStyleKeys.menuBadge]} ${className}`} {...props} />;
});
SidebarMenuBadge.displayName = 'SidebarMenuBadge';

export interface SidebarMenuSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
	showIcon?: boolean;
}

const SidebarMenuSkeleton = React.forwardRef<HTMLDivElement, SidebarMenuSkeletonProps>(({ className = '', showIcon = false, ...props }, ref) => {
	const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);

	return (
		<div ref={ref} data-slot="sidebar-menu-skeleton" className={`${styles[sidebarStyleKeys.skeleton]} ${className}`} {...props}>
			{showIcon && <Skeleton className={styles[sidebarStyleKeys.skeletonIcon]} />}
			<Skeleton className={styles[sidebarStyleKeys.skeletonText]} style={{ '--skeleton-width': width } as React.CSSProperties} />
		</div>
	);
});
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton';

export interface SidebarMenuSubProps extends React.HTMLAttributes<HTMLUListElement> {}

const SidebarMenuSub = React.forwardRef<HTMLUListElement, SidebarMenuSubProps>(({ className = '', ...props }, ref) => {
	return <ul ref={ref} data-slot="sidebar-menu-sub" className={`${styles[sidebarStyleKeys.menuSub]} ${className}`} {...props} />;
});
SidebarMenuSub.displayName = 'SidebarMenuSub';

export interface SidebarMenuSubItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, SidebarMenuSubItemProps>(({ className = '', ...props }, ref) => {
	return <li ref={ref} data-slot="sidebar-menu-sub-item" className={`${styles[sidebarStyleKeys.menuSubItem]} ${className}`} {...props} />;
});
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

export interface SidebarMenuSubButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	asChild?: boolean;
	size?: 'sm' | 'md';
	isActive?: boolean;
}

const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(({ asChild = false, size = 'md', isActive = false, className = '', ...props }, ref) => {
	const Comp = asChild ? Slot : 'a';
	const styleKeys = getSidebarMenuSubButtonStyleKeys(size);

	return (
		<Comp
			ref={ref}
			data-slot="sidebar-menu-sub-button"
			data-size={size}
			data-active={isActive}
			className={`${styles[styleKeys.base]} ${styles[styleKeys.size]} ${className}`}
			{...props}
		/>
	);
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
	useSidebar,
};
export default Sidebar;
