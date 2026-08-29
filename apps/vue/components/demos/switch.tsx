import { defineComponent, ref } from 'vue';
import { Switch } from '@tile-ui/vue';

export default defineComponent({
	name: 'SwitchDemo',
	setup() {
		const checked = ref(true);
		return () => (
			<div class="button-group">
				<Switch
					modelValue={checked.value}
					onUpdate:modelValue={(next: boolean) => {
						checked.value = next;
					}}
					aria-label="Enable notifications"
				/>
				<Switch size="sm" aria-label="Compact mode" />
			</div>
		);
	},
});
