import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@tile-ui/react';

export default function CardDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Starter workspace</CardTitle>
				<CardDescription>Ship a consistent docs and component experience across React and Vue.</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="component-preview__text">Use cards for summaries, settings surfaces, marketing CTAs, and denser information blocks that need a clear frame.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline">Preview</Button>
				<Button>Install</Button>
			</CardFooter>
		</Card>
	);
}
