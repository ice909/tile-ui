import { defineComponent, h, type PropType } from 'vue';
import { getSpinnerSize, spinnerStyleKeys } from '@tile-ui/core';
import type { SpinnerSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/spinner.module.scss';

export const Spinner = defineComponent({
	name: 'Spinner',
	props: {
		size: {
			type: String as PropType<SpinnerSize>,
			default: 'default',
		},
	},
	setup(props, { attrs }) {
		return () =>
			h(
				'svg',
				{
					...attrs,
					'data-slot': 'spinner',
					role: 'status',
					'aria-label': 'Loading',
					'data-size': getSpinnerSize(props.size),
					xmlns: 'http://www.w3.org/2000/svg',
					viewBox: '0 0 24 24',
					fill: 'none',
					stroke: 'currentColor',
					'stroke-width': 2,
					'stroke-linecap': 'round',
					'stroke-linejoin': 'round',
					class: [styles[spinnerStyleKeys.root], attrs.class],
				},
				[h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' })],
			);
	},
});

export default Spinner;
