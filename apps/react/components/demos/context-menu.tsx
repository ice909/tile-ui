import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@tile-ui/react';

export default function ContextMenuDemo() {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div className="component-preview__action">Right-click me</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Copy</ContextMenuItem>
				<ContextMenuItem>Paste</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
