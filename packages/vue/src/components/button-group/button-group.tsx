import { cloneVNode, computed, defineComponent, h, type PropType } from 'vue';
import { buttonGroupStyleKeys, getButtonGroupStyleKeys } from '@tile-ui/core';
import type { ButtonGroupOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/button-group.module.scss';

export const TButtonGroup = defineComponent({
	name: 'TButtonGroup',
	props: {
		orientation: {
			type: String as PropType<ButtonGroupOrientation>,
			default: 'horizontal',
		},
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getButtonGroupStyleKeys(props.orientation));
		const rootClass = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.orientation]]);

		return () =>
			h('div', { ...attrs, role: 'group', 'data-slot': 'button-group', 'data-orientation': props.orientation, class: [...rootClass.value, attrs.class] }, slots.default?.());
	},
});

export const TButtonGroupText = defineComponent({
	name: 'TButtonGroupText',
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const children = slots.default?.();

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as { class?: unknown };
					return cloneVNode(firstChild, {
						...attrs,
						'data-slot': 'button-group-text',
						class: [styles[buttonGroupStyleKeys.text], attrs.class, childProps.class].filter(Boolean),
					});
				}
			}

			return h('div', { ...attrs, 'data-slot': 'button-group-text', class: [styles[buttonGroupStyleKeys.text], attrs.class] }, children);
		};
	},
});

export const TButtonGroupSeparator = defineComponent({
	name: 'TButtonGroupSeparator',
	props: {
		orientation: {
			type: String as PropType<ButtonGroupOrientation>,
			default: 'vertical',
		},
	},
	setup(props, { attrs }) {
		return () =>
			h('div', {
				...attrs,
				role: 'none',
				'aria-hidden': 'true',
				'data-slot': 'button-group-separator',
				'data-orientation': props.orientation,
				class: [styles[buttonGroupStyleKeys.separator], attrs.class],
			});
	},
});

export default TButtonGroup;
