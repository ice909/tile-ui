import { ref } from 'vue';
import { DirectionProvider } from '@tile-ui/vue';

export default defineComponent({
	name: 'DirectionDemo',
	setup() {
		const rtl = ref(false);
		return () => (
			<div class="component-preview__stack">
				<DirectionProvider dir={rtl.value ? 'rtl' : 'ltr'}>
					<div style={{ display: 'flex', gap: '8px' }}>
						<span class="component-preview__text">One</span>
						<span class="component-preview__text">Two</span>
						<span class="component-preview__text">Three</span>
					</div>
				</DirectionProvider>
				<div class="button-group">
					<button
						type="button"
						class="component-preview__action"
						onClick={() => {
							rtl.value = !rtl.value;
						}}>
						{rtl.value ? 'RTL' : 'LTR'}
					</button>
				</div>
			</div>
		);
	},
});
