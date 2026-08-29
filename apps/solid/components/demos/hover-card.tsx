import { HoverCard, HoverCardContent, HoverCardTrigger } from '@tile-ui/solid';

export default function HoverCardDemo() {
	return (
		<HoverCard openDelay={250} closeDelay={350}>
			<HoverCardTrigger class="component-preview__action">@tile-ui/solid</HoverCardTrigger>
			<HoverCardContent data-demo-hover-card>
				<strong>Solid registry</strong>
				<p>Move diagonally from the trigger into this card: hover intent keeps the crossing path open.</p>
				<a href="/docs/components">Browse all components</a>
			</HoverCardContent>
		</HoverCard>
	);
}
