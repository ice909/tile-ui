import { createSignal } from 'solid-js';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@tile-ui/solid';

export default function SelectDemo() {
	const [value, setValue] = createSignal('solid');
	return (
		<div class="component-preview__stack" data-demo-select>
			<Select value={value()} onValueChange={setValue} selectedText={value() === 'solid' ? 'Solid <SSR>' : 'Vue & React'}>
				<SelectTrigger aria-label="Framework lane">
					<SelectValue placeholder="Choose a lane" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Framework lanes</SelectLabel>
						<SelectItem value="solid">Solid &lt;SSR&gt;</SelectItem>
						<SelectItem value="shared">Vue &amp; React</SelectItem>
					</SelectGroup>
					<SelectSeparator />
					<SelectItem value="disabled" disabled>
						Disabled lane
					</SelectItem>
				</SelectContent>
			</Select>
			<button type="button" data-after-select>
				Logical Tab target
			</button>
			<p data-demo-state>Selected: {value()}.</p>
		</div>
	);
}
