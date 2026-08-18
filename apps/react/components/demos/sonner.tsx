import { Button, toast, Toaster } from '@tile-ui/react';

export default function SonnerDemo() {
	return (
		<div className="component-preview__stack">
			<div className="button-group">
				<Button onClick={() => toast('Default toast')}>Default</Button>
				<Button variant="outline" onClick={() => toast.success('Saved successfully')}>
					Success
				</Button>
				<Button variant="destructive" onClick={() => toast.error('Something went wrong')}>
					Error
				</Button>
			</div>
			<Toaster position="bottom-right" />
		</div>
	);
}
