import { defineComponent, ref } from 'vue';
import { TCheckbox } from '@tile-ui/vue';

export default defineComponent({
	name: 'CheckboxDemo',
	setup() {
		const checked = ref(true);
		return () => (
			<div class="button-group">
				<TCheckbox
					modelValue={checked.value}
					onUpdate:modelValue={(next) => {
						checked.value = next === true;
					}}
				/>
				<TCheckbox defaultChecked="indeterminate" />
				<TCheckbox disabled />
			</div>
		);
	},
});
