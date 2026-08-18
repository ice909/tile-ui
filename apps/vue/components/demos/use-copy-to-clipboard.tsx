import { defineComponent } from 'vue';
import { useCopyToClipboard } from '@tile-ui/vue';

export default defineComponent({
	name: 'UseCopyToClipboardDemo',
	setup() {
		const { copy, copied } = useCopyToClipboard();
		return () => (
			<div class="component-preview__stack">
				<div class="card-link">
					<p class="component-preview__text">Registry URL: https://vue.tileui.zmorg.cn/r/button.json</p>
					<div class="button-group">
						<button
							type="button"
							class="component-preview__action"
							onClick={() => {
								void copy('https://vue.tileui.zmorg.cn/r/button.json');
							}}>
							{copied.value ? 'Copied' : 'Copy URL'}
						</button>
					</div>
				</div>
			</div>
		);
	},
});
