import { computed, defineComponent, h, inject, provide, ref, useId, type InjectionKey, type PropType, type Ref } from 'vue';
import { fieldStyleKeys, getFieldIds, getFieldMessageStyleKeys } from '@tile-ui/core';
import type { FieldMessageVariant } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/field.module.scss';

interface FieldContextValue {
	id: Ref<string>;
	labelId: Ref<string>;
	descriptionId: Ref<string>;
	messageId: Ref<string>;
	invalid: Ref<boolean>;
	required: Ref<boolean>;
}

const FieldContextKey: InjectionKey<FieldContextValue> = Symbol('tile-field');

export const Field = defineComponent({
	name: 'Field',
	props: {
		name: String,
		invalid: { type: Boolean, default: false },
		required: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const ids = getFieldIds(props.name ?? `tile-field-${useId()}`);
		const context: FieldContextValue = {
			id: ref(ids.id),
			labelId: ref(ids.labelId),
			descriptionId: ref(ids.descriptionId),
			messageId: ref(ids.messageId),
			invalid: computed(() => props.invalid),
			required: computed(() => props.required),
		};

		provide(FieldContextKey, context);

		return () =>
			h(
				'div',
				{
					...attrs,
					role: 'group',
					'data-slot': 'field',
					'data-invalid': props.invalid,
					'data-required': props.required,
					class: [styles[fieldStyleKeys.root], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const FieldLabel = defineComponent({
	name: 'FieldLabel',
	props: {
		htmlFor: String,
	},
	setup(props, { slots, attrs }) {
		const context = inject(FieldContextKey);
		if (!context) {
			throw new Error('FieldLabel must be used within <Field>.');
		}

		return () =>
			h(
				'label',
				{
					...attrs,
					id: context.id.value,
					for: props.htmlFor ?? context.id.value,
					'data-slot': 'field-label',
					class: [styles[fieldStyleKeys.label], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const FieldDescription = defineComponent({
	name: 'FieldDescription',
	setup(_props, { slots, attrs }) {
		const context = inject(FieldContextKey);
		if (!context) {
			throw new Error('FieldDescription must be used within <Field>.');
		}

		return () =>
			h(
				'p',
				{
					...attrs,
					id: context.descriptionId.value,
					'data-slot': 'field-description',
					class: [styles[fieldStyleKeys.description], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const FieldMessage = defineComponent({
	name: 'FieldMessage',
	props: {
		variant: {
			type: String as PropType<FieldMessageVariant>,
			default: 'default',
		},
	},
	setup(props, { slots, attrs }) {
		const context = inject(FieldContextKey);
		if (!context) {
			throw new Error('FieldMessage must be used within <Field>.');
		}

		const styleKeys = computed(() => getFieldMessageStyleKeys(props.variant));
		const classes = computed(() => [styles[styleKeys.value.base], styles[styleKeys.value.variant]]);

		return () =>
			h(
				'div',
				{
					...attrs,
					id: context.messageId.value,
					role: props.variant === 'error' ? 'alert' : undefined,
					'data-slot': 'field-message',
					'data-variant': props.variant,
					class: [...classes.value, attrs.class],
				},
				slots.default?.(),
			);
	},
});

export default Field;
