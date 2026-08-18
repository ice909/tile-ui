import { defineComponent, inject, ref } from 'vue';
import type { PreviewCodePayload } from '../lib/docs';

export const VueDocContentPreview = defineComponent({
	name: 'VueDocContentPreview',
	props: {
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: false,
			default: '',
		},
	},
	setup(_props, { slots }) {
		const previewCode = inject<{ value: PreviewCodePayload | null } | null>('preview-code', null);
		const expanded = ref(false);

		return () => {
			const payload = previewCode?.value ?? null;
			const lines = payload ? payload.raw.split('\n').length : 0;
			const showToggle = payload !== null && lines > 3;

			return (
				<div class="component-preview">
					<div class="component-preview__surface">{slots.default?.()}</div>
					{payload ? (
						expanded.value || !showToggle ? (
							<div class="component-preview__code" innerHTML={payload.full} />
						) : (
							<div class="component-preview__code-peek">
								<div class="component-preview__code-peek-pre" innerHTML={payload.preview} />
								<div class="component-preview__code-fade" aria-hidden="true" />
								<button
									type="button"
									class="component-preview__code-toggle"
									aria-expanded={false}
									onClick={() => {
										expanded.value = true;
									}}>
									View Code
								</button>
							</div>
						)
					) : null}
				</div>
			);
		};
	},
});
