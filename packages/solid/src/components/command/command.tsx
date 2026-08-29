import {
	For,
	Show,
	children,
	createContext,
	createEffect,
	createSignal,
	createUniqueId,
	onCleanup,
	onMount,
	splitProps,
	useContext,
	type Accessor,
	type JSX,
	type ParentProps,
} from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import { commandStyleKeys, matchCommandItem, moveCommandIndex } from '@tile-ui/core';
import type { CommandBaseProps, CommandFilterFn, CommandItemDef } from '@tile-ui/core';
import {
	activateModalFocusScope,
	createPortalScope,
	invokeEventHandler,
	PortalScopeContext,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
} from '../../utils';
import styles from '@tile-ui/styles/scss/components/command.module.scss';

interface CommandEntry {
	element?: HTMLDivElement;
	value: Accessor<string>;
	id: Accessor<string>;
	groupId: Accessor<string | undefined>;
	disabled: Accessor<boolean>;
	visible: Accessor<boolean>;
}

interface CommandContextValue {
	search: Accessor<string>;
	setSearch: (value: string) => void;
	filter: Accessor<CommandFilterFn | undefined>;
	loop: Accessor<boolean>;
	ownerId: string;
	listId: Accessor<string>;
	selected: Accessor<string | undefined>;
	setSelected: (value: string | undefined) => void;
	register: (entry: CommandEntry) => () => void;
	entries: () => CommandEntry[];
	visibleCount: Accessor<number>;
}

interface CommandGroupContextValue {
	id: string;
}

const CommandGroupContext = createContext<CommandGroupContextValue>();

function jsxText(node: unknown): string {
	if (typeof node === 'string' || typeof node === 'number') return String(node);
	if (Array.isArray(node)) return node.map(jsxText).join('');
	if (typeof node === 'function') return jsxText((node as () => unknown)());
	return '';
}

function normalizeServerCommandStructure(content: JSX.Element, ownerId: string): null {
	if (!isServer) return null;
	const nodes: Array<{ t: string }> = [];
	const visit = (node: unknown): void => {
		if (typeof node === 'function') visit((node as () => unknown)());
		else if (Array.isArray(node)) node.forEach(visit);
		else if (typeof node === 'object' && node !== null && 't' in node && typeof (node as { t?: unknown }).t === 'string') nodes.push(node as { t: string });
	};
	visit(content);
	const escapedOwner = ownerId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const itemPattern = new RegExp(`<div\\b(?=[^>]*data-command-owner="${escapedOwner}")(?=[^>]*data-slot="command-item")(?![^>]* hidden)[^>]*>`);
	if (!nodes.some((node) => itemPattern.test(node.t))) return null;
	const emptyPattern = new RegExp(`<div\\b(?=[^>]*data-command-owner="${escapedOwner}")(?=[^>]*data-slot="command-empty")[^>]*>[\\s\\S]*?</div>`, 'g');
	for (const node of nodes) node.t = node.t.replace(emptyPattern, '');
	return null;
}

function CommandChildren(props: { children: JSX.Element; ownerId: string }) {
	const content = children(() => props.children);
	normalizeServerCommandStructure(content(), props.ownerId);
	return content();
}

const CommandContext = createContext<CommandContextValue>();

function useCommand() {
	const context = useContext(CommandContext);
	if (!context) throw new Error('Command sub-components must be used within <Command>.');
	return context;
}

function SearchIcon() {
	return (
		<svg class={styles[commandStyleKeys.inputIcon]} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	);
}

