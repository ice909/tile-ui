import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import {
	SIDEBAR_MEDIA_QUERY,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_WIDTH_MOBILE,
	createMediaQueryWatcher,
	getSidebarMenuButtonStyleKeys,
	getSidebarMenuSubButtonStyleKeys,
	getSidebarState,
	matchesSidebarToggleShortcut,
	sidebarStyleKeys,
	type SidebarBaseProps,
	type SidebarMenuButtonSize,
	type SidebarMenuButtonVariant,
	type SidebarProviderBaseProps,
	type SidebarSetOpen,
	type SidebarState,
} from '@tile-ui/core';
import { composeRefs, invokeEventHandler, type CallbackRef } from '../../utils';
import { Button, type ButtonProps } from '../button';
import { Input, type InputProps } from '../input';
import { Separator, type SeparatorProps } from '../separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../sheet';
import { Skeleton } from '../skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, type TooltipContentProps } from '../tooltip';
import styles from '@tile-ui/styles/scss/components/sidebar.module.scss';

export interface SidebarContextValue {
	state: Accessor<SidebarState>;
	open: Accessor<boolean>;
	setOpen: SidebarSetOpen;
	isMobile: Accessor<boolean>;
	openMobile: Accessor<boolean>;
	setOpenMobile: (open: boolean) => void;
	toggleSidebar: () => void;
}

interface SidebarInternalContextValue extends SidebarContextValue {
	sidebarId: Accessor<string>;
	toggleSidebarFrom: (source?: HTMLElement) => void;
}

const SidebarContext = createContext<SidebarInternalContextValue>();

export function useSidebar(): SidebarContextValue {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('useSidebar must be used within a <SidebarProvider>.');
	return context;
}

function mergeStyle(style: JSX.CSSProperties | string | undefined, internal: JSX.CSSProperties): JSX.CSSProperties | string {
	if (typeof style === 'string') {
		const declarations = Object.entries(internal)
			.map(([property, value]) => `${property}:${String(value)}`)
			.join(';');
		return `${declarations};${style}`;
	}
	return Object.assign({}, internal, style);
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	return Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}

export interface SidebarProviderProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, SidebarProviderBaseProps {
	ref?: CallbackRef<HTMLDivElement>;
	sidebarId?: string;
}

