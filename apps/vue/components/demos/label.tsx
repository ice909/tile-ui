import { Label } from '@tile-ui/vue';

export default function LabelDemo() {
	return (
		<div class="component-preview__stack">
			<div class="form-group">
				<Label required htmlFor="preview-feedback">
					Feedback
				</Label>
				<textarea id="preview-feedback" class="component-preview__native-field" placeholder="Type your feedback here" />
			</div>
			<div class="form-group">
				<Label htmlFor="preview-slug">Project slug</Label>
				<input id="preview-slug" class="component-preview__native-field" value="tile-ui" readonly />
			</div>
		</div>
	);
}