export interface CommandProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, CommandBaseProps {
	/** Root-owned list ID; declare custom IDs here so SSR Input ARIA is exact. */
	listId?: string;
	search?: string;
	defaultSearch?: string;
	onSearchChange?: (search: string) => void;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Command：可组合命令集合，支持过滤、分组、空态与循环键盘导航。 */
export function Command(props: ParentProps<CommandProps>) {
	const [local, rest] = splitProps(props, ['items', 'groups', 'filter', 'loop', 'listId', 'search', 'defaultSearch', 'onSearchChange', 'class', 'children', 'ref']);
	const [internalSearch, setInternalSearch] = createSignal(local.defaultSearch ?? '');
	const [selected, setSelected] = createSignal<string>();
	const [version, setVersion] = createSignal(0);
	const entriesSet = new Set<CommandEntry>();
	const ownerId = `tile-solid-command-${createUniqueId()}`;
	const defaultListId = `${ownerId}-list`;
	const listId = () => local.listId ?? defaultListId;
	const search = () => (local.search !== undefined ? local.search : internalSearch());
	let previousSearch = search();
	createEffect(() => {
		const next = search();
		if (next !== previousSearch) {
			previousSearch = next;
			setSelected(undefined);
		}
	});
	const setSearch = (next: string) => {
		if (local.search === undefined) setInternalSearch(next);
		local.onSearchChange?.(next);
		setSelected(undefined);
	};
	const entries = () => {
		version();
		return [...entriesSet].sort((left, right) => {
			if (!left.element || !right.element) return 0;
			return left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
		});
	};
	const context: CommandContextValue = {
		search,
		setSearch,
		filter: () => local.filter,
		loop: () => local.loop ?? true,
		ownerId,
		listId,
		selected,
		setSelected,
		entries,
		visibleCount: () => entries().filter((entry) => entry.visible()).length,
		register: (entry) => {
			entriesSet.add(entry);
			setVersion((current) => current + 1);
			return () => {
				entriesSet.delete(entry);
				setVersion((current) => current + 1);
			};
		},
	};
	const renderItems = (items: CommandItemDef[]) => (
		<For each={items}>
			{(item) => (
				<CommandItem value={item.value} textValue={item.label ?? item.value} keywords={item.keywords} disabled={item.disabled}>
					{item.label ?? item.value}
					<Show when={item.shortcut}>
						<CommandShortcut>{item.shortcut}</CommandShortcut>
					</Show>
				</CommandItem>
			)}
		</For>
	);
	const content = () =>
		local.groups?.length ? (
			<For each={local.groups}>{(group) => <CommandGroup heading={group.label}>{renderItems(group.items)}</CommandGroup>}</For>
		) : local.items?.length ? (
			renderItems(local.items)
		) : (
			local.children
		);
	return (
		<CommandContext.Provider value={context}>
			<div {...rest} ref={local.ref} data-slot="command" class={`${styles[commandStyleKeys.root]} ${local.class ?? ''}`}>
				<CommandChildren ownerId={ownerId}>{content()}</CommandChildren>
			</div>
		</CommandContext.Provider>
	);
}

function navigateCommand(context: CommandContextValue, event: KeyboardEvent) {
	const entries = context.entries().filter((entry): entry is CommandEntry & { element: HTMLDivElement } => !!entry.element?.isConnected && entry.visible() && !entry.disabled());
	if (entries.length === 0) return;
	const current = entries.findIndex((entry) => entry.value() === context.selected());
	let next = -1;
	if (event.key === 'ArrowDown') next = moveCommandIndex(current, 1, entries.length, context.loop());
	else if (event.key === 'ArrowUp') next = moveCommandIndex(current, -1, entries.length, context.loop());
	else if (event.key === 'Home') next = 0;
	else if (event.key === 'End') next = entries.length - 1;
	else if (event.key === 'Enter') {
		event.preventDefault();
		entries[current >= 0 ? current : 0].element.click();
		return;
	} else return;
	event.preventDefault();
	const target = entries[next];
	context.setSelected(target.value());
	target.element.scrollIntoView?.({ block: 'nearest' });
}

export interface CommandInputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'ref'> {
	ref?: CallbackRef<HTMLInputElement>;
}
export function CommandInput(props: CommandInputProps) {
	const context = useCommand();
	const [local, rest] = splitProps(props, ['class', 'value', 'onInput', 'onKeyDown', 'ref']);
	return (
		<div class={styles[commandStyleKeys.inputWrapper]}>
			<SearchIcon />
			<input
				{...rest}
				ref={local.ref}
				role="combobox"
				aria-autocomplete="list"
				aria-expanded="true"
				aria-controls={context.listId()}
				aria-activedescendant={context
					.entries()
					.find((entry) => entry.value() === context.selected())
					?.id()}
				value={local.value ?? context.search()}
				class={`${styles[commandStyleKeys.input]} ${local.class ?? ''}`}
				onInput={(event) => {
					invokeEventHandler(local.onInput, event);
					if (!event.defaultPrevented) context.setSearch(event.currentTarget.value);
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (!event.defaultPrevented) navigateCommand(context, event);
				}}
			/>
		</div>
	);
}

export interface CommandListProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id' | 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function CommandList(props: ParentProps<CommandListProps>) {
	const context = useCommand();
	const [local, rest] = splitProps(props, ['class', 'children', 'onKeyDown', 'ref']);
	return (
		<div
			{...rest}
			ref={local.ref}
			id={context.listId()}
			role="listbox"
			tabIndex={-1}
			data-slot="command-list"
			class={`${styles[commandStyleKeys.list]} ${local.class ?? ''}`}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (!event.defaultPrevented) navigateCommand(context, event);
			}}>
			{local.children}
		</div>
	);
}

