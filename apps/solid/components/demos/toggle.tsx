import { createSignal } from 'solid-js';
import { Toggle } from '@tile-ui/solid';

export default function ToggleDemo() {
	const [pressed, setPressed] = createSignal(false);

	return (
		<div class="component-preview__stack">
			<Toggle pressed={pressed()} onPressedChange={setPressed} variant="outline">
				Hydration {pressed() ? 'active' : 'ready'}
			</Toggle>
			<p class="component-preview__text">Pressed state: {String(pressed())}</p>
		</div>
	);
}
