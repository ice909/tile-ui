import { Progress } from '@tile-ui/react';

export default function ProgressDemo() {
	return (
		<div className="component-preview__stack">
			<Progress value={40} />
			<Progress value={80} />
		</div>
	);
}
