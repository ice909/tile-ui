import { Label } from '@tile-ui/vue';

export default function LabelDemo() {
	return (
		<div class="component-preview__stack">
			<div class="form-group">
				<Label required>Feedback</Label>
				<textarea class="component-preview__native-field" placeholder="Type your feedback here" />
			</div>
			<div class="form-group">
				<Label>Project slug</Label>
				<input class="component-preview__native-field" value="tile-ui" readonly />
			</div>
		</div>
	);
}
