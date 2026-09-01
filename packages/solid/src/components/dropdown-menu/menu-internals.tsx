import { Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { resolveDropdownMenuSide } from '@tile-ui/core';
import type { DropdownMenuAlign, DropdownMenuSide } from '@tile-ui/core';
import {
	PortalScopeContext,
	createAnchoredPosition,
	createCollectionRegistry,
	createControllableSignal,
	createPortalScope,
	isEffectivelyFocusable,
	isHTMLElementNode,
	isNodeValue,
	invokeEventHandler,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
	type CollectionRegistry,
} from '../../utils';

export type MenuKind = 'dropdown' | 'context' | 'menubar';
export type MenuPosition = { top: number; left: number };
type MenuCloseReason = 'action' | 'escape' | 'focus-outside' | 'pointer-outside' | 'programmatic' | 'submenu' | 'tab';
type MenuFocusIntent = 'first' | 'last';

interface MenuTree {
	closeDescendants: () => void;
	register: (close: () => void) => () => void;
	addBranch: (node: Node) => () => void;
	contains: (target: EventTarget | null) => boolean;
	root: MenuTree;
}

export interface MenuStyleKeys {
	root: string;
	menu?: string;
	trigger: string;
	content: string;
	group: string;
	item: string;
	checkboxItem: string;
	radioGroup: string;
	radioItem: string;
	indicator: string;
	label: string;
	separator: string;
	shortcut: string;
	subTrigger: string;
	subContent: string;
	chevron: string;
	checkIcon: string;
	radioIcon: string;
}

export interface MenuFamilyConfig {
	prefix: string;
	kind: MenuKind;
	styles: Record<string, string>;
	keys: MenuStyleKeys;
	state: (open: boolean) => string;
	checkState: (checked: boolean) => string;
	position: (input: {
		triggerRect: DOMRect;
		contentSize: { width: number; height: number };
		side: DropdownMenuSide;
		align?: DropdownMenuAlign;
		sideOffset: number;
		alignOffset?: number;
		viewport: { width: number; height: number };
		rtl?: boolean;
	}) => MenuPosition;
	subPosition?: MenuFamilyConfig['position'];
}

export interface MenuRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenuPortalProps {
	container?: Node;
	children?: JSX.Element;
}

export interface MenuTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export interface ContextTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export interface MenuContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	side?: DropdownMenuSide;
	align?: DropdownMenuAlign;
	sideOffset?: number;
	alignOffset?: number;
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenuGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenuLabelProps extends MenuGroupProps {
	inset?: boolean;
}

export interface MenuSeparatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenuShortcutProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
	ref?: CallbackRef<HTMLSpanElement>;
}

export interface MenuItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'ref'> {
	inset?: boolean;
	variant?: 'default' | 'destructive';
	disabled?: boolean;
	textValue?: string;
	onSelect?: (event: Event) => void;
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'variant'> {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export interface MenuRadioGroupProps extends Omit<MenuGroupProps, 'onChange'> {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

export interface MenuRadioItemProps extends Omit<MenuItemProps, 'variant'> {
	value: string;
}

export interface MenuSubProps {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: JSX.Element;
}

export interface MenuSubTriggerProps extends Omit<MenuItemProps, 'onSelect' | 'variant'> {}

export interface MenubarRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'ref'> {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string | undefined) => void;
	ref?: CallbackRef<HTMLDivElement>;
}

export interface MenubarMenuProps {
	value: string;
	children?: JSX.Element;
}

interface RootContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	trigger: Accessor<HTMLElement | undefined>;
	setTrigger: (element: HTMLElement) => void;
	triggerId: Accessor<string>;
	setTriggerId: (id: string) => void;
	contentId: Accessor<string>;
	setContentId: (id: string) => void;
	closeAll: (reason?: MenuCloseReason) => void;
	initialFocus: Accessor<MenuFocusIntent>;
	setInitialFocus: (intent: MenuFocusIntent) => void;
	point: Accessor<MenuPosition>;
	setPoint: (position: MenuPosition) => void;
	tree: MenuTree;
}

interface ContentContextValue {
	collection: CollectionRegistry<HTMLDivElement>;
	closeAll: (reason?: MenuCloseReason) => void;
	element: Accessor<HTMLDivElement | undefined>;
}

interface SubContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	trigger: Accessor<HTMLDivElement | undefined>;
	setTrigger: (element: HTMLDivElement) => void;
	triggerId: Accessor<string>;
	setTriggerId: (id: string) => void;
	contentId: Accessor<string>;
	setContentId: (id: string) => void;
	close: (reason?: MenuCloseReason) => void;
	tree: MenuTree;
}

interface RadioContextValue {
	value: Accessor<string | undefined>;
	setValue: (value: string) => void;
}

interface MenubarContextValue {
	value: Accessor<string | undefined>;
	setValue: (value: string | undefined) => void;
	registerTrigger: (item: { element: HTMLButtonElement; disabled: Accessor<boolean>; textValue: Accessor<string> }) => () => void;
	isTabStop: (element: HTMLButtonElement | undefined) => boolean;
	setActiveTrigger: (element: HTMLButtonElement) => void;
	reconcileTabStop: () => void;
	registerMenu: (
		value: string,
		trigger: Accessor<HTMLButtonElement | undefined>,
		disabled: Accessor<boolean>,
		tree: MenuTree,
		setInitialFocus: (intent: MenuFocusIntent) => void,
	) => () => void;
	move: (current: HTMLButtonElement, intent: 'next' | 'previous' | 'first' | 'last', openNext: boolean, focusIntent?: MenuFocusIntent) => void;
}

