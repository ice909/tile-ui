import { defineComponent, computed, h, type PropType } from 'vue';
import { getSeparatorStyleKeys } from '@tile-ui/core';
import type { SeparatorOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/separator.module.scss';

export const Separator = defineComponent({
	name: 'Separator',
	props: {
		orientation: {
			type: String as PropType<SeparatorOrientation>,
			default: 'horizontal',
		},
		decorative: { type: Boolean, default: true },
	},
	setup(props, { attrs }) {
		const styleKeys = computed(() => getSeparatorStyleKeys(props.orientation));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.orientation], attrs.class]);

		return () =>
			h('div', {
				...attrs,
				class: classes.value,
				role: props.decorative ? 'none' : 'separator',
				'aria-orientation': props.decorative ? undefined : props.orientation,
			});
	},
});

export default Separator;
