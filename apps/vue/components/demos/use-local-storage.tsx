import { defineComponent } from 'vue';
import { useLocalStorage } from '@tile-ui/vue';

export default defineComponent({
	name: 'UseLocalStorageDemo',
	setup() {
		const theme = useLocalStorage<'light' | 'dark'>('theme', 'light');
		return () => (
			<div class="component-preview__stack">
				<div class="button-group">
					<button
						type="button"
						class="component-preview__action"
						onClick={() => {
							theme.value = 'light';
						}}>
						Light
					</button>
					<button
						type="button"
						class="component-preview__action"
						onClick={() => {
							theme.value = 'dark';
						}}>
						Dark
					</button>
				</div>
				<p class="component-preview__text">
					Current theme preference: <strong>{theme.value}</strong>
				</p>
			</div>
		);
	},
});
