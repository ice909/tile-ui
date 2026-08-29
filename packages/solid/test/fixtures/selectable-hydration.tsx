import { createSignal } from 'solid-js';
import { Checkbox } from '../../src/components/checkbox/checkbox';
import { RadioGroup, RadioGroupItem } from '../../src/components/radio-group/radio-group';
import { Switch } from '../../src/components/switch/switch';
import { ToggleGroup, ToggleGroupItem } from '../../src/components/toggle-group/toggle-group';

export function SelectableHydrationFixture() {
	const [toggleValue, setToggleValue] = createSignal('b');
	const [radioValue, setRadioValue] = createSignal('two');
	return (
		<form>
			<Checkbox name="check" value="yes" defaultChecked />
			<Switch name="switch" value="yes" defaultChecked />
			<ToggleGroup data-id="toggle-selected" value={toggleValue()}>
				<ToggleGroupItem value="a">A</ToggleGroupItem>
				<ToggleGroupItem value="b">B</ToggleGroupItem>
				<ToggleGroupItem value="c">C</ToggleGroupItem>
			</ToggleGroup>
			<button type="button" data-id="toggle-control" onClick={() => setToggleValue('c')}>
				Toggle control
			</button>
			<ToggleGroup data-id="toggle-fallback" defaultValue="missing">
				<ToggleGroupItem value="a" disabled>
					A
				</ToggleGroupItem>
				<ToggleGroupItem value="b">B</ToggleGroupItem>
				<ToggleGroupItem value="c">C</ToggleGroupItem>
			</ToggleGroup>
			<RadioGroup data-id="radio-selected" name="radio" value={radioValue()}>
				<RadioGroupItem value="one">One</RadioGroupItem>
				<RadioGroupItem value="two">Two</RadioGroupItem>
				<RadioGroupItem value="three">Three</RadioGroupItem>
			</RadioGroup>
			<button type="button" data-id="radio-control" onClick={() => setRadioValue('three')}>
				Radio control
			</button>
			<RadioGroup data-id="radio-fallback" defaultValue="missing">
				<RadioGroupItem value="one" disabled>
					One
				</RadioGroupItem>
				<RadioGroupItem value="two">Two</RadioGroupItem>
				<RadioGroupItem value="three">Three</RadioGroupItem>
			</RadioGroup>
		</form>
	);
}
