import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from '@tile-ui/react';

export default function MenubarDemo() {
	return (
		<Menubar>
			<MenubarMenu value="file">
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New</MenubarItem>
					<MenubarItem>Open</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu value="edit">
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>Undo</MenubarItem>
					<MenubarItem>Redo</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
