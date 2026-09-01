import { children, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX } from 'solid-js';
import { isServer } from 'solid-js/web';
import { getRadioState, radioGroupStyleKeys } from '@tile-ui/core';
import type { RadioGroupBaseProps, RadioGroupItemBaseProps, RadioGroupOrientation } from '@tile-ui/core';
import { createControllableSignal, createFormResetBinding, invokeEventHandler, moveRovingFocus, setInitialNativeChecked, setNativeChecked } from '../../utils';
import styles from '@tile-ui/styles/scss/components/radio-group.module.scss';

interface RadioGroupContextValue {
	value: Accessor<string>;
	controlled: Accessor<boolean>;
	publicName: Accessor<string | undefined>;
	nativeName: Accessor<string>;
	nativeForm: Accessor<string | undefined>;
	disabled: Accessor<boolean>;
	required: Accessor<boolean>;
	form: Accessor<string | undefined>;
	orientation: Accessor<RadioGroupOrientation>;
	select: (value: string) => void;
	reset: () => void;
	register: (value: Accessor<string>, disabled: Accessor<boolean>) => RadioGroupEntry;
	bind: (entry: RadioGroupEntry, element: HTMLInputElement) => void;
	unregister: (entry: RadioGroupEntry) => void;
	isTabStop: (entry: RadioGroupEntry) => boolean;
	sync: () => void;
	moveFocus: (element: HTMLInputElement, event: KeyboardEvent) => void;
}

interface RadioGroupEntry {
	element?: HTMLInputElement;
	value: Accessor<string>;
	disabled: Accessor<boolean>;
}

const RadioGroupContext = createContext<RadioGroupContextValue>();

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
		const tag = node.t.match(/<input\b[^>]*data-slot="radio-group-item"[^>]*>/)?.[0];
		return tag ? [{ node, tag }] : [];
	});
	const enabled = items.filter(({ tag }) => !/\sdisabled(?:=""|(?=[\s>]))/.test(tag));
	const target = enabled.find(({ tag }) => /\schecked(?:=""|(?=[\s>]))/.test(tag)) ?? enabled[0];
	for (const item of items) item.node.t = item.node.t.replace(/\stabIndex="[^"]*"/, ` tabIndex="${item === target ? 0 : -1}"`);
	return null;
}

function RadioGroupContent(props: { children: JSX.Element }) {
	const content = children(() => props.children);
	normalizeServerTabStops(content());
	return content();
}

function useRadioGroup() {
	const context = useContext(RadioGroupContext);
	if (!context) throw new Error('RadioGroupItem must be used within <RadioGroup>.');
	return context;
}

export interface RadioGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'value'>, RadioGroupBaseProps {
	required?: boolean;
	form?: string;
}

