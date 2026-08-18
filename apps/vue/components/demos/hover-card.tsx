import { THoverCard, THoverCardTrigger, THoverCardContent } from '@tile-ui/vue';

export default function HoverCardDemo() {
	return (
		<THoverCard>
			<THoverCardTrigger class="component-preview__action">Hover me</THoverCardTrigger>
			<THoverCardContent>
				<p class="component-preview__text">Preview content on hover.</p>
			</THoverCardContent>
		</THoverCard>
	);
}
