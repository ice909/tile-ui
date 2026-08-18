import { TButton, TCard, TCardContent, TCardDescription, TCardFooter, TCardHeader, TCardTitle } from '@tile-ui/vue';

export default function CardDemo() {
	return (
		<TCard>
			<TCardHeader>
				<TCardTitle>Starter workspace</TCardTitle>
				<TCardDescription>Ship a consistent docs and component experience across React and Vue.</TCardDescription>
			</TCardHeader>
			<TCardContent>
				<p class="component-preview__text">Use cards for summaries, settings surfaces, marketing CTAs, and denser information blocks that need a clear frame.</p>
			</TCardContent>
			<TCardFooter>
				<TButton variant="outline">Preview</TButton>
				<TButton>Install</TButton>
			</TCardFooter>
		</TCard>
	);
}