interface MenubarMenuContextValue {
	value: string;
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	trigger: Accessor<HTMLButtonElement | undefined>;
	setTrigger: (element: HTMLButtonElement) => void;
	triggerId: Accessor<string>;
	setTriggerId: (id: string) => void;
	contentId: Accessor<string>;
	setContentId: (id: string) => void;
	disabled: Accessor<boolean>;
	setDisabled: (disabled: boolean) => void;
	initialFocus: Accessor<MenuFocusIntent>;
	setInitialFocus: (intent: MenuFocusIntent) => void;
	close: (reason?: MenuCloseReason) => void;
	tree: MenuTree;
}

function assignRef<T>(ref: CallbackRef<T> | undefined, element: T) {
	ref?.(element);
}

function classNames(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(' ');
}

function focusItem(collection: CollectionRegistry<HTMLDivElement>, target: HTMLDivElement | undefined) {
	if (!target) return;
	for (const item of collection.items()) item.element.removeAttribute('data-highlighted');
	target.setAttribute('data-highlighted', 'true');
	target.focus();
}

function menuDirection(element: HTMLElement | undefined): 'ltr' | 'rtl' {
	return element?.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

function adjacentTabTarget(trigger: HTMLElement | undefined, backwards: boolean): HTMLElement | undefined {
	if (!trigger) return undefined;
	const document = trigger.ownerDocument;
	const candidates = Array.from(
		document.querySelectorAll<HTMLElement>('a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable="true"], [tabindex]'),
	).filter((element) => element === trigger || isEffectivelyFocusable(element));
	if (!candidates.includes(trigger)) candidates.push(trigger);
	candidates.sort((left, right) => {
		if (left === right) return 0;
		const leftOrder = left.tabIndex > 0 ? left.tabIndex : Number.POSITIVE_INFINITY;
		const rightOrder = right.tabIndex > 0 ? right.tabIndex : Number.POSITIVE_INFINITY;
		if (leftOrder !== rightOrder) return leftOrder - rightOrder;
		const following = left.ownerDocument.defaultView?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4;
		return left.compareDocumentPosition(right) & following ? -1 : 1;
	});
	const index = candidates.indexOf(trigger);
	return candidates[index + (backwards ? -1 : 1)];
}

function hasModifiedMenuNavigation(event: KeyboardEvent): boolean {
	if (!event.ctrlKey && !event.metaKey && !event.altKey) return false;
	return event.key === 'Tab' || event.key.length === 1 || event.key === 'Home' || event.key === 'End' || event.key.startsWith('Arrow');
}

function createMenuTree(parent?: MenuTree): MenuTree {
	const descendants = new Set<() => void>();
	const branchCounts = new Map<Node, number>();
	const parentRemovers = new Map<Node, () => void>();
	const tree: MenuTree = {
		closeDescendants: () => {
			for (const close of descendants) close();
		},
		register: (close) => {
			descendants.add(close);
			return () => descendants.delete(close);
		},
		addBranch: (node) => {
			const count = branchCounts.get(node) ?? 0;
			branchCounts.set(node, count + 1);
			if (count === 0 && parent) parentRemovers.set(node, parent.addBranch(node));
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				const next = (branchCounts.get(node) ?? 1) - 1;
				if (next > 0) branchCounts.set(node, next);
				else {
					branchCounts.delete(node);
					parentRemovers.get(node)?.();
					parentRemovers.delete(node);
				}
			};
		},
		contains: (target) => {
			if (!isNodeValue(target)) return false;
			for (const branch of branchCounts.keys()) {
				if (branch === target || branch.contains(target)) return true;
			}
			return false;
		},
		root: undefined!,
	};
	tree.root = parent?.root ?? tree;
	return tree;
}

