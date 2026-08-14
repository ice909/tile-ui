import { computed, defineComponent, h } from 'vue';
import { aspectRatioStyleKeys, getAspectRatioPadding } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/aspect-ratio.module.scss';

export const TAspectRatio = defineComponent({
	name: 'TAspectRatio',
	props: {
		ratio: { type: Number, default: 1 },
	},
	setup(props, { slots, attrs }) {
		const paddingTop = computed(() => `${getAspectRatioPadding(props.ratio)}%`);

		return () =>
			h(
				'div',
				{
					...attrs,
					'data-slot': 'aspect-ratio',
					class: [styles[aspectRatioStyleKeys.root], attrs.class],
					style: [attrs.style, { paddingTop: paddingTop.value }],
				},
				[h('div', { class: styles[aspectRatioStyleKeys.content] }, slots.default?.())],
			);
	},
});

export default TAspectRatio;
