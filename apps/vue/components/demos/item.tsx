import { TItem, TItemMedia, TItemContent, TItemTitle, TItemDescription, TItemActions, TButton } from '@tile-ui/vue';

export default function ItemDemo() {
	return (
		<div class="component-preview__stack">
			<TItem>
				<TItemMedia>+</TItemMedia>
				<TItemContent>
					<TItemTitle>Tile UI</TItemTitle>
					<TItemDescription>A cross-framework component library.</TItemDescription>
				</TItemContent>
				<TItemActions>
					<TButton size="sm" variant="outline">
						Open
					</TButton>
				</TItemActions>
			</TItem>
		</div>
	);
}
