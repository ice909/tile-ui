import { computed, defineComponent, h, type PropType } from 'vue';
import { getInputGroupAddonStyleKeys, getInputGroupStyleKeys, inputGroupStyleKeys } from '@tile-ui/core';
import type { InputGroupAddonAlign, InputGroupVariant, ButtonVariant, ButtonSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/input-group.module.scss';
import { TButton } from '../button';

export const TInputGroup = defineComponent({
	name: 'TInputGroup',
	props: {
		variant: {
			type: String as PropType<InputGroupVariant>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getInputGroupStyleKeys(props.variant));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant]]);

		return () => h('div', { ...attrs, role: 'group', 'data-slot': 'input-group', 'data-variant': props.variant, class: [...classes.value, attrs.class] }, slots.default?.());
	},
});

export const TInputGroupAddon = defineComponent({
	name: 'TInputGroupAddon',
	props: {
		variant: {
			type: String as PropType<InputGroupVariant>,
			default: 'default',
		},
		align: {
			type: String as PropType<InputGroupAddonAlign>,
			default: 'inline-start',
		},
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getInputGroupAddonStyleKeys(props.variant));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant]]);

		function handleClick(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (target.closest('button')) {
				return;
			}
			(event.currentTarget as HTMLElement).parentElement?.querySelector('input')?.focus();
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					role: 'group',
					'data-slot': 'input-group-addon',
					'data-variant': props.variant,
					'data-align': props.align,
					class: [...classes.value, attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export const TInputGroupButton = defineComponent({
	name: 'TInputGroupButton',
	props: {
		variant: {
			type: String as PropType<ButtonVariant>,
			default: 'ghost',
		},
		size: {
			type: String as PropType<ButtonSize>,
			default: 'sm',
		},
		type: {
			type: String as PropType<'button' | 'submit' | 'reset'>,
			default: 'button',
		},
	},
	setup(props, { slots, attrs }) {
		return () =>
			h(
				TButton,
				{
					...attrs,
					type: props.type,
					variant: props.variant,
					size: props.size,
					class: [styles[inputGroupStyleKeys.button], attrs.class],
				},
				() => slots.default?.(),
			);
	},
});

export const TInputGroupText = defineComponent({
	name: 'TInputGroupText',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, 'data-slot': 'input-group-text', class: [styles[inputGroupStyleKeys.text], attrs.class] }, slots.default?.());
	},
});

export const TInputGroupInput = defineComponent({
	name: 'TInputGroupInput',
	props: {
		modelValue: String,
		placeholder: String,
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, attrs }) {
		function handleInput(event: Event) {
			emit('update:modelValue', (event.target as HTMLInputElement).value);
		}

		return () =>
			h('input', {
				...attrs,
				'data-slot': 'input-group-control',
				value: props.modelValue,
				placeholder: props.placeholder,
				disabled: props.disabled,
				class: [styles[inputGroupStyleKeys.input], attrs.class],
				onInput: handleInput,
			});
	},
});

export const TInputGroupTextarea = defineComponent({
	name: 'TInputGroupTextarea',
	props: {
		modelValue: String,
		placeholder: String,
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, attrs }) {
		function handleInput(event: Event) {
			emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
		}

		return () =>
			h('textarea', {
				...attrs,
				'data-slot': 'input-group-control',
				value: props.modelValue,
				placeholder: props.placeholder,
				disabled: props.disabled,
				class: [styles[inputGroupStyleKeys.textarea], attrs.class],
				onInput: handleInput,
			});
	},
});

export default TInputGroup;
