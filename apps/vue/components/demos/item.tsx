import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, Button } from '@tile-ui/vue';

export default function ItemDemo() {
	return (
		<div class="component-preview__stack">
			<Item>
				<ItemMedia>+</ItemMedia>
				<ItemContent>
					<ItemTitle>Tile UI</ItemTitle>
					<ItemDescription>A cross-framework component library.</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Button size="sm" variant="outline">
						Open
					</Button>
				</ItemActions>
			</Item>
		</div>
	);
}
