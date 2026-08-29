import { Input, Label } from '@tile-ui/solid';
export default function LabelDemo() {
	return (
		<div class="component-preview__stack">
			<Label for="solid-email" required>
				Email
			</Label>
			<Input id="solid-email" type="email" placeholder="solid@example.com" />
		</div>
	);
}
