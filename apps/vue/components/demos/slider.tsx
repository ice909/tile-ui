import { defineComponent, ref } from 'vue';
import { Slider, SliderTrack, SliderRange, SliderThumb } from '@tile-ui/vue';

export default defineComponent({
	name: 'SliderDemo',
	setup() {
		const value = ref(40);
		return () => (
			<div class="component-preview__stack">
				<Slider
					modelValue={value.value}
					onUpdate:modelValue={(next: number) => {
						value.value = next;
					}}
					max={100}
					step={1}>
					<SliderTrack>
						<SliderRange />
						<SliderThumb aria-label="Volume" />
					</SliderTrack>
				</Slider>
				<p class="component-preview__text">
					Value:
					<strong>{value.value}</strong>
				</p>
			</div>
		);
	},
});
