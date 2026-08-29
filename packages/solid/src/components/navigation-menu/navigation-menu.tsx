import {
	children,
	createContext,
	createEffect,
	createRenderEffect,
	createSignal,
	createUniqueId,
	onCleanup,
	onMount,
	Show,
	splitProps,
	useContext,
	type Accessor,
	type JSX,
	type ParentProps,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { getNavigationMenuState, navigationMenuStyleKeys } from '@tile-ui/core';
import type { NavigationMenuBaseProps, NavigationMenuItemBaseProps } from '@tile-ui/core';
import { createAnchoredPosition, createCollectionRegistry, createControllableSignal, invokeEventHandler, registerDismissableLayer, type CallbackRef } from '../../utils';
import styles from '@tile-ui/styles/scss/components/navigation-menu.module.scss';

interface TriggerEntry {
	element?: HTMLButtonElement;
	value: Accessor<string>;
	id: Accessor<string>;
	disabled: Accessor<boolean>;
	disposeCollection?: () => void;
}

interface ContentEntry {
	value: Accessor<string>;
	id: Accessor<string>;
	render: () => JSX.Element;
}

interface ViewportEntry {
	render: () => JSX.Element;
}

interface IndicatorRect {
	left: number;
	width: number;
}

interface NavigationMenuContextValue {
	value: Accessor<string | undefined>;
	viewport: Accessor<boolean>;
	ownerId: string;
	root: Accessor<HTMLElement | undefined>;
	activeTrigger: Accessor<HTMLButtonElement | undefined>;
	entriesVersion: Accessor<number>;
	indicatorRect: Accessor<IndicatorRect | undefined>;
	setIndicatorRect: (rect: IndicatorRect | undefined) => void;
	setValue: (value: string | undefined) => void;
	defaultTriggerId: (value: string) => string;
	defaultContentId: (value: string) => string;
	triggerId: (value: string) => string;
	contentId: (value: string) => string;
	registerTrigger: (value: Accessor<string>, id: Accessor<string>, disabled: Accessor<boolean>) => TriggerEntry;
	registerContent: (entry: ContentEntry) => ContentEntry;
	bindTrigger: (entry: TriggerEntry, element: HTMLButtonElement) => void;
	unregisterTrigger: (entry: TriggerEntry) => void;
	unregisterContent: (entry: ContentEntry) => void;
	registerViewport: (entry: ViewportEntry) => ViewportEntry;
	unregisterViewport: (entry: ViewportEntry) => void;
	activeViewport: Accessor<ViewportEntry | undefined>;
	isTabStop: (entry: TriggerEntry) => boolean;
	setTabStop: (entry: TriggerEntry) => void;
	moveFocus: (current: HTMLButtonElement, event: KeyboardEvent) => void;
	activeContent: Accessor<ContentEntry | undefined>;
}

interface NavigationMenuItemContextValue {
	value: Accessor<string>;
	disabled: Accessor<boolean>;
	open: Accessor<boolean>;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	setTriggerId: (id: string) => void;
	setContentId: (id: string) => void;
}

const NavigationMenuContext = createContext<NavigationMenuContextValue>();
const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue>();

function useNavigationMenu() {
	const context = useContext(NavigationMenuContext);
	if (!context) throw new Error('NavigationMenu sub-components must be used within <NavigationMenu>.');
	return context;
}

function useNavigationMenuItem() {
	const context = useContext(NavigationMenuItemContext);
	if (!context) throw new Error('NavigationMenuTrigger and NavigationMenuContent must be used within <NavigationMenuItem>.');
	return context;
}

function isButtonElement(target: EventTarget | null): target is HTMLButtonElement {
	if (!target || typeof target !== 'object' || !('ownerDocument' in target)) return false;
	const element = target as { localName?: string; nodeType?: number; ownerDocument?: Document | null };
	return element.nodeType === 1 && element.localName === 'button' && !!element.ownerDocument?.defaultView;
}

function getAttribute(tag: string, name: string): string | undefined {
	return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

function setAttribute(tag: string, name: string, value: string): string {
	const pattern = new RegExp(`\\s${name}="[^"]*"`);
	return pattern.test(tag) ? tag.replace(pattern, ` ${name}="${value}"`) : tag.replace(/>$/, ` ${name}="${value}">`);
}

function normalizeServerMarkup(content: JSX.Element, ownerId: string): null {
	if (!isServer) return null;
	const nodes: Array<{ t: string }> = [];
	const visit = (node: unknown): void => {
		if (typeof node === 'function') visit((node as () => unknown)());
		else if (Array.isArray(node)) node.forEach(visit);
		else if (typeof node === 'object' && node !== null && 't' in node && typeof (node as { t?: unknown }).t === 'string') nodes.push(node as { t: string });
	};
	visit(content);
	const triggerPattern = /<button\b[^>]*data-slot="navigation-menu-trigger"[^>]*>/g;
	const contentPattern = /<div\b[^>]*data-slot="navigation-menu-content"[^>]*>/g;
	const triggers = nodes
		.flatMap((node) => Array.from(node.t.matchAll(triggerPattern), (match) => ({ node, tag: match[0] })))
		.filter(({ tag }) => getAttribute(tag, 'data-navigation-menu-owner') === ownerId);
	const panels = nodes
		.flatMap((node) => Array.from(node.t.matchAll(contentPattern), (match) => ({ node, tag: match[0] })))
		.filter(({ tag }) => getAttribute(tag, 'data-navigation-menu-owner') === ownerId);
	const enabled = triggers.filter(({ tag }) => !/\sdisabled(?:=""|(?=[\s>]))/.test(tag));
	const target = enabled.find(({ tag }) => /\saria-expanded="true"/.test(tag)) ?? enabled[0];
	for (const node of nodes) {
		let triggerIndex = 0;
		node.t = node.t.replace(triggerPattern, (tag) => {
			if (getAttribute(tag, 'data-navigation-menu-owner') !== ownerId) return tag;
			const trigger = triggers.filter((candidate) => candidate.node === node)[triggerIndex++];
			const value = getAttribute(tag, 'data-value');
			const panel = panels.find((candidate) => getAttribute(candidate.tag, 'data-value') === value);
			const linked = panel ? setAttribute(tag, 'aria-controls', getAttribute(panel.tag, 'id') ?? '') : tag;
			return linked.replace(/\stabIndex="[^"]*"/, ` tabIndex="${trigger === target ? 0 : -1}"`);
		});
		let panelIndex = 0;
		node.t = node.t.replace(contentPattern, (tag) => {
			if (getAttribute(tag, 'data-navigation-menu-owner') !== ownerId) return tag;
			const panel = panels.filter((candidate) => candidate.node === node)[panelIndex++];
			const value = getAttribute(tag, 'data-value');
			const trigger = triggers.find((candidate) => getAttribute(candidate.tag, 'data-value') === value);
			return trigger ? setAttribute(panel.tag, 'aria-labelledby', getAttribute(trigger.tag, 'id') ?? '') : tag;
		});
	}
	return null;
}

function NavigationMenuChildren(props: { children: JSX.Element; ownerId: string; viewport: Accessor<boolean> }) {
	const content = children(() => props.children);
	const resolved = content();
	const output = [
		resolved,
		<Show when={props.viewport()}>
			<NavigationMenuResolvedViewport />
		</Show>,
	];
	normalizeServerMarkup(output, props.ownerId);
	return output;
}

function NavigationMenuResolvedViewport() {
	const menu = useNavigationMenu();
	return (
		<Show when={menu.activeViewport()} fallback={<NavigationMenuViewportElement />} keyed>
			{(entry) => entry.render()}
		</Show>
	);
}

function Chevron(props: { open: boolean }) {
	return (
		<svg
			aria-hidden="true"
			data-state={getNavigationMenuState(props.open)}
			class={styles[navigationMenuStyleKeys.chevron]}
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round">
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function NavigationMenuContentRenderer(props: { render: () => JSX.Element }) {
	return props.render();
}

export interface NavigationMenuProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'defaultValue' | 'onChange' | 'ref' | 'value'>, NavigationMenuBaseProps {
	ref?: CallbackRef<HTMLElement>;
}

/** SolidJS NavigationMenu：根节点拥有集中式视口、集合导航和 dismiss 生命周期。 */
export function NavigationMenu(props: ParentProps<NavigationMenuProps>) {
	const [local, rest] = splitProps(props, ['value', 'defaultValue', 'onValueChange', 'viewport', 'class', 'children', 'ref']);
	const controlled = Object.prototype.hasOwnProperty.call(props, 'value');
	const [internalValue, setInternalValue] = createControllableSignal<string | undefined>({
		defaultValue: () => local.defaultValue,
	});
	const value = () => (controlled ? local.value : internalValue());
	const setValue = (next: string | undefined) => {
		const previous = value();
		if (!controlled) setInternalValue(next);
		if (!Object.is(previous, next)) local.onValueChange?.(next);
		return next;
	};
	const ownerId = `tile-solid-navigation-menu-${createUniqueId()}`;
	const triggers: TriggerEntry[] = [];
	const contents: ContentEntry[] = [];
	const viewports: ViewportEntry[] = [];
	const collection = createCollectionRegistry<HTMLButtonElement>();
	const [entriesVersion, setEntriesVersion] = createSignal(0);
	const [viewportVersion, setViewportVersion] = createSignal(0);
	const [tabStop, setTabStop] = createSignal<TriggerEntry>();
	const [root, setRoot] = createSignal<HTMLElement>();
	const [indicatorRect, setIndicatorRect] = createSignal<IndicatorRect>();
	const idPart = (itemValue: string) => encodeURIComponent(itemValue);
	const defaultTriggerId = (itemValue: string) => `${ownerId}-trigger-${idPart(itemValue)}`;
	const defaultContentId = (itemValue: string) => `${ownerId}-content-${idPart(itemValue)}`;
	const context: NavigationMenuContextValue = {
		value,
		viewport: () => local.viewport ?? true,
		ownerId,
		root,
		activeTrigger: () => {
			entriesVersion();
			const entry = triggers.find((candidate) => candidate.value() === value() && !candidate.disabled());
			return entry?.element?.isConnected ? entry.element : undefined;
		},
		entriesVersion,
		indicatorRect,
		setIndicatorRect,
		setValue,
		defaultTriggerId,
		defaultContentId,
		triggerId: (itemValue) => {
			entriesVersion();
			return triggers.find((entry) => entry.value() === itemValue)?.id() ?? defaultTriggerId(itemValue);
		},
		contentId: (itemValue) => {
			entriesVersion();
			return contents.find((entry) => entry.value() === itemValue)?.id() ?? defaultContentId(itemValue);
		},
		registerTrigger: (itemValue, id, disabled) => {
			const entry = { value: itemValue, id, disabled };
			triggers.push(entry);
			setEntriesVersion((version) => version + 1);
			return entry;
		},
		registerContent: (entry) => {
			contents.push(entry);
			setEntriesVersion((version) => version + 1);
			return entry;
		},
		bindTrigger: (entry, element) => {
			entry.element = element;
			entry.disposeCollection?.();
			entry.disposeCollection = collection.register({ element, disabled: entry.disabled, textValue: () => element.textContent ?? '' });
			setEntriesVersion((version) => version + 1);
		},
		unregisterTrigger: (entry) => {
			entry.disposeCollection?.();
			const index = triggers.indexOf(entry);
			if (index !== -1) triggers.splice(index, 1);
			if (tabStop() === entry) setTabStop(undefined);
			setEntriesVersion((version) => version + 1);
		},
		unregisterContent: (entry) => {
			const index = contents.indexOf(entry);
			if (index !== -1) contents.splice(index, 1);
			setEntriesVersion((version) => version + 1);
		},
		registerViewport: (entry) => {
			viewports.push(entry);
			setViewportVersion((version) => version + 1);
			return entry;
		},
		unregisterViewport: (entry) => {
			const index = viewports.indexOf(entry);
			if (index !== -1) viewports.splice(index, 1);
			setViewportVersion((version) => version + 1);
		},
		activeViewport: () => {
			viewportVersion();
			return viewports[0];
		},
		isTabStop: (entry) => {
			entriesVersion();
			const enabled = triggers.filter((candidate) => !candidate.disabled());
			const current = tabStop();
			return entry === (current && enabled.includes(current) ? current : (enabled.find((candidate) => candidate.value() === value()) ?? enabled[0]));
		},
		setTabStop: (entry) => {
			if (!entry.disabled()) setTabStop(entry);
		},
		moveFocus: (current, event) => {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			let target;
			if (event.key === 'ArrowRight') target = collection.move(current, 'next');
			else if (event.key === 'ArrowLeft') target = collection.move(current, 'previous');
			else if (event.key === 'Home') target = collection.move(current, 'first');
			else if (event.key === 'End') target = collection.move(current, 'last');
			else target = collection.typeahead(event.key, current);
			if (!target) return;
			event.preventDefault();
			target.element.focus();
		},
		activeContent: () => {
			entriesVersion();
			return contents.find((entry) => entry.value() === value());
		},
	};

	createEffect(() => {
		if (value() === undefined || !root()) return;
		const layer = registerDismissableLayer({
			element: root,
			onDismiss: () => setValue(undefined),
			onEscapeKeyDown: () => {
				const trigger = context.activeTrigger();
				queueMicrotask(() => trigger?.focus());
			},
		});
		layer.update();
		onCleanup(() => layer.destroy());
	});

	onCleanup(() => collection.destroy());

	return (
		<NavigationMenuContext.Provider value={context}>
			<nav
				{...rest}
				ref={(element) => {
					setRoot(element);
					local.ref?.(element);
				}}
				data-slot="navigation-menu"
				data-navigation-menu-owner={ownerId}
				data-viewport={context.viewport()}
				class={`${styles[navigationMenuStyleKeys.root]} ${local.class ?? ''}`}>
				<NavigationMenuChildren ownerId={ownerId} viewport={context.viewport}>
					{local.children}
				</NavigationMenuChildren>
			</nav>
		</NavigationMenuContext.Provider>
	);
}

export interface NavigationMenuListProps extends Omit<JSX.HTMLAttributes<HTMLUListElement>, 'ref'> {
	ref?: CallbackRef<HTMLUListElement>;
}

export function NavigationMenuList(props: ParentProps<NavigationMenuListProps>) {
	const menu = useNavigationMenu();
	const [local, rest] = splitProps(props, ['class', 'children', 'onKeyDown', 'ref']);
	return (
		<ul
			{...rest}
			ref={local.ref}
			data-slot="navigation-menu-list"
			data-navigation-menu-owner={menu.ownerId}
			class={`${styles[navigationMenuStyleKeys.list]} ${local.class ?? ''}`}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (
					!event.defaultPrevented &&
					isButtonElement(event.target) &&
					event.target.dataset.navigationMenuOwner === menu.ownerId &&
					event.target.dataset.slot === 'navigation-menu-trigger'
				)
					menu.moveFocus(event.target, event);
			}}>
			{local.children}
		</ul>
	);
}

export interface NavigationMenuItemProps extends Omit<JSX.LiHTMLAttributes<HTMLLIElement>, 'ref' | 'value'>, NavigationMenuItemBaseProps {
	disabled?: boolean;
	ref?: CallbackRef<HTMLLIElement>;
}

export function NavigationMenuItem(props: ParentProps<NavigationMenuItemProps>) {
	const menu = useNavigationMenu();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class', 'children', 'ref']);
	const baseId = `${menu.ownerId}-item-${createUniqueId()}`;
	const [triggerId, setTriggerId] = createSignal(`${baseId}-trigger`);
	const [contentId, setContentId] = createSignal(`${baseId}-content`);
	const disabled = () => local.disabled ?? false;
	const open = () => menu.value() === local.value;
	const context: NavigationMenuItemContextValue = { value: () => local.value, disabled, open, triggerId, contentId, setTriggerId, setContentId };
	return (
		<NavigationMenuItemContext.Provider value={context}>
			<li
				{...rest}
				ref={local.ref}
				data-slot="navigation-menu-item"
				data-navigation-menu-owner={menu.ownerId}
				data-state={getNavigationMenuState(open())}
				data-disabled={disabled() || undefined}
				class={`${styles[navigationMenuStyleKeys.item]} ${local.class ?? ''}`}>
				{local.children}
			</li>
		</NavigationMenuItemContext.Provider>
	);
}

export interface NavigationMenuTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function NavigationMenuTrigger(props: ParentProps<NavigationMenuTriggerProps>) {
	const menu = useNavigationMenu();
	const item = useNavigationMenuItem();
	const [local, rest] = splitProps(props, ['id', 'disabled', 'class', 'children', 'onClick', 'onFocus', 'onMouseEnter', 'ref', 'type']);
	const id = () => local.id ?? menu.defaultTriggerId(item.value());
	const disabled = () => item.disabled() || (local.disabled ?? false);
	createRenderEffect(() => item.setTriggerId(id()));
	const entry = menu.registerTrigger(item.value, id, disabled);

	onCleanup(() => menu.unregisterTrigger(entry));

	return (
		<button
			{...rest}
			ref={(element) => {
				menu.bindTrigger(entry, element);
				local.ref?.(element);
			}}
			id={id()}
			type={local.type ?? 'button'}
			aria-haspopup="true"
			aria-expanded={item.open()}
			aria-controls={item.contentId()}
			data-slot="navigation-menu-trigger"
			data-navigation-menu-owner={menu.ownerId}
			data-value={item.value()}
			data-state={getNavigationMenuState(item.open())}
			data-disabled={disabled() || undefined}
			disabled={disabled()}
			tabIndex={menu.isTabStop(entry) ? 0 : -1}
			class={`${styles[navigationMenuStyleKeys.trigger]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !disabled()) menu.setValue(item.open() ? undefined : item.value());
			}}
			onFocus={(event) => {
				invokeEventHandler(local.onFocus, event);
				if (!event.defaultPrevented) menu.setTabStop(entry);
			}}
			onMouseEnter={(event) => {
				invokeEventHandler(local.onMouseEnter, event);
				if (!event.defaultPrevented && !disabled()) menu.setValue(item.value());
			}}>
			{local.children}
			<Chevron open={item.open()} />
		</button>
	);
}

export interface NavigationMenuContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export function NavigationMenuContent(props: ParentProps<NavigationMenuContentProps>) {
	const menu = useNavigationMenu();
	const item = useNavigationMenuItem();
	const [local, rest] = splitProps(props, ['id', 'class', 'children', 'ref']);
	const id = () => local.id ?? menu.defaultContentId(item.value());
	createRenderEffect(() => item.setContentId(id()));
	const render = () => (
		<div
			{...rest}
			ref={local.ref}
			id={id()}
			role="region"
			aria-labelledby={item.triggerId()}
			data-slot="navigation-menu-content"
			data-navigation-menu-owner={menu.ownerId}
			data-value={item.value()}
			data-state={getNavigationMenuState(item.open())}
			data-viewport={menu.viewport()}
			class={`${styles[navigationMenuStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
	const entry = menu.registerContent({ value: item.value, id, render });

	onCleanup(() => menu.unregisterContent(entry));

	return (
		<Show when={!menu.viewport() && item.open()}>
			<NavigationMenuContentRenderer render={render} />
		</Show>
	);
}

export interface NavigationMenuViewportProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

function NavigationMenuViewportElement(props: ParentProps<NavigationMenuViewportProps> = {}) {
	const menu = useNavigationMenu();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div
			{...rest}
			ref={local.ref}
			data-slot="navigation-menu-viewport"
			data-navigation-menu-owner={menu.ownerId}
			data-state={getNavigationMenuState(menu.value() !== undefined)}
			class={`${styles[navigationMenuStyleKeys.viewport]} ${local.class ?? ''}`}>
			<div class={styles[navigationMenuStyleKeys.viewportInner]}>
				<Show when={menu.activeContent()} keyed>
					{(entry) => entry.render()}
				</Show>
				{local.children}
			</div>
		</div>
	);
}

/** 声明根节点使用的显式视口；实际节点在所有菜单项注册后由根节点统一渲染。 */
export function NavigationMenuViewport(props: ParentProps<NavigationMenuViewportProps>) {
	const menu = useNavigationMenu();
	const entry = menu.registerViewport({ render: () => <NavigationMenuViewportElement {...props} /> });
	onCleanup(() => menu.unregisterViewport(entry));
	return null;
}

export interface NavigationMenuIndicatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}

export function NavigationMenuIndicator(props: NavigationMenuIndicatorProps) {
	const menu = useNavigationMenu();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'style']);
	let indicator: HTMLDivElement | undefined;
	let position: ReturnType<typeof createAnchoredPosition> | undefined;
	let previousTrigger: HTMLButtonElement | undefined;

	onMount(() => {
		position = createAnchoredPosition({
			anchor: menu.activeTrigger,
			content: () => indicator,
			container: menu.root,
			open: () => menu.value() !== undefined,
			onPosition: ({ anchorRect, containerRect }) => menu.setIndicatorRect({ left: anchorRect.left - containerRect.left, width: anchorRect.width }),
		});
		position.recompute();
		onCleanup(() => position?.destroy());
	});

	createEffect(() => {
		menu.entriesVersion();
		menu.value();
		const trigger = menu.activeTrigger();
		if (trigger !== previousTrigger) {
			previousTrigger = trigger;
			menu.setIndicatorRect(undefined);
		}
		if (!trigger) return;
		queueMicrotask(() => position?.recompute());
	});

	const geometry = () => menu.indicatorRect();
	const style = () => {
		const rect = geometry();
		const measured = rect ? `left:${rect.left}px;width:${rect.width}px;` : '';
		if (typeof local.style === 'string') return `${local.style};${measured}`;
		return { ...(local.style as JSX.CSSProperties | undefined), ...(rect ? { left: `${rect.left}px`, width: `${rect.width}px` } : {}) };
	};

	return (
		<div
			{...rest}
			ref={(element) => {
				indicator = element;
				local.ref?.(element);
			}}
			data-slot="navigation-menu-indicator"
			data-navigation-menu-owner={menu.ownerId}
			data-state={menu.value() !== undefined && geometry() ? 'visible' : 'hidden'}
			class={`${styles[navigationMenuStyleKeys.indicator]} ${local.class ?? ''}`}
			style={style()}>
			{local.children ?? <div class={styles[navigationMenuStyleKeys.indicatorArrow]} />}
		</div>
	);
}

export interface NavigationMenuLinkProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'ref'> {
	active?: boolean;
	ref?: CallbackRef<HTMLAnchorElement>;
}

export function NavigationMenuLink(props: ParentProps<NavigationMenuLinkProps>) {
	const [local, rest] = splitProps(props, ['active', 'class', 'children', 'ref']);
	return (
		<a
			{...rest}
			ref={local.ref}
			data-slot="navigation-menu-link"
			data-active={local.active ? 'true' : undefined}
			aria-current={local.active ? 'page' : undefined}
			class={`${styles[navigationMenuStyleKeys.link]} ${local.class ?? ''}`}>
			{local.children}
		</a>
	);
}

export default NavigationMenu;
