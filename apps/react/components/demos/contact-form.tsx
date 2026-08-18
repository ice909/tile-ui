import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea, CardFooter, Button } from '@tile-ui/react';

export default function ContactFormDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Contact support</CardTitle>
				<CardDescription>Send a structured request without building the form anatomy from scratch.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="component-preview__stack">
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
