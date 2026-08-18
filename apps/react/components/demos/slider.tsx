import { useState } from 'react';
import { Slider, SliderTrack, SliderRange, SliderThumb } from '@tile-ui/react';

export default function SliderDemo() {
	const [value, setValue] = useState(40);

	return (
		<div className="component-preview__stack">
			<Slider value={value} onValueChange={setValue} max={100} step={1}>
				<SliderTrack>
					<SliderRange />
					<SliderThumb />
				</SliderTrack>
			</Slider>
			<p className="component-preview__text">
				Value: <strong>{value}</strong>
			</p>
		</div>
	);
}
