import { defineComponent, computed, h } from 'vue';
import { getProgressOffset, progressStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/progress.module.scss';

export const TProgress = defineComponent({
	name: 'TProgress',
	props: {
		value: { type: Number, default: 0 },
		min: { type: Number, default: 0 },
		max: { type: Number, default: 100 },
	},
	setup(props) {
		const offset = computed(() => getProgressOffset(props.value, props.min, props.max));

		return () =>
			h(
				'div',
				{
					role: 'progressbar',
					'aria-valuemin': props.min,
					'aria-valuemax': props.max,
					'aria-valuenow': props.value,
					class: styles[progressStyleKeys.root],
				},
				[h('div', { class: styles[progressStyleKeys.indicator], style: { transform: `translateX(-${100 - offset.value}%)` } })],
			);
	},
});

export default TProgress;
