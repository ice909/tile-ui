import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@tile-ui/solid';
export default function EmptyDemo() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">+</EmptyMedia>
				<EmptyTitle>No Solid components found</EmptyTitle>
				<EmptyDescription>Add a registry item to begin.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button size="sm">Add component</Button>
			</EmptyContent>
		</Empty>
	);
}
