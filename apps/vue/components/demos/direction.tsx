import { ref } from 'vue';
import { TDirectionProvider } from '@tile-ui/vue';

export default defineComponent({
	name: 'DirectionDemo',
	setup() {
		const rtl = ref(false);
		return () => (
			<div class="component-preview__stack">
				<TDirectionProvider dir={rtl.value ? 'rtl' : 'ltr'}>
					<div style={{ display: 'flex', gap: '8px' }}>
						<span class="component-preview__text">One</span>
						<span class="component-preview__text">Two</span>
						<span class="component-preview__text">Three</span>
					</div>
				</TDirectionProvider>
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
