import { computed, defineComponent, h, type PropType } from 'vue';
import { emptyStyleKeys, getEmptyMediaVariantKey } from '@tile-ui/core';
import type { EmptyMediaVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/empty.module.scss';

export const Empty = defineComponent({
	name: 'Empty',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'empty', class: [styles[emptyStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const EmptyHeader = defineComponent({
	name: 'EmptyHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'empty-header', class: [styles[emptyStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const EmptyMedia = defineComponent({
	name: 'EmptyMedia',
	props: {
		variant: {
			type: String as PropType<EmptyMediaVariant>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const variantKey = computed(() => getEmptyMediaVariantKey(props.variant));
		const classes = computed(() => [styles[emptyStyleKeys.media], styles[variantKey.value], attrs.class]);

		return () => h('div', { ...attrs, 'data-slot': 'empty-icon', 'data-variant': props.variant, class: classes.value }, slots.default?.());
	},
});

export const EmptyTitle = defineComponent({
	name: 'EmptyTitle',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'empty-title', class: [styles[emptyStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const EmptyDescription = defineComponent({
	name: 'EmptyDescription',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'empty-description', class: [styles[emptyStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const EmptyContent = defineComponent({
	name: 'EmptyContent',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'empty-content', class: [styles[emptyStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export default Empty;
