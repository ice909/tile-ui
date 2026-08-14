import { defineComponent, computed, h, type PropType } from 'vue';
import { getBadgeStyleKeys } from '@tile-ui/core';
import type { BadgeVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/badge.module.scss';

export const TBadge = defineComponent({
	name: 'TBadge',
	props: {
		variant: {
			type: String as PropType<BadgeVariant>,
			default: 'default',
		},
	},
	setup(props, { slots }) {
		const styleKeys = computed(() => getBadgeStyleKeys(props.variant));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant]]);

		return () => h('span', { class: classes.value }, slots.default?.());
	},
});

export default TBadge;
