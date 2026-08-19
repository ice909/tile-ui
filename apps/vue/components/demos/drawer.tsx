import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@tile-ui/vue';

export default function DrawerDemo() {
	return (
		<Drawer direction="right">
			<DrawerTrigger class="component-preview__action">Open drawer</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Title</DrawerTitle>
					<DrawerDescription>Description for the drawer.</DrawerDescription>
				</DrawerHeader>
			</DrawerContent>
		</Drawer>
	);
}
