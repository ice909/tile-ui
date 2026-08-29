import { createSignal } from 'solid-js';
import { Button, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@tile-ui/solid';

export default function InputOtpDemo() {
	const [value, setValue] = createSignal('');
	const slots = [0, 1, 2, 3, 4, 5];
	return (
		<form class="component-preview__stack" onSubmit={(event) => event.preventDefault()} onReset={() => queueMicrotask(() => setValue(''))}>
			<InputOTP name="code" maxLength={6} mode="numeric" value={value()} onChange={setValue}>
				<InputOTPGroup>
					{slots.slice(0, 3).map((index) => (
						<InputOTPSlot index={index} />
					))}
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					{slots.slice(3).map((index) => (
						<InputOTPSlot index={index} />
					))}
				</InputOTPGroup>
			</InputOTP>
			<div>
				<Button type="submit" size="sm">
					Verify
				</Button>{' '}
				<Button type="reset" size="sm" variant="outline">
					Reset
				</Button>
			</div>
			<p class="component-preview__text">Code: {value() || 'empty'}; paste and composition are supported.</p>
		</form>
	);
}
