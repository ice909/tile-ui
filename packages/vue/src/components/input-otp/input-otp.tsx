import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type PropType, type Ref } from 'vue';
import { getNextOtpIndex, getPrevOtpIndex, inputOtpStyleKeys, isOtpCharAllowed, joinOtpValue, splitOtpValue } from '@tile-ui/core';
import type { InputOtpMode } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/input-otp.module.scss';

interface InputOtpContext {
	value: ComputedRef<string>;
	maxLength: number;
	activeIndex: Ref<number>;
	mode: InputOtpMode;
	disabled: boolean;
	registerSlot: (index: number, element: HTMLInputElement | null) => void;
	setActiveIndex: (index: number) => void;
	focusSlot: (index: number) => void;
	handleInputChange: (index: number, inputValue: string) => void;
	handleSlotKeyDown: (index: number, event: KeyboardEvent) => void;
	handlePaste: (event: ClipboardEvent) => void;
}

const InputOtpContextKey: InjectionKey<InputOtpContext> = Symbol('tile-input-otp');

function useInputOtpContext(): InputOtpContext {
	const context = inject(InputOtpContextKey);
	if (!context) {
		throw new Error('InputOTP sub-components must be used within <InputOTP>.');
	}
	return context;
}

export const InputOTP = defineComponent({
	name: 'InputOTP',
	props: {
		modelValue: { type: String, default: undefined },
		defaultValue: { type: String, default: '' },
		maxLength: { type: Number, default: 4 },
		disabled: { type: Boolean, default: false },
		mode: { type: String as PropType<InputOtpMode>, default: 'alphanumeric' },
	},
	emits: ['update:modelValue', 'complete'],
	setup(props, { slots, emit }) {
		const internalValue = ref(props.defaultValue);
		const isControlled = computed(() => props.modelValue !== undefined);
		const currentValue = computed(() => (isControlled.value ? (props.modelValue ?? '') : internalValue.value));
		const activeIndex = ref(0);
		const slotInputs: Array<HTMLInputElement | null> = [];

		function commit(next: string) {
			const sanitized = Array.from(next)
				.filter((char) => isOtpCharAllowed(char, props.mode))
				.slice(0, props.maxLength)
				.join('');
			if (!isControlled.value) {
				internalValue.value = sanitized;
			}
			emit('update:modelValue', sanitized);
			if (sanitized.length === props.maxLength) {
				emit('complete', sanitized);
			}
			return sanitized;
		}

		function registerSlot(index: number, element: HTMLInputElement | null) {
			slotInputs[index] = element;
		}

		function focusSlot(index: number) {
			const slot = slotInputs[index];
			slot?.focus();
			slot?.select();
			activeIndex.value = index;
		}

		function setActiveIndex(index: number) {
			activeIndex.value = index;
		}

		function handleInputChange(index: number, inputValue: string) {
			const newChar =
				Array.from(inputValue)
					.filter((char) => isOtpCharAllowed(char, props.mode))
					.slice(-1)[0] ?? '';
			const chars = splitOtpValue(currentValue.value, props.maxLength);
			chars[index] = newChar;
			commit(joinOtpValue(chars, props.maxLength));
			if (newChar) {
				const next = getNextOtpIndex(index, props.maxLength);
				if (next !== null) {
					focusSlot(next);
				}
			}
		}

		function handleSlotKeyDown(index: number, event: KeyboardEvent) {
			if (event.key === 'Backspace') {
				event.preventDefault();
				const chars = splitOtpValue(currentValue.value, props.maxLength);
				if (chars[index]) {
					chars[index] = '';
					commit(joinOtpValue(chars, props.maxLength));
				} else {
					const prev = getPrevOtpIndex(index);
					if (prev !== null) {
						chars[prev] = '';
						commit(joinOtpValue(chars, props.maxLength));
						focusSlot(prev);
					}
				}
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				const prev = getPrevOtpIndex(index);
				if (prev !== null) {
					focusSlot(prev);
				}
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				const next = getNextOtpIndex(index, props.maxLength);
				if (next !== null) {
					focusSlot(next);
				}
			} else if (event.key === 'Home') {
				event.preventDefault();
				focusSlot(0);
			} else if (event.key === 'End') {
				event.preventDefault();
				focusSlot(props.maxLength - 1);
			}
		}

		function handlePaste(event: ClipboardEvent) {
			event.preventDefault();
			const text = event.clipboardData?.getData('text') ?? '';
			const pasted = Array.from(text)
				.filter((char) => isOtpCharAllowed(char, props.mode))
				.slice(0, props.maxLength);
			if (pasted.length === 0) {
				return;
			}
			const chars = splitOtpValue(currentValue.value, props.maxLength);
			for (let i = 0; i < pasted.length && activeIndex.value + i < props.maxLength; i++) {
				chars[activeIndex.value + i] = pasted[i];
			}
			commit(joinOtpValue(chars, props.maxLength));
			focusSlot(Math.min(activeIndex.value + pasted.length, props.maxLength - 1));
		}

		provide(InputOtpContextKey, {
			value: currentValue,
			maxLength: props.maxLength,
			activeIndex,
			mode: props.mode,
			disabled: props.disabled,
			registerSlot,
			setActiveIndex,
			focusSlot,
			handleInputChange,
			handleSlotKeyDown,
			handlePaste,
		});

		return () => h('div', { 'data-slot': 'input-otp', 'data-disabled': props.disabled ? 'true' : 'false', class: styles[inputOtpStyleKeys.root] }, slots.default?.());
	},
});

