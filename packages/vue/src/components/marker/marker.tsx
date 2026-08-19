import { cloneVNode, computed, defineComponent, h, type PropType } from 'vue';
import { getMarkerVariantKey, markerStyleKeys } from '@tile-ui/core';
import type { MarkerVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/marker.module.scss';

export const Marker = defineComponent({
	name: 'Marker',
	props: {
		variant: {
			type: String as PropType<MarkerVariant>,
			default: 'default',
		},
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const variantKey = computed(() => getMarkerVariantKey(props.variant));

		return () => {
			const children = slots.default?.();
			const variantKeyValue = variantKey.value;
			const rootClass = [styles[markerStyleKeys.root], styles[variantKeyValue]];

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as { class?: unknown };
					return cloneVNode(firstChild, {
						...attrs,
						'data-slot': 'marker',
						'data-variant': props.variant,
						class: [styles[markerStyleKeys.root], styles[variantKeyValue], attrs.class, childProps.class].filter(Boolean),
					});
				}
			}

			return h('div', { ...attrs, 'data-slot': 'marker', 'data-variant': props.variant, class: [...rootClass, attrs.class] }, children);
		};
	},
});

export const MarkerIcon = defineComponent({
	name: 'MarkerIcon',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, 'data-slot': 'marker-icon', 'aria-hidden': 'true', class: [styles[markerStyleKeys.icon], attrs.class] }, slots.default?.());
	},
});

export const MarkerContent = defineComponent({
	name: 'MarkerContent',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, 'data-slot': 'marker-content', class: [styles[markerStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export default Marker;
