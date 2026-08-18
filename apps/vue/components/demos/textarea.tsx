import { defineComponent, ref } from 'vue';
import { TTextarea } from '@tile-ui/vue';

export default defineComponent({
	name: 'TextareaDemo',
	setup() {
		const value = ref('');
		return () => (
			<div class="component-preview__stack">
				<TTextarea
					label="Summary"
					helperText="Keep it short and specific for reviewers."
					modelValue={value.value}
					onUpdate:modelValue={(nextValue: string) => {
						value.value = nextValue;
					}}
					placeholder="Describe the release in one paragraph"
				/>
				<TTextarea label="Validation example" error="Please provide at least 20 characters before submitting." defaultValue="Too short" />
			</div>
		);
	},
});
