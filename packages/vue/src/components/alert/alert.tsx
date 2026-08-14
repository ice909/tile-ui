import { computed, defineComponent, h, type PropType } from 'vue';
import { alertStyleKeys, getAlertStyleKeys } from '@tile-ui/core';
import type { AlertVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/alert.module.scss';

export const TAlert = defineComponent({
	name: 'TAlert',
	props: {
		variant: {
			type: String as PropType<AlertVariant>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getAlertStyleKeys(props.variant));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant], attrs.class]);

		return () => h('div', { ...attrs, role: 'alert', 'data-slot': 'alert', 'data-variant': props.variant, class: classes.value }, slots.default?.());
	},
});

export const TAlertTitle = defineComponent({
	name: 'TAlertTitle',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'alert-title', class: [styles[alertStyleKeys.title], attrs.class] }, slots.default?.());
	},
});

export const TAlertDescription = defineComponent({
	name: 'TAlertDescription',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'alert-description', class: [styles[alertStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export default TAlert;
