import { createSignal } from 'solid-js';
import { ToggleGroup, ToggleGroupItem, type ToggleGroupValue } from '@tile-ui/solid';

export default function ToggleGroupDemo() {
	const [value, setValue] = createSignal<ToggleGroupValue>(['bold']);
	const active = () => {
		const current = value();
		return Array.isArray(current) ? current.join(', ') || 'none' : current;
	};
	return (
		<div class="component-preview__stack">
			<ToggleGroup type="multiple" value={value()} onValueChange={setValue}>
				<ToggleGroupItem value="bold">Bold</ToggleGroupItem>
				<ToggleGroupItem value="italic">Italic</ToggleGroupItem>
				<ToggleGroupItem value="underline">Underline</ToggleGroupItem>
			</ToggleGroup>
			<p class="component-preview__text">Active: {active()}; arrows move focus.</p>
		</div>
	);
}
