import { cloneVNode, computed, defineComponent, h, type PropType } from 'vue';
import { getItemVariantKey, itemStyleKeys } from '@tile-ui/core';
import type { ItemVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/item.module.scss';

export const TItemGroup = defineComponent({
	name: 'TItemGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'list', 'data-slot': 'item-group', class: [styles[itemStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const TItemSeparator = defineComponent({
	name: 'TItemSeparator',
	setup(_props, { attrs }) {
		return () =>
			h('div', { ...attrs, role: 'separator', 'aria-orientation': 'horizontal', 'data-slot': 'item-separator', class: [styles[itemStyleKeys.separator], attrs.class] });
	},
});

export const TItem = defineComponent({
	name: 'TItem',
	props: {
		variant: {
			type: String as PropType<ItemVariant>,
			default: 'neutral',
		},
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const variantKey = computed(() => getItemVariantKey(props.variant));

		return () => {
			const children = slots.default?.();
			const variantKeyValue = variantKey.value;
			const rootClass = [styles[itemStyleKeys.item], styles[variantKeyValue]];

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as { class?: unknown };
					return cloneVNode(firstChild, {
						...attrs,
						'data-slot': 'item',
						'data-variant': props.variant,
						class: [styles[itemStyleKeys.item], styles[variantKeyValue], attrs.class, childProps.class].filter(Boolean),
					});
				}
			}

			return h('div', { ...attrs, 'data-slot': 'item', 'data-variant': props.variant, class: [...rootClass, attrs.class] }, children);
		};
	},
});

export const TItemMedia = defineComponent({
	name: 'TItemMedia',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-media', class: [styles[itemStyleKeys.media], attrs.class] }, slots.default?.());
	},
});

export const TItemContent = defineComponent({
	name: 'TItemContent',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-content', class: [styles[itemStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const TItemTitle = defineComponent({
	name: 'TItemTitle',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-title', class: [styles[itemStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const TItemDescription = defineComponent({
	name: 'TItemDescription',
	setup(_props, { slots, attrs }) {
		return () => h('p', { ...attrs, 'data-slot': 'item-description', class: [styles[itemStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const TItemActions = defineComponent({
	name: 'TItemActions',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-actions', class: [styles[itemStyleKeys.actions], attrs.class] }, slots.default?.());
	},
});

export const TItemHeader = defineComponent({
	name: 'TItemHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-header', class: [styles[itemStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TItemFooter = defineComponent({
	name: 'TItemFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-footer', class: [styles[itemStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export default TItem;
