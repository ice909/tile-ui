import { defineComponent, h } from 'vue';
import { kbdStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/kbd.module.scss';

export const TKbd = defineComponent({
	name: 'TKbd',
	setup(_props, { slots }) {
		return () => h('kbd', { class: styles[kbdStyleKeys.base] }, slots.default?.());
	},
});

export const TKbdGroup = defineComponent({
	name: 'TKbdGroup',
	setup(_props, { slots }) {
		return () => h('kbd', { class: styles[kbdStyleKeys.group] }, slots.default?.());
	},
});

export default TKbd;
