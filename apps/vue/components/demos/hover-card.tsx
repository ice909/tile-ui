import { HoverCard, HoverCardTrigger, HoverCardContent } from '@tile-ui/vue';

export default function HoverCardDemo() {
	return (
		<HoverCard>
			<HoverCardTrigger class="component-preview__action">Hover me</HoverCardTrigger>
			<HoverCardContent>
				<p class="component-preview__text">Preview content on hover.</p>
			</HoverCardContent>
		</HoverCard>
	);
}
