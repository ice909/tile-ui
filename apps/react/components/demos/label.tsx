import { Label } from '@tile-ui/react';

export default function LabelDemo() {
	return (
		<div className="component-preview__stack">
			<div className="form-group">
				<Label required htmlFor="preview-feedback">
					Feedback
				</Label>
				<textarea id="preview-feedback" className="component-preview__native-field" placeholder="Type your feedback here" />
			</div>
			<div className="form-group">
				<Label htmlFor="preview-slug">Project slug</Label>
				<input id="preview-slug" className="component-preview__native-field" defaultValue="tile-ui" readOnly />
			</div>
		</div>
	);
}
