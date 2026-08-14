import { defineComponent, computed, h, type PropType } from 'vue';
import { getSwitchState, switchStyleKeys } from '@tile-ui/core';
import type { SwitchSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/switch.module.scss';

export const TSwitch = defineComponent({
	name: 'TSwitch',
	props: {
		modelValue: { type: Boolean, default: false },
		size: {
			type: String as PropType<SwitchSize>,
			default: 'default',
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit }) {
		const state = computed(() => getSwitchState(props.modelValue));

		function handleClick() {
			const next = !props.modelValue;
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h(
				'button',
				{
					type: 'button',
					role: 'switch',
					'aria-checked': props.modelValue ? 'true' : 'false',
					'data-state': state.value,
					'data-size': props.size,
					disabled: props.disabled,
					class: styles[switchStyleKeys.root],
					onClick: handleClick,
				},
				[h('span', { class: styles[switchStyleKeys.thumb] })],
			);
	},
});

export default TSwitch;
