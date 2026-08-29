import { createSignal } from 'solid-js';
import { Button, Switch } from '@tile-ui/solid';

export default function SwitchDemo() {
	const [checked, setChecked] = createSignal(true);
	return (
		<form class="component-preview__stack" onReset={() => queueMicrotask(() => setChecked(true))}>
			<Switch name="notifications" checked={checked()} onCheckedChange={setChecked} aria-label="Enable notifications" />
			<Button type="reset" size="sm" variant="outline">
				Reset switch
			</Button>
			<p class="component-preview__text">Notifications: {checked() ? 'on' : 'off'}</p>
		</form>
	);
}
