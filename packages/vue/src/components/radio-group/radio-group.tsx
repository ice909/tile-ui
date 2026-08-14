import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { getRadioState, radioGroupStyleKeys } from '@tile-ui/core';
import type { RadioGroupOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/radio-group.module.scss';

interface RadioGroupContextValue {
	value: string;
	name: string;
	disabled: boolean;
	select: (value: string) => void;
}

type RadioGroupContext = ComputedRef<RadioGroupContextValue>;

const RadioGroupContextKey: InjectionKey<RadioGroupContext> = Symbol('tile-radio-group');

export const TRadioGroup = defineComponent({
	name: 'TRadioGroup',
	props: {
		modelValue: { type: String, default: undefined },
		defaultValue: { type: String, default: '' },
		orientation: {
			type: String as PropType<RadioGroupOrientation>,
			default: 'vertical',
		},
		name: { type: String, default: '' },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, slots }) {
		const internalValue = ref(props.defaultValue);
		const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));

		const context = computed<RadioGroupContextValue>(() => ({
			value: currentValue.value,
			name: props.name,
			disabled: props.disabled,
			select: (next: string) => {
				if (props.disabled) {
					return;
				}
				if (props.modelValue === undefined) {
					internalValue.value = next;
				}
				emit('update:modelValue', next);
				emit('change', next);
			},
		}));

		provide(RadioGroupContextKey, context);

		return () =>
			h(
				'div',
				{
					class: styles[radioGroupStyleKeys.root],
					role: 'radiogroup',
					'aria-orientation': props.orientation,
					'data-orientation': props.orientation,
				},
				slots.default?.(),
			);
	},
});

let radioCounter = 0;

export const TRadioGroupItem = defineComponent({
	name: 'TRadioGroupItem',
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props) {
		const context = inject(RadioGroupContextKey);
		if (!context) {
			throw new Error('TRadioGroupItem must be used within <TRadioGroup>.');
		}

		const checked = computed(() => context.value.value === props.value);
		const state = computed(() => getRadioState(checked.value));
		const inputId = `tile-radio-${++radioCounter}`;

		return () =>
			h('label', { class: styles[radioGroupStyleKeys.label], for: inputId }, [
				h('input', {
					id: inputId,
					type: 'radio',
					name: context.value.name,
					value: props.value,
					checked: checked.value,
					disabled: props.disabled || context.value.disabled,
					class: styles[radioGroupStyleKeys.input],
					onChange: () => {
						if (!checked.value) {
							context.value.select(props.value);
						}
					},
				}),
				h('span', { 'data-state': state.value, class: styles[radioGroupStyleKeys.item] }, [
					h('span', { class: styles[radioGroupStyleKeys.indicator] }, [h('span', { class: styles[radioGroupStyleKeys.dot] })]),
				]),
			]);
	},
});

export default TRadioGroup;
