import { Toaster, toast } from '@tile-ui/solid';

export default function SonnerDemo() {
	let loadingId = '';
	return (
		<div class="component-preview__row" data-demo-sonner>
			<button class="component-preview__action" onClick={() => toast('Saved draft')}>
				Default
			</button>
			<button class="component-preview__action" onClick={() => toast.success('Published successfully')}>
				Success
			</button>
			<button class="component-preview__action" onClick={() => toast.error('Publishing failed')}>
				Error
			</button>
			<button class="component-preview__action" onClick={() => (loadingId = toast.loading('Uploading file', { duration: 0 }))}>
				Loading
			</button>
			<button class="component-preview__action" onClick={() => toast.dismiss(loadingId || undefined)}>
				Dismiss
			</button>
			<Toaster richColors />
		</div>
	);
}
