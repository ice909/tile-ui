import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@tile-ui/react';

export default function EmptyDemo() {
	return (
		<Empty>
			<EmptyMedia variant="default">+</EmptyMedia>
			<EmptyTitle>No results</EmptyTitle>
			<EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
		</Empty>
	);
}
