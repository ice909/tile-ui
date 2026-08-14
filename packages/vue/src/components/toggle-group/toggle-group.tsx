import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { getToggleGroupItemState, getToggleStyleKeys, toggleGroupStyleKeys, toggleValueInList } from '@tile-ui/core';
import type { ToggleGroupType, ToggleVariant, ToggleSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/toggle-group.module.scss';

type ToggleGroupValue = string | string[];

interface ToggleGroupContextValue {
	type: 'single' | 'multiple';
	value: ToggleGroupValue;
	onItemClick: (itemValue: string) => void;
}

type ToggleGroupContext = ComputedRef<ToggleGroupContextValue>;

const ToggleGroupContextKey: InjectionKey<ToggleGroupContext> = Symbol('tile-toggle-group');

export const TToggleGroup = defineComponent({
	name: 'TToggleGroup',
	props: {
		modelValue: {
			type: [String, Array] as PropType<string | string[]>,
			default: undefined,
		},
		type: {
			type: String as PropType<ToggleGroupType>,
			default: 'single',
		},
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, slots, attrs }) {
		const internalValue = ref<string | string[]>(props.modelValue ?? (props.type === 'single' ? '' : []));
		const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));

		function handleItemClick(itemValue: string) {
			let next: string | string[];

			if (props.type === 'single') {
				next = currentValue.value === itemValue ? '' : itemValue;
			} else {
				const list = Array.isArray(currentValue.value) ? currentValue.value : [];
				next = toggleValueInList(itemValue, list);
			}

			if (props.modelValue === undefined) {
				internalValue.value = next;
			}

			emit('update:modelValue', next);
			emit('change', next);
		}

		const context = computed<ToggleGroupContextValue>(() => ({
			type: props.type,
			value: currentValue.value,
			onItemClick: handleItemClick,
		}));

		provide(ToggleGroupContextKey, context);

		return () =>
			h('div', { ...attrs, role: 'group', 'data-slot': 'toggle-group', 'data-type': props.type, class: [styles[toggleGroupStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const TToggleGroupItem = defineComponent({
	name: 'TToggleGroupItem',
	props: {
		value: { type: String, required: true },
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
	setup(props, { slots, attrs }) {
		const context = inject(ToggleGroupContextKey);
		if (!context) {
			throw new Error('TToggleGroupItem must be used within <TToggleGroup>.');
		}
		const contextRef = context;

		const selected = computed(() =>
			contextRef.value.type === 'single'
				? contextRef.value.value === props.value
				: Array.isArray(contextRef.value.value)
					? contextRef.value.value.includes(props.value)
					: false,
		);
		const state = computed(() => getToggleGroupItemState(selected.value));
		const styleKeys = computed(() => getToggleStyleKeys(props.variant, props.size));
		const classes = computed(() => [styles[toggleGroupStyleKeys.item], styles[styleKeys.value.variant], styles[styleKeys.value.size]]);

		function handleClick() {
			contextRef.value.onItemClick(props.value);
		}

		return () =>
			h(
				'button',
				{
					...attrs,
					type: 'button',
					value: props.value,
					role: 'button',
					'aria-pressed': selected.value ? 'true' : 'false',
					'data-state': state.value,
					'data-active': selected.value,
					disabled: props.disabled,
					class: [...classes.value, attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export default TToggleGroup;
