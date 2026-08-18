import { TEmpty, TEmptyMedia, TEmptyTitle, TEmptyDescription } from '@tile-ui/vue';

export default function EmptyDemo() {
	return (
		<TEmpty>
			<TEmptyMedia variant="default">+</TEmptyMedia>
			<TEmptyTitle>No results</TEmptyTitle>
			<TEmptyDescription>Try adjusting your search or filters.</TEmptyDescription>
		</TEmpty>
	);
}
