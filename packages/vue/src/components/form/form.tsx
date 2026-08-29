import {
	Comment,
	cloneVNode,
	computed,
	defineComponent,
	h,
	inject,
	onBeforeUnmount,
	provide,
	ref,
	useId,
	watch,
	type ComputedRef,
	type InjectionKey,
	type PropType,
	type Ref,
	type VNode,
} from 'vue';
import { createFormStore, formStyleKeys, getFormFieldIds, FormStore } from '@tile-ui/core';
import type { FormControllerField, FormErrors, FormRegisterOptions, FormValues } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/form.module.scss';

interface FormContextValue {
	store: FormStore;
	version: Ref<number>;
}

const FormContextKey: InjectionKey<FormContextValue> = Symbol('tile-form');

const FormFieldContextKey: InjectionKey<ComputedRef<string>> = Symbol('tile-form-field');

interface FormItemContextValue {
	id: ComputedRef<string>;
	declaredDescriptionId: ComputedRef<string | undefined>;
	declaredMessageId: ComputedRef<string | undefined>;
	descriptionIds: ComputedRef<string[]>;
	messageIds: ComputedRef<string[]>;
	registerDescription: (id: string) => () => void;
	registerMessage: (id: string) => () => void;
}

const FormItemContextKey: InjectionKey<FormItemContextValue> = Symbol('tile-form-item');

function useFormContext(): FormContextValue {
	const context = inject(FormContextKey);
	if (!context) {
		throw new Error('表单子组件必须在 <Form> 内使用');
	}
	return context;
}

/** 判断插槽产物是否包含可见内容（空字符串/纯注释视为无内容）。 */
function hasSlotContent(nodes: VNode[] | undefined): boolean {
	if (!nodes || nodes.length === 0) return false;
	return nodes.some((node) => {
		if (node.type === Comment) return false;
		if (typeof node.children === 'string') return node.children.trim().length > 0;
		return true;
	});
}

function useFormField() {
	const { store, version } = useFormContext();
	const fieldName = inject(FormFieldContextKey);
	const itemContext = inject(FormItemContextKey);

	if (!fieldName) {
		throw new Error('useFormField 必须在 <FormField> 内使用');
	}

	return computed(() => {
		void version.value;
		const name = fieldName.value;
		const ids = getFormFieldIds(itemContext?.id.value ?? 'tile-form-field');
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
		const unsubscribe = store.subscribe(() => {
			version.value += 1;
		});
		onBeforeUnmount(unsubscribe);

		provide(FormContextKey, { store, version });

		return () => slots.default?.();
	},
});

export const FormField = defineComponent({
	name: 'FormField',
	props: {
		name: { type: String, required: true },
		options: { type: Object as PropType<FormRegisterOptions>, default: () => ({}) },
	},
	setup(props, { slots }) {
		const { store, version } = useFormContext();
		let registration: ReturnType<FormStore['registerField']> | undefined;

		const stop = watch(
			() => [props.name, props.options] as const,
			([name, options]) => {
				registration?.unregister();
				registration = store.registerField(name, options);
			},
			{ immediate: true, deep: true },
		);

		onBeforeUnmount(() => {
			stop();
			registration?.unregister();
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
				onChange: (value: unknown) => registration?.onChange(value),
				onBlur: () => store.blurField(props.name),
				ref: props.name,
			};

			return slots.default ? slots.default({ field }) : null;
		};
	},
});

export const FormItem = defineComponent({
	name: 'FormItem',
	props: {
		descriptionId: { type: String, default: undefined },
		messageId: { type: String, default: undefined },
	},
	setup(props, { slots, attrs }) {
		const id = `tile-form-item-${useId()}`;
		const version = ref(0);
		const descriptions = new Set<string>();
		const messages = new Set<string>();
		if (props.descriptionId) descriptions.add(props.descriptionId);
		if (props.messageId) messages.add(props.messageId);
		const bump = () => {
			version.value += 1;
		};
		const register = (registry: Set<string>) => (registeredId: string) => {
			registry.add(registeredId);
			bump();
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				registry.delete(registeredId);
				bump();
			};
		};

		provide(FormItemContextKey, {
			id: computed(() => id),
			declaredDescriptionId: computed(() => props.descriptionId),
			declaredMessageId: computed(() => props.messageId),
			descriptionIds: computed(() => {
				void version.value;
				return [...descriptions];
			}),
			messageIds: computed(() => {
				void version.value;
				return [...messages];
			}),
			registerDescription: register(descriptions),
			registerMessage: register(messages),
		});

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
		const itemContext = inject(FormItemContextKey);

		return () => {
			const f = field.value;
			const describedByIds = [...(itemContext?.descriptionIds.value ?? [])];
			if (f.error) describedByIds.push(...(itemContext?.messageIds.value ?? []));
			const controlProps = {
				id: f.formItemId,
				'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
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
	props: {
		id: { type: String, default: undefined },
	},
	setup(props, { slots, attrs }) {
		const field = useFormField();
		const itemContext = inject(FormItemContextKey);
		const effectiveId = computed(() => props.id ?? itemContext?.declaredDescriptionId.value ?? field.value.formDescriptionId);

		let unregister: (() => void) | undefined;
		const stop = watch(
			effectiveId,
			(id) => {
				unregister?.();
				unregister = itemContext?.registerDescription(id);
			},
			{ immediate: true },
		);
		onBeforeUnmount(() => {
			stop();
			unregister?.();
		});

		return () => h('p', { ...attrs, 'data-slot': 'form-description', id: effectiveId.value, class: [styles[formStyleKeys.description], attrs.class] }, slots.default?.());
	},
});

export const FormMessage = defineComponent({
	name: 'FormMessage',
	props: {
		id: { type: String, default: undefined },
	},
	setup(props, { slots, attrs }) {
		const field = useFormField();
		const itemContext = inject(FormItemContextKey);
		const effectiveId = computed(() => props.id ?? itemContext?.declaredMessageId.value ?? field.value.formMessageId);
		let registeredId: string | undefined;
		let unregister: (() => void) | undefined;
		onBeforeUnmount(() => {
			unregister?.();
		});

		return () => {
			const error = field.value.error;
			const slotContent = slots.default?.();
			const body = error ? String(error.message ?? '') : slotContent;
			const present = error ? !!body : hasSlotContent(slotContent);

			const id = effectiveId.value;
			if (present && registeredId !== id) {
				unregister?.();
				unregister = itemContext?.registerMessage(id);
				registeredId = id;
			} else if (!present && registeredId !== undefined) {
				unregister?.();
				unregister = undefined;
				registeredId = undefined;
			}

			if (!present) {
				return null;
			}

			return h('p', { ...attrs, 'data-slot': 'form-message', id, class: [styles[formStyleKeys.message], attrs.class] }, body);
		};
	},
});

export default Form;
