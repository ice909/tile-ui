import { defineComponent, computed, h, onMounted, ref, useId } from 'vue';
import { getInputIds, getInputAriaProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/input.module.scss';

export const Input = defineComponent({
	name: 'Input',
	props: {
		label: String,
		error: String,
		helperText: String,
		required: { type: Boolean, default: false },
		id: String,
		type: { type: String, default: 'text' },
		placeholder: String,
		modelValue: String,
		defaultValue: String,
		readOnly: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const fallbackId = useId();
		const inputId = computed(() => props.id || fallbackId);
		const ids = computed(() => getInputIds(inputId.value));
		const ariaProps = computed(() => getInputAriaProps(ids.value, props.error, props.helperText));
		const inputEl = ref<HTMLInputElement | null>(null);

		onMounted(() => {
			if (!inputEl.value) return;
			if (props.modelValue === undefined && props.defaultValue !== undefined) {
				inputEl.value.value = props.defaultValue;
			}
		});

		function onInput(event: Event) {
			emit('update:modelValue', (event.target as HTMLInputElement).value);
		}

		return () => {
			const children: any[] = [];

			if (props.label) {
				children.push(
					h(
						'label',
						{
							for: inputId.value,
							class: [styles.label, props.required ? styles.required : ''],
						},
						props.label,
					),
				);
			}

			children.push(
				h('input', {
					ref: inputEl,
					id: inputId.value,
					type: props.type,
					class: [styles.input, props.error ? styles.error : ''],
					value: props.modelValue,
					placeholder: props.placeholder,
					readonly: props.readOnly,
					disabled: props.disabled,
					'aria-invalid': ariaProps.value['aria-invalid'],
					'aria-describedby': ariaProps.value['aria-describedby'],
					onInput,
				}),
			);

			if (props.error) {
				children.push(h('span', { id: ids.value.error, class: styles.errorText }, props.error));
			} else if (props.helperText) {
				children.push(h('span', { id: ids.value.helper, class: styles.helperText }, props.helperText));
			}

			return h('div', { class: styles.inputWrapper }, children);
		};
	},
});

export default Input;
