import { TScrollArea } from '@tile-ui/vue';

export default function ScrollAreaDemo() {
	return (
		<TScrollArea style={{ maxHeight: '140px' }}>
			<div style={{ paddingRight: '16px' }}>
				{Array.from({ length: 12 }, (_, i) => (
					<p key={i} class="component-preview__text">
						Line
						{i + 1}— scrollable content.
					</p>
				))}
			</div>
		</TScrollArea>
	);
}
