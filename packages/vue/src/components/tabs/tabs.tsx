import { computed, defineComponent, h, inject, provide, ref, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { getTabsState, tabsStyleKeys } from '@tile-ui/core';
import type { TabsOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/tabs.module.scss';

interface TabsContextValue {
	value: string;
	orientation: TabsOrientation;
	select: (value: string) => void;
}

type TabsContext = ComputedRef<TabsContextValue>;

const TabsContextKey: InjectionKey<TabsContext> = Symbol('tile-tabs');

export const TTabs = defineComponent({
	name: 'TTabs',
	props: {
		modelValue: { type: String, default: undefined },
		defaultValue: { type: String, default: '' },
		orientation: {
			type: String as PropType<TabsOrientation>,
			default: 'horizontal',
		},
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, slots }) {
		const internalValue = ref(props.defaultValue);
		const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));

		const context = computed<TabsContextValue>(() => ({
			value: currentValue.value,
			orientation: props.orientation,
			select: (next: string) => {
				if (props.modelValue === undefined) {
					internalValue.value = next;
				}
				emit('update:modelValue', next);
				emit('change', next);
			},
		}));

		provide(TabsContextKey, context);

		return () => h('div', { class: styles[tabsStyleKeys.root], 'data-orientation': props.orientation }, slots.default?.());
	},
});

export const TTabsList = defineComponent({
	name: 'TTabsList',
	setup(_props, { slots }) {
		const context = inject(TabsContextKey);
		if (!context) {
			throw new Error('TTabsList must be used within <TTabs>.');
		}

		function handleKeydown(event: KeyboardEvent) {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
				return;
			}

			const triggers = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button[role="tab"]')).filter((trigger) => !trigger.disabled);

			if (triggers.length === 0) {
				return;
			}

			const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
			const direction = event.key === 'ArrowRight' ? 1 : -1;
			const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;

			triggers[nextIndex]?.focus();
			event.preventDefault();
		}

		return () => h('div', { class: styles[tabsStyleKeys.list], role: 'tablist', 'data-orientation': context.value.orientation, onKeydown: handleKeydown }, slots.default?.());
	},
});

export const TTabsTrigger = defineComponent({
	name: 'TTabsTrigger',
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots }) {
		const context = inject(TabsContextKey);
		if (!context) {
			throw new Error('TTabsTrigger must be used within <TTabs>.');
		}

		const active = computed(() => context.value.value === props.value);
		const state = computed(() => getTabsState(active.value));

		return () =>
			h(
				'button',
				{
					type: 'button',
					role: 'tab',
					'aria-selected': active.value,
					tabindex: active.value ? 0 : -1,
					disabled: props.disabled,
					'data-state': state.value,
					'data-orientation': context.value.orientation,
					class: styles[tabsStyleKeys.trigger],
					onClick: () => context.value.select(props.value),
				},
				slots.default?.(),
			);
	},
});

export const TTabsContent = defineComponent({
	name: 'TTabsContent',
	props: {
		value: { type: String, required: true },
	},
	setup(props, { slots }) {
		const context = inject(TabsContextKey);
		if (!context) {
			throw new Error('TTabsContent must be used within <TTabs>.');
		}

		const active = computed(() => context.value.value === props.value);
		const state = computed(() => getTabsState(active.value));

		return () =>
			h(
				'div',
				{
					role: 'tabpanel',
					'data-state': state.value,
					'data-orientation': context.value.orientation,
					hidden: !active.value,
					class: styles[tabsStyleKeys.content],
				},
				slots.default?.(),
			);
	},
});

export default TTabs;
