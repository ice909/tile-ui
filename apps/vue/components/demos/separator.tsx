import { Separator } from '@tile-ui/vue';

export default function SeparatorDemo() {
	return (
		<div class="component-preview__stack">
			<div>
				<p class="component-preview__text">Above</p>
				<Separator />
				<p class="component-preview__text">Below</p>
			</div>
			<div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '24px' }}>
				<span class="component-preview__text">Left</span>
				<Separator orientation="vertical" />
				<span class="component-preview__text">Right</span>
			</div>
		</div>
	);
}
