import { toast, Toaster } from '@tile-ui/vue';

export default function SonnerDemo() {
	let loadingId = '';
	return (
		<div class="component-preview__stack">
			<div class="button-group">
				<button type="button" onClick={() => toast('Default toast')}>
					Default
				</button>
				<button type="button" onClick={() => toast.success('Saved successfully')}>
					Success
				</button>
				<button type="button" onClick={() => toast.error('Something went wrong')}>
					Error
				</button>
				<button type="button" onClick={() => (loadingId = toast.loading('Uploading file', { duration: 0 }))}>
					Loading
				</button>
				<button type="button" onClick={() => toast.dismiss(loadingId || undefined)}>
					Dismiss
				</button>
			</div>
			<Toaster position="bottom-right" />
		</div>
	);
}