export function SidebarProvider(props: ParentProps<SidebarProviderProps>) {
	const [local, rest] = splitProps(props, ['defaultOpen', 'open', 'onOpenChange', 'sidebarId', 'class', 'style', 'children', 'ref']);
	const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen ?? true);
	const [isMobile, setIsMobile] = createSignal(false);
	const [openMobile, setOpenMobileSignal] = createSignal(false);
	const generatedSidebarId = `tile-solid-sidebar-${createUniqueId()}`;
	const sidebarId = () => local.sidebarId ?? generatedSidebarId;
	const open = () => local.open ?? internalOpen();
	const setOpen: SidebarSetOpen = (value) => {
		const next = typeof value === 'function' ? value(open()) : value;
		if (next === open()) return;
		if (local.open === undefined) setInternalOpen(next);
		local.onOpenChange?.(next);
	};
	const setOpenMobile = (next: boolean) => {
		if (next === openMobile()) return;
		setOpenMobileSignal(next);
	};
	let mobileOpener: HTMLElement | undefined;
	const toggleSidebarFrom = (source?: HTMLElement) => {
		if (isMobile()) {
			if (!openMobile()) mobileOpener = source;
			setOpenMobile(!openMobile());
		} else setOpen((value) => !value);
	};
	const toggleSidebar = () => toggleSidebarFrom();
	const state = () => getSidebarState(open());
	let wrapper: HTMLDivElement | undefined;
	let previouslyOpenMobile = false;

	onMount(() => {
		const ownerWindow = wrapper?.ownerDocument.defaultView ?? window;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.isComposing || isEditableTarget(event.target)) return;
			if (!matchesSidebarToggleShortcut(event)) return;
			event.preventDefault();
			toggleSidebar();
		};
		ownerWindow.addEventListener('keydown', handleKeyDown);
		const stopMediaWatcher = createMediaQueryWatcher(SIDEBAR_MEDIA_QUERY, setIsMobile);
		onCleanup(() => {
			ownerWindow.removeEventListener('keydown', handleKeyDown);
			stopMediaWatcher();
		});
	});

	createEffect(() => {
		const current = openMobile();
		if (previouslyOpenMobile && !current) {
			const opener = mobileOpener;
			mobileOpener = undefined;
			queueMicrotask(() => {
				if (opener?.isConnected) opener.focus();
			});
		}
		previouslyOpenMobile = current;
	});

	const context: SidebarInternalContextValue = {
		state,
		open,
		setOpen,
		isMobile,
		openMobile,
		setOpenMobile,
		toggleSidebar,
		sidebarId,
		toggleSidebarFrom,
	};

	return (
		<SidebarContext.Provider value={context}>
			<TooltipProvider delayDuration={0}>
				<div
					{...rest}
					ref={composeRefs(local.ref, (element) => (wrapper = element))}
					data-slot="sidebar-wrapper"
					style={mergeStyle(local.style, { '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON })}
					class={`${styles[sidebarStyleKeys.wrapper]} ${local.class ?? ''}`}>
					{local.children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	);
}

export interface SidebarProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref' | 'id'>, SidebarBaseProps {
	ref?: CallbackRef<HTMLDivElement>;
}

export function Sidebar(props: ParentProps<SidebarProps>) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('Sidebar must be used within a <SidebarProvider>.');
	const [local, rest] = splitProps(props, ['side', 'variant', 'collapsible', 'class', 'style', 'children', 'ref']);
	const side = () => local.side ?? 'left';
	const variant = () => local.variant ?? 'sidebar';
	const collapsible = () => local.collapsible ?? 'offcanvas';
	const id = context.sidebarId;

	return (
		<Show
			when={collapsible() !== 'none'}
			fallback={
				<div
					{...rest}
					ref={local.ref}
					id={id()}
					data-slot="sidebar"
					data-side={side()}
					style={local.style}
					class={`${styles[sidebarStyleKeys.sidebar]} ${local.class ?? ''}`}>
					{local.children}
				</div>
			}>
			<Show
				when={context.isMobile()}
				fallback={
					<div
						data-slot="sidebar-container"
						data-state={context.state()}
						data-collapsible={context.state() === 'collapsed' ? collapsible() : ''}
						data-variant={variant()}
						data-side={side()}
						style={local.style}
						class={styles[sidebarStyleKeys.container]}>
						<div {...rest} ref={local.ref} id={id()} data-slot="sidebar" class={`${styles[sidebarStyleKeys.sidebar]} ${local.class ?? ''}`}>
							{local.children}
						</div>
					</div>
				}>
				<Sheet open={context.openMobile()} onOpenChange={context.setOpenMobile}>
					<SheetContent
						{...rest}
						ref={local.ref}
						id={id()}
						data-slot="sidebar"
						data-mobile="true"
						side={side()}
						showCloseButton={false}
						class={`${styles[sidebarStyleKeys.sheetContent]} ${local.class ?? ''}`}
						style={mergeStyle(local.style, { '--sidebar-width': SIDEBAR_WIDTH_MOBILE })}>
						<SheetHeader class={styles[sidebarStyleKeys.srOnly]}>
							<SheetTitle>Sidebar</SheetTitle>
							<SheetDescription>Displays the mobile sidebar.</SheetDescription>
						</SheetHeader>
						<div class={styles[sidebarStyleKeys.sidebar]}>{local.children}</div>
					</SheetContent>
				</Sheet>
			</Show>
		</Show>
	);
}

export interface SidebarTriggerProps extends Omit<ButtonProps, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function SidebarTrigger(props: ParentProps<SidebarTriggerProps>) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('SidebarTrigger must be used within a <SidebarProvider>.');
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'onClick', 'aria-label']);
	return (
		<Button
			{...rest}
			ref={local.ref}
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			aria-label={local['aria-label'] ?? 'Toggle Sidebar'}
			aria-expanded={context.isMobile() ? context.openMobile() : context.open()}
			aria-controls={context.sidebarId()}
			class={`${styles[sidebarStyleKeys.trigger]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.toggleSidebarFrom(event.currentTarget);
			}}>
			{local.children ?? <SidebarIcon />}
		</Button>
	);
}

function SidebarIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M9 3v18" />
		</svg>
	);
}

export interface SidebarRailProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function SidebarRail(props: SidebarRailProps) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('SidebarRail must be used within a <SidebarProvider>.');
	const [local, rest] = splitProps(props, ['class', 'ref', 'onClick', 'type']);
	return (
		<button
			{...rest}
			ref={local.ref}
			type={local.type ?? 'button'}
			data-slot="sidebar-rail"
			aria-label={rest['aria-label'] ?? 'Toggle Sidebar'}
			aria-expanded={context.isMobile() ? context.openMobile() : context.open()}
			aria-controls={context.sidebarId()}
			tabIndex={rest.tabIndex ?? -1}
			title={rest.title ?? 'Toggle Sidebar'}
			class={`${styles[sidebarStyleKeys.rail] ?? ''} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.toggleSidebarFrom(event.currentTarget);
			}}
		/>
	);
}

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> & { ref?: CallbackRef<HTMLDivElement> };
type ListProps = Omit<JSX.HTMLAttributes<HTMLUListElement>, 'ref'> & { ref?: CallbackRef<HTMLUListElement> };
type ItemProps = Omit<JSX.HTMLAttributes<HTMLLIElement>, 'ref'> & { ref?: CallbackRef<HTMLLIElement> };

