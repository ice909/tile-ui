import { TButton, TCard, TCardContent, TCardDescription, TCardFooter, TCardHeader, TCardTitle, TInput, TTextarea } from '@tile-ui/vue';

export default function ContactFormDemo() {
	return (
		<TCard>
			<TCardHeader>
				<TCardTitle>Contact support</TCardTitle>
				<TCardDescription>Send a structured request without building the form anatomy from scratch.</TCardDescription>
			</TCardHeader>
			<TCardContent>
				<div class="component-preview__stack">
					<TInput label="Email" placeholder="name@company.com" helperText="We reply to the address used here." />
					<TTextarea label="Question" placeholder="Tell us what you need help with" helperText="Include relevant context and links." />
				</div>
			</TCardContent>
			<TCardFooter>
				<TButton variant="outline">Cancel</TButton>
				<TButton>Submit</TButton>
			</TCardFooter>
		</TCard>
	);
}
