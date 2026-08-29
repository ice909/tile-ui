import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../src/components/input-otp/input-otp';
import { Slider, SliderRange, SliderThumb, SliderTrack } from '../../src/components/slider/slider';

export function Batch2InteractionHydrationFixture() {
	return (
		<main data-id="batch2-interaction-root">
			<form id="batch2-interaction-form">
				<Slider name="level" min={2} max={10} step={3} defaultValue={9}>
					<SliderTrack>
						<SliderRange data-id="slider-range" />
					</SliderTrack>
					<SliderThumb data-id="slider-thumb" aria-label="Level" />
				</Slider>
				<InputOTP name="code" mode="numeric" maxLength={3} defaultValue="A1B2">
					<InputOTPGroup>
						{[0, 1, 2, 3].map((index) => (
							<InputOTPSlot index={index} />
						))}
					</InputOTPGroup>
				</InputOTP>
			</form>
		</main>
	);
}
