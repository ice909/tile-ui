import { defineComponent, computed, h, type PropType } from 'vue';
import { getSeparatorStyleKeys } from '@tile-ui/core';
import type { SeparatorOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/separator.module.scss';

export const TSeparator = defineComponent({
	name: 'TSeparator',
	props: {
		orientation: {
			type: String as PropType<SeparatorOrientation>,
			default: 'horizontal',
		},
		decorative: { type: Boolean, default: true },
	},
	setup(props) {
		const styleKeys = computed(() => getSeparatorStyleKeys(props.orientation));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.orientation]]);

		return () =>
			h('div', {
				class: classes.value,
				role: props.decorative ? 'none' : 'separator',
				'aria-orientation': props.decorative ? undefined : props.orientation,
			});
	},
});

export default TSeparator;
