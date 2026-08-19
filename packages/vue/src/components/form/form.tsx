import {
	cloneVNode,
	computed,
	defineComponent,
	h,
	inject,
	onBeforeUnmount,
	onMounted,
	provide,
	ref,
	useId,
	type ComputedRef,
	type InjectionKey,
	type PropType,
	type Ref,
} from 'vue';
import { createFormStore, formStyleKeys, getFormFieldIds, normalizeFormValue, FormStore } from '@tile-ui/core';
import type { FormControllerField, FormErrors, FormValues } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/form.module.scss';

interface FormContextValue {
	store: FormStore;
	version: Ref<number>;
}

const FormContextKey: InjectionKey<FormContextValue> = Symbol('tile-form');

const FormFieldContextKey: InjectionKey<ComputedRef<string>> = Symbol('tile-form-field');

const FormItemContextKey: InjectionKey<ComputedRef<string>> = Symbol('tile-form-item');

function useFormContext(): FormContextValue {
	const context = inject(FormContextKey);
	if (!context) {
		throw new Error('表单子组件必须在 <Form> 内使用');
	}
	return context;
}

function useFormField() {
	const { store, version } = useFormContext();
	const fieldName = inject(FormFieldContextKey);
	const itemId = inject(FormItemContextKey);

	if (!fieldName) {
		throw new Error('useFormField 必须在 <FormField> 内使用');
	}

	return computed(() => {
		void version.value;
		const name = fieldName.value;
		const ids = getFormFieldIds(itemId?.value ?? 'tile-form-field');
		const fieldState = store.getFieldState(name);

		return {
			id: ids.id,
			name,
			formItemId: ids.formItemId,
			formDescriptionId: ids.formDescriptionId,
			formMessageId: ids.formMessageId,
			error: fieldState.error,
			isTouched: fieldState.isTouched,
			isDirty: fieldState.isDirty,
		};
	});
}

export const Form = defineComponent({
	name: 'Form',
	props: {
		defaultValues: { type: Object as PropType<FormValues>, default: () => ({}) },
		resolver: { type: Function as PropType<(values: FormValues) => FormErrors | Promise<FormErrors>>, default: undefined },
		form: { type: Object as PropType<FormStore>, default: undefined },
	},
	setup(props, { slots }) {
		const store = props.form ?? createFormStore(props.defaultValues, props.resolver);
		const version = ref(0);
		store.subscribe(() => {
			version.value += 1;
		});

		provide(FormContextKey, { store, version });

		return () => slots.default?.();
	},
});

export const FormField = defineComponent({
	name: 'FormField',
	props: {
		name: { type: String, required: true },
	},
	setup(props, { slots }) {
		const { store, version } = useFormContext();

		onMounted(() => {
			store.registerField(props.name);
		});

		onBeforeUnmount(() => {
			store.unregisterField(props.name);
		});

		provide(
			FormFieldContextKey,
			computed(() => props.name),
		);

		return () => {
			void version.value;
			const field: FormControllerField = {
				name: props.name,
				value: store.getValue(props.name),
				onChange: (value: unknown) => store.setValue(props.name, normalizeFormValue(value)),
				onBlur: () => store.blurField(props.name),
				ref: props.name,
			};

			return slots.default ? slots.default({ field }) : null;
		};
	},
});

export const FormItem = defineComponent({
	name: 'FormItem',
	setup(_props, { slots, attrs }) {
		const id = `tile-form-item-${useId()}`;
		provide(
			FormItemContextKey,
			computed(() => id),
		);

		return () => h('div', { ...attrs, 'data-slot': 'form-item', class: [styles[formStyleKeys.item], attrs.class] }, slots.default?.());
	},
});

export const FormLabel = defineComponent({
	name: 'FormLabel',
	setup(_props, { slots, attrs }) {
		const field = useFormField();

		return () =>
			h(
				'label',
				{
					...attrs,
					'data-slot': 'form-label',
					'data-error': field.value.error ? 'true' : 'false',
					for: field.value.formItemId,
					class: [styles[formStyleKeys.label], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const FormControl = defineComponent({
	name: 'FormControl',
	setup(_props, { slots }) {
		const field = useFormField();

		return () => {
			const f = field.value;
			const controlProps = {
				id: f.formItemId,
				'aria-describedby': !f.error ? f.formDescriptionId : `${f.formDescriptionId} ${f.formMessageId}`,
				'aria-invalid': f.error ? 'true' : 'false',
			};

			const child = slots.default?.()[0];
			if (child) {
				return cloneVNode(child, { ...controlProps, 'data-slot': 'form-control' });
			}

			return h('div', { ...controlProps, 'data-slot': 'form-control' });
		};
	},
});

export const FormDescription = defineComponent({
	name: 'FormDescription',
	setup(_props, { slots, attrs }) {
		const field = useFormField();

		return () =>
			h('p', { ...attrs, 'data-slot': 'form-description', id: field.value.formDescriptionId, class: [styles[formStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const FormMessage = defineComponent({
	name: 'FormMessage',
	setup(_props, { slots, attrs }) {
		const field = useFormField();

		return () => {
			const error = field.value.error;
			const body = error ? String(error.message ?? '') : slots.default?.();

			if (!body) {
				return null;
			}

			return h('p', { ...attrs, 'data-slot': 'form-message', id: field.value.formMessageId, class: [styles[formStyleKeys.message], attrs.class] }, body);
		};
	},
});

export default Form;
