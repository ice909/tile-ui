import { createSignal } from 'solid-js';
import { Button, DirectionProvider, useDirection } from '@tile-ui/solid';

function DirectionValue() {
	const direction = useDirection();
	return <p class="component-preview__text">Hook value: {direction()}</p>;
}

export default function DirectionDemo() {
	const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('ltr');
	return (
		<DirectionProvider dir={direction()} class="component-preview__stack" data-direction-demo>
			<Button size="sm" variant="outline" onClick={() => setDirection((value) => (value === 'ltr' ? 'rtl' : 'ltr'))}>
				Switch to {direction() === 'ltr' ? 'RTL' : 'LTR'}
			</Button>
			<DirectionValue />
			<p class="component-preview__text">Start aligned text follows the provider direction.</p>
		</DirectionProvider>
	);
}
