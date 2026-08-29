import { createContext, createSignal, createUniqueId, onCleanup, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { accordionStyleKeys, getAccordionNextValues, getAccordionState } from '@tile-ui/core';
import type { AccordionBaseProps, AccordionItemBaseProps, AccordionType } from '@tile-ui/core';
import { createControllableSignal, invokeEventHandler, moveRovingFocus } from '../../utils';
import styles from '@tile-ui/styles/scss/components/accordion.module.scss';

export type AccordionValue = string | string[];

interface AccordionEntry {
	element?: HTMLButtonElement;
	disabled: Accessor<boolean>;
}

interface AccordionContextValue {
	type: Accessor<AccordionType>;
	value: Accessor<AccordionValue>;
	collapsible: Accessor<boolean>;
	toggle: (value: string) => void;
	register: (disabled: Accessor<boolean>) => AccordionEntry;
	bind: (entry: AccordionEntry, element: HTMLButtonElement) => void;
	unregister: (entry: AccordionEntry) => void;
	isTabStop: (entry: AccordionEntry) => boolean;
	setTabStop: (entry: AccordionEntry) => void;
	moveFocus: (element: HTMLButtonElement, event: KeyboardEvent) => void;
}

interface AccordionItemContextValue {
	value: Accessor<string>;
	open: Accessor<boolean>;
	disabled: Accessor<boolean>;
	triggerId: Accessor<string>;
	contentId: Accessor<string>;
	entry: AccordionEntry;
}

const AccordionContext = createContext<AccordionContextValue>();
const AccordionItemContext = createContext<AccordionItemContextValue>();

function useAccordion() {
	const context = useContext(AccordionContext);
	if (!context) throw new Error('Accordion sub-components must be used within <Accordion>.');
	return context;
}

function useAccordionItem() {
	const context = useContext(AccordionItemContext);
	if (!context) throw new Error('AccordionTrigger and AccordionContent must be used within <AccordionItem>.');
	return context;
}

function normalizeAccordionValue(type: AccordionType, value: AccordionValue | undefined): AccordionValue {
	return type === 'multiple' ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? value : '';
}

export type AccordionRef<T> = (element: T) => void;

export interface AccordionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'ref' | 'value'>, AccordionBaseProps {
	ref?: AccordionRef<HTMLDivElement>;
}

/** SolidJS Accordion：支持单选/多选、受控状态与 disabled-aware roving focus。 */
export function Accordion(props: ParentProps<AccordionProps>) {
	const [local, rest] = splitProps(props, ['type', 'value', 'defaultValue', 'onValueChange', 'collapsible', 'class', 'children', 'ref']);
	const initialType = local.type ?? 'single';
	const initialValue = normalizeAccordionValue(initialType, local.defaultValue);
	const [rawValue, setRawValue] = createControllableSignal<AccordionValue>({
		value: () => (local.value === undefined ? undefined : normalizeAccordionValue(local.type ?? 'single', local.value)),
		defaultValue: () => initialValue,
		onChange: (next) => local.onValueChange?.(next),
	});
	const entries: AccordionEntry[] = [];
	const [entriesVersion, setEntriesVersion] = createSignal(0);
	const [tabStop, setTabStop] = createSignal<AccordionEntry>();
	const type = () => local.type ?? 'single';
	const value = () => normalizeAccordionValue(type(), rawValue());
	const collapsible = () => local.collapsible ?? false;

	const context: AccordionContextValue = {
		type,
		value,
		collapsible,
		toggle: (itemValue) => {
			const current = value();
			if (type() === 'multiple') {
				setRawValue(getAccordionNextValues(itemValue, Array.isArray(current) ? current : []));
			} else if (current !== itemValue) {
				setRawValue(itemValue);
			} else if (collapsible()) {
				setRawValue('');
			}
		},
		register: (disabled) => {
			const entry = { disabled };
			entries.push(entry);
			setEntriesVersion((version) => version + 1);
			return entry;
		},
		bind: (entry, element) => {
			entry.element = element;
		},
		unregister: (entry) => {
			const index = entries.indexOf(entry);
			if (index !== -1) {
				entries.splice(index, 1);
				if (tabStop() === entry) setTabStop(undefined);
				setEntriesVersion((version) => version + 1);
			}
		},
		isTabStop: (entry) => {
			entriesVersion();
			const enabled = entries.filter((candidate) => !candidate.disabled());
			for (const candidate of entries) candidate.disabled();
			const current = tabStop();
			return entry === (current && enabled.includes(current) ? current : enabled[0]);
		},
		setTabStop: (entry) => {
			if (!entry.disabled()) setTabStop(entry);
		},
		moveFocus: (element, event) => {
			let intent: 'first' | 'last' | 'next' | 'previous' | undefined;
			if (event.key === 'ArrowDown') intent = 'next';
			else if (event.key === 'ArrowUp') intent = 'previous';
			else if (event.key === 'Home') intent = 'first';
			else if (event.key === 'End') intent = 'last';
			if (!intent) return;
			event.preventDefault();
			moveRovingFocus(
				entries.flatMap((entry) => (!entry.disabled() && entry.element ? [entry.element] : [])),
				element,
				intent,
			);
		},
	};

	return (
		<AccordionContext.Provider value={context}>
			<div {...rest} ref={local.ref} data-slot="accordion" data-type={type()} class={`${styles[accordionStyleKeys.root]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</AccordionContext.Provider>
	);
}

export interface AccordionItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, AccordionItemBaseProps {
	value: string;
	/** 预声明 Trigger ID，使 SSR 输出中的 aria-labelledby 保持精确。 */
	triggerId?: string;
	/** 预声明 Content ID，使先渲染的 Trigger 在 SSR 中获得精确 aria-controls。 */
	contentId?: string;
	ref?: AccordionRef<HTMLDivElement>;
}

export function AccordionItem(props: ParentProps<AccordionItemProps>) {
	const accordion = useAccordion();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'triggerId', 'contentId', 'class', 'children', 'ref']);
	const baseId = `tile-solid-accordion-${createUniqueId()}`;
	const triggerId = () => local.triggerId ?? `${baseId}-trigger`;
	const contentId = () => local.contentId ?? `${baseId}-content`;
	const disabled = () => local.disabled ?? false;
	const open = () => (accordion.type() === 'multiple' ? (accordion.value() as string[]).includes(local.value) : accordion.value() === local.value);
	const entry = accordion.register(disabled);
	const context: AccordionItemContextValue = {
		value: () => local.value,
		open,
		disabled,
		triggerId,
		contentId,
		entry,
	};

	onCleanup(() => accordion.unregister(entry));

	return (
		<AccordionItemContext.Provider value={context}>
			<div
				{...rest}
				ref={local.ref}
				data-slot="accordion-item"
				data-state={getAccordionState(open())}
				data-disabled={disabled() || undefined}
				class={`${styles[accordionStyleKeys.item]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</AccordionItemContext.Provider>
	);
}

export interface AccordionTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'ref'> {
	ref?: AccordionRef<HTMLButtonElement>;
}

export function AccordionTrigger(props: ParentProps<AccordionTriggerProps>) {
	const accordion = useAccordion();
	const item = useAccordionItem();
	const [local, rest] = splitProps(props, ['class', 'children', 'disabled', 'onClick', 'onFocus', 'onKeyDown', 'ref', 'type']);
	const disabled = () => item.disabled() || (local.disabled ?? false);
	item.entry.disabled = disabled;

	return (
		<div class={styles[accordionStyleKeys.header]}>
			<button
				{...rest}
				ref={(element) => {
					accordion.bind(item.entry, element);
					local.ref?.(element);
				}}
				id={item.triggerId()}
				type={local.type ?? 'button'}
				aria-expanded={item.open()}
				aria-controls={item.contentId()}
				data-slot="accordion-trigger"
				data-state={getAccordionState(item.open())}
				data-disabled={disabled() || undefined}
				disabled={disabled()}
				tabIndex={accordion.isTabStop(item.entry) ? 0 : -1}
				class={`${styles[accordionStyleKeys.trigger]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented && !disabled()) accordion.toggle(item.value());
				}}
				onFocus={(event) => {
					invokeEventHandler(local.onFocus, event);
					if (!event.defaultPrevented) accordion.setTabStop(item.entry);
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (!event.defaultPrevented) accordion.moveFocus(event.currentTarget, event);
				}}>
				{local.children}
				<svg
					aria-hidden="true"
					class={styles[accordionStyleKeys.chevron]}
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
			</button>
		</div>
	);
}

export interface AccordionContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id' | 'ref'> {
	ref?: AccordionRef<HTMLDivElement>;
}

export function AccordionContent(props: ParentProps<AccordionContentProps>) {
	const item = useAccordionItem();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div
			{...rest}
			ref={local.ref}
			id={item.contentId()}
			role="region"
			aria-labelledby={item.triggerId()}
			data-slot="accordion-content"
			data-state={getAccordionState(item.open())}
			hidden={!item.open()}
			class={`${styles[accordionStyleKeys.content]} ${local.class ?? ''}`}>
			<div class={styles[accordionStyleKeys.contentInner]}>{local.children}</div>
		</div>
	);
}

export default Accordion;
