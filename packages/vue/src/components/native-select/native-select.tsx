import { computed, defineComponent, h, type PropType } from 'vue';
import { getNativeSelectState, nativeSelectStyleKeys } from '@tile-ui/core';
import type { NativeSelectSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/native-select.module.scss';

export const TNativeSelect = defineComponent({
	name: 'TNativeSelect',
	props: {
		modelValue: { type: String, default: '' },
		size: {
			type: String as PropType<NativeSelectSize>,
			default: 'default',
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, attrs, slots }) {
		const state = computed(() => getNativeSelectState(props.modelValue));

		function handleChange(event: Event) {
			const next = (event.target as HTMLSelectElement).value;
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h('div', { class: styles[nativeSelectStyleKeys.wrapper] }, [
				h(
					'select',
					{
						...attrs,
						'data-slot': 'native-select',
						'data-size': props.size,
						'data-state': state.value,
						value: props.modelValue,
						disabled: props.disabled,
						class: [styles[nativeSelectStyleKeys.select], attrs.class],
						onChange: handleChange,
					},
					slots.default?.(),
				),
				h(
					'svg',
					{
						class: styles[nativeSelectStyleKeys.icon],
						xmlns: 'http://www.w3.org/2000/svg',
						viewBox: '0 0 24 24',
						fill: 'none',
						stroke: 'currentColor',
						'stroke-width': '2',
						'stroke-linecap': 'round',
						'stroke-linejoin': 'round',
						'aria-hidden': 'true',
						'data-slot': 'native-select-icon',
					},
					[h('path', { d: 'm6 9 6 6 6-6' })],
				),
			]);
	},
});

export const TNativeSelectOption = defineComponent({
	name: 'TNativeSelectOption',
	props: {
		value: { type: String, default: undefined },
		label: String,
		disabled: { type: Boolean, default: false },
	},
	setup(props, { attrs }) {
		return () =>
			h('option', {
				...attrs,
				'data-slot': 'native-select-option',
				value: props.value,
				label: props.label,
				disabled: props.disabled,
				class: [styles[nativeSelectStyleKeys.option], attrs.class],
			});
	},
});

export const TNativeSelectOptGroup = defineComponent({
	name: 'TNativeSelectOptGroup',
	props: {
		label: String,
		disabled: { type: Boolean, default: false },
	},
	setup(props, { attrs, slots }) {
		return () =>
			h(
				'optgroup',
				{
					...attrs,
					'data-slot': 'native-select-optgroup',
					label: props.label,
					disabled: props.disabled,
					class: [styles[nativeSelectStyleKeys.optGroup], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export default TNativeSelect;
