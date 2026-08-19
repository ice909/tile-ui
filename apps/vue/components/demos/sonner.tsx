import { toast, Toaster } from '@tile-ui/vue';

export default function SonnerDemo() {
	return (
		<div class="component-preview__stack">
			<div class="button-group">
				<button type="button" class="component-preview__action" onClick={() => toast('Default toast')}>
					Default
				</button>
				<button type="button" class="component-preview__action" onClick={() => toast.success('Saved successfully')}>
					Success
				</button>
				<button type="button" class="component-preview__action" onClick={() => toast.error('Something went wrong')}>
					Error
				</button>
			</div>
			<Toaster position="bottom-right" />
		</div>
	);
}
