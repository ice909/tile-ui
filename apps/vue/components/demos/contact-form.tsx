import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Textarea } from '@tile-ui/vue';

export default function ContactFormDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Contact support</CardTitle>
				<CardDescription>Send a structured request without building the form anatomy from scratch.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="component-preview__stack">
					<Input label="Email" placeholder="name@company.com" helperText="We reply to the address used here." />
					<Textarea label="Question" placeholder="Tell us what you need help with" helperText="Include relevant context and links." />
				</div>
			</CardContent>
			<CardFooter>
				<Button variant="outline">Cancel</Button>
				<Button>Submit</Button>
			</CardFooter>
		</Card>
	);
}