function CheckIcon(props: { config: MenuFamilyConfig }) {
	return (
		<svg
			class={props.config.styles[props.config.keys.checkIcon]}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function RadioIcon(props: { config: MenuFamilyConfig }) {
	return (
		<svg
			class={props.config.styles[props.config.keys.radioIcon]}
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

function ChevronIcon(props: { config: MenuFamilyConfig }) {
	return (
		<svg
			class={props.config.styles[props.config.keys.chevron]}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

export function createMenuFamily(config: MenuFamilyConfig) {
	const RootContext = createContext<RootContextValue>();
	const ContentContext = createContext<ContentContextValue>();
	const SubContext = createContext<SubContextValue>();
	const RadioContext = createContext<RadioContextValue>();
	const MenubarContext = createContext<MenubarContextValue>();
	const MenubarMenuContext = createContext<MenubarMenuContextValue>();

	const useRoot = () => {
		const context = useContext(RootContext);
		if (!context) throw new Error(`${config.prefix} sub-components must be used within <${config.prefix}>.`);
		return context;
	};
	const useContent = () => {
		const context = useContext(ContentContext);
		if (!context) throw new Error(`${config.prefix} items must be used within menu content.`);
		return context;
	};
	const useSub = () => {
		const context = useContext(SubContext);
		if (!context) throw new Error(`${config.prefix} submenu parts must be used within a submenu.`);
		return context;
	};
	const useRadio = () => {
		const context = useContext(RadioContext);
		if (!context) throw new Error(`${config.prefix} radio items must be used within a radio group.`);
		return context;
	};

	function createRootValue(props: MenuRootProps): RootContextValue {
		const [open, setOpen] = createControllableSignal({
			value: () => props.open,
			defaultValue: () => props.defaultOpen ?? false,
			onChange: (next) => props.onOpenChange?.(next),
		});
		const [trigger, setTrigger] = createSignal<HTMLElement>();
		const [triggerId, setTriggerId] = createSignal(`tile-solid-${config.kind}-trigger-${createUniqueId()}`);
		const [initialFocus, setInitialFocus] = createSignal<MenuFocusIntent>('first');
		const [point, setPoint] = createSignal<MenuPosition>({ top: 0, left: 0 });
		const [contentId, setContentId] = createSignal(`tile-solid-${config.kind}-${createUniqueId()}`);
		const tree = createMenuTree();
		return {
			open,
			setOpen,
			trigger,
			setTrigger,
			triggerId,
			setTriggerId,
			contentId,
			setContentId,
			closeAll: (reason = 'programmatic') => {
				tree.closeDescendants();
				setOpen(false);
				if (reason !== 'focus-outside') queueMicrotask(() => trigger()?.isConnected && trigger()?.focus());
			},
			initialFocus,
			setInitialFocus,
			point,
			setPoint,
			tree,
		};
	}

	function Root(props: ParentProps<MenuRootProps>) {
		const [local, rest] = splitProps(props, ['open', 'defaultOpen', 'onOpenChange', 'class', 'children', 'ref']);
		const value = createRootValue(local);
		const parentScope = usePortalScope();
		const scope = createPortalScope(() => undefined, parentScope);
		return (
			<PortalScopeContext.Provider value={scope}>
				<RootContext.Provider value={value}>
					<div
						{...rest}
						ref={(element) => assignRef(local.ref, element)}
						data-slot={`${config.kind}-menu`}
						class={classNames(config.styles[config.keys.root], local.class)}>
						{local.children}
					</div>
				</RootContext.Provider>
			</PortalScopeContext.Provider>
		);
	}

	function MenuPortal(props: MenuPortalProps) {
		const parent = usePortalScope();
		const scope = createPortalScope(() => props.container, parent);
		return <PortalScopeContext.Provider value={scope}>{props.children}</PortalScopeContext.Provider>;
	}

	function Trigger(props: ParentProps<MenuTriggerProps>) {
		const context = useRoot();
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id', 'type', 'onClick', 'onKeyDown']);
		const triggerId = () => local.id ?? context.triggerId();
		const initialTriggerId = triggerId();
		context.setTriggerId(initialTriggerId);
		createEffect(() => context.setTriggerId(triggerId()));
		let removeTreeBranch: (() => void) | undefined;
		onCleanup(() => removeTreeBranch?.());
		return (
			<button
				{...rest}
				ref={(element) => {
					context.setTrigger(element);
					removeTreeBranch ??= context.tree.addBranch(element);
					assignRef(local.ref, element);
				}}
				id={triggerId()}
				type={local.type ?? 'button'}
				aria-haspopup="menu"
				aria-expanded={context.open()}
				aria-controls={context.contentId()}
				data-state={config.state(context.open())}
				class={classNames(config.styles[config.keys.trigger], local.class)}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented) {
						if (context.open()) context.closeAll('programmatic');
						else context.setOpen(true);
					}
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (event.defaultPrevented) return;
					if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
						event.preventDefault();
						context.setInitialFocus(event.key === 'ArrowUp' ? 'last' : 'first');
						context.setOpen(true);
					}
				}}>
				{local.children}
			</button>
		);
	}

	function ContextTrigger(props: ParentProps<ContextTriggerProps>) {
		const context = useRoot();
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id', 'type', 'tabIndex', 'onContextMenu', 'onKeyDown']);
		const triggerId = () => local.id ?? context.triggerId();
		const initialTriggerId = triggerId();
		context.setTriggerId(initialTriggerId);
		createEffect(() => context.setTriggerId(triggerId()));
		let removeTreeBranch: (() => void) | undefined;
		onCleanup(() => removeTreeBranch?.());
		const openAtKeyboardPosition = (element: HTMLButtonElement) => {
			const rect = element.getBoundingClientRect();
			context.setPoint({ left: rect.left, top: rect.bottom });
			context.setInitialFocus('first');
			if (context.open()) context.setPoint({ left: rect.left, top: rect.bottom });
			else context.setOpen(true);
		};
		return (
			<button
				{...rest}
				ref={(element) => {
					context.setTrigger(element);
					removeTreeBranch ??= context.tree.addBranch(element);
					assignRef(local.ref, element);
				}}
				id={triggerId()}
				type={local.type ?? 'button'}
				tabIndex={local.tabIndex}
				aria-haspopup="menu"
				aria-expanded={context.open()}
				aria-controls={context.contentId()}
				data-state={config.state(context.open())}
				class={classNames(config.styles[config.keys.trigger], local.class)}
				onContextMenu={(event) => {
					invokeEventHandler(local.onContextMenu, event);
					if (event.defaultPrevented) return;
					event.preventDefault();
					context.setPoint({ left: event.clientX, top: event.clientY });
					context.setInitialFocus('first');
					if (!context.open()) context.setOpen(true);
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (!event.defaultPrevented && (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) {
						event.preventDefault();
						openAtKeyboardPosition(event.currentTarget);
					}
				}}>
				{local.children}
			</button>
		);
	}

	function Content(props: ParentProps<MenuContentProps & { sub?: boolean }>) {
		const root = config.kind === 'menubar' ? undefined : useContext(RootContext);
		const menu = config.kind === 'menubar' ? useContext(MenubarMenuContext) : undefined;
		const bar = config.kind === 'menubar' ? useContext(MenubarContext) : undefined;
		const sub = props.sub ? useSub() : undefined;
		if (!sub && !root && !menu) throw new Error(`${config.prefix} content requires a root or menu.`);
		const [local, rest] = splitProps(props, [
			'children',
			'class',
			'ref',
			'id',
			'side',
			'align',
			'sideOffset',
			'alignOffset',
			'container',
			'sub',
			'style',
			'onKeyDown',
			'aria-label',
			'aria-labelledby',
		]);
		const open = sub?.open ?? menu?.open ?? root!.open;
		const trigger = sub?.trigger ?? menu?.trigger ?? root!.trigger;
		const contentId = () => local.id ?? sub?.contentId() ?? menu?.contentId() ?? root!.contentId();
		const side = () => local.side ?? (sub ? 'right' : 'bottom');
		const [resolvedSide, setResolvedSide] = createSignal<DropdownMenuSide>(side());
		const align = () => local.align ?? (config.kind === 'dropdown' && !sub ? 'center' : 'start');
		const sideOffset = () => local.sideOffset ?? (config.kind === 'menubar' && !sub ? 8 : config.kind === 'dropdown' && !sub ? 4 : 0);
		const alignOffset = () => local.alignOffset ?? (config.kind === 'menubar' && !sub ? -4 : 0);
		const collection = createCollectionRegistry<HTMLDivElement>();
		const parentScope = usePortalScope();
		const parentContent = useContext(ContentContext);
		const scope = createPortalScope(() => local.container, parentScope);
		const tree = sub?.tree ?? menu?.tree ?? root!.tree;
		let content: HTMLDivElement | undefined;
		let removeBranch: (() => void) | undefined;
		let removeTreeBranch: (() => void) | undefined;
		const [position, setPosition] = createSignal<MenuPosition>();
		const initialContentId = contentId();
		if (sub) sub.setContentId(initialContentId);
		else if (menu) menu.setContentId(initialContentId);
		else root!.setContentId(initialContentId);
		createEffect(() => {
			const id = contentId();
			if (sub) sub.setContentId(id);
			else if (menu) menu.setContentId(id);
			else root!.setContentId(id);
		});
		const triggerId = () => sub?.triggerId() ?? menu?.triggerId() ?? root?.triggerId();
		const closeLayer = (reason: MenuCloseReason = 'programmatic') => {
			if (sub) {
				sub.close(reason);
			} else if (menu) menu.close(reason);
			else root!.closeAll(reason);
		};
		const closeAll = (reason: MenuCloseReason = 'action') => {
			if (config.kind === 'menubar') menu?.close(reason);
			else root?.closeAll(reason);
		};
		const recomputeContextPosition = () => {
			if (config.kind !== 'context' || sub || !open()) return;
			const rect = content?.getBoundingClientRect();
			const view = content?.ownerDocument.defaultView;
			if (!rect || !view) return;
			const point = root!.point();
			setPosition(
				config.position({
					triggerRect: new DOMRect(point.left, point.top),
					contentSize: { width: rect.width, height: rect.height },
					side: 'bottom',
					sideOffset: 0,
					viewport: { width: view.innerWidth, height: view.innerHeight },
				}),
			);
		};
		createEffect(() => {
			if (config.kind !== 'context' || sub || !open()) return;
			root!.point();
			queueMicrotask(recomputeContextPosition);
		});
		createEffect(() => {
			if (!open()) return;
			let closeReason: MenuCloseReason = 'programmatic';
			let treeClosed = false;
			const layer = registerDismissableLayer({
				element: () => content,
				branches: () => (trigger() ? [trigger()!] : []),
				portalScope: scope,
				onEscapeKeyDown: () => {
					closeReason = 'escape';
				},
				onPointerDownOutside: (event) => {
					closeReason = 'pointer-outside';
					const target = event.target;
					const insideParentLayer = isNodeValue(target) && (parentContent?.element()?.contains(target) || sub?.trigger()?.contains(target));
					if (sub && !insideParentLayer) {
						treeClosed = true;
						closeAll('pointer-outside');
					}
				},
				onFocusOutside: (event) => {
					closeReason = 'focus-outside';
					if (sub && !tree.root.contains(event.target)) {
						treeClosed = true;
						closeAll('focus-outside');
					}
				},
				onDismiss: () => {
					if (!treeClosed) closeLayer(closeReason);
				},
			});
			const positioner =
				config.kind === 'context' && !sub
					? undefined
					: createAnchoredPosition({
							anchor: trigger,
							content: () => content,
							open,
							onPosition: ({ anchorRect, contentRect, containerRect, direction }) => {
								let physicalSide = sub ? resolveDropdownMenuSide(side(), direction === 'rtl') : side();
								if (sub && (physicalSide === 'left' || physicalSide === 'right')) {
									const leftSpace = anchorRect.left - containerRect.left;
									const rightSpace = containerRect.right - anchorRect.right;
									const requiredSpace = contentRect.width + sideOffset();
									if (physicalSide === 'right' && rightSpace < requiredSpace && leftSpace > rightSpace) physicalSide = 'left';
									else if (physicalSide === 'left' && leftSpace < requiredSpace && rightSpace > leftSpace) physicalSide = 'right';
								}
								setResolvedSide(physicalSide);
								const next = (sub && config.subPosition ? config.subPosition : config.position)({
									triggerRect: anchorRect,
									contentSize: { width: contentRect.width, height: contentRect.height },
									side: physicalSide,
									align: align(),
									sideOffset: sideOffset(),
									alignOffset: alignOffset(),
									viewport: { width: containerRect.width, height: containerRect.height },
									rtl: sub && (physicalSide === 'left' || physicalSide === 'right') ? false : direction === 'rtl',
								});
								setPosition({ left: next.left + containerRect.left, top: next.top + containerRect.top });
							},
						});
			queueMicrotask(() => {
				layer.update();
				positioner?.recompute();
				recomputeContextPosition();
				const focusIntent = sub ? 'first' : (menu?.initialFocus() ?? root?.initialFocus() ?? 'first');
				const target = collection.move(null, focusIntent)?.element;
				focusItem(collection, target);
			});
			let contextObserver: ResizeObserver | undefined;
			const contextDocument = content?.ownerDocument;
			const contextView = contextDocument?.defaultView;
			if (config.kind === 'context' && !sub && contextDocument) {
				const ResizeObserverConstructor = contextView ? (contextView as Window & typeof globalThis).ResizeObserver : undefined;
				try {
					contextObserver = ResizeObserverConstructor ? new ResizeObserverConstructor(recomputeContextPosition) : undefined;
					if (content) contextObserver?.observe(content);
				} catch {
					contextObserver = undefined;
				}
				contextView?.addEventListener('resize', recomputeContextPosition);
				contextDocument.addEventListener('scroll', recomputeContextPosition, true);
			}
			onCleanup(() => {
				layer.destroy();
				positioner?.destroy();
				contextObserver?.disconnect();
				contextView?.removeEventListener('resize', recomputeContextPosition);
				contextDocument?.removeEventListener('scroll', recomputeContextPosition, true);
			});
		});
		onCleanup(() => {
			removeBranch?.();
			removeTreeBranch?.();
			collection.destroy();
		});
		const handleKeyDown = (event: KeyboardEvent) => {
			invokeEventHandler(local.onKeyDown, event);
			if (event.defaultPrevented || hasModifiedMenuNavigation(event)) return;
			const current = isHTMLElementNode(event.target) && event.target.tagName === 'DIV' ? (event.target as HTMLDivElement) : null;
			let target: HTMLDivElement | undefined;
			if (event.key === 'Tab') {
				event.preventDefault();
				const tabTarget = adjacentTabTarget(menu?.trigger() ?? root?.trigger() ?? trigger(), event.shiftKey);
				closeAll('tab');
				queueMicrotask(() => tabTarget?.isConnected && tabTarget.focus());
				return;
			} else if (event.key === 'ArrowDown') target = collection.move(current, 'next')?.element;
			else if (event.key === 'ArrowUp') target = collection.move(current, 'previous')?.element;
			else if (event.key === 'Home') target = collection.move(current, 'first')?.element;
			else if (event.key === 'End') target = collection.move(current, 'last')?.element;
			else if ((event.key === 'Enter' || event.key === ' ') && current?.matches('[role^="menuitem"]')) {
				event.preventDefault();
				current.click();
				return;
			} else if (sub) {
				const closeKey = menuDirection(content) === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
				if (event.key === closeKey) {
					event.preventDefault();
					closeLayer('submenu');
					return;
				}
				target = collection.typeahead(event.key, current)?.element;
			} else if (menu && bar) {
				const rtl = menuDirection(content) === 'rtl';
				const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
				const previousKey = rtl ? 'ArrowRight' : 'ArrowLeft';
				if (event.key === nextKey || event.key === previousKey) {
					event.preventDefault();
					bar.move(menu.trigger()!, event.key === nextKey ? 'next' : 'previous', true, event.key === nextKey ? 'first' : 'last');
					return;
				}
				target = collection.typeahead(event.key, current)?.element;
			} else {
				target = collection.typeahead(event.key, current)?.element;
			}
			if (target) {
				event.preventDefault();
				focusItem(collection, target);
			}
		};
		const bindContent = (element: HTMLDivElement) => {
			content = element;
			removeBranch = scope.addBranch(element);
			removeTreeBranch = tree.addBranch(element);
			element.addEventListener('keydown', handleKeyDown);
			onCleanup(() => element.removeEventListener('keydown', handleKeyDown));
			assignRef(local.ref, element);
		};
		return (
			<Show when={open()}>
				<Portal mount={resolvePortalContainer(scope)}>
					<PortalScopeContext.Provider value={scope}>
						<ContentContext.Provider value={{ collection, closeAll, element: () => content }}>
							<div
								{...rest}
								ref={bindContent}
								id={contentId()}
								role="menu"
								aria-label={local['aria-label']}
								aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : triggerId())}
								dir={menuDirection(trigger())}
								tabIndex={-1}
								data-state={config.state(open())}
								data-side={sub ? resolvedSide() : side()}
								data-align={align()}
								class={classNames(config.styles[sub ? config.keys.subContent : config.keys.content], local.class)}
								style={{
									position: 'fixed',
									top: position() ? `${position()!.top}px` : undefined,
									left: position() ? `${position()!.left}px` : undefined,
									...(local.style as JSX.CSSProperties),
								}}>
								{local.children}
							</div>
						</ContentContext.Provider>
					</PortalScopeContext.Provider>
				</Portal>
			</Show>
		);
	}

	function Group(props: ParentProps<MenuGroupProps>) {
		const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
		return (
			<div {...rest} ref={(element) => assignRef(local.ref, element)} role="group" class={classNames(config.styles[config.keys.group], local.class)}>
				{local.children}
			</div>
		);
	}

	function Label(props: ParentProps<MenuLabelProps>) {
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'inset']);
		return (
			<div {...rest} ref={(element) => assignRef(local.ref, element)} data-inset={local.inset ?? false} class={classNames(config.styles[config.keys.label], local.class)}>
				{local.children}
			</div>
		);
	}

	function Separator(props: MenuSeparatorProps) {
		const [local, rest] = splitProps(props, ['class', 'ref']);
		return <div {...rest} ref={(element) => assignRef(local.ref, element)} role="separator" class={classNames(config.styles[config.keys.separator], local.class)} />;
	}

	function Shortcut(props: ParentProps<MenuShortcutProps>) {
		const [local, rest] = splitProps(props, ['children', 'class', 'ref']);
		return (
			<span {...rest} ref={(element) => assignRef(local.ref, element)} class={classNames(config.styles[config.keys.shortcut], local.class)}>
				{local.children}
			</span>
		);
	}

	function useItem(props: MenuItemProps, element: Accessor<HTMLDivElement | undefined>) {
		const content = useContent();
		let unregister: (() => void) | undefined;
		createEffect(() => {
			const node = element();
			if (!node || unregister) return;
			unregister = content.collection.register({ element: node, disabled: () => props.disabled ?? false, textValue: () => props.textValue ?? node.textContent ?? '' });
		});
		onCleanup(() => unregister?.());
		return content;
	}

	function Item(props: ParentProps<MenuItemProps>) {
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'inset', 'variant', 'disabled', 'textValue', 'onSelect', 'onClick', 'onPointerMove']);
		const [element, setElement] = createSignal<HTMLDivElement>();
		const content = useItem(local, element);
		return (
			<div
				{...rest}
				ref={(node) => {
					setElement(node);
					assignRef(local.ref, node);
				}}
				role="menuitem"
				tabIndex={-1}
				aria-disabled={local.disabled || undefined}
				data-disabled={local.disabled ?? false}
				data-inset={local.inset ?? false}
				data-variant={local.variant ?? 'default'}
				class={classNames(config.styles[config.keys.item], local.class)}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !local.disabled) focusItem(content.collection, event.currentTarget);
				}}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (event.defaultPrevented || local.disabled) return;
					local.onSelect?.(event);
					if (!event.defaultPrevented) content.closeAll();
				}}>
				{local.children}
			</div>
		);
	}

	function CheckboxItem(props: ParentProps<MenuCheckboxItemProps>) {
		const [local, rest] = splitProps(props, [
			'children',
			'class',
			'ref',
			'inset',
			'disabled',
			'textValue',
			'onSelect',
			'onClick',
			'onPointerMove',
			'checked',
			'defaultChecked',
			'onCheckedChange',
		]);
		const [checked, setChecked] = createControllableSignal({
			value: () => local.checked,
			defaultValue: () => local.defaultChecked ?? false,
			onChange: (next) => local.onCheckedChange?.(next),
		});
		const [element, setElement] = createSignal<HTMLDivElement>();
		const content = useItem(local, element);
		return (
			<div
				{...rest}
				ref={(node) => {
					setElement(node);
					assignRef(local.ref, node);
				}}
				role="menuitemcheckbox"
				tabIndex={-1}
				aria-checked={checked()}
				aria-disabled={local.disabled || undefined}
				data-checked={config.checkState(checked())}
				data-disabled={local.disabled ?? false}
				data-inset={local.inset ?? false}
				class={classNames(config.styles[config.keys.checkboxItem], local.class)}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !local.disabled) focusItem(content.collection, event.currentTarget);
				}}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (event.defaultPrevented || local.disabled) return;
					local.onSelect?.(event);
					if (!event.defaultPrevented) setChecked(!checked());
				}}>
				<span class={config.styles[config.keys.indicator]}>
					<Show when={checked()}>
						<CheckIcon config={config} />
					</Show>
				</span>
				{local.children}
			</div>
		);
	}

	function RadioGroup(props: ParentProps<MenuRadioGroupProps>) {
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'value', 'defaultValue', 'onValueChange']);
		const [value, setValue] = createControllableSignal({
			value: () => local.value,
			defaultValue: () => local.defaultValue ?? '',
			onChange: (next) => local.onValueChange?.(next),
		});
		return (
			<RadioContext.Provider value={{ value, setValue }}>
				<div {...rest} ref={(element) => assignRef(local.ref, element)} role="group" class={classNames(config.styles[config.keys.radioGroup], local.class)}>
					{local.children}
				</div>
			</RadioContext.Provider>
		);
	}

	function RadioItem(props: ParentProps<MenuRadioItemProps>) {
		const radio = useRadio();
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'value', 'inset', 'disabled', 'textValue', 'onSelect', 'onClick', 'onPointerMove']);
		const [element, setElement] = createSignal<HTMLDivElement>();
		const content = useItem(local, element);
		const checked = () => radio.value() === local.value;
		return (
			<div
				{...rest}
				ref={(node) => {
					setElement(node);
					assignRef(local.ref, node);
				}}
				role="menuitemradio"
				tabIndex={-1}
				aria-checked={checked()}
				aria-disabled={local.disabled || undefined}
				data-checked={config.checkState(checked())}
				data-disabled={local.disabled ?? false}
				data-inset={local.inset ?? false}
				class={classNames(config.styles[config.keys.radioItem], local.class)}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !local.disabled) focusItem(content.collection, event.currentTarget);
				}}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (event.defaultPrevented || local.disabled) return;
					local.onSelect?.(event);
					if (!event.defaultPrevented) radio.setValue(local.value);
				}}>
				<span class={config.styles[config.keys.indicator]}>
					<Show when={checked()}>
						<RadioIcon config={config} />
					</Show>
				</span>
				{local.children}
			</div>
		);
	}

	function Sub(props: MenuSubProps) {
		const parentSub = useContext(SubContext);
		const root = config.kind === 'menubar' ? undefined : useContext(RootContext);
		const menu = config.kind === 'menubar' ? useContext(MenubarMenuContext) : undefined;
		const parentTree = parentSub?.tree ?? menu?.tree ?? root?.tree;
		if (!parentTree) throw new Error(`${config.prefix}Sub must be used within menu content.`);
		const [open, setOpen] = createControllableSignal({
			value: () => props.open,
			defaultValue: () => props.defaultOpen ?? false,
			onChange: (next) => props.onOpenChange?.(next),
		});
		const [trigger, setTrigger] = createSignal<HTMLDivElement>();
		const [triggerId, setTriggerId] = createSignal(`tile-solid-${config.kind}-sub-trigger-${createUniqueId()}`);
		const [contentId, setContentId] = createSignal(`tile-solid-${config.kind}-sub-${createUniqueId()}`);
		const tree = createMenuTree(parentTree);
		let closeRequested = false;
		const close = (reason: MenuCloseReason = 'submenu') => {
			tree.closeDescendants();
			if (props.open === undefined) setOpen(false);
			else if (open() && !closeRequested) {
				closeRequested = true;
				setOpen(false);
				queueMicrotask(() => {
					closeRequested = false;
				});
			}
			if (reason === 'escape' || reason === 'pointer-outside' || reason === 'submenu') queueMicrotask(() => trigger()?.isConnected && trigger()?.focus());
		};
		const unregister = parentTree.register(close);
		onCleanup(unregister);
		const value: SubContextValue = { open, setOpen, trigger, setTrigger, triggerId, setTriggerId, contentId, setContentId, close, tree };
		return <SubContext.Provider value={value}>{props.children}</SubContext.Provider>;
	}

	function SubTrigger(props: ParentProps<MenuSubTriggerProps>) {
		const sub = useSub();
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id', 'inset', 'disabled', 'textValue', 'onClick', 'onPointerMove', 'onKeyDown']);
		const [element, setElement] = createSignal<HTMLDivElement>();
		const content = useItem(local, element);
		const triggerId = () => local.id ?? sub.triggerId();
		const initialTriggerId = triggerId();
		sub.setTriggerId(initialTriggerId);
		createEffect(() => sub.setTriggerId(triggerId()));
		let removeTreeBranch: (() => void) | undefined;
		onCleanup(() => removeTreeBranch?.());
		const openKey = () => (menuDirection(element()) === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
		const open = () => {
			if (local.disabled) return;
			sub.setOpen(true);
		};
		return (
			<div
				{...rest}
				ref={(node) => {
					setElement(node);
					sub.setTrigger(node);
					removeTreeBranch ??= sub.tree.addBranch(node);
					assignRef(local.ref, node);
				}}
				id={triggerId()}
				role="menuitem"
				tabIndex={-1}
				aria-haspopup="menu"
				aria-expanded={sub.open()}
				aria-controls={sub.contentId()}
				aria-disabled={local.disabled || undefined}
				data-state={config.state(sub.open())}
				data-disabled={local.disabled ?? false}
				data-inset={local.inset ?? false}
				class={classNames(config.styles[config.keys.subTrigger], local.class)}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !local.disabled) {
						focusItem(content.collection, event.currentTarget);
						open();
					}
				}}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented && !local.disabled) sub.setOpen(!sub.open());
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (
						!event.defaultPrevented &&
						!hasModifiedMenuNavigation(event) &&
						!local.disabled &&
						(event.key === openKey() || event.key === 'Enter' || event.key === ' ')
					) {
						event.preventDefault();
						open();
					}
				}}>
				{local.children}
				<ChevronIcon config={config} />
			</div>
		);
	}

	function SubContent(props: ParentProps<MenuContentProps>) {
		return <Content {...props} sub />;
	}

	function MenubarRoot(props: ParentProps<MenubarRootProps>) {
		const [local, rest] = splitProps(props, ['value', 'defaultValue', 'onValueChange', 'children', 'class', 'ref', 'onKeyDown']);
		const [value, setValue] = createControllableSignal({ value: () => local.value, defaultValue: () => local.defaultValue, onChange: (next) => local.onValueChange?.(next) });
		const collection = createCollectionRegistry<HTMLButtonElement>();
		const [activeTrigger, setActiveTrigger] = createSignal<HTMLButtonElement>();
		const [triggersVersion, setTriggersVersion] = createSignal(0);
		const menus = new Map<
			string,
			{ trigger: Accessor<HTMLButtonElement | undefined>; disabled: Accessor<boolean>; tree: MenuTree; setInitialFocus: (intent: MenuFocusIntent) => void }
		>();
		const context: MenubarContextValue = {
			value,
			setValue,
			registerTrigger: (item) => {
				const unregister = collection.register(item);
				setTriggersVersion((version) => version + 1);
				return () => {
					unregister();
					if (activeTrigger() === item.element) setActiveTrigger(undefined);
					setTriggersVersion((version) => version + 1);
				};
			},
			isTabStop: (element) => {
				triggersVersion();
				const enabled = collection.enabledItems();
				return element === (enabled.some((item) => item.element === activeTrigger()) ? activeTrigger() : enabled[0]?.element);
			},
			setActiveTrigger,
			reconcileTabStop: () => setTriggersVersion((version) => version + 1),
			registerMenu: (itemValue, trigger, disabled, tree, setInitialFocus) => {
				menus.set(itemValue, { trigger, disabled, tree, setInitialFocus });
				return () => menus.delete(itemValue);
			},
			move: (current, intent, openNext, focusIntent = 'first') => {
				const target = collection.move(current, intent)?.element;
				if (!target) return;
				setActiveTrigger(target);
				target.focus();
				if (openNext) {
					const entry = [...menus].find(([, item]) => item.trigger() === target);
					if (entry) {
						for (const [itemValue, item] of menus) {
							if (itemValue !== entry[0]) item.tree.closeDescendants();
						}
						entry[1].setInitialFocus(focusIntent);
						setValue(entry[0]);
					}
				}
			},
		};
		onCleanup(() => collection.destroy());
		return (
			<MenubarContext.Provider value={context}>
				<div
					{...rest}
					ref={(element) => assignRef(local.ref, element)}
					role="menubar"
					aria-orientation="horizontal"
					class={classNames(config.styles[config.keys.root], local.class)}
					onKeyDown={(event) => {
						invokeEventHandler(local.onKeyDown, event);
						if (
							event.defaultPrevented ||
							hasModifiedMenuNavigation(event) ||
							!isHTMLElementNode(event.target) ||
							event.target.tagName !== 'BUTTON' ||
							event.target.getAttribute('role') !== 'menuitem'
						)
							return;
						const rtl = menuDirection(event.currentTarget) === 'rtl';
						let intent: 'next' | 'previous' | 'first' | 'last' | undefined;
						if (event.key === 'Home') intent = 'first';
						else if (event.key === 'End') intent = 'last';
						else if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) intent = 'next';
						else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) intent = 'previous';
						if (intent) {
							event.preventDefault();
							context.move(event.target as HTMLButtonElement, intent, value() !== undefined);
						}
					}}>
					{local.children}
				</div>
			</MenubarContext.Provider>
		);
	}

	function MenubarMenu(props: MenubarMenuProps) {
		const bar = useContext(MenubarContext);
		if (!bar) throw new Error(`${config.prefix}Menu must be used within <${config.prefix}>.`);
		const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
		const [triggerId, setTriggerId] = createSignal(`tile-solid-menubar-trigger-${createUniqueId()}`);
		const [disabled, setDisabled] = createSignal(false);
		const [initialFocus, setInitialFocus] = createSignal<MenuFocusIntent>('first');
		const [contentId, setContentId] = createSignal(`tile-solid-menubar-${createUniqueId()}`);
		const tree = createMenuTree();
		const close = (reason: MenuCloseReason = 'programmatic') => {
			tree.closeDescendants();
			bar.setValue(undefined);
			if (reason !== 'focus-outside') queueMicrotask(() => trigger()?.isConnected && trigger()?.focus());
		};
		const value: MenubarMenuContextValue = {
			value: props.value,
			open: () => bar.value() === props.value,
			setOpen: (open) => bar.setValue(open ? props.value : undefined),
			trigger,
			setTrigger,
			triggerId,
			setTriggerId,
			contentId,
			setContentId,
			disabled,
			setDisabled,
			initialFocus,
			setInitialFocus,
			close,
			tree,
		};
		const unregister = bar.registerMenu(props.value, trigger, disabled, tree, setInitialFocus);
		onCleanup(unregister);
		return (
			<MenubarMenuContext.Provider value={value}>
				<div class={config.styles[config.keys.menu!]}>{props.children}</div>
			</MenubarMenuContext.Provider>
		);
	}

	function MenubarTrigger(props: ParentProps<MenuTriggerProps & { disabled?: boolean }>) {
		const menu = useContext(MenubarMenuContext);
		const bar = useContext(MenubarContext);
		if (!menu || !bar) throw new Error(`${config.prefix}Trigger must be used within a menu.`);
		const [local, rest] = splitProps(props, ['children', 'class', 'ref', 'id', 'type', 'disabled', 'onClick', 'onKeyDown', 'onPointerMove']);
		const triggerId = () => local.id ?? menu.triggerId();
		const initialTriggerId = triggerId();
		menu.setTriggerId(initialTriggerId);
		createEffect(() => menu.setTriggerId(triggerId()));
		let unregister: (() => void) | undefined;
		let removeTreeBranch: (() => void) | undefined;
		createEffect(() => {
			menu.setDisabled(local.disabled ?? false);
			bar.reconcileTabStop();
		});
		onCleanup(() => {
			unregister?.();
			removeTreeBranch?.();
		});
		return (
			<button
				{...rest}
				ref={(element) => {
					menu.setTrigger(element);
					removeTreeBranch ??= menu.tree.addBranch(element);
					unregister ??= bar.registerTrigger({ element, disabled: () => local.disabled ?? false, textValue: () => element.textContent ?? '' });
					assignRef(local.ref, element);
				}}
				id={triggerId()}
				type={local.type ?? 'button'}
				role="menuitem"
				aria-haspopup="menu"
				aria-expanded={menu.open()}
				aria-controls={menu.contentId()}
				disabled={local.disabled}
				tabIndex={bar.isTabStop(menu.trigger()) ? 0 : -1}
				data-state={config.state(menu.open())}
				data-disabled={local.disabled ?? false}
				class={classNames(config.styles[config.keys.trigger], local.class)}
				onFocus={(event) => bar.setActiveTrigger(event.currentTarget)}
				onPointerMove={(event) => {
					invokeEventHandler(local.onPointerMove, event);
					if (!event.defaultPrevented && !local.disabled && bar.value() !== undefined) {
						event.currentTarget.focus();
						menu.setOpen(true);
					}
				}}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented && !local.disabled) {
						if (menu.open()) menu.close('programmatic');
						else menu.setOpen(true);
					}
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (event.defaultPrevented || hasModifiedMenuNavigation(event) || local.disabled) return;
					if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
						event.preventDefault();
						menu.setInitialFocus(event.key === 'ArrowUp' ? 'last' : 'first');
						menu.setOpen(true);
					}
				}}>
				{local.children}
			</button>
		);
	}

	return {
		Root,
		MenuPortal,
		Trigger,
		ContextTrigger,
		Content,
		Group,
		Label,
		Separator,
		Shortcut,
		Item,
		CheckboxItem,
		RadioGroup,
		RadioItem,
		Sub,
		SubTrigger,
		SubContent,
		MenubarRoot,
		MenubarMenu,
		MenubarTrigger,
	};
}
