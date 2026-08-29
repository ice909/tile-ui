import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../src/components/context-menu/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../src/components/dropdown-menu/dropdown-menu';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '../../src/components/menubar/menubar';

export function Batch4MenuHydrationFixture() {
	return (
		<div data-id="batch4-menu-root">
			<DropdownMenu defaultOpen>
				<DropdownMenuContent id="fixture-dropdown-content">
					<DropdownMenuItem>Action</DropdownMenuItem>
				</DropdownMenuContent>
				<DropdownMenuTrigger id="fixture-dropdown-trigger">Dropdown</DropdownMenuTrigger>
			</DropdownMenu>
			<ContextMenu defaultOpen>
				<ContextMenuContent id="fixture-context-content">
					<ContextMenuItem>Action</ContextMenuItem>
				</ContextMenuContent>
				<ContextMenuTrigger id="fixture-context-trigger">Context</ContextMenuTrigger>
			</ContextMenu>
			<Menubar defaultValue="file">
				<MenubarMenu value="file">
					<MenubarContent id="fixture-menubar-content">
						<MenubarItem>New</MenubarItem>
					</MenubarContent>
					<MenubarTrigger id="fixture-menubar-trigger">File</MenubarTrigger>
				</MenubarMenu>
			</Menubar>
		</div>
	);
}
