import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@tile-ui/vue';

export default function NewsletterCardDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Stay in the loop</CardTitle>
				<CardDescription>Product updates, release notes, and design system changes once a month.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="component-preview__stack">
					<Input label="Email" placeholder="you@company.com" helperText="We only send relevant updates." />
				</div>
			</CardContent>
			<CardFooter>
				<Button>Subscribe</Button>
			</CardFooter>
		</Card>
	);
}
