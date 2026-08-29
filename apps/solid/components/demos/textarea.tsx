import { createSignal } from 'solid-js';
import { Button, Textarea } from '@tile-ui/solid';

export default function TextareaDemo() {
	const [value, setValue] = createSignal('SSR-safe initial note');
	return (
		<form class="component-preview__stack" onReset={() => queueMicrotask(() => setValue('SSR-safe initial note'))}>
			<Textarea
				name="note"
				label="Release note"
				defaultValue="SSR-safe initial note"
				onChangeValue={setValue}
				required
				helperText="Edit the initial server-rendered value, then reset."
			/>
			<Button type="reset" size="sm" variant="outline">
				Reset note
			</Button>
			<p class="component-preview__text">Characters: {value().length}</p>
		</form>
	);
}
