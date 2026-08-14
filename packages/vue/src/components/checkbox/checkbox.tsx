import { defineComponent, computed, h, type PropType } from 'vue';
import { checkboxStyleKeys, getCheckboxState, getNextCheckboxState } from '@tile-ui/core';
import type { CheckboxCheckedState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/checkbox.module.scss';

export const TCheckbox = defineComponent({
	name: 'TCheckbox',
	props: {
		modelValue: {
			type: [Boolean, String] as PropType<boolean | 'indeterminate'>,
			default: false,
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit }) {
		const checked = computed<CheckboxCheckedState>(() => (props.modelValue === 'indeterminate' ? 'indeterminate' : !!props.modelValue));
		const state = computed(() => getCheckboxState(checked.value));

		function handleClick() {
			const next = getNextCheckboxState(checked.value);
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h(
				'button',
				{
					type: 'button',
					role: 'checkbox',
					'aria-checked': state.value,
					'data-state': state.value,
					disabled: props.disabled,
					class: styles[checkboxStyleKeys.root],
					onClick: handleClick,
				},
				[
					h('span', { class: styles[checkboxStyleKeys.indicator] }, [
						state.value === 'checked'
							? h(
									'svg',
									{
										xmlns: 'http://www.w3.org/2000/svg',
										viewBox: '0 0 24 24',
										fill: 'none',
										stroke: 'currentColor',
										'stroke-width': '3',
										'stroke-linecap': 'round',
										'stroke-linejoin': 'round',
									},
									[h('path', { d: 'M20 6 9 17l-5-5' })],
								)
							: null,
						state.value === 'mixed'
							? h(
									'svg',
									{
										xmlns: 'http://www.w3.org/2000/svg',
										viewBox: '0 0 24 24',
										fill: 'none',
										stroke: 'currentColor',
										'stroke-width': '3',
										'stroke-linecap': 'round',
									},
									[h('path', { d: 'M5 12h14' })],
								)
							: null,
					]),
				],
			);
	},
});

export default TCheckbox;
