import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from '@tile-ui/vue';

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
		</Menubar>
	);
}
