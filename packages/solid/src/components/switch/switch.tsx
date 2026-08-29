import { createEffect, createUniqueId, onCleanup, onMount, splitProps, type JSX } from 'solid-js';
import { getSwitchState, switchStyleKeys } from '@tile-ui/core';
import type { SwitchBaseProps } from '@tile-ui/core';
import { HIDDEN_FORM_CONTROL_PROPS, createControllableSignal, createFormResetBinding, invokeEventHandler, setInitialNativeChecked, setNativeChecked } from '../../utils';
import styles from '@tile-ui/styles/scss/components/switch.module.scss';

export interface SwitchProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'defaultChecked' | 'name' | 'onChange' | 'required' | 'value'>, SwitchBaseProps {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	name?: string;
	value?: string;
	form?: string;
	required?: boolean;
}

/** SolidJS Switch：使用隐藏原生 checkbox 提供表单语义。 */
export function Switch(props: SwitchProps) {
	const [local, rest] = splitProps(props, [
		'size',
		'checked',
		'defaultChecked',
		'onCheckedChange',
		'name',
		'value',
		'form',
		'required',
		'disabled',
		'class',
		'onClick',
		'children',
		'type',
	]);
	const initialChecked = local.defaultChecked ?? false;
	const [checked, setChecked, resetChecked] = createControllableSignal({
		value: () => local.checked,
		defaultValue: () => initialChecked,
		onChange: (next) => local.onCheckedChange?.(next),
	});
	const controlId = `tile-solid-switch-${createUniqueId()}`;
	let control: HTMLInputElement | undefined;

	const syncControl = () => {
		if (control) setNativeChecked(control, checked());
	};

	const resetBinding = createFormResetBinding(() => {
		resetChecked();
		queueMicrotask(syncControl);
	});
	const bindReset = () => {
		const associatedForm = local.form && typeof document !== 'undefined' ? (document.getElementById(local.form) as HTMLFormElement | null) : control?.form;
		resetBinding.bind({ form: associatedForm ?? null });
	};

	onMount(() => {
		createEffect(syncControl);
		createEffect(() => {
			const form = local.form;
			bindReset();
			return form;
		});
		setInitialNativeChecked(control, initialChecked);
		onCleanup(resetBinding.cleanup);
	});

	return (
		<>
			<button
				{...rest}
				type={local.type ?? 'button'}
				role="switch"
				aria-checked={checked()}
				data-state={getSwitchState(checked())}
				data-size={local.size ?? 'default'}
				disabled={local.disabled}
				class={`${styles[switchStyleKeys.root]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented) setChecked(!checked());
				}}>
				<span class={styles[switchStyleKeys.thumb]} />
				{local.children}
			</button>
			<input
				{...HIDDEN_FORM_CONTROL_PROPS}
				ref={(element) => {
					control = element;
					bindReset();
				}}
				id={controlId}
				type="checkbox"
				name={local.name}
				value={local.value ?? 'on'}
				form={local.form}
				required={local.required}
				disabled={local.disabled}
			/>
		</>
	);
}

export default Switch;
