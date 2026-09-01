import { Show, createEffect, createUniqueId, onCleanup, onMount, splitProps, type JSX } from 'solid-js';
import { checkboxStyleKeys, getCheckboxState, getNextCheckboxState } from '@tile-ui/core';
import type { CheckboxCheckedState } from '@tile-ui/core';
import { HIDDEN_FORM_CONTROL_PROPS, createControllableSignal, createFormResetBinding, invokeEventHandler, setInitialNativeChecked, setNativeChecked } from '../../utils';
import styles from '@tile-ui/styles/scss/components/checkbox.module.scss';

export interface CheckboxProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'defaultChecked' | 'name' | 'onChange' | 'required' | 'value'> {
	checked?: CheckboxCheckedState;
	defaultChecked?: CheckboxCheckedState;
	onCheckedChange?: (checked: CheckboxCheckedState) => void;
	name?: string;
	value?: string;
	form?: string;
	required?: boolean;
}

/** SolidJS Checkbox：支持三态、受控/非受控状态与原生表单提交。 */
export function Checkbox(props: CheckboxProps) {
	const [local, rest] = splitProps(props, [
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
	const [checked, setChecked, resetChecked] = createControllableSignal<CheckboxCheckedState>({
		value: () => local.checked,
		defaultValue: () => initialChecked,
		onChange: (next) => local.onCheckedChange?.(next),
	});
	const state = () => getCheckboxState(checked());
	const controlId = `tile-solid-checkbox-${createUniqueId()}`;
	let control: HTMLInputElement | undefined;

	const syncControl = () => {
		if (!control) return;
		setNativeChecked(control, checked() === true);
		control.indeterminate = checked() === 'indeterminate';
	};

	const resetBinding = createFormResetBinding(() => {
		resetChecked();
		queueMicrotask(syncControl);
	});
	const bindReset = () => {
		resetBinding.bind(control);
	};

	onMount(() => {
		createEffect(syncControl);
		createEffect(() => {
			const form = local.form;
			bindReset();
			return form;
		});
		setInitialNativeChecked(control, initialChecked === true);
		if (control) control.indeterminate = initialChecked === 'indeterminate';
		onCleanup(resetBinding.cleanup);
	});

	return (
		<>
			<button
				{...rest}
				type={local.type ?? 'button'}
				role="checkbox"
				aria-checked={state() === 'mixed' ? 'mixed' : checked() === true}
				data-state={state()}
				disabled={local.disabled}
				class={`${styles[checkboxStyleKeys.root]} ${local.class ?? ''}`}
				onClick={(event) => {
					invokeEventHandler(local.onClick, event);
					if (!event.defaultPrevented) setChecked(getNextCheckboxState(checked()));
				}}>
				<span class={styles[checkboxStyleKeys.indicator]}>
					<Show when={state() === 'checked'}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round">
							<path d="M20 6 9 17l-5-5" />
						</svg>
					</Show>
					<Show when={state() === 'mixed'}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
							<path d="M5 12h14" />
						</svg>
					</Show>
				</span>
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

export default Checkbox;
