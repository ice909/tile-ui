import { AspectRatio } from '@tile-ui/react';

export default function AspectRatioDemo() {
	return (
		<div style={{ width: '100%', maxWidth: '32rem' }}>
			<AspectRatio ratio={16 / 9} style={{ background: 'var(--docs-surface-hover)' }}>
				<div style={{ display: 'grid', width: '100%', height: '100%', placeItems: 'center' }}>
					<span className="component-preview__text">16:9</span>
				</div>
			</AspectRatio>
		</div>
	);
}
