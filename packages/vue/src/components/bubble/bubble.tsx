import { cloneVNode, defineComponent, h, type PropType } from 'vue';
import { bubbleStyleKeys, getBubbleStyleKeys } from '@tile-ui/core';
import type { BubbleAlign, BubbleReactionsSide, BubbleVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/bubble.module.scss';

export const BubbleGroup = defineComponent({
	name: 'BubbleGroup',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'bubble-group', class: styles[bubbleStyleKeys.group] }, slots.default?.());
	},
});

export const Bubble = defineComponent({
	name: 'Bubble',
	props: {
		variant: { type: String as PropType<BubbleVariant>, default: 'default' },
		align: { type: String as PropType<BubbleAlign>, default: 'start' },
	},
	setup(props, { slots }) {
		return () => {
			const styleKeys = getBubbleStyleKeys(props.variant);
			return h(
				'div',
				{
					'data-slot': 'bubble',
					'data-variant': props.variant,
					'data-align': props.align,
					class: [styles[styleKeys.base], styles[styleKeys.variant]],
				},
				slots.default?.(),
			);
		};
	},
});

export const BubbleContent = defineComponent({
	name: 'BubbleContent',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			const slotChildren = slots.default?.();
			const firstChild = Array.isArray(slotChildren) ? slotChildren[0] : slotChildren;

			if (props.asChild && firstChild) {
				return cloneVNode(firstChild, {
					...restAttrs,
					'data-slot': 'bubble-content',
					class: [styles[bubbleStyleKeys.content], userClass, (firstChild.props as Record<string, unknown> | null)?.class],
				});
			}

			return h('div', { ...restAttrs, 'data-slot': 'bubble-content', class: [styles[bubbleStyleKeys.content], userClass] }, slotChildren);
		};
	},
});

export const BubbleReactions = defineComponent({
	name: 'BubbleReactions',
	props: {
		side: { type: String as PropType<BubbleReactionsSide>, default: 'bottom' },
		align: { type: String as PropType<BubbleAlign>, default: 'end' },
	},
	setup(props, { slots }) {
		return () =>
			h(
				'div',
				{
					'data-slot': 'bubble-reactions',
					'data-side': props.side,
					'data-align': props.align,
					class: styles[bubbleStyleKeys.reactions],
				},
				slots.default?.(),
			);
	},
});

export default Bubble;
