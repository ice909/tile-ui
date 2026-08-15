import { computed, defineComponent, h, inject, provide, ref, useId, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import { accordionStyleKeys, getAccordionState, getAccordionNextValues } from '@tile-ui/core';
import type { AccordionType } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/accordion.module.scss';

interface AccordionContextValue {
	type: AccordionType;
	collapsible: boolean;
	value: string | string[];
	toggleItem: (value: string) => void;
}

type AccordionContext = ComputedRef<AccordionContextValue>;

const AccordionContextKey: InjectionKey<AccordionContext> = Symbol('tile-accordion');

interface AccordionItemContextValue {
	value: string;
	open: boolean;
	disabled: boolean;
	contentId: string;
}

type AccordionItemContext = ComputedRef<AccordionItemContextValue>;

const AccordionItemContextKey: InjectionKey<AccordionItemContext> = Symbol('tile-accordion-item');

export const TAccordion = defineComponent({
	name: 'TAccordion',
	props: {
		modelValue: {
			type: [String, Array] as PropType<string | string[]>,
			default: undefined,
		},
		defaultValue: {
			type: [String, Array] as PropType<string | string[]>,
			default: undefined,
		},
		type: {
			type: String as PropType<AccordionType>,
			default: 'single',
		},
		collapsible: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, slots }) {
		const internalValue = ref<string | string[]>(
			props.modelValue !== undefined ? props.modelValue : props.defaultValue !== undefined ? props.defaultValue : props.type === 'multiple' ? [] : '',
		);
		const currentValue = computed<string | string[]>(() => (props.modelValue !== undefined ? props.modelValue : internalValue.value));
		const normalized = computed<string | string[]>(() =>
			props.type === 'multiple' ? (Array.isArray(currentValue.value) ? currentValue.value : []) : typeof currentValue.value === 'string' ? currentValue.value : '',
		);

		function toggleItem(itemValue: string) {
			let next: string | string[];

			if (props.type === 'multiple') {
				const list = Array.isArray(normalized.value) ? normalized.value : [];
				next = getAccordionNextValues(itemValue, list);
			} else if (normalized.value === itemValue) {
				next = props.collapsible ? '' : normalized.value;
			} else {
				next = itemValue;
			}

			if (props.modelValue === undefined) {
				internalValue.value = next;
			}

			emit('update:modelValue', next);
			emit('change', next);
		}

		const context = computed<AccordionContextValue>(() => ({
			type: props.type,
			collapsible: props.collapsible,
			value: normalized.value,
			toggleItem,
		}));

		provide(AccordionContextKey, context);

		return () => h('div', { class: styles[accordionStyleKeys.root] }, slots.default?.());
	},
});

export const TAccordionItem = defineComponent({
	name: 'TAccordionItem',
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots }) {
		const accordion = inject(AccordionContextKey);
		if (!accordion) {
			throw new Error('TAccordionItem must be used within <TAccordion>.');
		}

		const open = computed(() =>
			accordion.value.type === 'multiple' ? Array.isArray(accordion.value.value) && accordion.value.value.includes(props.value) : accordion.value.value === props.value,
		);

		const contentId = `tile-accordion-${useId()}`;

		const itemContext = computed<AccordionItemContextValue>(() => ({
			value: props.value,
			open: open.value,
			disabled: props.disabled,
			contentId,
		}));

		provide(AccordionItemContextKey, itemContext);

		return () => h('div', { class: styles[accordionStyleKeys.item], 'data-state': getAccordionState(open.value) }, slots.default?.());
	},
});

export const TAccordionTrigger = defineComponent({
	name: 'TAccordionTrigger',
	setup(_props, { slots }) {
		const accordion = inject(AccordionContextKey);
		if (!accordion) {
			throw new Error('TAccordionTrigger must be used within <TAccordion>.');
		}

		const item = inject(AccordionItemContextKey);
		if (!item) {
			throw new Error('TAccordionTrigger must be used within <TAccordionItem>.');
		}

		return () =>
			h('div', { class: styles[accordionStyleKeys.header] }, [
				h(
					'button',
					{
						type: 'button',
						'aria-expanded': item.value.open,
						'aria-controls': item.value.contentId,
						'data-state': getAccordionState(item.value.open),
						disabled: item.value.disabled,
						class: styles[accordionStyleKeys.trigger],
						onClick: () => accordion.value.toggleItem(item.value.value),
					},
					[
						slots.default?.(),
						h(
							'svg',
							{
								class: styles[accordionStyleKeys.chevron],
								xmlns: 'http://www.w3.org/2000/svg',
								width: '16',
								height: '16',
								viewBox: '0 0 24 24',
								fill: 'none',
								stroke: 'currentColor',
								'stroke-width': '2',
								'stroke-linecap': 'round',
								'stroke-linejoin': 'round',
							},
							[h('path', { d: 'm6 9 6 6 6-6' })],
						),
					],
				),
			]);
	},
});

export const TAccordionContent = defineComponent({
	name: 'TAccordionContent',
	setup(_props, { slots }) {
		const item = inject(AccordionItemContextKey);
		if (!item) {
			throw new Error('TAccordionContent must be used within <TAccordionItem>.');
		}

		return () =>
			h('div', { id: item.value.contentId, 'data-state': getAccordionState(item.value.open), class: styles[accordionStyleKeys.content] }, [
				h('div', { class: styles[accordionStyleKeys.contentInner] }, slots.default?.()),
			]);
	},
});

export default TAccordion;
