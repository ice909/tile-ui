import { defineComponent, ref } from 'vue';
import { TSlider, TSliderTrack, TSliderRange, TSliderThumb } from '@tile-ui/vue';

export default defineComponent({
	name: 'SliderDemo',
	setup() {
		const value = ref(40);
		return () => (
			<div class="component-preview__stack">
				<TSlider
					modelValue={value.value}
					onUpdate:modelValue={(next: number) => {
						value.value = next;
					}}
					max={100}
					step={1}>
					<TSliderTrack>
						<TSliderRange />
						<TSliderThumb />
					</TSliderTrack>
				</TSlider>
				<p class="component-preview__text">
					Value:
					<strong>{value.value}</strong>
				</p>
			</div>
		);
	},
});
