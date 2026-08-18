import { TInputOTP, TInputOTPGroup, TInputOTPSlot } from '@tile-ui/vue';

export default function InputOtpDemo() {
	return (
		<TInputOTP maxLength={6}>
			<TInputOTPGroup>
				<TInputOTPSlot index={0} />
				<TInputOTPSlot index={1} />
				<TInputOTPSlot index={2} />
				<TInputOTPSlot index={3} />
				<TInputOTPSlot index={4} />
				<TInputOTPSlot index={5} />
			</TInputOTPGroup>
		</TInputOTP>
	);
}
