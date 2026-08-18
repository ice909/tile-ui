import { TButton, TCard, TCardContent, TCardDescription, TCardFooter, TCardHeader, TCardTitle, TInput } from '@tile-ui/vue';

export default function NewsletterCardDemo() {
	return (
		<TCard>
			<TCardHeader>
				<TCardTitle>Stay in the loop</TCardTitle>
				<TCardDescription>Product updates, release notes, and design system changes once a month.</TCardDescription>
			</TCardHeader>
			<TCardContent>
				<div class="component-preview__stack">
					<TInput label="Email" placeholder="you@company.com" helperText="We only send relevant updates." />
				</div>
			</TCardContent>
			<TCardFooter>
				<TButton>Subscribe</TButton>
			</TCardFooter>
		</TCard>
	);
}
