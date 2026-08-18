import { TDrawer, TDrawerTrigger, TDrawerContent, TDrawerHeader, TDrawerTitle, TDrawerDescription } from '@tile-ui/vue';

export default function DrawerDemo() {
	return (
		<TDrawer direction="right">
			<TDrawerTrigger class="component-preview__action">Open drawer</TDrawerTrigger>
			<TDrawerContent>
				<TDrawerHeader>
					<TDrawerTitle>Title</TDrawerTitle>
					<TDrawerDescription>Description for the drawer.</TDrawerDescription>
				</TDrawerHeader>
			</TDrawerContent>
		</TDrawer>
	);
}
