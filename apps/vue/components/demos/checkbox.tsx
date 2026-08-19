import { defineComponent, ref } from 'vue';
import { Checkbox } from '@tile-ui/vue';

export default defineComponent({
	name: 'CheckboxDemo',
	setup() {
		const checked = ref(true);
		return () => (
			<div class="button-group">
				<Checkbox
					modelValue={checked.value}
					onUpdate:modelValue={(next) => {
						checked.value = next === true;
					}}
				/>
				<Checkbox defaultChecked="indeterminate" />
				<Checkbox disabled />
			</div>
		);
	},
});
