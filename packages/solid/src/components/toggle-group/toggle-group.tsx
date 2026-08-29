import { children, createContext, createSignal, onCleanup, splitProps, useContext, type Accessor, type JSX } from 'solid-js';
import { isServer } from 'solid-js/web';
import { getToggleGroupItemState, getToggleStyleKeys, toggleGroupStyleKeys, toggleValueInList } from '@tile-ui/core';
import type { RadioGroupOrientation, ToggleGroupBaseProps, ToggleGroupItemBaseProps } from '@tile-ui/core';
import { createControllableSignal, invokeEventHandler, moveRovingFocus } from '../../utils';
import styles from '@tile-ui/styles/scss/components/toggle-group.module.scss';

export type ToggleGroupValue = string | string[];

interface ToggleGroupContextValue {
	type: Accessor<'single' | 'multiple'>;
	value: Accessor<ToggleGroupValue>;
	disabled: Accessor<boolean>;
	orientation: Accessor<RadioGroupOrientation>;
	select: (value: string) => void;
	register: (value: Accessor<string>, disabled: Accessor<boolean>) => ToggleGroupEntry;
	bind: (entry: ToggleGroupEntry, element: HTMLButtonElement) => void;
	unregister: (entry: ToggleGroupEntry) => void;
	isTabStop: (entry: ToggleGroupEntry) => boolean;
	moveFocus: (element: HTMLButtonElement, event: KeyboardEvent) => void;
}

