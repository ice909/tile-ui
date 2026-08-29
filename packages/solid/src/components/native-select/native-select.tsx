import { createContext, createEffect, createRenderEffect, createSignal, onCleanup, onMount, splitProps, useContext, type JSX, type ParentProps } from 'solid-js';
import { getNativeSelectState, nativeSelectStyleKeys } from '@tile-ui/core';
import type { NativeSelectBaseProps, NativeSelectOptGroupBaseProps, NativeSelectOptionBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import { createFormResetBinding, setInitialNativeValue } from '../../utils/form-control';
import styles from '@tile-ui/styles/scss/components/native-select.module.scss';

interface NativeSelectContextValue {
	initialValue: string | undefined;
}

const NativeSelectContext = createContext<NativeSelectContextValue>();

export interface NativeSelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value'>, NativeSelectBaseProps {
	value?: string;
	/** 非受控初始值；后续属性变化不会改变原生重置基准。 */
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

export function NativeSelect(props: ParentProps<NativeSelectProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'size', 'value', 'defaultValue', 'onValueChange', 'onChange', 'ref']);
	const initialValue = local.value ?? local.defaultValue;
	const [nativeValue, setNativeValue] = createSignal(initialValue);
	let select: HTMLSelectElement | undefined;
	const resetBinding = createFormResetBinding(() => {
		queueMicrotask(() => {
			if (!select) return;
			if (local.value !== undefined) select.value = local.value;
			setNativeValue(select.value);
		});
	});

	const assignSelect = (element: HTMLSelectElement) => {
		select = element;
		if (typeof local.ref === 'function') local.ref(element);
	};

	createRenderEffect(() => {
		const controlledValue = local.value;
		if (select && controlledValue !== undefined) {
			select.value = controlledValue;
			setNativeValue(controlledValue);
		}
	});

	createEffect(() => {
		void props.form;
		resetBinding.bind(select);
	});

	onMount(() => {
		if (!select) return;
		if (local.defaultValue !== undefined) {
			setInitialNativeValue(select, local.defaultValue);
			if (local.value === undefined) select.value = local.defaultValue;
		}
		setNativeValue(select.value);
		resetBinding.bind(select);
	});
	onCleanup(() => resetBinding.cleanup());

	return (
		<NativeSelectContext.Provider value={{ initialValue }}>
			<div class={styles[nativeSelectStyleKeys.wrapper]}>
				<select
					{...rest}
					ref={assignSelect}
					data-slot="native-select"
					data-size={local.size ?? 'default'}
					data-state={getNativeSelectState(local.value ?? nativeValue())}
					class={`${styles[nativeSelectStyleKeys.select]} ${local.class ?? ''}`}
					onChange={(event) => {
						const next = event.currentTarget.value;
						invokeEventHandler(local.onChange, event);
						// 非受控选择保留原生 DOM 变更；preventDefault 仅取消值回调。
						if (local.value === undefined) setNativeValue(next);
						else {
							event.currentTarget.value = local.value;
							setNativeValue(local.value);
						}
						if (!event.defaultPrevented) local.onValueChange?.(next);
					}}>
					{local.children}
				</select>
				<svg
					class={styles[nativeSelectStyleKeys.icon]}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					data-slot="native-select-icon">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
		</NativeSelectContext.Provider>
	);
}

export interface NativeSelectOptionProps extends JSX.OptionHTMLAttributes<HTMLOptionElement>, NativeSelectOptionBaseProps {}

export function NativeSelectOption(props: ParentProps<NativeSelectOptionProps>) {
	const selectedValue = useContext(NativeSelectContext);
	const [local, rest] = splitProps(props, ['class', 'children', 'value', 'selected']);
	const optionValue = () => String(local.value ?? (typeof local.children === 'string' || typeof local.children === 'number' ? local.children : ''));
	return (
		<option
			{...rest}
			value={local.value}
			selected={selectedValue?.initialValue === undefined ? local.selected : selectedValue.initialValue === optionValue()}
			data-slot="native-select-option"
			class={`${styles[nativeSelectStyleKeys.option]} ${local.class ?? ''}`}>
			{local.children}
		</option>
	);
}

export interface NativeSelectOptGroupProps extends JSX.OptgroupHTMLAttributes<HTMLOptGroupElement>, NativeSelectOptGroupBaseProps {}

export function NativeSelectOptGroup(props: ParentProps<NativeSelectOptGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<optgroup {...rest} data-slot="native-select-optgroup" class={`${styles[nativeSelectStyleKeys.optGroup]} ${local.class ?? ''}`}>
			{local.children}
		</optgroup>
	);
}

export default NativeSelect;
