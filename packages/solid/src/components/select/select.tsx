import {
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
import { getSelectCheckState, getSelectPosition, getSelectState, selectStyleKeys } from '@tile-ui/core';
import type { SelectBaseProps, SelectContentBaseProps, SelectItemBaseProps, SelectTriggerBaseProps } from '@tile-ui/core';
import {
	createAnchoredPosition,
	createCollectionRegistry,
	createControllableSignal,
	createPortalScope,
	invokeEventHandler,
	isNodeValue,
	registerDismissableLayer,
	resolvePortalContainer,
	PortalScopeContext,
	usePortalScope,
	type CallbackRef,
} from '../../utils';
import { getLogicalTabTarget } from './logical-tab';
import styles from '@tile-ui/styles/scss/components/select.module.scss';

interface SelectEntry {
	element?: HTMLDivElement;
	value: Accessor<string>;
	disabled: Accessor<boolean>;
	text: Accessor<string>;
}

interface SelectContextValue {
	ownerId: string;
	open: Accessor<boolean>;
	value: Accessor<string | undefined>;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	trigger: () => HTMLButtonElement | undefined;
	setTrigger: (element: HTMLButtonElement) => void;
	openIntent: Accessor<'first' | 'selected-or-first' | 'selected-or-last'>;
	setOpen: (open: boolean, restore?: boolean, intent?: 'first' | 'selected-or-first' | 'selected-or-last') => void;
	select: (value: string) => void;
	selectedText: Accessor<string | undefined>;
	register: (entry: SelectEntry) => () => void;
	collection: ReturnType<typeof createCollectionRegistry<HTMLDivElement>>;
}

function SelectChildren(props: { children: JSX.Element }) {
	const content = children(() => props.children);
	return content();
}

const SelectContext = createContext<SelectContextValue>();

interface SelectGroupContextValue {
	labelId: Accessor<string>;
	labelled: Accessor<boolean>;
	registerLabel: (id: string) => () => void;
}

const SelectGroupContext = createContext<SelectGroupContextValue>();

function useSelect() {
	const context = useContext(SelectContext);
	if (!context) throw new Error('Select sub-components must be used within <Select>.');
	return context;
}

function CheckIcon() {
	return (
		<svg class={styles[selectStyleKeys.checkIcon]} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function ChevronIcon(props: { up?: boolean }) {
	return (
		<svg class={styles[selectStyleKeys.chevron]} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d={props.up ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
		</svg>
	);
}

export interface SelectProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'ref'>, SelectBaseProps {
	triggerId?: string;
	/** 自定义列表 ID；Trigger 与 Content 的 ARIA 关联统一由 Root 声明。 */
	contentId?: string;
	/** SSR 时声明当前值的展示文本；客户端挂载后仍会从对应 SelectItem 自动同步。 */
	selectedText?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Select：复合式单选列表，支持受控状态、typeahead 与锚定 Portal。 */
export function Select(props: ParentProps<SelectProps>) {
	const [local, rest] = splitProps(props, [
		'open',
		'defaultOpen',
		'onOpenChange',
		'value',
		'defaultValue',
		'onValueChange',
		'triggerId',
		'contentId',
		'selectedText',
		'class',
		'children',
		'ref',
	]);
	const [open, setOpenValue] = createControllableSignal({
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next),
	});
	const [value, setValue] = createControllableSignal<string | undefined>({
		value: () => local.value,
		defaultValue: () => local.defaultValue,
		onChange: (next) => {
			if (next !== undefined) local.onValueChange?.(next);
		},
	});
	const baseId = `tile-solid-select-${createUniqueId()}`;
	const triggerId = () => local.triggerId ?? `${baseId}-trigger`;
	const contentId = () => local.contentId ?? `${baseId}-content`;
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [openIntent, setOpenIntent] = createSignal<'first' | 'selected-or-first' | 'selected-or-last'>('selected-or-first');
	const [restoreOnClose, setRestoreOnClose] = createSignal(false);
	const [version, setVersion] = createSignal(0);
	const entries = new Set<SelectEntry>();
	const collection = createCollectionRegistry<HTMLDivElement>();
	const selectedText = () => {
		version();
		return local.selectedText ?? [...entries].find((entry) => entry.value() === value())?.text();
	};
	const context: SelectContextValue = {
		ownerId: baseId,
		open,
		value,
		triggerId,
		contentId,
		trigger,
		setTrigger,
		openIntent,
		setOpen: (next, restore = false, intent = 'selected-or-first') => {
			if (next) setOpenIntent(intent);
			if (!next && restore) setRestoreOnClose(true);
			setOpenValue(next);
			if (!next) collection.resetTypeahead();
		},
		select: (next) => {
			setValue(next);
			setRestoreOnClose(true);
			setOpenValue(false);
			collection.resetTypeahead();
		},
		selectedText,
		collection,
		register: (entry) => {
			entries.add(entry);
			setVersion((current) => current + 1);
			const unregister = entry.element ? collection.register({ element: entry.element, disabled: entry.disabled, textValue: entry.text }) : () => undefined;
			return () => {
				entries.delete(entry);
				unregister();
				setVersion((current) => current + 1);
			};
		},
	};
	createEffect(() => {
		if (!open() && restoreOnClose()) {
			setRestoreOnClose(false);
			trigger()?.focus();
		}
	});
	onCleanup(() => collection.destroy());

	return (
		<SelectContext.Provider value={context}>
			<div {...rest} ref={local.ref} data-slot="select" data-state={getSelectState(open())} class={`${styles[selectStyleKeys.root]} ${local.class ?? ''}`}>
				<SelectChildren>{local.children}</SelectChildren>
			</div>
		</SelectContext.Provider>
	);
}

export interface SelectTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'>, SelectTriggerBaseProps {
	ref?: CallbackRef<HTMLButtonElement>;
}

export function SelectTrigger(props: ParentProps<SelectTriggerProps>) {
	const context = useSelect();
	const [local, rest] = splitProps(props, ['class', 'children', 'size', 'onClick', 'onKeyDown', 'ref', 'type', 'id']);
	return (
		<button
			{...rest}
			ref={(element) => {
				context.setTrigger(element);
				local.ref?.(element);
			}}
			id={local.id ?? context.triggerId()}
			type={local.type ?? 'button'}
			role="combobox"
			aria-haspopup="listbox"
			aria-expanded={context.open()}
			aria-controls={context.contentId()}
			data-slot="select-trigger"
			data-state={getSelectState(context.open())}
			data-size={local.size ?? 'default'}
			class={`${styles[selectStyleKeys.trigger]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.setOpen(!context.open());
			}}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (event.defaultPrevented) return;
				if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
					event.preventDefault();
					context.setOpen(true, false, event.key === 'ArrowDown' ? 'first' : event.key === 'ArrowUp' ? 'selected-or-last' : 'selected-or-first');
				}
			}}>
			{local.children}
			<ChevronIcon />
		</button>
	);
}

export interface SelectValueProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> {
	placeholder?: string;
	ref?: CallbackRef<HTMLSpanElement>;
}

export function SelectValue(props: ParentProps<SelectValueProps>) {
	const context = useSelect();
	const [local, rest] = splitProps(props, ['placeholder', 'class', 'children', 'ref']);
	const text = () => context.selectedText();
	const content = () => text() ?? local.placeholder ?? local.children;
	return (
		<span
			{...rest}
			ref={local.ref}
			data-select-owner={context.ownerId}
			data-slot="select-value"
			data-placeholder={!text() || undefined}
			class={`${styles[selectStyleKeys.value]} ${local.class ?? ''}`}>
			{content as unknown as JSX.Element}
		</span>
	);
}

export interface SelectContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id' | 'ref'>, SelectContentBaseProps {
	container?: Node;
	ref?: CallbackRef<HTMLDivElement>;
}

export function SelectContent(props: ParentProps<SelectContentProps>) {
	const context = useSelect();
	const parentScope = usePortalScope();
	const [local, rest] = splitProps(props, ['position', 'align', 'sideOffset', 'container', 'class', 'children', 'onKeyDown', 'ref']);
	let content: HTMLDivElement | undefined;
	const mount = () => resolvePortalContainer(parentScope, local.container);
	const scope = createPortalScope(mount, parentScope);
	const positioner = createAnchoredPosition({
		anchor: context.trigger,
		content: () => content,
		container: () => {
			const container = mount();
			const ElementConstructor = isNodeValue(container) ? container.ownerDocument?.defaultView?.Element : undefined;
			return ElementConstructor && container instanceof ElementConstructor ? container : undefined;
		},
		open: context.open,
		onPosition: ({ anchorRect, contentRect, containerRect, direction }) => {
			if (!content) return;
			const next = getSelectPosition({
				triggerRect: anchorRect,
				contentSize: { width: contentRect.width, height: contentRect.height },
				viewport: { width: containerRect.width, height: containerRect.height },
				align: local.align ?? 'center',
				sideOffset: local.sideOffset ?? 4,
				rtl: direction === 'rtl',
			});
			content.style.left = `${next.left + containerRect.left}px`;
			content.style.top = `${next.top + containerRect.top}px`;
		},
	});

	function highlighted() {
		return context.collection.enabledItems().find((entry) => entry.element.dataset.highlighted === 'true')?.element ?? null;
	}

	function highlight(element: HTMLDivElement | undefined, focus = true) {
		for (const entry of context.collection.items()) entry.element.removeAttribute('data-highlighted');
		if (!element) return;
		element.dataset.highlighted = 'true';
		if (focus) element.focus({ preventScroll: true });
		element.scrollIntoView?.({ block: 'nearest' });
	}

	createEffect(() => {
		if (!context.open()) return;
		context.value();
		queueMicrotask(() => {
			positioner.recompute();
			const enabled = context.collection.enabledItems();
			const selected = enabled.find((entry) => entry.element.getAttribute('aria-selected') === 'true');
			const target = context.openIntent() === 'first' ? enabled[0] : (selected ?? (context.openIntent() === 'selected-or-last' ? enabled.at(-1) : enabled[0]));
			highlight(target?.element);
		});
	});

	createEffect(() => {
		if (!context.open() || !content) return;
		const removeBranch = parentScope?.addBranch(content);
		let restore = true;
		const layer = registerDismissableLayer({
			element: () => content,
			branches: () => (context.trigger() ? [context.trigger()!] : []),
			portalScope: scope,
			onFocusOutside: () => {
				restore = false;
			},
			onDismiss: () => context.setOpen(false, restore),
		});
		queueMicrotask(layer.update);
		onCleanup(() => {
			removeBranch?.();
			layer.destroy();
		});
	});
	onCleanup(() => positioner.destroy());

	const body = (
		<PortalScopeContext.Provider value={scope}>
			<div
				{...rest}
				ref={(element) => {
					content = element;
					local.ref?.(element);
				}}
				id={context.contentId()}
				role="listbox"
				tabIndex={-1}
				hidden={!context.open()}
				data-slot="select-content"
				data-state={getSelectState(context.open())}
				data-position={local.position ?? 'item-aligned'}
				class={`${styles[selectStyleKeys.content]} ${local.class ?? ''}`}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (event.defaultPrevented) return;
					if (event.key === 'Tab') {
						if (event.ctrlKey || event.metaKey || event.altKey) return;
						event.preventDefault();
						context.setOpen(false);
						getLogicalTabTarget(context.trigger(), content, event.shiftKey)?.focus();
						return;
					}
					let target;
					if (event.key === 'ArrowDown') target = context.collection.move(highlighted(), 'next');
					else if (event.key === 'ArrowUp') target = context.collection.move(highlighted(), 'previous');
					else if (event.key === 'Home') target = context.collection.move(null, 'first');
					else if (event.key === 'End') target = context.collection.move(null, 'last');
					else if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						highlighted()?.click();
						return;
					} else if (event.key === 'Escape') {
						event.preventDefault();
						context.setOpen(false, true);
						return;
					} else if (!event.ctrlKey && !event.metaKey && !event.altKey) target = context.collection.typeahead(event.key, highlighted());
					if (target) {
						event.preventDefault();
						highlight(target.element);
					}
				}}>
				{local.children}
			</div>
		</PortalScopeContext.Provider>
	);

	if (isServer) return <Show when={context.open()}>{body}</Show>;
	return <Portal mount={mount()}>{body}</Portal>;
}

export interface SelectGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	labelId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}
export function SelectGroup(props: ParentProps<SelectGroupProps>) {
	const context = useSelect();
	const [local, rest] = splitProps(props, ['class', 'children', 'labelId', 'ref', 'id']);
	const defaultGroupId = `${context.contentId()}-group-${createUniqueId()}`;
	const groupId = () => local.id ?? defaultGroupId;
	const [registeredLabelId, setRegisteredLabelId] = createSignal(local.labelId);
	const labelId = () => registeredLabelId() ?? `${groupId()}-label`;
	const labelled = () => registeredLabelId() !== undefined;
	return (
		<SelectGroupContext.Provider
			value={{
				labelId,
				labelled,
				registerLabel: (id) => {
					setRegisteredLabelId(id);
					return () => setRegisteredLabelId(local.labelId);
				},
			}}>
			<div
				{...rest}
				ref={local.ref}
				id={groupId()}
				role="group"
				aria-labelledby={labelled() ? labelId() : undefined}
				data-slot="select-group"
				class={`${styles[selectStyleKeys.group]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</SelectGroupContext.Provider>
	);
}

export interface SelectLabelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SelectLabel(props: ParentProps<SelectLabelProps>) {
	const group = useContext(SelectGroupContext);
	if (!group) throw new Error('SelectLabel must be used within <SelectGroup>.');
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'id']);
	const id = local.id ?? group.labelId();
	const unregister = group.registerLabel(id);
	onCleanup(unregister);
	return (
		<div {...rest} ref={local.ref} id={id} data-slot="select-label" class={`${styles[selectStyleKeys.label]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface SelectItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, SelectItemBaseProps {
	textValue?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

export function SelectItem(props: ParentProps<SelectItemProps>) {
	const context = useSelect();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'textValue', 'class', 'children', 'onClick', 'onPointerMove', 'ref', 'id']);
	const resolvedChildren = children(() => local.children);
	const childText = () => {
		const value = resolvedChildren();
		if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
		if (Array.isArray(value))
			return value
				.filter((item) => typeof item === 'string' || typeof item === 'number')
				.join('')
				.trim();
		return '';
	};
	const itemId = () => local.id ?? `${context.contentId()}-option-${encodeURIComponent(local.value)}`;
	const selected = () => context.value() === local.value;
	let element!: HTMLDivElement;
	const entry: SelectEntry = {
		value: () => local.value,
		disabled: () => local.disabled ?? false,
		text: () => local.textValue ?? element?.textContent?.trim() ?? (childText() || local.value),
	};
	const unregisterMetadata = context.register(entry);
	onCleanup(unregisterMetadata);
	onMount(() => {
		entry.element = element;
		const unregister = context.collection.register({ element, disabled: entry.disabled, textValue: entry.text });
		onCleanup(unregister);
	});
	return (
		<div
			{...rest}
			ref={(node) => {
				element = node;
				local.ref?.(node);
			}}
			id={itemId()}
			role="option"
			tabIndex={-1}
			aria-selected={selected()}
			aria-disabled={local.disabled || undefined}
			data-slot="select-item"
			data-select-owner={context.ownerId}
			data-value={local.value}
			data-checked={getSelectCheckState(selected())}
			data-disabled={local.disabled || undefined}
			class={`${styles[selectStyleKeys.item]} ${local.class ?? ''}`}
			onPointerMove={(event) => {
				invokeEventHandler(local.onPointerMove, event);
				if (!event.defaultPrevented && !local.disabled) {
					for (const candidate of context.collection.items()) candidate.element.removeAttribute('data-highlighted');
					element.dataset.highlighted = 'true';
				}
			}}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !local.disabled) context.select(local.value);
			}}>
			<span class={styles[selectStyleKeys.indicator]}>
				<Show when={selected()}>
					<CheckIcon />
				</Show>
			</span>
			{resolvedChildren()}
		</div>
	);
}

export interface SelectSeparatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SelectSeparator(props: SelectSeparatorProps) {
	const [local, rest] = splitProps(props, ['class', 'ref']);
	return <div {...rest} ref={local.ref} role="separator" data-slot="select-separator" class={`${styles[selectStyleKeys.separator]} ${local.class ?? ''}`} />;
}

export interface SelectScrollButtonProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CallbackRef<HTMLDivElement>;
}
export function SelectScrollUpButton(props: ParentProps<SelectScrollButtonProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div {...rest} ref={local.ref} data-slot="select-scroll-up-button" class={`${styles[selectStyleKeys.scrollButton]} ${local.class ?? ''}`}>
			{local.children ?? <ChevronIcon up />}
		</div>
	);
}
export function SelectScrollDownButton(props: ParentProps<SelectScrollButtonProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div {...rest} ref={local.ref} data-slot="select-scroll-down-button" class={`${styles[selectStyleKeys.scrollButton]} ${local.class ?? ''}`}>
			{local.children ?? <ChevronIcon />}
		</div>
	);
}

export default Select;
