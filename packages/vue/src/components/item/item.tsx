import { cloneVNode, computed, defineComponent, h, type PropType } from 'vue';
import { getItemMediaVariantKey, getItemSizeKey, getItemVariantKey, itemStyleKeys } from '@tile-ui/core';
import type { ItemMediaVariant, ItemSize, ItemVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/item.module.scss';

export const ItemGroup = defineComponent({
	name: 'ItemGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'list', 'data-slot': 'item-group', class: [styles[itemStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const ItemSeparator = defineComponent({
	name: 'ItemSeparator',
	setup(_props, { attrs }) {
		return () =>
			h('div', { ...attrs, role: 'separator', 'aria-orientation': 'horizontal', 'data-slot': 'item-separator', class: [styles[itemStyleKeys.separator], attrs.class] });
	},
});

export const Item = defineComponent({
	name: 'Item',
	props: {
		variant: {
			type: String as PropType<ItemVariant>,
			default: 'default',
		},
		size: {
			type: String as PropType<ItemSize>,
			default: 'default',
		},
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const variantKey = computed(() => getItemVariantKey(props.variant));
		const sizeKey = computed(() => getItemSizeKey(props.size));

		return () => {
			const children = slots.default?.();
			const rootClass = [styles[itemStyleKeys.item], styles[variantKey.value], styles[sizeKey.value]];

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as { class?: unknown };
					return cloneVNode(firstChild, {
						...attrs,
						'data-slot': 'item',
						'data-variant': props.variant,
						'data-size': props.size,
						class: [styles[itemStyleKeys.item], styles[variantKey.value], styles[sizeKey.value], attrs.class, childProps.class].filter(Boolean),
					});
				}
			}

			return h('div', { ...attrs, 'data-slot': 'item', 'data-variant': props.variant, 'data-size': props.size, class: [...rootClass, attrs.class] }, children);
		};
	},
});

export const ItemMedia = defineComponent({
	name: 'ItemMedia',
	props: {
		variant: {
			type: String as PropType<ItemMediaVariant>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const variantKey = computed(() => getItemMediaVariantKey(props.variant));
		return () =>
			h(
				'div',
				{ ...attrs, 'data-slot': 'item-media', 'data-variant': props.variant, class: [styles[itemStyleKeys.media], styles[variantKey.value], attrs.class] },
				slots.default?.(),
			);
	},
});

export const ItemContent = defineComponent({
	name: 'ItemContent',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-content', class: [styles[itemStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const ItemTitle = defineComponent({
	name: 'ItemTitle',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-title', class: [styles[itemStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const ItemDescription = defineComponent({
	name: 'ItemDescription',
	setup(_props, { slots, attrs }) {
		return () => h('p', { ...attrs, 'data-slot': 'item-description', class: [styles[itemStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const ItemActions = defineComponent({
	name: 'ItemActions',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-actions', class: [styles[itemStyleKeys.actions], attrs.class] }, slots.default?.());
	},
});

export const ItemHeader = defineComponent({
	name: 'ItemHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-header', class: [styles[itemStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const ItemFooter = defineComponent({
	name: 'ItemFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'item-footer', class: [styles[itemStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export default Item;
