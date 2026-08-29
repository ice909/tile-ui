import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@tile-ui/solid';

export default function CardDemo() {
	return (
		<Card class="demo-card">
			<CardHeader>
				<CardTitle>SolidStart workspace</CardTitle>
				<CardDescription>Twenty-one components, one shared design system, and real SSR.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>The rendered preview and highlighted implementation both originate in this file.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline">Inspect source</Button>
				<Button>Install slice</Button>
			</CardFooter>
		</Card>
	);
}