interface ToggleGroupEntry {
	element?: HTMLButtonElement;
	value: Accessor<string>;
	disabled: Accessor<boolean>;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>();

function normalizeServerTabStops(content: JSX.Element): null {
	if (!isServer) return null;
	const nodes: Array<{ t: string }> = [];
	const visit = (node: unknown): void => {
		if (typeof node === 'function') visit((node as () => unknown)());
		else if (Array.isArray(node)) node.forEach(visit);
		else if (typeof node === 'object' && node !== null && 't' in node && typeof (node as { t?: unknown }).t === 'string') nodes.push(node as { t: string });
	};
	visit(content);
	const items = nodes.flatMap((node) => {
		const tag = node.t.match(/<button\b[^>]*data-slot="toggle-group-item"[^>]*>/)?.[0];
		return tag ? [{ node, tag }] : [];
	});
	const enabled = items.filter(({ tag }) => !/\sdisabled(?:=""|(?=[\s>]))/.test(tag));
	const target = enabled.find(({ tag }) => /\saria-pressed="true"/.test(tag)) ?? enabled[0];
	for (const item of items) item.node.t = item.node.t.replace(/\stabIndex="[^"]*"/, ` tabIndex="${item === target ? 0 : -1}"`);
	return null;
}

function ToggleGroupContent(props: { children: JSX.Element }) {
	const content = children(() => props.children);
	normalizeServerTabStops(content());
	return content();
}

function useToggleGroup() {
	const context = useContext(ToggleGroupContext);
	if (!context) throw new Error('ToggleGroupItem must be used within <ToggleGroup>.');
	return context;
}

export interface ToggleGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'value'>, ToggleGroupBaseProps {
	value?: ToggleGroupValue;
	defaultValue?: ToggleGroupValue;
	onValueChange?: (value: ToggleGroupValue) => void;
	disabled?: boolean;
	orientation?: RadioGroupOrientation;
}

/** SolidJS ToggleGroup：支持单选/多选、上下文状态与 disabled-aware roving focus。 */
export function ToggleGroup(props: ToggleGroupProps) {
	const [local, rest] = splitProps(props, ['type', 'value', 'defaultValue', 'onValueChange', 'disabled', 'orientation', 'class', 'children']);
	const initialValue = local.defaultValue ?? (local.type === 'multiple' ? [] : '');
	const [value, setValue] = createControllableSignal<ToggleGroupValue>({
		value: () => local.value,
		defaultValue: () => initialValue,
		onChange: (next) => local.onValueChange?.(next),
	});
	const items: ToggleGroupEntry[] = [];
	const [itemsVersion, setItemsVersion] = createSignal(0);
	const type = () => local.type ?? 'single';
	const disabled = () => local.disabled ?? false;
	const orientation = () => local.orientation ?? 'horizontal';
	const isSelected = (itemValue: string) => (type() === 'single' ? value() === itemValue : Array.isArray(value()) && value().includes(itemValue));

	const context: ToggleGroupContextValue = {
		type,
		value,
		disabled,
		orientation,
		select: (itemValue) => {
			if (disabled()) return;
			const current = value();
			setValue(type() === 'single' ? (current === itemValue ? '' : itemValue) : toggleValueInList(itemValue, Array.isArray(current) ? current : []));
		},
		register: (itemValue, itemDisabled) => {
			const entry = { value: itemValue, disabled: itemDisabled };
			items.push(entry);
			setItemsVersion((version) => version + 1);
			return entry;
		},
		bind: (entry, element) => {
			entry.element = element;
		},
		unregister: (entry) => {
			const index = items.indexOf(entry);
			if (index !== -1) {
				items.splice(index, 1);
				setItemsVersion((version) => version + 1);
			}
		},
		isTabStop: (entry) => {
			itemsVersion();
			disabled();
			const enabled = items.filter((item) => !item.disabled());
			for (const item of items) item.disabled();
			const selected = enabled.find((item) => isSelected(item.value()));
			return entry === (selected ?? enabled[0]);
		},
		moveFocus: (element, event) => {
			let intent: 'first' | 'last' | 'next' | 'previous' | undefined;
			if (event.key === 'Home') intent = 'first';
			else if (event.key === 'End') intent = 'last';
			else if ((orientation() === 'horizontal' && event.key === 'ArrowRight') || (orientation() === 'vertical' && event.key === 'ArrowDown')) intent = 'next';
			else if ((orientation() === 'horizontal' && event.key === 'ArrowLeft') || (orientation() === 'vertical' && event.key === 'ArrowUp')) intent = 'previous';
			if (intent) {
				event.preventDefault();
				moveRovingFocus(
					items.flatMap((item) => (!item.disabled() && item.element ? [item.element] : [])),
					element,
					intent,
				);
			}
		},
	};
	return (
		<ToggleGroupContext.Provider value={context}>
			<div
				{...rest}
				role="group"
				aria-disabled={disabled() || undefined}
				data-slot="toggle-group"
				data-type={type()}
				data-orientation={orientation()}
				class={`${styles[toggleGroupStyleKeys.root]} ${local.class ?? ''}`}>
				<ToggleGroupContent>{local.children}</ToggleGroupContent>
			</div>
		</ToggleGroupContext.Provider>
	);
}

export interface ToggleGroupItemProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'value'>, ToggleGroupItemBaseProps {}

export function ToggleGroupItem(props: ToggleGroupItemProps) {
	const context = useToggleGroup();
	const [local, rest] = splitProps(props, ['value', 'variant', 'size', 'disabled', 'class', 'children', 'onClick', 'onKeyDown', 'type']);
	const selected = () => (context.type() === 'single' ? context.value() === local.value : Array.isArray(context.value()) && context.value().includes(local.value));
	const disabled = () => context.disabled() || (local.disabled ?? false);
	const styleKeys = () => getToggleStyleKeys(local.variant, local.size);
	const entry = context.register(() => local.value, disabled);

	onCleanup(() => {
		context.unregister(entry);
	});

	return (
		<button
			{...rest}
			ref={(node) => {
				context.bind(entry, node);
			}}
			type={local.type ?? 'button'}
			value={local.value}
			aria-pressed={selected()}
			data-state={getToggleGroupItemState(selected())}
			data-slot="toggle-group-item"
			data-active={selected() || undefined}
			data-value={local.value}
			disabled={disabled()}
			tabIndex={context.isTabStop(entry) ? 0 : -1}
			class={`${styles[toggleGroupStyleKeys.item]} ${styles[styleKeys().variant]} ${styles[styleKeys().size]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented) context.select(local.value);
			}}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (!event.defaultPrevented) context.moveFocus(event.currentTarget, event);
			}}>
			{local.children}
		</button>
	);
}

export default ToggleGroup;
