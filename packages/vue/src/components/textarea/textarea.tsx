import { defineComponent, computed, h, onMounted, ref, useId } from 'vue';
import { getTextareaIds, getTextareaAriaProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/textarea.module.scss';

export const TTextarea = defineComponent({
	name: 'TTextarea',
	props: {
		label: String,
		error: String,
		helperText: String,
		required: { type: Boolean, default: false },
		id: String,
		placeholder: String,
		modelValue: String,
		defaultValue: String,
		readOnly: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const fallbackId = useId();
		const textareaId = computed(() => props.id || fallbackId);
		const ids = computed(() => getTextareaIds(textareaId.value));
		const ariaProps = computed(() => getTextareaAriaProps(ids.value, props.error, props.helperText));
		const textareaEl = ref<HTMLTextAreaElement | null>(null);

		onMounted(() => {
			if (!textareaEl.value) return;
			if (props.modelValue === undefined && props.defaultValue !== undefined) {
				textareaEl.value.value = props.defaultValue;
			}
		});

		function onInput(event: Event) {
			emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
		}

		return () => {
			const children: any[] = [];

			if (props.label) {
				children.push(
					h(
						'label',
						{
							for: textareaId.value,
							class: [styles.label, props.required ? styles.required : ''],
						},
						props.label,
					),
				);
			}

			children.push(
				h('textarea', {
					ref: textareaEl,
					id: textareaId.value,
					class: [styles.textarea, props.error ? styles.error : ''],
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

			return h('div', { class: styles.textareaWrapper }, children);
		};
	},
});

export default TTextarea;
