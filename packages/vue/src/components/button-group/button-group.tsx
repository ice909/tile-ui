import { cloneVNode, computed, defineComponent, h, type PropType } from 'vue';
import { buttonGroupStyleKeys, getButtonGroupStyleKeys } from '@tile-ui/core';
import type { ButtonGroupVariant, ButtonGroupSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/button-group.module.scss';

export const TButtonGroup = defineComponent({
	name: 'TButtonGroup',
	props: {
		variant: {
			type: String as PropType<ButtonGroupVariant>,
			default: 'default',
		},
		size: {
			type: String as PropType<ButtonGroupSize>,
			default: 'default',
		},
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getButtonGroupStyleKeys(props.variant, props.size));
		const rootClass = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant], styles[styleKeys.value.size]]);

		return () => {
			const children = slots.default?.();

			if (props.asChild) {
				const firstChild = Array.isArray(children) ? children[0] : children;

				if (firstChild) {
					const childProps = (firstChild.props ?? {}) as { class?: unknown };
					return cloneVNode(firstChild, {
						...attrs,
						role: 'group',
						'data-slot': 'button-group',
						'data-variant': props.variant,
						'data-size': props.size,
						class: [...rootClass.value, attrs.class, childProps.class].filter(Boolean),
					});
				}
			}

			return h(
				'div',
				{ ...attrs, role: 'group', 'data-slot': 'button-group', 'data-variant': props.variant, 'data-size': props.size, class: [...rootClass.value, attrs.class] },
				children,
			);
		};
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
	setup(_props, { attrs }) {
		return () =>
			h('div', {
				...attrs,
				role: 'none',
				'aria-hidden': 'true',
				'data-slot': 'button-group-separator',
				class: [styles[buttonGroupStyleKeys.separator], attrs.class],
			});
	},
});

export default TButtonGroup;
