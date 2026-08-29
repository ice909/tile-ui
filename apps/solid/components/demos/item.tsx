import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@tile-ui/solid';
export default function ItemDemo() {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">S</ItemMedia>
			<ItemContent>
				<ItemTitle>Solid registry</ItemTitle>
				<ItemDescription>SSR-safe component source.</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Button size="sm" variant="outline">
					Open
				</Button>
			</ItemActions>
		</Item>
	);
}