/** SolidJS RadioGroup：以真实原生 radio 提供提交、校验、重置与键盘语义。 */
export function RadioGroup(props: RadioGroupProps) {
	const [local, rest] = splitProps(props, ['value', 'defaultValue', 'onValueChange', 'orientation', 'name', 'disabled', 'required', 'form', 'class', 'children']);
	const initialValue = local.defaultValue ?? '';
	const [value, setValue, resetValue] = createControllableSignal({
		value: () => local.value,
		defaultValue: () => initialValue,
		onChange: (next) => local.onValueChange?.(next),
	});
	const fallbackName = `tile-solid-radio-group-${createUniqueId()}`;
	const detachedFormId = `${fallbackName}-detached-form`;
	const inputs: RadioGroupEntry[] = [];
	const [inputsVersion, setInputsVersion] = createSignal(0);
	const publicName = () => local.name || undefined;
	const nativeName = () => publicName() ?? fallbackName;
	const nativeForm = () => (publicName() ? local.form : detachedFormId);
	const disabled = () => local.disabled ?? false;
	const required = () => local.required ?? false;
	const orientation = () => local.orientation ?? 'vertical';
	const sync = () => {
		for (const input of inputs) {
			const element = input.element;
			if (element) setNativeChecked(element, input.value() === value());
		}
	};

	const context: RadioGroupContextValue = {
		value,
		controlled: () => local.value !== undefined,
		publicName,
		nativeName,
		nativeForm,
		disabled,
		required,
		form: () => local.form,
		orientation,
		select: (next) => {
			if (!disabled()) setValue(next);
		},
		reset: () => {
			resetValue();
			queueMicrotask(sync);
		},
		register: (itemValue, itemDisabled) => {
			const entry = { value: itemValue, disabled: itemDisabled };
			inputs.push(entry);
			setInputsVersion((version) => version + 1);
			return entry;
		},
		bind: (entry, element) => {
			entry.element = element;
		},
		unregister: (entry) => {
			const index = inputs.indexOf(entry);
			if (index !== -1) {
				inputs.splice(index, 1);
				setInputsVersion((version) => version + 1);
			}
		},
		isTabStop: (entry) => {
			inputsVersion();
			disabled();
			const enabled = inputs.filter((input) => !input.disabled());
			for (const input of inputs) input.disabled();
			return entry === (enabled.find((input) => input.value() === value()) ?? enabled[0]);
		},
		sync,
		moveFocus: (element, event) => {
			let intent: 'first' | 'last' | 'next' | 'previous' | undefined;
			if (event.key === 'Home') intent = 'first';
			else if (event.key === 'End') intent = 'last';
			else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') intent = 'next';
			else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') intent = 'previous';
			if (intent) {
				event.preventDefault();
				const target = moveRovingFocus(
					inputs.flatMap((input) => (!input.disabled() && input.element ? [input.element] : [])),
					element,
					intent,
				) as HTMLInputElement | undefined;
				target?.click();
			}
		},
	};
	return (
		<RadioGroupContext.Provider value={context}>
			<div
				{...rest}
				role="radiogroup"
				aria-orientation={orientation()}
				aria-disabled={disabled() || undefined}
				data-orientation={orientation()}
				class={`${styles[radioGroupStyleKeys.root]} ${local.class ?? ''}`}>
				<RadioGroupContent>{local.children}</RadioGroupContent>
			</div>
		</RadioGroupContext.Provider>
	);
}

export interface RadioGroupItemProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'form' | 'name' | 'required' | 'type' | 'value'>, RadioGroupItemBaseProps {
	value: string;
}

export function RadioGroupItem(props: RadioGroupItemProps) {
	const context = useRadioGroup();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'id', 'class', 'children', 'onClick', 'onChange', 'onKeyDown']);
	const fallbackId = `tile-solid-radio-${createUniqueId()}`;
	const inputId = () => local.id ?? fallbackId;
	const checked = () => context.value() === local.value;
	const disabled = () => context.disabled() || (local.disabled ?? false);
	let input: HTMLInputElement | undefined;
	const entry = context.register(() => local.value, disabled);
	const resetBinding = createFormResetBinding(context.reset);

	onMount(() => {
		if (!input) return;
		setInitialNativeChecked(input, initialChecked);
		createEffect(() => {
			context.form();
			context.publicName();
			resetBinding.bind(input);
		});
		onCleanup(resetBinding.cleanup);
	});
	onCleanup(() => {
		context.unregister(entry);
	});
	const initialChecked = checked();

	return (
		<label for={inputId()} class={`${styles[radioGroupStyleKeys.label]} ${local.class ?? ''}`}>
			<input
				{...rest}
				ref={(element) => {
					input = element;
					context.bind(entry, element);
					resetBinding.bind(input);
				}}
				id={inputId()}
				type="radio"
				name={context.nativeName()}
				value={local.value}
				data-slot="radio-group-item"
				checked={checked()}
				disabled={disabled()}
				required={context.required()}
				form={context.nativeForm()}
				tabIndex={context.isTabStop(entry) ? 0 : -1}
				class={styles[radioGroupStyleKeys.input]}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (event.defaultPrevented) queueMicrotask(context.sync);
				}}
				onChange={(event) => {
					invokeEventHandler(local.onChange, event);
					if (event.defaultPrevented) context.sync();
					else if (event.currentTarget.checked) {
						context.select(local.value);
						if (context.controlled()) context.sync();
					}
				}}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (!event.defaultPrevented) context.moveFocus(event.currentTarget, event);
				}}
			/>
			<span aria-hidden="true" data-state={getRadioState(checked())} class={styles[radioGroupStyleKeys.item]}>
				<span class={styles[radioGroupStyleKeys.indicator]}>
					<span class={styles[radioGroupStyleKeys.dot]} />
				</span>
			</span>
			{local.children}
		</label>
	);
}

export default RadioGroup;
