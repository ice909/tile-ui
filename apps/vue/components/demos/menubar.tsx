import { TMenubar, TMenubarMenu, TMenubarTrigger, TMenubarContent, TMenubarItem } from '@tile-ui/vue';

export default function MenubarDemo() {
	return (
		<TMenubar>
			<TMenubarMenu value="file">
				<TMenubarTrigger>File</TMenubarTrigger>
				<TMenubarContent>
					<TMenubarItem>New</TMenubarItem>
					<TMenubarItem>Open</TMenubarItem>
				</TMenubarContent>
			</TMenubarMenu>
		</TMenubar>
	);
}
