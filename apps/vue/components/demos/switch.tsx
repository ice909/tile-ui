import { defineComponent, ref } from 'vue';
import { TSwitch } from '@tile-ui/vue';

export default defineComponent({
	name: 'SwitchDemo',
	setup() {
		const checked = ref(true);
		return () => (
			<div class="button-group">
				<TSwitch
					modelValue={checked.value}
					onUpdate:modelValue={(next: boolean) => {
						checked.value = next;
					}}
				/>
				<TSwitch size="sm" />
			</div>
		);
	},
});