export interface CommandEmptyProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function CommandEmpty(props: ParentProps<CommandEmptyProps>) {
	const context = useCommand();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<Show when={context.visibleCount() === 0}>
			<div {...rest} ref={local.ref} data-command-owner={context.ownerId} data-slot="command-empty" class={`${styles[commandStyleKeys.empty]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</Show>
	);
}

export interface CommandGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	heading?: string;
	headingId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}
export function CommandGroup(props: ParentProps<CommandGroupProps>) {
	const context = useCommand();
	const [local, rest] = splitProps(props, ['heading', 'headingId', 'class', 'children', 'ref', 'id']);
	const groupId = local.id ?? `${context.ownerId}-group-${createUniqueId()}`;
	const headingId = () => local.headingId ?? `${groupId}-heading`;
	const visible = () => context.entries().some((entry) => entry.groupId() === groupId && entry.visible());
	return (
		<CommandGroupContext.Provider value={{ id: groupId }}>
			<div
				{...rest}
				ref={local.ref}
				id={groupId}
				role="group"
				aria-labelledby={local.heading ? headingId() : undefined}
				hidden={!visible()}
				data-command-owner={context.ownerId}
				data-slot="command-group"
				class={`${styles[commandStyleKeys.group]} ${local.class ?? ''}`}>
				<Show when={local.heading}>
					<div id={headingId()} class={styles[commandStyleKeys.groupLabel]}>
						{local.heading}
					</div>
				</Show>
				<div class={styles[commandStyleKeys.groupContent]}>{local.children}</div>
			</div>
		</CommandGroupContext.Provider>
	);
}

export interface CommandItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref' | 'onSelect'> {
	value: string;
	textValue?: string;
	keywords?: string[];
	disabled?: boolean;
	onSelect?: (value: string) => void;
	ref?: CallbackRef<HTMLDivElement>;
}

export function CommandItem(props: ParentProps<CommandItemProps>) {
	const context = useCommand();
	const group = useContext(CommandGroupContext);
	const [local, rest] = splitProps(props, ['value', 'textValue', 'keywords', 'disabled', 'onSelect', 'class', 'children', 'onClick', 'onPointerMove', 'ref', 'id']);
	const resolvedChildren = children(() => local.children);
	const textValue = () => local.textValue ?? jsxText(resolvedChildren()).trim();
	const itemId = () => local.id ?? `${context.listId()}-item-${encodeURIComponent(local.value)}`;
	const visible = () =>
		context.filter()?.(local.value, context.search(), local.keywords) ??
		matchCommandItem({ value: local.value, label: textValue(), keywords: local.keywords }, context.search());
	const selected = () => context.selected() === local.value;
	let element: HTMLDivElement | undefined;
	const entry: CommandEntry = { element, value: () => local.value, id: itemId, groupId: () => group?.id, disabled: () => local.disabled ?? false, visible };
	const unregister = context.register(entry);
	onCleanup(unregister);
	onMount(() => {
		entry.element = element;
	});
	return (
		<div
			{...rest}
			ref={(node) => {
				element = node;
				entry.element = node;
				local.ref?.(node);
			}}
			id={itemId()}
			role="option"
			tabIndex={-1}
			hidden={!visible()}
			aria-selected={selected()}
			aria-disabled={local.disabled || undefined}
			data-slot="command-item"
			data-command-owner={context.ownerId}
			data-selected={selected() || undefined}
			data-disabled={local.disabled || undefined}
			class={`${styles[commandStyleKeys.item]} ${local.class ?? ''}`}
			onPointerMove={(event) => {
				invokeEventHandler(local.onPointerMove, event);
				if (!event.defaultPrevented && !local.disabled) context.setSelected(local.value);
			}}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !local.disabled) local.onSelect?.(local.value);
			}}>
			{resolvedChildren()}
		</div>
	);
}

export interface CommandSeparatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function CommandSeparator(props: CommandSeparatorProps) {
	const context = useCommand();
	const group = useContext(CommandGroupContext);
	const [local, rest] = splitProps(props, ['class', 'ref']);
	const visible = () => context.entries().some((entry) => (!group || entry.groupId() === group.id) && entry.visible());
	return (
		<div
			{...rest}
			ref={local.ref}
			hidden={!visible()}
			data-command-owner={context.ownerId}
			data-slot="command-separator"
			class={`${styles[commandStyleKeys.separator]} ${local.class ?? ''}`}
		/>
	);
}

export interface CommandShortcutProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
	ref?: CallbackRef<HTMLSpanElement>;
}
export function CommandShortcut(props: ParentProps<CommandShortcutProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<span {...rest} ref={local.ref} data-slot="command-shortcut" class={`${styles[commandStyleKeys.shortcut]} ${local.class ?? ''}`}>
			{local.children}
		</span>
	);
}

export interface CommandDialogProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref' | 'title'> {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: string;
	showCloseButton?: boolean;
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
}

/** CommandDialog 复用 frozen modal focus 与 dismissable-layer 基础能力。 */
export function CommandDialog(props: ParentProps<CommandDialogProps>) {
	const [local, rest] = splitProps(props, [
		'open',
		'onOpenChange',
		'title',
		'description',
		'showCloseButton',
		'container',
		'class',
		'children',
		'ref',
		'aria-label',
		'aria-labelledby',
		'aria-describedby',
		'id',
	]);
	const parentScope = usePortalScope();
	const inheritedMount = () => resolvePortalContainer(parentScope, local.container);
	const mount = () => inheritedMount() ?? (typeof document === 'undefined' ? undefined : document.body);
	const scope = createPortalScope(mount, parentScope);
	const baseId = `tile-solid-command-dialog-${createUniqueId()}`;
	const contentId = () => local.id ?? `${baseId}-content`;
	const [content, setContent] = createSignal<HTMLDivElement>();
	let closeButton: HTMLButtonElement | undefined;
	let layer: ReturnType<typeof registerDismissableLayer> | undefined;
	let focusScope: ReturnType<typeof activateModalFocusScope> | undefined;
	const close = () => local.onOpenChange?.(false);
	const bindContent = (element: HTMLDivElement) => {
		setContent(element);
		local.ref?.(element);
	};
	createEffect(() => {
		if (!local.open || !content()) return;
		layer = registerDismissableLayer({ element: content, portalScope: scope, modal: true, onDismiss: close });
		focusScope = activateModalFocusScope({
			container: content,
			portalScope: scope,
			initialFocus: () => content()?.querySelector<HTMLInputElement>('input') ?? closeButton,
			trapFocus: true,
			lockScroll: true,
		});
		layer.update();
		focusScope.update();
		onCleanup(() => {
			layer?.destroy();
			focusScope?.destroy();
			layer = undefined;
			focusScope = undefined;
		});
	});
	const body = (
		<PortalScopeContext.Provider value={scope}>
			<div data-slot="command-dialog-overlay" class={styles[commandStyleKeys.dialogOverlay]} />
			<div
				{...rest}
				ref={bindContent}
				id={contentId()}
				role="dialog"
				aria-modal="true"
				aria-label={local['aria-label']}
				aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : `${baseId}-title`)}
				aria-describedby={local['aria-describedby'] ?? `${baseId}-description`}
				tabIndex={-1}
				data-slot="command-dialog-content"
				class={`${styles[commandStyleKeys.dialogContent]} ${local.class ?? ''}`}>
				<h2 id={`${baseId}-title`} class={styles[commandStyleKeys.dialogTitle]}>
					{local.title ?? 'Command Palette'}
				</h2>
				<p id={`${baseId}-description`} class={styles[commandStyleKeys.dialogDescription]}>
					{local.description ?? 'Search for a command to run...'}
				</p>
				{local.children}
				<Show when={local.showCloseButton !== false}>
					<button ref={(element) => (closeButton = element)} type="button" aria-label="Close" class={styles[commandStyleKeys.dialogClose]} onClick={close}>
						×
					</button>
				</Show>
			</div>
		</PortalScopeContext.Provider>
	);
	return <Show when={local.open}>{isServer ? body : <Portal mount={mount()}>{body}</Portal>}</Show>;
}

export default Command;
