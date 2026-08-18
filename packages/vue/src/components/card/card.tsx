import { defineComponent, h, type PropType } from 'vue';
import { cardStyleKeys } from '@tile-ui/core';
import type { CardElement } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/card.module.scss';

export const TCard = defineComponent({
	name: 'TCard',
	props: {
		as: {
			type: String as PropType<CardElement>,
			default: 'div',
		},
	},
	setup(props, { slots, attrs }) {
		return () => h(props.as!, { ...attrs, class: [styles[cardStyleKeys.card], attrs.class] }, slots.default?.());
	},
});

export const TCardHeader = defineComponent({
	name: 'TCardHeader',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TCardTitle = defineComponent({
	name: 'TCardTitle',
	setup(_, { slots, attrs }) {
		return () => h('h3', { ...attrs, class: [styles[cardStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const TCardDescription = defineComponent({
	name: 'TCardDescription',
	setup(_, { slots, attrs }) {
		return () => h('p', { ...attrs, class: [styles[cardStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const TCardAction = defineComponent({
	name: 'TCardAction',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.action], attrs.class] }, slots.default?.());
	},
});

export const TCardContent = defineComponent({
	name: 'TCardContent',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const TCardFooter = defineComponent({
	name: 'TCardFooter',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export default TCard;
