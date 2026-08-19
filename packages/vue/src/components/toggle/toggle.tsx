import { computed, defineComponent, h, ref, type PropType } from 'vue';
import { getToggleState, getToggleStyleKeys } from '@tile-ui/core';
import type { ToggleVariant, ToggleSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/toggle.module.scss';

export const Toggle = defineComponent({
	name: 'Toggle',
	props: {
		modelValue: { type: Boolean, default: undefined },
		defaultValue: { type: Boolean, default: false },
		variant: {
			type: String as PropType<ToggleVariant>,
			default: 'default',
		},
		size: {
			type: String as PropType<ToggleSize>,
			default: 'default',
		},
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, attrs, slots }) {
		const internalValue = ref(props.defaultValue);
		const isPressed = computed(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));
		const state = computed(() => getToggleState(isPressed.value));
		const styleKeys = computed(() => getToggleStyleKeys(props.variant, props.size));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant], styles[styleKeys.value.size]]);

		function handleClick() {
			const next = !isPressed.value;
			if (props.modelValue === undefined) {
				internalValue.value = next;
			}
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h(
				'button',
				{
					...attrs,
					type: 'button',
					'aria-pressed': isPressed.value ? 'true' : 'false',
					'data-state': state.value,
					'data-variant': props.variant,
					'data-size': props.size,
					disabled: props.disabled,
					class: [...classes.value, attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export default Toggle;
