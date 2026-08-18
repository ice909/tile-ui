import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, CardFooter, Button } from '@tile-ui/react';

export default function NewsletterCardDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Stay in the loop</CardTitle>
				<CardDescription>Product updates, release notes, and design system changes once a month.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="component-preview__stack">
					<Input label="Email" placeholder="you@company.com" helperText="We only send relevant updates." />
				</div>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Subscribe</Button>
			</CardFooter>
		</Card>
	);
}
