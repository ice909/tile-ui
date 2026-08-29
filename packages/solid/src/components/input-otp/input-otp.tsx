import {
	createContext,
	createEffect,
	createRenderEffect,
	createSignal,
	createUniqueId,
	onCleanup,
	splitProps,
	useContext,
	type Accessor,
	type JSX,
	type ParentProps,
} from 'solid-js';
import { getNextOtpIndex, getPrevOtpIndex, inputOtpStyleKeys, isOtpCharAllowed } from '@tile-ui/core';
import type { InputOtpBaseProps, InputOtpMode, InputOtpSlotBaseProps } from '@tile-ui/core';
import { createFormResetBinding, HIDDEN_FORM_CONTROL_PROPS, invokeEventHandler, setInitialNativeValue, setNativeValue } from '../../utils';
import styles from '@tile-ui/styles/scss/components/input-otp.module.scss';

interface InputOtpContextValue {
	value: Accessor<string>;
	maxLength: Accessor<number>;
	mode: Accessor<InputOtpMode>;
	disabled: Accessor<boolean>;
	controlled: Accessor<boolean>;
	resetValue: Accessor<string>;
	activeIndex: Accessor<number>;
	baseId: string;
	registerSlot: (index: number, element: HTMLInputElement | undefined) => void;
	setActiveIndex: (index: number) => void;
	focusSlot: (index: number) => void;
	input: (index: number, value: string) => void;
	backspace: (index: number) => void;
	paste: (index: number, value: string) => void;
	allowPaste: Accessor<boolean>;
}

const InputOtpContext = createContext<InputOtpContextValue>();

function useInputOtp() {
	const context = useContext(InputOtpContext);
	if (!context) throw new Error('InputOTP 子组件必须位于 <InputOTP> 内部。');
	return context;
}

function sanitizeOtp(value: string, mode: InputOtpMode, maxLength: number) {
	return Array.from(value)
		.filter((char) => isOtpCharAllowed(char, mode))
		.slice(0, maxLength)
		.join('');
}

export interface InputOTPProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'>, InputOtpBaseProps {
	containerClass?: string;
	/** 提交到原生表单的唯一字段名。 */
	name?: string;
	/** 关联的原生表单 ID。 */
	form?: string;
}

