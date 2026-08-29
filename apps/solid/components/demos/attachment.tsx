import { createSignal } from 'solid-js';
import { AttachmentCard } from '@tile-ui/solid';
export default function AttachmentDemo() {
	const [message, setMessage] = createSignal('Choose an action');
	return (
		<div class="component-preview__stack">
			<AttachmentCard
				name="solid-registry.pdf"
				size={2516582}
				onPreview={() => setMessage('Previewed attachment')}
				onDownload={() => setMessage('Downloaded attachment')}
				onRemove={() => setMessage('Removed attachment')}
			/>
			<p aria-live="polite">{message()}</p>
		</div>
	);
}