function StyledDiv(props: ParentProps<DivProps>, slot: string, styleKey: keyof typeof sidebarStyleKeys) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div {...rest} ref={local.ref} data-slot={slot} class={`${styles[sidebarStyleKeys[styleKey]]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface SidebarInsetProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'> {
	ref?: CallbackRef<HTMLElement>;
}
export function SidebarInset(props: ParentProps<SidebarInsetProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<main {...rest} ref={local.ref} data-slot="sidebar-inset" class={`${styles[sidebarStyleKeys.inset]} ${local.class ?? ''}`}>
			{local.children}
		</main>
	);
}

export interface SidebarInputProps extends Omit<InputProps, 'ref'> {
	ref?: CallbackRef<HTMLInputElement>;
}
export function SidebarInput(props: SidebarInputProps) {
	const [local, rest] = splitProps(props, ['class', 'ref']);
	return <Input {...rest} ref={local.ref} data-slot="sidebar-input" class={`${styles[sidebarStyleKeys.input]} ${local.class ?? ''}`} />;
}

export interface SidebarHeaderProps extends DivProps {}
export function SidebarHeader(props: ParentProps<SidebarHeaderProps>) {
	return StyledDiv(props, 'sidebar-header', 'header');
}
export interface SidebarFooterProps extends DivProps {}
export function SidebarFooter(props: ParentProps<SidebarFooterProps>) {
	return StyledDiv(props, 'sidebar-footer', 'footer');
}

export interface SidebarSeparatorProps extends Omit<SeparatorProps, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SidebarSeparator(props: SidebarSeparatorProps) {
	const [local, rest] = splitProps(props, ['class', 'ref']);
	return <Separator {...rest} ref={local.ref} data-slot="sidebar-separator" class={`${styles[sidebarStyleKeys.separator]} ${local.class ?? ''}`} />;
}

export interface SidebarContentProps extends DivProps {}
export function SidebarContent(props: ParentProps<SidebarContentProps>) {
	return StyledDiv(props, 'sidebar-content', 'content');
}
export interface SidebarGroupProps extends DivProps {}
export function SidebarGroup(props: ParentProps<SidebarGroupProps>) {
	return StyledDiv(props, 'sidebar-group', 'group');
}
export interface SidebarGroupLabelProps extends DivProps {}
export function SidebarGroupLabel(props: ParentProps<SidebarGroupLabelProps>) {
	return StyledDiv(props, 'sidebar-group-label', 'groupLabel');
}
export interface SidebarGroupContentProps extends DivProps {}
export function SidebarGroupContent(props: ParentProps<SidebarGroupContentProps>) {
	return StyledDiv(props, 'sidebar-group-content', 'groupContent');
}

export interface SidebarGroupActionProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}
export function SidebarGroupAction(props: ParentProps<SidebarGroupActionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'type']);
	return (
		<button {...rest} ref={local.ref} type={local.type ?? 'button'} data-slot="sidebar-group-action" class={`${styles[sidebarStyleKeys.groupAction]} ${local.class ?? ''}`}>
			{local.children}
		</button>
	);
}

export interface SidebarMenuProps extends ListProps {}
export function SidebarMenu(props: ParentProps<SidebarMenuProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<ul {...rest} ref={local.ref} data-slot="sidebar-menu" class={`${styles[sidebarStyleKeys.menu]} ${local.class ?? ''}`}>
			{local.children}
		</ul>
	);
}

export interface SidebarMenuItemProps extends ItemProps {}
export function SidebarMenuItem(props: ParentProps<SidebarMenuItemProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<li {...rest} ref={local.ref} data-slot="sidebar-menu-item" class={`${styles[sidebarStyleKeys.menuItem]} ${local.class ?? ''}`}>
			{local.children}
		</li>
	);
}

export type SidebarMenuButtonTooltip = string | (Omit<TooltipContentProps, 'children'> & { children: JSX.Element });
export interface SidebarMenuButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
	isActive?: boolean;
	tooltip?: SidebarMenuButtonTooltip;
	variant?: SidebarMenuButtonVariant;
	size?: SidebarMenuButtonSize;
}

export function SidebarMenuButton(props: ParentProps<SidebarMenuButtonProps>) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('SidebarMenuButton must be used within a <SidebarProvider>.');
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'isActive', 'tooltip', 'variant', 'size', 'type']);
	const variant = () => local.variant ?? 'default';
	const size = () => local.size ?? 'default';
	const styleKeys = () => getSidebarMenuButtonStyleKeys(variant(), size());
	const className = () => `${styles[styleKeys().base]} ${styles[styleKeys().variant]} ${styles[styleKeys().size]} ${local.class ?? ''}`;
	const tooltipProps = () => (typeof local.tooltip === 'string' ? { children: local.tooltip } : local.tooltip);
	const buttonProps = () => ({
		...rest,
		ref: local.ref,
		type: local.type ?? 'button',
		'data-slot': 'sidebar-menu-button',
		'data-size': size(),
		'data-active': local.isActive ?? false,
		class: className(),
	});

	return (
		<Show when={local.tooltip && !context.isMobile() && context.state() === 'collapsed'} fallback={<button {...buttonProps()}>{local.children}</button>}>
			<Tooltip>
				<TooltipTrigger {...buttonProps()}>{local.children}</TooltipTrigger>
				<TooltipContent side="right" {...tooltipProps()!} />
			</Tooltip>
		</Show>
	);
}

export interface SidebarMenuActionProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
	showOnHover?: boolean;
}
export function SidebarMenuAction(props: ParentProps<SidebarMenuActionProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'showOnHover', 'type']);
	return (
		<button
			{...rest}
			ref={local.ref}
			type={local.type ?? 'button'}
			data-slot="sidebar-menu-action"
			data-show-on-hover={local.showOnHover ?? false}
			class={`${styles[sidebarStyleKeys.menuAction]} ${local.class ?? ''}`}>
			{local.children}
		</button>
	);
}

export interface SidebarMenuBadgeProps extends DivProps {}
export function SidebarMenuBadge(props: ParentProps<SidebarMenuBadgeProps>) {
	return StyledDiv(props, 'sidebar-menu-badge', 'menuBadge');
}

export interface SidebarMenuSkeletonProps extends DivProps {
	showIcon?: boolean;
	width?: string;
}
export function SidebarMenuSkeleton(props: SidebarMenuSkeletonProps) {
	const [local, rest] = splitProps(props, ['class', 'ref', 'showIcon', 'width']);
	return (
		<div {...rest} ref={local.ref} data-slot="sidebar-menu-skeleton" class={`${styles[sidebarStyleKeys.skeleton]} ${local.class ?? ''}`}>
			<Show when={local.showIcon}>
				<Skeleton class={styles[sidebarStyleKeys.skeletonIcon]} />
			</Show>
			<Skeleton class={styles[sidebarStyleKeys.skeletonText]} style={{ '--skeleton-width': local.width ?? '70%' }} />
		</div>
	);
}

export interface SidebarMenuSubProps extends ListProps {}
export function SidebarMenuSub(props: ParentProps<SidebarMenuSubProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<ul {...rest} ref={local.ref} data-slot="sidebar-menu-sub" class={`${styles[sidebarStyleKeys.menuSub]} ${local.class ?? ''}`}>
			{local.children}
		</ul>
	);
}
export interface SidebarMenuSubItemProps extends ItemProps {}
export function SidebarMenuSubItem(props: ParentProps<SidebarMenuSubItemProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<li {...rest} ref={local.ref} data-slot="sidebar-menu-sub-item" class={`${styles[sidebarStyleKeys.menuSubItem]} ${local.class ?? ''}`}>
			{local.children}
		</li>
	);
}

export interface SidebarMenuSubButtonProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'ref'> {
	ref?: CallbackRef<HTMLAnchorElement>;
	size?: 'sm' | 'md';
	isActive?: boolean;
}
export function SidebarMenuSubButton(props: ParentProps<SidebarMenuSubButtonProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'size', 'isActive']);
	const size = () => local.size ?? 'md';
	const styleKeys = () => getSidebarMenuSubButtonStyleKeys(size());
	return (
		<a
			{...rest}
			ref={local.ref}
			data-slot="sidebar-menu-sub-button"
			data-size={size()}
			data-active={local.isActive ?? false}
			aria-current={local.isActive ? (rest['aria-current'] ?? 'page') : rest['aria-current']}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().size]} ${local.class ?? ''}`}>
			{local.children}
		</a>
	);
}

export default Sidebar;