/** SolidJS InputOTP：复合槽位输入，支持粘贴、组合输入、自动填充与原生表单。 */
export function InputOTP(props: ParentProps<InputOTPProps>) {
	const [local, rest] = splitProps(props, [
		'class',
		'containerClass',
		'children',
		'value',
		'defaultValue',
		'maxLength',
		'disabled',
		'onChange',
		'onComplete',
		'mode',
		'allowPaste',
		'name',
		'form',
		'id',
		'aria-label',
	]);
	const maxLength = () => Math.max(1, Math.floor(local.maxLength ?? 4));
	const mode = () => local.mode ?? 'alphanumeric';
	const disabled = () => local.disabled ?? false;
	const capturedDefaultValue = local.defaultValue ?? '';
	const resetValue = () => sanitizeOtp(capturedDefaultValue, mode(), maxLength());
	const [uncontrolledValue, setUncontrolledValue] = createSignal(resetValue());
	const controlled = () => local.value !== undefined;
	const value = () => sanitizeOtp(controlled() ? local.value! : uncontrolledValue(), mode(), maxLength());
	const [activeIndex, setActiveIndex] = createSignal(0);
	const slots: Array<HTMLInputElement | undefined> = [];
	const baseId = local.id ?? `tile-solid-input-otp-${createUniqueId()}`;
	const [formControl, setFormControl] = createSignal<HTMLInputElement>();
	let lastCompletionRequest: string | undefined;

	createEffect(() => {
		const current = value();
		if (current.length < maxLength() || (lastCompletionRequest !== undefined && current !== lastCompletionRequest)) lastCompletionRequest = undefined;
	});
	createEffect(() => {
		const currentActiveIndex = activeIndex();
		if (currentActiveIndex < maxLength()) return;
		const nextIndex = maxLength() - 1;
		const shouldRestoreFocus = typeof document !== 'undefined' && document.activeElement === slots[currentActiveIndex];
		setActiveIndex(nextIndex);
		if (shouldRestoreFocus) queueMicrotask(() => focusSlot(nextIndex));
	});

	function commit(next: string) {
		const sanitized = sanitizeOtp(next, mode(), maxLength());
		const previous = value();
		if (!controlled()) setUncontrolledValue(sanitized);
		if (previous !== sanitized) local.onChange?.(sanitized);
		if (sanitized.length < maxLength()) {
			lastCompletionRequest = undefined;
		} else if (sanitized !== lastCompletionRequest) {
			lastCompletionRequest = sanitized;
			local.onComplete?.(sanitized);
		}
		return sanitized;
	}

	function focusSlot(index: number) {
		const bounded = Math.min(maxLength() - 1, Math.max(0, index));
		const slot = slots[bounded];
		if (disabled() || !slot) return;
		slot.focus();
		slot.select();
		setActiveIndex(bounded);
	}

	function insert(index: number, raw: string) {
		const incoming = Array.from(raw).filter((char) => isOtpCharAllowed(char, mode()));
		if (incoming.length === 0) return value();
		const chars = Array.from(value());
		const start = Math.min(Math.max(0, index), chars.length);
		for (let offset = 0; offset < incoming.length && start + offset < maxLength(); offset++) chars[start + offset] = incoming[offset];
		return commit(chars.join(''));
	}

	function input(index: number, raw: string) {
		if (disabled()) return;
		const allowed = Array.from(raw).filter((char) => isOtpCharAllowed(char, mode()));
		if (allowed.length > 1) {
			const next = insert(index, allowed.join(''));
			focusSlot(Math.min(next.length, maxLength() - 1));
			return;
		}
		const chars = Array.from(value());
		if (allowed[0]) {
			const target = Math.min(index, chars.length);
			chars[target] = allowed[0];
			commit(chars.join(''));
			const next = getNextOtpIndex(target, maxLength());
			if (next !== null) focusSlot(next);
		} else if (index < chars.length) {
			chars.splice(index, 1);
			commit(chars.join(''));
		}
	}

	function backspace(index: number) {
		if (disabled()) return;
		const chars = Array.from(value());
		if (index < chars.length) {
			chars.splice(index, 1);
			commit(chars.join(''));
			return;
		}
		const previous = getPrevOtpIndex(Math.min(index, chars.length));
		if (previous !== null && previous < chars.length) {
			chars.splice(previous, 1);
			commit(chars.join(''));
			focusSlot(previous);
		}
	}

	function paste(index: number, raw: string) {
		if (disabled() || !(local.allowPaste ?? true)) return;
		const next = insert(index, raw);
		focusSlot(Math.min(next.length, maxLength() - 1));
	}

	const syncSlots = () => {
		const characters = Array.from(value());
		for (let index = 0; index < slots.length; index++) {
			const slot = slots[index];
			if (slot) slot.value = characters[index] ?? '';
		}
	};
	const resetBinding = createFormResetBinding(() => {
		const control = formControl();
		if (controlled()) {
			const current = value();
			setInitialNativeValue(control, current);
			if (control && control.value !== current) setNativeValue(control, current);
		} else {
			const initial = resetValue();
			setUncontrolledValue(initial);
			lastCompletionRequest = undefined;
			setInitialNativeValue(control, initial);
			if (control && control.value !== initial) setNativeValue(control, initial);
		}
		queueMicrotask(syncSlots);
	});
	createEffect(() => {
		const [, , control] = [local.name, local.form, formControl()] as const;
		resetBinding.bind(control);
	});
	createRenderEffect(() => {
		const control = formControl();
		if (!control) return;
		const current = value();
		setInitialNativeValue(control, controlled() ? current : resetValue());
		if (control.value !== current) setNativeValue(control, current);
	});
	onCleanup(() => resetBinding.cleanup());

	const context: InputOtpContextValue = {
		value,
		maxLength,
		mode,
		disabled,
		controlled,
		resetValue,
		activeIndex,
		baseId,
		registerSlot: (index, element) => {
			if (element === undefined || slots[index] === undefined || slots[index] === element) slots[index] = element;
		},
		setActiveIndex,
		focusSlot,
		input,
		backspace,
		paste,
		allowPaste: () => local.allowPaste ?? true,
	};

	return (
		<InputOtpContext.Provider value={context}>
			<div
				{...rest}
				id={baseId}
				role="group"
				aria-label={local['aria-label'] ?? 'One-time password'}
				data-slot="input-otp"
				data-disabled={disabled()}
				class={[styles[inputOtpStyleKeys.root], local.containerClass, local.class].filter(Boolean).join(' ')}>
				{local.children}
				<input {...HIDDEN_FORM_CONTROL_PROPS} ref={setFormControl} type="hidden" name={local.name} form={local.form} disabled={disabled()} value={value()} />
			</div>
		</InputOtpContext.Provider>
	);
}

