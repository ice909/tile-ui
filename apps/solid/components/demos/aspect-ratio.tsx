import { AspectRatio } from '@tile-ui/solid';
export default function AspectRatioDemo() {
	return (
		<AspectRatio ratio={16 / 9} style={{ width: '100%', 'max-width': '32rem' }}>
			<div style={{ display: 'grid', height: '100%', 'place-items': 'center', 'background-color': 'var(--muted)' }}>16:9 Solid surface</div>
		</AspectRatio>
	);
}
