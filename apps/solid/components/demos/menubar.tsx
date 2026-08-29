import { createSignal } from 'solid-js';
import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from '@tile-ui/solid';

export default function MenubarDemo() {
	const [sidebar, setSidebar] = createSignal(true);
	const [theme, setTheme] = createSignal('system');
	return (
		<div class="component-preview__stack" data-demo-menubar>
			<Menubar>
				<MenubarMenu value="file">
					<MenubarTrigger>File</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>New file</MenubarItem>
						<MenubarSub>
							<MenubarSubTrigger>Export</MenubarSubTrigger>
							<MenubarSubContent>
								<MenubarItem>JSON</MenubarItem>
							</MenubarSubContent>
						</MenubarSub>
					</MenubarContent>
				</MenubarMenu>
				<MenubarMenu value="view">
					<MenubarTrigger>View</MenubarTrigger>
					<MenubarContent>
						<MenubarCheckboxItem checked={sidebar()} onCheckedChange={setSidebar}>
							Sidebar
						</MenubarCheckboxItem>
						<MenubarRadioGroup value={theme()} onValueChange={setTheme}>
							<MenubarRadioItem value="system">System</MenubarRadioItem>
							<MenubarRadioItem value="light">Light</MenubarRadioItem>
						</MenubarRadioGroup>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
			<p data-demo-state>
				Arrow Left/Right switches open menus; sidebar {sidebar() ? 'shown' : 'hidden'}; {theme()} theme.
			</p>
		</div>
	);
}
