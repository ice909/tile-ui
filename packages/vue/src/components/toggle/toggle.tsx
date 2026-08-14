import { computed, defineComponent, h, type PropType } from 'vue';
import { getToggleState, getToggleStyleKeys } from '@tile-ui/core';
import type { ToggleVariant, ToggleSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/toggle.module.scss';

export const TToggle = defineComponent({
	name: 'TToggle',
	props: {
		modelValue: { type: Boolean, default: false },
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
		const state = computed(() => getToggleState(props.modelValue));
		const styleKeys = computed(() => getToggleStyleKeys(props.variant, props.size));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant], styles[styleKeys.value.size]]);

		function handleClick() {
			const next = !props.modelValue;
			emit('update:modelValue', next);
			emit('change', next);
		}

		return () =>
			h(
				'button',
				{
					...attrs,
					type: 'button',
					role: 'button',
					'aria-pressed': props.modelValue ? 'true' : 'false',
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

export default TToggle;
