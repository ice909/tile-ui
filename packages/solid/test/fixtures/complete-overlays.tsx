import { createSignal, type JSX } from 'solid-js';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogTrigger,
	Combobox,
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Drawer,
	DrawerContent,
	DrawerTitle,
	DrawerTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@tile-ui/solid';

const Slug = (props: { name: string; children: JSX.Element }) => <section data-slug={props.name}>{props.children}</section>;
const options = [
	{ value: 'alpha', label: 'Alpha' },
	{ value: 'beta', label: 'Beta' },
];

export function CompleteOverlaysFixture(props: { namespace: string }) {
	const [value, setValue] = createSignal('alpha');
	return (
		<main data-stage5-root="overlays">
			<Slug name="alert-dialog">
				<AlertDialog>
					<AlertDialogTrigger data-control="alert-dialog-trigger">Alert</AlertDialogTrigger>
					<AlertDialogContent id={`${props.namespace}alert-dialog`}>
						<AlertDialogTitle>Confirm</AlertDialogTitle>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
					</AlertDialogContent>
				</AlertDialog>
			</Slug>
			<Slug name="combobox">
				<Combobox
					data-control="combobox"
					items={options}
					value={value()}
					onValueChange={setValue}
					triggerId={`${props.namespace}combobox-trigger`}
					contentId={`${props.namespace}combobox-content`}
				/>
			</Slug>
			<Slug name="command">
				<Command defaultSearch="alpha">
					<CommandInput data-control="command-input" />
					<CommandList>
						<CommandGroup heading="Results">
							<CommandItem value="alpha">Alpha</CommandItem>
							<CommandItem value="beta">Beta</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</Slug>
			<Slug name="context-menu">
				<ContextMenu>
					<ContextMenuTrigger data-control="context-trigger">Context</ContextMenuTrigger>
					<ContextMenuContent id={`${props.namespace}context`}>
						<ContextMenuItem>Action</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</Slug>
			<Slug name="drawer">
				<Drawer>
					<DrawerTrigger data-control="drawer-trigger">Drawer</DrawerTrigger>
					<DrawerContent id={`${props.namespace}drawer`}>
						<DrawerTitle>Drawer</DrawerTitle>
					</DrawerContent>
				</Drawer>
			</Slug>
			<Slug name="dropdown-menu">
				<DropdownMenu>
					<DropdownMenuTrigger data-control="dropdown-trigger">Dropdown</DropdownMenuTrigger>
					<DropdownMenuContent id={`${props.namespace}dropdown`}>
						<DropdownMenuItem>Action</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</Slug>
			<Slug name="hover-card">
				<HoverCard openDelay={0} closeDelay={0}>
					<HoverCardTrigger data-control="hover-trigger">Hover</HoverCardTrigger>
					<HoverCardContent id={`${props.namespace}hover`}>Preview</HoverCardContent>
				</HoverCard>
			</Slug>
			<Slug name="menubar">
				<Menubar>
					<MenubarMenu value="file">
						<MenubarTrigger data-control="menubar-trigger">File</MenubarTrigger>
						<MenubarContent id={`${props.namespace}menubar`}>
							<MenubarItem>New</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</Slug>
			<Slug name="navigation-menu">
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem value="products">
							<NavigationMenuTrigger data-control="navigation-trigger">Products</NavigationMenuTrigger>
							<NavigationMenuContent id={`${props.namespace}navigation`}>
								<NavigationMenuLink href="/one">One</NavigationMenuLink>
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</Slug>
			<Slug name="popover">
				<Popover contentId={`${props.namespace}popover`}>
					<PopoverTrigger data-control="popover-trigger">Popover</PopoverTrigger>
					<PopoverContent>Content</PopoverContent>
				</Popover>
			</Slug>
			<Slug name="select">
				<Select defaultValue="alpha" selectedText="Alpha" triggerId={`${props.namespace}select-trigger`} contentId={`${props.namespace}select-content`}>
					<SelectTrigger data-control="select-trigger">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="alpha">Alpha</SelectItem>
						<SelectItem value="beta">Beta</SelectItem>
					</SelectContent>
				</Select>
			</Slug>
			<Slug name="sheet">
				<Sheet>
					<SheetTrigger data-control="sheet-trigger">Sheet</SheetTrigger>
					<SheetContent id={`${props.namespace}sheet`}>
						<SheetTitle>Sheet</SheetTitle>
					</SheetContent>
				</Sheet>
			</Slug>
			<Slug name="tooltip">
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger data-control="tooltip-trigger">Tooltip</TooltipTrigger>
						<TooltipContent id={`${props.namespace}tooltip`}>Help</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</Slug>
		</main>
	);
}
