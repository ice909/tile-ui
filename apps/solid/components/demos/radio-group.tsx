import { createSignal } from 'solid-js';
import { Button, RadioGroup, RadioGroupItem } from '@tile-ui/solid';

export default function RadioGroupDemo() {
	const [value, setValue] = createSignal('email');
	return (
		<form class="component-preview__stack" onReset={() => queueMicrotask(() => setValue('email'))}>
			<RadioGroup name="channel" value={value()} onValueChange={setValue} required orientation="horizontal">
				<RadioGroupItem value="email">Email</RadioGroupItem>
				<RadioGroupItem value="sms">SMS</RadioGroupItem>
				<RadioGroupItem value="push">Push</RadioGroupItem>
			</RadioGroup>
			<Button type="reset" size="sm" variant="outline">
				Reset channel
			</Button>
			<p class="component-preview__text">Channel: {value()}; arrow keys move and select.</p>
		</form>
	);
}