export interface InputOTPGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function InputOTPGroup(props: ParentProps<InputOTPGroupProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="input-otp-group" class={`${styles[inputOtpStyleKeys.group]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface InputOTPSlotProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onInput' | 'onKeyDown' | 'onPaste' | 'onFocus'>, InputOtpSlotBaseProps {
	inputClass?: string;
	inputProps?: Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'value' | 'disabled' | 'name'>;
}

export function InputOTPSlot(props: ParentProps<InputOTPSlotProps>) {
	const context = useInputOtp();
	const [local, rest] = splitProps(props, ['class', 'children', 'index', 'inputClass', 'inputProps']);
	const [inputLocal, inputRest] = splitProps(local.inputProps ?? {}, [
		'class',
		'id',
		'aria-label',
		'onInput',
		'onKeyDown',
		'onPaste',
		'onFocus',
		'onCompositionStart',
		'onCompositionEnd',
		'autocomplete',
		'inputmode',
	]);
	let composing = false;
	let inputElement: HTMLInputElement | undefined;
	const declaredIndex = () => Math.max(0, Math.floor(local.index));
	const outOfRange = () => declaredIndex() >= context.maxLength();
	const character = () => (outOfRange() ? '' : (Array.from(context.value())[declaredIndex()] ?? ''));
	const resetCharacter = () => (outOfRange() ? '' : (Array.from(context.resetValue())[declaredIndex()] ?? ''));
	let registeredIndex: number | undefined;
	createEffect(() => {
		const nextIndex = declaredIndex();
		if (registeredIndex !== undefined && registeredIndex !== nextIndex) context.registerSlot(registeredIndex, undefined);
		registeredIndex = nextIndex;
		if (inputElement) context.registerSlot(nextIndex, inputElement);
	});
	onCleanup(() => {
		if (registeredIndex !== undefined) context.registerSlot(registeredIndex, undefined);
	});
	createRenderEffect(() => {
		const current = character();
		const initial = context.controlled() ? current : resetCharacter();
		if (!inputElement) return;
		inputElement.defaultValue = initial;
		if (!composing && inputElement.value !== current) inputElement.value = current;
	});

	return (
		<div
			{...rest}
			data-slot="input-otp-slot"
			data-active={!outOfRange() && context.activeIndex() === declaredIndex()}
			data-disabled={context.disabled() || outOfRange()}
			data-out-of-range={outOfRange()}
			hidden={outOfRange()}
			aria-hidden={outOfRange() || undefined}
			class={`${styles[inputOtpStyleKeys.slot]} ${local.class ?? ''}`}>
			<input
				{...inputRest}
				ref={(element) => {
					inputElement = element;
					context.registerSlot(declaredIndex(), element);
				}}
				id={inputLocal.id ?? `${context.baseId}-slot-${declaredIndex()}`}
				class={`${inputLocal.class ?? ''} ${local.inputClass ?? ''}`}
				value={character()}
				disabled={context.disabled() || outOfRange()}
				tabIndex={outOfRange() ? -1 : inputRest.tabIndex}
				inputmode={inputLocal.inputmode ?? (context.mode() === 'numeric' ? 'numeric' : 'text')}
				autocomplete={inputLocal.autocomplete ?? (declaredIndex() === 0 ? 'one-time-code' : 'off')}
				aria-label={outOfRange() ? undefined : (inputLocal['aria-label'] ?? `One-time password character ${declaredIndex() + 1} of ${context.maxLength()}`)}
				onFocus={(event) => {
					invokeEventHandler(inputLocal.onFocus, event);
					if (!event.defaultPrevented && !outOfRange()) {
						context.setActiveIndex(declaredIndex());
						event.currentTarget.select();
					}
				}}
				onInput={(event) => {
					invokeEventHandler(inputLocal.onInput, event);
					if (!event.defaultPrevented && !composing && !outOfRange()) {
						context.input(declaredIndex(), event.currentTarget.value);
						event.currentTarget.value = character();
					}
				}}
				onKeyDown={(event) => {
					invokeEventHandler(inputLocal.onKeyDown, event);
					if (event.defaultPrevented || context.disabled() || composing || outOfRange()) return;
					let target: number | null = null;
					switch (event.key) {
						case 'Backspace':
							event.preventDefault();
							context.backspace(declaredIndex());
							return;
						case 'ArrowLeft':
							target = getPrevOtpIndex(declaredIndex());
							break;
						case 'ArrowRight':
							target = getNextOtpIndex(declaredIndex(), context.maxLength());
							break;
						case 'Home':
							target = 0;
							break;
						case 'End':
							target = context.maxLength() - 1;
							break;
					}
					if (target !== null) {
						event.preventDefault();
						context.focusSlot(target);
					}
				}}
				onPaste={(event) => {
					invokeEventHandler(inputLocal.onPaste, event);
					if (event.defaultPrevented) return;
					event.preventDefault();
					if (context.allowPaste() && !outOfRange()) context.paste(declaredIndex(), event.clipboardData?.getData('text') ?? '');
				}}
				onCompositionStart={(event) => {
					invokeEventHandler(inputLocal.onCompositionStart, event);
					if (!event.defaultPrevented && !outOfRange()) composing = true;
				}}
				onCompositionEnd={(event) => {
					invokeEventHandler(inputLocal.onCompositionEnd, event);
					composing = false;
					if (!event.defaultPrevented && !outOfRange()) context.input(declaredIndex(), event.currentTarget.value || event.data);
					event.currentTarget.value = character();
				}}
			/>
			{local.children}
		</div>
	);
}

export interface InputOTPSeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function InputOTPSeparator(props: ParentProps<InputOTPSeparatorProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="input-otp-separator" role="separator" class={`${styles[inputOtpStyleKeys.separator]} ${local.class ?? ''}`}>
			{local.children ?? (
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M5 12h14" />
				</svg>
			)}
		</div>
	);
}

export default InputOTP;
