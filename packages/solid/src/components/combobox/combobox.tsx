import { For, Show, createEffect, createSignal, createUniqueId, onCleanup, splitProps, type JSX } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import { comboboxStyleKeys, filterComboboxItems, getSelectPosition, getSelectState, moveComboboxIndex } from '@tile-ui/core';
import type { ComboboxBaseProps, ComboboxItem } from '@tile-ui/core';
import {
	createAnchoredPosition,
	createControllableSignal,
	createPortalScope,
	isNodeValue,
	PortalScopeContext,
	registerDismissableLayer,
	resolvePortalContainer,
	usePortalScope,
	type CallbackRef,
} from '../../utils';
import { getLogicalTabTarget } from '../select/logical-tab';
import styles from '@tile-ui/styles/scss/components/combobox.module.scss';

export interface ComboboxProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'ref'>, Omit<ComboboxBaseProps, 'value'> {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	container?: Node;
	triggerId?: string;
	contentId?: string;
	inputId?: string;
	ref?: CallbackRef<HTMLDivElement>;
}

/** SolidJS Combobox：数据驱动单选搜索，打开与搜索保持内部状态。 */
export function Combobox(props: ComboboxProps) {
	const [local, rest] = splitProps(props, [
		'items',
		'value',
		'defaultValue',
		'onValueChange',
		'placeholder',
		'searchPlaceholder',
		'emptyText',
		'notFoundText',
		'maxItems',
		'disabled',
		'filter',
		'container',
		'triggerId',
		'contentId',
		'inputId',
		'class',
		'ref',
	]);
	const [value, setValue] = createControllableSignal<string | undefined>({
		value: () => local.value,
		defaultValue: () => local.defaultValue,
		onChange: (next) => next !== undefined && local.onValueChange?.(next),
	});
	const [open, setOpen] = createSignal(false);
	const [openIntent, setOpenIntent] = createSignal<'first' | 'selected-or-first' | 'selected-or-last'>('selected-or-first');
	const [search, setSearch] = createSignal('');
	const [active, setActive] = createSignal<string>();
	const baseId = `tile-solid-combobox-${createUniqueId()}`;
	const triggerId = () => local.triggerId ?? `${baseId}-trigger`;
	const contentId = () => local.contentId ?? `${baseId}-content`;
	const popupId = () => `${contentId()}-popup`;
	const inputId = () => local.inputId ?? `${baseId}-input`;
	const emptyId = () => `${contentId()}-empty`;
	const optionId = (item: ComboboxItem) => `${contentId()}-option-${encodeURIComponent(item.value)}`;
	const activeOptionId = () => {
		const item = enabled().find((candidate) => candidate.value === active());
		return item ? optionId(item) : undefined;
	};
	const filtered = () => filterComboboxItems(local.items, search(), local.maxItems, local.filter);
	const enabled = () => filtered().filter((item) => !item.disabled);
	const empty = () => filtered().length === 0;
	const selected = () => local.items.find((item) => item.value === value());
	let trigger: HTMLButtonElement | undefined;
	let content: HTMLDivElement | undefined;
	let input: HTMLInputElement | undefined;
	const parentScope = usePortalScope();
	const mount = () => resolvePortalContainer(parentScope, local.container);
	const scope = createPortalScope(mount, parentScope);
	const close = (restore = false) => {
		setOpen(false);
		setSearch('');
		setActive(undefined);
		if (restore) trigger?.focus();
	};
	const choose = (item: ComboboxItem) => {
		if (item.disabled) return;
		setValue(item.value);
		close(true);
	};
	const positioner = createAnchoredPosition({
		anchor: () => trigger,
		content: () => content,
		container: () => {
			const container = mount();
			const ElementConstructor = isNodeValue(container) ? container.ownerDocument?.defaultView?.Element : undefined;
			return ElementConstructor && container instanceof ElementConstructor ? container : undefined;
		},
		open,
		onPosition: ({ anchorRect, contentRect, containerRect, direction }) => {
			if (!content) return;
			const next = getSelectPosition({ triggerRect: anchorRect, contentSize: contentRect, viewport: containerRect, sideOffset: 4, align: 'start', rtl: direction === 'rtl' });
			content.style.left = `${next.left + containerRect.left}px`;
			content.style.top = `${next.top + containerRect.top}px`;
		},
	});
	createEffect(() => {
		if (!open()) return;
		queueMicrotask(() => {
			positioner.recompute();
			const items = enabled();
			const selectedItem = items.find((item) => item.value === value());
			setActive(openIntent() === 'first' ? items[0]?.value : (selectedItem?.value ?? (openIntent() === 'selected-or-last' ? items.at(-1)?.value : items[0]?.value)));
			input?.focus();
		});
	});
	createEffect(() => {
		if (!open() || !content) return;
		const removeBranch = scope.addBranch(content);
		let restore = true;
		const layer = registerDismissableLayer({
			element: () => content,
			branches: () => (trigger ? [trigger] : []),
			portalScope: scope,
			onFocusOutside: () => {
				restore = false;
			},
			onDismiss: () => close(restore),
		});
		queueMicrotask(layer.update);
		onCleanup(() => {
			layer.destroy();
			removeBranch();
		});
	});
	onCleanup(() => positioner.destroy());

	function move(key: string) {
		const items = enabled();
		if (items.length === 0) return;
		const current = items.findIndex((item) => item.value === active());
		if (key === 'Home') setActive(items[0].value);
		else if (key === 'End') setActive(items.at(-1)!.value);
		else setActive(items[moveComboboxIndex(current, key === 'ArrowDown' ? 1 : -1, items.length)].value);
	}

	const popup = (
		<PortalScopeContext.Provider value={scope}>
			<div
				ref={(element) => (content = element)}
				id={popupId()}
				hidden={!open()}
				data-slot="combobox-content"
				data-state={getSelectState(open())}
				class={styles[comboboxStyleKeys.content]}>
				<div class={styles[comboboxStyleKeys.search]}>
					<input
						ref={(element) => (input = element)}
						id={inputId()}
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={open()}
						aria-controls={contentId()}
						aria-activedescendant={activeOptionId()}
						aria-describedby={empty() ? emptyId() : undefined}
						value={search()}
						placeholder={local.searchPlaceholder ?? 'Search...'}
						class={styles[comboboxStyleKeys.searchInput]}
						onInput={(event) => {
							setSearch(event.currentTarget.value);
							queueMicrotask(() => setActive(enabled()[0]?.value));
						}}
						onPaste={() => queueMicrotask(() => setActive(enabled()[0]?.value))}
						onKeyDown={(event) => {
							if (event.key === 'Tab') {
								if (event.ctrlKey || event.metaKey || event.altKey) return;
								event.preventDefault();
								close();
								getLogicalTabTarget(trigger, content, event.shiftKey)?.focus();
							} else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
								event.preventDefault();
								move(event.key);
							} else if (event.key === 'Enter') {
								const item = enabled().find((candidate) => candidate.value === active());
								if (item) {
									event.preventDefault();
									choose(item);
								}
							} else if (event.key === 'Escape') {
								event.preventDefault();
								close(true);
							}
						}}
					/>
				</div>
				<div id={contentId()} role="listbox" data-slot="combobox-list" class={styles[comboboxStyleKeys.list]}>
					<For each={filtered()}>
						{(item) => (
							<div
								id={optionId(item)}
								role="option"
								aria-selected={value() === item.value}
								aria-disabled={item.disabled || undefined}
								data-highlighted={active() === item.value || undefined}
								data-disabled={item.disabled || undefined}
								data-slot="combobox-item"
								class={styles[comboboxStyleKeys.item]}
								onPointerMove={() => !item.disabled && setActive(item.value)}
								onClick={() => choose(item)}>
								<span class={styles[comboboxStyleKeys.itemIndicator]}>
									<Show when={value() === item.value}>✓</Show>
								</span>
								{item.label}
							</div>
						)}
					</For>
				</div>
				<Show when={empty()}>
					<div id={emptyId()} role="status" data-slot="combobox-empty" class={styles[comboboxStyleKeys.empty]}>
						{search() ? (local.notFoundText ?? 'No results found.') : (local.emptyText ?? 'No items.')}
					</div>
				</Show>
			</div>
		</PortalScopeContext.Provider>
	);

	return (
		<div
			{...rest}
			ref={local.ref}
			data-slot="combobox"
			data-state={getSelectState(open())}
			data-disabled={local.disabled || undefined}
			class={`${styles[comboboxStyleKeys.root]} ${local.class ?? ''}`}>
			<button
				ref={(element) => (trigger = element)}
				id={triggerId()}
				type="button"
				role={open() ? undefined : 'combobox'}
				aria-label={selected()?.label ?? local.placeholder ?? 'Select...'}
				aria-haspopup="listbox"
				aria-expanded={open()}
				aria-controls={contentId()}
				disabled={local.disabled}
				class={styles[comboboxStyleKeys.trigger]}
				onClick={() => {
					if (local.disabled) return;
					setOpenIntent('selected-or-first');
					setOpen((current) => !current);
				}}
				onKeyDown={(event) => {
					if (!local.disabled && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
						event.preventDefault();
						setOpenIntent(event.key === 'ArrowDown' ? 'first' : event.key === 'ArrowUp' ? 'selected-or-last' : 'selected-or-first');
						setOpen(true);
					}
				}}>
				<span data-placeholder={!selected() || undefined} class={styles[comboboxStyleKeys.triggerValue]}>
					{selected()?.label ?? local.placeholder ?? 'Select...'}
				</span>
				<span class={styles[comboboxStyleKeys.triggerIcon]} aria-hidden="true">
					⌄
				</span>
			</button>
			{isServer ? <Show when={open()}>{popup}</Show> : <Portal mount={mount()}>{popup}</Portal>}
		</div>
	);
}

export default Combobox;