export const InputOTPGroup = defineComponent({
	name: 'InputOTPGroup',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'input-otp-group', class: styles[inputOtpStyleKeys.group] }, slots.default?.());
	},
});

export const InputOTPSlot = defineComponent({
	name: 'InputOTPSlot',
	inheritAttrs: false,
	props: {
		index: { type: Number, required: true },
	},
	setup(props, { slots, attrs }) {
		const context = useInputOtpContext();

		return () => {
			const char = context.value.value[props.index] ?? '';
			const isActive = context.activeIndex.value === props.index;
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'div',
				{
					...restAttrs,
					'data-slot': 'input-otp-slot',
					'data-active': isActive ? 'true' : 'false',
					class: [styles[inputOtpStyleKeys.slot], userClass],
				},
				[
					h('input', {
						ref: (el: unknown) => context.registerSlot(props.index, el as HTMLInputElement | null),
						value: char,
						disabled: context.disabled,
						inputmode: context.mode === 'numeric' ? 'numeric' : 'text',
						autocomplete: 'one-time-code',
						'aria-label': `Character ${props.index + 1}`,
						onFocus: (event: FocusEvent) => {
							context.setActiveIndex(props.index);
							(event.target as HTMLInputElement).select();
						},
						onInput: (event: Event) => context.handleInputChange(props.index, (event.target as HTMLInputElement).value),
						onKeydown: (event: KeyboardEvent) => context.handleSlotKeyDown(props.index, event),
						onPaste: (event: ClipboardEvent) => context.handlePaste(event),
					}),
					...(slots.default?.() ?? []),
				],
			);
		};
	},
});

export const InputOTPSeparator = defineComponent({
	name: 'InputOTPSeparator',
	setup(_props, { slots }) {
		return () =>
			h(
				'div',
				{ 'data-slot': 'input-otp-separator', role: 'separator', class: styles[inputOtpStyleKeys.separator] },
				slots.default?.() ??
					h(
						'svg',
						{
							xmlns: 'http://www.w3.org/2000/svg',
							width: '16',
							height: '16',
							viewBox: '0 0 24 24',
							fill: 'none',
							stroke: 'currentColor',
							'stroke-width': '2',
							'stroke-linecap': 'round',
							'stroke-linejoin': 'round',
							'aria-hidden': 'true',
						},
						[h('path', { d: 'M5 12h14' })],
					),
			);
	},
});

export default InputOTP;
