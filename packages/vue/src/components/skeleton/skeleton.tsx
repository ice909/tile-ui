import { defineComponent, h } from 'vue';
import { skeletonStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/skeleton.module.scss';

export const Skeleton = defineComponent({
	name: 'Skeleton',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[skeletonStyleKeys.base], attrs.class] }, slots.default?.());
	},
});

export default Skeleton;
