import { Toggle } from '@tile-ui/react';

export default function ToggleDemo() {
	return (
		<div className="button-group">
			<Toggle>Bold</Toggle>
			<Toggle variant="outline">Italic</Toggle>
			<Toggle variant="ghost">Underline</Toggle>
		</div>
	);
}
