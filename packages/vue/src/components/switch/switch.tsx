import { defineComponent, computed, h, ref, type PropType } from 'vue';
import { getSwitchState, switchStyleKeys } from '@tile-ui/core';
import type { SwitchSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/switch.module.scss';

export const Switch = defineComponent({
	name: 'Switch',
	props: {
		modelValue: { type: Boolean, default: undefined },
		defaultChecked: { type: Boolean, default: false },
		size: {
			type: String as PropType<SwitchSize>,
			default: 'default',
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit }) {
		const internalChecked = ref(props.defaultChecked);
		const isChecked = computed(() => (props.modelValue !== undefined ? props.modelValue : internalChecked.value));
		const state = computed(() => getSwitchState(isChecked.value));

		function handleClick() {
			const next = !isChecked.value;
			if (props.modelValue === undefined) {
				internalChecked.value = next;
			}
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h(
				'button',
				{
					type: 'button',
					role: 'switch',
					'aria-checked': isChecked.value ? 'true' : 'false',
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

export default Switch;
