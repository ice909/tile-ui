import { defineComponent, ref } from 'vue';
import { TInput } from '@tile-ui/vue';

export default defineComponent({
	name: 'InputDemo',
	setup() {
		const value = ref('');
		return () => (
			<div class="component-preview__stack">
				<TInput
					label="Project name"
					helperText="Used in your dashboard and generated URLs."
					modelValue={value.value}
					onUpdate:modelValue={(nextValue: string) => {
						value.value = nextValue;
					}}
					placeholder="Tile UI Docs"
				/>
				<TInput label="Read-only example" helperText="Use this for immutable values or generated fields." defaultValue="tile-ui" readOnly />
				<TInput label="Validation example" error="A project name is required before publishing." defaultValue="" />
			</div>
		);
	},
});
