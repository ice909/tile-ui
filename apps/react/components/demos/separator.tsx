import { Separator } from '@tile-ui/react';

export default function SeparatorDemo() {
	return (
		<div className="component-preview__stack">
			<div>
				<p className="component-preview__text">Above</p>
				<Separator />
				<p className="component-preview__text">Below</p>
			</div>
			<div style={{ display: 'flex', gap: 12, alignItems: 'center', height: 24 }}>
				<span className="component-preview__text">Left</span>
				<Separator orientation="vertical" />
				<span className="component-preview__text">Right</span>
			</div>
		</div>
	);
}
