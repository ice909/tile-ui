import { createSignal } from 'solid-js';
import { Button, Progress } from '@tile-ui/solid';

export default function ProgressDemo() {
	const [value, setValue] = createSignal(35);
	return (
		<div class="component-preview__stack">
			<Progress value={value()} aria-label="Upload progress" />
			<Button size="sm" onClick={() => setValue((current) => (current >= 100 ? 0 : current + 10))}>
				Advance to {value()}%
			</Button>
		</div>
	);
}
