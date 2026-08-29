import { createSignal } from 'solid-js';
import { Button, Checkbox } from '@tile-ui/solid';

export default function CheckboxDemo() {
	const [checked, setChecked] = createSignal(false);
	const [submitted, setSubmitted] = createSignal('not submitted');
	return (
		<form
			class="component-preview__stack"
			onSubmit={(event) => {
				event.preventDefault();
				setSubmitted(new FormData(event.currentTarget).has('terms') ? 'accepted' : 'missing');
			}}
			onReset={() => queueMicrotask(() => setChecked(false))}>
			<Checkbox name="terms" checked={checked()} onCheckedChange={(value) => setChecked(value === true)} required>
				Accept terms
			</Checkbox>
			<div>
				<Button type="submit" size="sm">
					Validate
				</Button>{' '}
				<Button type="reset" size="sm" variant="outline">
					Reset
				</Button>
			</div>
			<p class="component-preview__text">
				Checkbox: {String(checked())}; submit: {submitted()}
			</p>
		</form>
	);
}
