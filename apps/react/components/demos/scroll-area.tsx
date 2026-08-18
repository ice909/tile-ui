import { ScrollArea } from '@tile-ui/react';

export default function ScrollAreaDemo() {
	return (
		<ScrollArea style={{ maxHeight: 140 }}>
			<div style={{ paddingRight: 16 }}>
				{Array.from({ length: 12 }, (_, i) => (
					<p key={i} className="component-preview__text">
						Line {i + 1} — scrollable content.
					</p>
				))}
			</div>
		</ScrollArea>
	);
}
