import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, Button } from '@tile-ui/react';

export default function ItemDemo() {
	return (
		<div className="component-preview__stack">
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
			<Item variant="outline">
				<ItemMedia>+</ItemMedia>
				<ItemContent>
					<ItemTitle>Outlined item</ItemTitle>
					<ItemDescription>Highlighted with the outline variant.</ItemDescription>
				</ItemContent>
			</Item>
		</div>
	);
}
