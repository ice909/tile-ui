import { Progress } from '@tile-ui/react';

export default function ProgressDemo() {
	return (
		<div className="component-preview__stack">
			<Progress value={40} aria-label="Upload progress" />
			<Progress value={80} aria-label="Download progress" />
		</div>
	);
}
