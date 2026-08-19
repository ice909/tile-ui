import { defineComponent, h } from 'vue';
import { kbdStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/kbd.module.scss';

export const Kbd = defineComponent({
	name: 'Kbd',
	setup(_props, { slots }) {
		return () => h('kbd', { class: styles[kbdStyleKeys.base] }, slots.default?.());
	},
});

export const KbdGroup = defineComponent({
	name: 'KbdGroup',
	setup(_props, { slots }) {
		return () => h('kbd', { class: styles[kbdStyleKeys.group] }, slots.default?.());
	},
});

export default Kbd;
