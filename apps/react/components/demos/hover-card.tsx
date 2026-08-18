import { HoverCard, HoverCardTrigger, HoverCardContent } from '@tile-ui/react';

export default function HoverCardDemo() {
	return (
		<HoverCard>
			<HoverCardTrigger className="component-preview__action">Hover me</HoverCardTrigger>
			<HoverCardContent>
				<div style={{ display: 'grid', gap: 8 }}>
					<p className="component-preview__text">Preview content on hover.</p>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
