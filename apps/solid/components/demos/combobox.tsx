import { createSignal } from 'solid-js';
import { Combobox } from '@tile-ui/solid';

const items = [
	{ value: 'alert-dialog', label: 'Alert Dialog', keywords: ['modal', 'focus'] },
	{ value: 'command', label: 'Command', keywords: ['palette', 'filter'] },
	{ value: 'navigation-menu', label: 'Navigation Menu', keywords: ['viewport', 'links'] },
];

export default function ComboboxDemo() {
	const [value, setValue] = createSignal('command');
	return (
		<div class="component-preview__stack" data-demo-combobox>
			<Combobox
				items={items}
				value={value()}
				onValueChange={setValue}
				placeholder="Choose a component"
				searchPlaceholder="Filter by name or behavior"
				notFoundText="No matching component"
			/>
			<button type="button" data-after-combobox>
				Logical Tab target
			</button>
			<p data-demo-state>Selected: {value()}.</p>
		</div>
	);
}
