import { createSignal } from 'solid-js';
import { Slider, SliderRange, SliderThumb, SliderTrack } from '@tile-ui/solid';

function DemoSlider(props: { orientation: 'horizontal' | 'vertical'; value: number; onValueChange: (value: number) => void }) {
	return (
		<Slider
			orientation={props.orientation}
			value={props.value}
			onValueChange={props.onValueChange}
			min={0}
			max={100}
			step={5}
			style={props.orientation === 'vertical' ? { height: '8rem' } : undefined}>
			<SliderTrack>
				<SliderRange />
			</SliderTrack>
			<SliderThumb aria-label={`${props.orientation} volume`} />
		</Slider>
	);
}

export default function SliderDemo() {
	const [horizontal, setHorizontal] = createSignal(40);
	const [vertical, setVertical] = createSignal(65);
	return (
		<div class="component-preview__stack">
			<DemoSlider orientation="horizontal" value={horizontal()} onValueChange={setHorizontal} />
			<DemoSlider orientation="vertical" value={vertical()} onValueChange={setVertical} />
			<p class="component-preview__text">
				Values: {horizontal()} horizontal, {vertical()} vertical. Use pointer or arrow keys.
			</p>
		</div>
	);
}
