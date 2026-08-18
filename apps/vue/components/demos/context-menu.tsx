import { TContextMenu, TContextMenuTrigger, TContextMenuContent, TContextMenuItem } from '@tile-ui/vue';

export default function ContextMenuDemo() {
	return (
		<TContextMenu>
			<TContextMenuTrigger>
				<div class="component-preview__action">Right-click me</div>
			</TContextMenuTrigger>
			<TContextMenuContent>
				<TContextMenuItem>Copy</TContextMenuItem>
				<TContextMenuItem>Paste</TContextMenuItem>
			</TContextMenuContent>
		</TContextMenu>
	);
}
