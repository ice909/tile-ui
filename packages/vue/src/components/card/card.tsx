import { defineComponent, h, type PropType } from 'vue';
import { cardStyleKeys } from '@tile-ui/core';
import type { CardElement } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/card.module.scss';

export const Card = defineComponent({
	name: 'Card',
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

export const CardHeader = defineComponent({
	name: 'CardHeader',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const CardTitle = defineComponent({
	name: 'CardTitle',
	setup(_, { slots, attrs }) {
		return () => h('h3', { ...attrs, class: [styles[cardStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const CardDescription = defineComponent({
	name: 'CardDescription',
	setup(_, { slots, attrs }) {
		return () => h('p', { ...attrs, class: [styles[cardStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const CardAction = defineComponent({
	name: 'CardAction',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.action], attrs.class] }, slots.default?.());
	},
});

export const CardContent = defineComponent({
	name: 'CardContent',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const CardFooter = defineComponent({
	name: 'CardFooter',
	setup(_, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[cardStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export default Card;
