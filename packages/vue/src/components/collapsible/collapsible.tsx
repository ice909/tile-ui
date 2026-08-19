import { computed, defineComponent, h, inject, provide, ref, useId, type ComputedRef, type InjectionKey } from 'vue';
import { collapsibleStyleKeys, getCollapsibleState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/collapsible.module.scss';

interface CollapsibleContextValue {
	open: boolean;
	disabled: boolean;
	contentId: string;
	toggle: () => void;
}

type CollapsibleContext = ComputedRef<CollapsibleContextValue>;

const CollapsibleContextKey: InjectionKey<CollapsibleContext> = Symbol('tile-collapsible');

export const Collapsible = defineComponent({
	name: 'Collapsible',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const contentId = `tile-collapsible-${useId()}`;

		function toggle() {
			if (props.disabled) {
				return;
			}

			const next = !isOpen.value;

			if (props.open === undefined) {
				internalOpen.value = next;
			}

			emit('update:open', next);
		}

		const context = computed<CollapsibleContextValue>(() => ({
			open: isOpen.value,
			disabled: props.disabled,
			contentId,
			toggle,
		}));

		provide(CollapsibleContextKey, context);

		return () => h('div', { class: styles[collapsibleStyleKeys.root] }, slots.default?.());
	},
});

export const CollapsibleTrigger = defineComponent({
	name: 'CollapsibleTrigger',
	setup(_props, { slots }) {
		const context = inject(CollapsibleContextKey);
		if (!context) {
			throw new Error('CollapsibleTrigger must be used within <Collapsible>.');
		}

		return () =>
			h(
				'button',
				{
					type: 'button',
					'aria-expanded': context.value.open,
					'aria-controls': context.value.contentId,
					'data-state': getCollapsibleState(context.value.open),
					disabled: context.value.disabled,
					class: styles[collapsibleStyleKeys.trigger],
					onClick: context.value.toggle,
				},
				slots.default?.(),
			);
	},
});

export const CollapsibleContent = defineComponent({
	name: 'CollapsibleContent',
	setup(_props, { slots }) {
		const context = inject(CollapsibleContextKey);
		if (!context) {
			throw new Error('CollapsibleContent must be used within <Collapsible>.');
		}

		return () =>
			h('div', { id: context.value.contentId, 'data-state': getCollapsibleState(context.value.open), class: styles[collapsibleStyleKeys.content] }, [
				h('div', { class: styles[collapsibleStyleKeys.contentInner] }, slots.default?.()),
			]);
	},
});

export default Collapsible;
