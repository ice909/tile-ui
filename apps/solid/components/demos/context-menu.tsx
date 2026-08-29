import { createSignal } from 'solid-js';
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@tile-ui/solid';

export default function ContextMenuDemo() {
	const [pinned, setPinned] = createSignal(false);
	const [format, setFormat] = createSignal('markdown');
	return (
		<div class="component-preview__stack" data-demo-context-menu>
			<ContextMenu>
				<ContextMenuTrigger class="component-preview__surface" tabindex="0">
					Right-click here, or focus and press Shift+F10.
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Open</ContextMenuItem>
					<ContextMenuCheckboxItem checked={pinned()} onCheckedChange={setPinned}>
						Pinned
					</ContextMenuCheckboxItem>
					<ContextMenuRadioGroup value={format()} onValueChange={setFormat}>
						<ContextMenuRadioItem value="markdown">Markdown</ContextMenuRadioItem>
						<ContextMenuRadioItem value="json">JSON</ContextMenuRadioItem>
					</ContextMenuRadioGroup>
					<ContextMenuSub>
						<ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							<ContextMenuItem>Archive</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
				</ContextMenuContent>
			</ContextMenu>
			<p data-demo-state>
				{pinned() ? 'Pinned' : 'Not pinned'}; {format()}.
			</p>
		</div>
	);
}
