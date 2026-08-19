import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@tile-ui/vue';

export default function ContextMenuDemo() {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div class="component-preview__action">Right-click me</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Copy</ContextMenuItem>
				<ContextMenuItem>Paste</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
