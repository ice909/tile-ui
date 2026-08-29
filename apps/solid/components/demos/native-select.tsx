import { createSignal } from 'solid-js';
import { Button, NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@tile-ui/solid';

export default function NativeSelectDemo() {
	const [value, setValue] = createSignal('solid');
	return (
		<form class="component-preview__stack" onReset={() => queueMicrotask(() => setValue('solid'))}>
			<NativeSelect name="framework" defaultValue="solid" aria-label="Framework" onValueChange={setValue}>
				<NativeSelectOptGroup label="Framework">
					<NativeSelectOption value="solid">Solid</NativeSelectOption>
					<NativeSelectOption value="react">React</NativeSelectOption>
					<NativeSelectOption value="vue">Vue</NativeSelectOption>
				</NativeSelectOptGroup>
			</NativeSelect>
			<Button type="reset" size="sm" variant="outline">
				Reset selection
			</Button>
			<p class="component-preview__text">Selected: {value()}</p>
		</form>
	);
}
