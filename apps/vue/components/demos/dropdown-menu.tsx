import { TDropdownMenu, TDropdownMenuTrigger, TDropdownMenuContent, TDropdownMenuItem } from '@tile-ui/vue';

export default function DropdownMenuDemo() {
	return (
		<TDropdownMenu>
			<TDropdownMenuTrigger class="component-preview__action">Open menu</TDropdownMenuTrigger>
			<TDropdownMenuContent>
				<TDropdownMenuItem>Profile</TDropdownMenuItem>
				<TDropdownMenuItem>Settings</TDropdownMenuItem>
				<TDropdownMenuItem variant="destructive">Sign out</TDropdownMenuItem>
			</TDropdownMenuContent>
		</TDropdownMenu>
	);
}
