import { TLabel } from '@tile-ui/vue';

export default function LabelDemo() {
	return (
		<div class="component-preview__stack">
			<div class="form-group">
				<TLabel required>Feedback</TLabel>
				<textarea class="component-preview__native-field" placeholder="Type your feedback here" />
			</div>
			<div class="form-group">
				<TLabel>Project slug</TLabel>
				<input class="component-preview__native-field" value="tile-ui" readonly />
			</div>
		</div>
	);
}
