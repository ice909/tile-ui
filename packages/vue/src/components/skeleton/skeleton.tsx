import { defineComponent, h } from 'vue';
import { skeletonStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/skeleton.module.scss';

export const TSkeleton = defineComponent({
	name: 'TSkeleton',
	setup(_props, { slots }) {
		return () => h('div', { class: styles[skeletonStyleKeys.base] }, slots.default?.());
	},
});

export default TSkeleton;
