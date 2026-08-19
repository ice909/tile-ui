import { AspectRatio } from '@tile-ui/vue';

export default function AspectRatioDemo() {
	return (
		<AspectRatio ratio={16 / 9} style={{ background: 'var(--docs-surface-hover)' }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
				<span class="component-preview__text">16:9</span>
			</div>
		</AspectRatio>
	);
}
