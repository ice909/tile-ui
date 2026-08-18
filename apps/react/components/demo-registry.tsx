'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertDescription,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
	AlertTitle,
	AspectRatio,
	Attachment,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentFileIcon,
	AttachmentMedia,
	AttachmentTitle,
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Bubble,
	BubbleContent,
	BubbleGroup,
	Button,
	ButtonGroup,
	Calendar,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	ChartContainer,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Combobox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DirectionProvider,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
	Field,
	FieldDescription,
	FieldLabel,
	FieldMessage,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	Kbd,
	KbdGroup,
	Marker,
	MarkerContent,
	MarkerIcon,
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
	Message,
	MessageContent,
	MessageGroup,
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
	NativeSelect,
	NativeSelectOption,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Progress,
	RadioGroup,
	RadioGroupItem,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarProvider,
	SidebarTrigger,
	Skeleton,
	Slider,
	SliderRange,
	SliderThumb,
	SliderTrack,
	Spinner,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Toggle,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	Toaster,
	toast,
} from '@tile-ui/react';

export type Demo = {
	title: string;
	description: string;
	Component: () => ReactNode;
};

function Stack({ children }: { children: ReactNode }) {
	return <div className="component-preview__stack">{children}</div>;
}

export const demoRegistry: Record<string, Demo> = {
	badge: {
		title: 'Badge variants',
		description: 'Badges surface status and short labels with six visual variants.',
		Component: () => (
			<div className="button-group">
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="destructive">Destructive</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="ghost">Ghost</Badge>
				<Badge variant="link">Link</Badge>
			</div>
		),
	},
	skeleton: {
		title: 'Skeleton placeholders',
		description: 'Skeletons reserve space while content loads.',
		Component: () => (
			<Stack>
				<div style={{ display: 'grid', gap: 8 }}>
					<Skeleton style={{ height: 16, width: '60%' }} />
					<Skeleton style={{ height: 16, width: '90%' }} />
					<Skeleton style={{ height: 16, width: '40%' }} />
				</div>
			</Stack>
		),
	},
	kbd: {
		title: 'Keyboard keys',
		description: 'Kbd renders keys and key combinations.',
		Component: () => (
			<KbdGroup>
				<Kbd>Ctrl</Kbd>
				<Kbd>Shift</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
		),
	},
	separator: {
		title: 'Separators',
		description: 'Separators divide content horizontally or vertically.',
		Component: () => (
			<Stack>
				<div>
					<p className="component-preview__text">Above</p>
					<Separator />
					<p className="component-preview__text">Below</p>
				</div>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', height: 24 }}>
					<span className="component-preview__text">Left</span>
					<Separator orientation="vertical" />
					<span className="component-preview__text">Right</span>
				</div>
			</Stack>
		),
	},
	table: {
		title: 'Table',
		description: 'Tables lay out tabular data with header, body, and caption.',
		Component: () => (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>Tile UI</TableCell>
						<TableCell>Design system</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>shadcn</TableCell>
						<TableCell>Registry</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		),
	},
	progress: {
		title: 'Progress bars',
		description: 'Progress shows completion against a range.',
		Component: () => (
			<Stack>
				<Progress value={40} />
				<Progress value={80} />
			</Stack>
		),
	},
	avatar: {
		title: 'Avatars',
		description: 'Avatars show images with a text fallback and group stacking.',
		Component: () => (
			<div className="button-group">
				<Avatar size="sm">
					<AvatarFallback>TU</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarFallback>TU</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarFallback>TU</AvatarFallback>
				</Avatar>
				<AvatarGroup>
					<Avatar>
						<AvatarFallback>A</AvatarFallback>
					</Avatar>
					<Avatar>
						<AvatarFallback>B</AvatarFallback>
					</Avatar>
					<AvatarGroupCount>+3</AvatarGroupCount>
				</AvatarGroup>
			</div>
		),
	},
	switch: {
		title: 'Switches',
		description: 'Switches toggle a boolean setting.',
		Component: () => {
			const [checked, setChecked] = useState(true);
			return (
				<div className="button-group">
					<Switch checked={checked} onCheckedChange={setChecked} />
					<Switch size="sm" />
				</div>
			);
		},
	},
	checkbox: {
		title: 'Checkboxes',
		description: 'Checkboxes support checked and indeterminate states.',
		Component: () => {
			const [checked, setChecked] = useState(true);
			return (
				<div className="button-group">
					<Checkbox checked={checked} onCheckedChange={(next) => setChecked(next === true)} />
					<Checkbox checked="indeterminate" />
					<Checkbox disabled />
				</div>
			);
		},
	},
	collapsible: {
		title: 'Collapsible',
		description: 'Collapsible toggles extra content without a dialog.',
		Component: () => (
			<Collapsible>
				<CollapsibleTrigger className="component-preview__action">Toggle details</CollapsibleTrigger>
				<CollapsibleContent>
					<p className="component-preview__text">This content is hidden until you expand it.</p>
				</CollapsibleContent>
			</Collapsible>
		),
	},
	breadcrumb: {
		title: 'Breadcrumb',
		description: 'Breadcrumbs show the current location in a hierarchy.',
		Component: () => (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/docs/">Docs</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/docs/components/">Components</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Button</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		),
	},
	pagination: {
		title: 'Pagination',
		description: 'Pagination pages through long lists.',
		Component: () => (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious href="#" />
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" isActive>
							1
						</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#">2</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationNext href="#" />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		),
	},
	alert: {
		title: 'Alerts',
		description: 'Alerts surface important feedback with variants.',
		Component: () => (
			<Stack>
				<Alert>
					<AlertTitle>Heads up</AlertTitle>
					<AlertDescription>A new version of Tile UI is available.</AlertDescription>
				</Alert>
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>Your session could not be restored.</AlertDescription>
				</Alert>
			</Stack>
		),
	},
	'aspect-ratio': {
		title: 'Aspect ratio',
		description: 'AspectRatio keeps content at a fixed width-to-height ratio.',
		Component: () => (
			<AspectRatio ratio={16 / 9} style={{ background: 'var(--docs-surface-hover)' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
					<span className="component-preview__text">16:9</span>
				</div>
			</AspectRatio>
		),
	},
	spinner: {
		title: 'Spinners',
		description: 'Spinners indicate in-progress work.',
		Component: () => (
			<div className="button-group">
				<Spinner size="sm" />
				<Spinner />
				<Spinner size="lg" />
			</div>
		),
	},
	empty: {
		title: 'Empty state',
		description: 'Empty guides users when there is nothing to display.',
		Component: () => (
			<Empty>
				<EmptyMedia variant="default">+</EmptyMedia>
				<EmptyTitle>No results</EmptyTitle>
				<EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
			</Empty>
		),
	},
	marker: {
		title: 'Markers',
		description: 'Markers annotate content with visual variants.',
		Component: () => (
			<div className="button-group">
				<Marker variant="default">
					<MarkerIcon />
					<MarkerContent>Default</MarkerContent>
				</Marker>
				<Marker variant="separator">
					<MarkerIcon />
					<MarkerContent>Separator</MarkerContent>
				</Marker>
				<Marker variant="border">
					<MarkerIcon />
					<MarkerContent>Border</MarkerContent>
				</Marker>
			</div>
		),
	},
	item: {
		title: 'List items',
		description: 'Items build consistent rows with media, content, and actions.',
		Component: () => (
			<Stack>
				<Item>
					<ItemMedia>+</ItemMedia>
					<ItemContent>
						<ItemTitle>Tile UI</ItemTitle>
						<ItemDescription>A cross-framework component library.</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button size="sm" variant="outline">
							Open
						</Button>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemMedia>+</ItemMedia>
					<ItemContent>
						<ItemTitle>Outlined item</ItemTitle>
						<ItemDescription>Highlighted with the outline variant.</ItemDescription>
					</ItemContent>
				</Item>
			</Stack>
		),
	},
	'button-group': {
		title: 'Button group',
		description: 'ButtonGroup attaches related buttons into a single control.',
		Component: () => (
			<ButtonGroup>
				<Button variant="outline">One</Button>
				<Button variant="outline">Two</Button>
				<Button variant="outline">Three</Button>
			</ButtonGroup>
		),
	},
	'input-group': {
		title: 'Input group',
		description: 'InputGroup attaches addons and buttons to an input.',
		Component: () => (
			<InputGroup>
				<InputGroupAddon>https://</InputGroupAddon>
				<InputGroupInput placeholder="example.com" />
			</InputGroup>
		),
	},
	'native-select': {
		title: 'Native select',
		description: 'NativeSelect is a styled native dropdown.',
		Component: () => (
			<NativeSelect defaultValue="a" style={{ maxWidth: 260 }}>
				<NativeSelectOption value="a">Option A</NativeSelectOption>
				<NativeSelectOption value="b">Option B</NativeSelectOption>
				<NativeSelectOption value="c">Option C</NativeSelectOption>
			</NativeSelect>
		),
	},
	field: {
		title: 'Field',
		description: 'Field composes label, description, and message.',
		Component: () => (
			<Field name="email" required invalid>
				<FieldLabel htmlFor="demo-email">Email</FieldLabel>
				<input id="demo-email" className="component-preview__native-field" placeholder="you@example.com" />
				<FieldDescription>We never share your email.</FieldDescription>
				<FieldMessage variant="error">An email address is required.</FieldMessage>
			</Field>
		),
	},
	toggle: {
		title: 'Toggles',
		description: 'Toggle expresses a binary selection as a button.',
		Component: () => (
			<div className="button-group">
				<Toggle>Bold</Toggle>
				<Toggle variant="outline">Italic</Toggle>
				<Toggle variant="ghost">Underline</Toggle>
			</div>
		),
	},
	'toggle-group': {
		title: 'Toggle group',
		description: 'ToggleGroup groups single- or multi-select toggles.',
		Component: () => (
			<ToggleGroup type="single" defaultValue="left">
				<ToggleGroupItem value="left">Left</ToggleGroupItem>
				<ToggleGroupItem value="center">Center</ToggleGroupItem>
				<ToggleGroupItem value="right">Right</ToggleGroupItem>
			</ToggleGroup>
		),
	},
	tabs: {
		title: 'Tabs',
		description: 'Tabs switch between panes of content.',
		Component: () => (
			<Tabs defaultValue="account">
				<TabsList>
					<TabsTrigger value="account">Account</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>
				<TabsContent value="account">
					<p className="component-preview__text">Account preferences live here.</p>
				</TabsContent>
				<TabsContent value="settings">
					<p className="component-preview__text">Settings live here.</p>
				</TabsContent>
			</Tabs>
		),
	},
	accordion: {
		title: 'Accordion',
		description: 'Accordion presents collapsible sections.',
		Component: () => (
			<Accordion type="single" collapsible defaultValue="one">
				<AccordionItem value="one">
					<AccordionTrigger>Section one</AccordionTrigger>
					<AccordionContent>
						<p className="component-preview__text">Content one.</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="two">
					<AccordionTrigger>Section two</AccordionTrigger>
					<AccordionContent>
						<p className="component-preview__text">Content two.</p>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		),
	},
	'radio-group': {
		title: 'Radio group',
		description: 'RadioGroup selects one of several options.',
		Component: () => (
			<RadioGroup defaultValue="a" orientation="horizontal">
				<div className="button-group">
					<RadioGroupItem value="a" />
					<RadioGroupItem value="b" />
					<RadioGroupItem value="c" />
				</div>
			</RadioGroup>
		),
	},
	slider: {
		title: 'Slider',
		description: 'Slider picks a value from a range.',
		Component: () => {
			const [value, setValue] = useState(40);
			return (
				<Stack>
					<Slider value={value} onValueChange={setValue} max={100} step={1}>
						<SliderTrack>
							<SliderRange />
							<SliderThumb />
						</SliderTrack>
					</Slider>
					<p className="component-preview__text">
						Value: <strong>{value}</strong>
					</p>
				</Stack>
			);
		},
	},
	'scroll-area': {
		title: 'Scroll area',
		description: 'ScrollArea provides a styled scroll container.',
		Component: () => (
			<ScrollArea style={{ maxHeight: 140 }}>
				<div style={{ paddingRight: 16 }}>
					{Array.from({ length: 12 }, (_, i) => (
						<p key={i} className="component-preview__text">
							Line {i + 1} — scrollable content.
						</p>
					))}
				</div>
			</ScrollArea>
		),
	},
	tooltip: {
		title: 'Tooltip',
		description: 'Tooltip shows contextual help on hover or focus.',
		Component: () => (
			<Tooltip>
				<TooltipTrigger className="component-preview__action">Hover me</TooltipTrigger>
				<TooltipContent>Helpful context here.</TooltipContent>
			</Tooltip>
		),
	},
	popover: {
		title: 'Popover',
		description: 'Popover shows richer content anchored to a trigger.',
		Component: () => (
			<Popover>
				<PopoverTrigger className="component-preview__action">Open popover</PopoverTrigger>
				<PopoverContent>
					<div style={{ display: 'grid', gap: 8 }}>
						<p className="component-preview__text">Rich content anchored to the trigger.</p>
					</div>
				</PopoverContent>
			</Popover>
		),
	},
	'hover-card': {
		title: 'Hover card',
		description: 'HoverCard shows a preview when hovering a trigger.',
		Component: () => (
			<HoverCard>
				<HoverCardTrigger className="component-preview__action">Hover me</HoverCardTrigger>
				<HoverCardContent>
					<div style={{ display: 'grid', gap: 8 }}>
						<p className="component-preview__text">Preview content on hover.</p>
					</div>
				</HoverCardContent>
			</HoverCard>
		),
	},
	dialog: {
		title: 'Dialog',
		description: 'Dialog requires a decision before continuing.',
		Component: () => (
			<Dialog>
				<DialogTrigger className="component-preview__action">Open dialog</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit profile</DialogTitle>
						<DialogDescription>Make changes to your profile here.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline">Cancel</Button>
						<Button>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		),
	},
	'alert-dialog': {
		title: 'Alert dialog',
		description: 'AlertDialog interrupts for confirmation.',
		Component: () => (
			<AlertDialog>
				<AlertDialogTrigger className="component-preview__action">Delete</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		),
	},
	sheet: {
		title: 'Sheet',
		description: 'Sheet slides a panel from the edge.',
		Component: () => (
			<Sheet>
				<SheetTrigger className="component-preview__action">Open sheet</SheetTrigger>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Details</SheetTitle>
						<SheetDescription>Supporting details for this panel.</SheetDescription>
					</SheetHeader>
				</SheetContent>
			</Sheet>
		),
	},
	'dropdown-menu': {
		title: 'Dropdown menu',
		description: 'DropdownMenu offers a list of actions.',
		Component: () => (
			<DropdownMenu>
				<DropdownMenuTrigger className="component-preview__action">Open menu</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Profile</DropdownMenuItem>
					<DropdownMenuItem>Settings</DropdownMenuItem>
					<DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
	'context-menu': {
		title: 'Context menu',
		description: 'ContextMenu shows actions on right-click.',
		Component: () => (
			<ContextMenu>
				<ContextMenuTrigger>
					<div className="component-preview__action">Right-click me</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Copy</ContextMenuItem>
					<ContextMenuItem>Paste</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		),
	},
	menubar: {
		title: 'Menubar',
		description: 'Menubar provides a desktop-style application menu.',
		Component: () => (
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
		),
	},
	'navigation-menu': {
		title: 'Navigation menu',
		description: 'NavigationMenu provides primary navigation.',
		Component: () => (
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem value="docs">
						<NavigationMenuTrigger>Docs</NavigationMenuTrigger>
						<NavigationMenuContent>
							<div style={{ padding: 12 }}>
								<p className="component-preview__text">Documentation links live here.</p>
							</div>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem value="components">
						<NavigationMenuTrigger>Components</NavigationMenuTrigger>
						<NavigationMenuContent>
							<div style={{ padding: 12 }}>
								<p className="component-preview__text">Component links live here.</p>
							</div>
						</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
				<NavigationMenuViewport />
			</NavigationMenu>
		),
	},
	select: {
		title: 'Select',
		description: 'Select picks one value from a styled dropdown.',
		Component: () => (
			<Select defaultValue="apple">
				<SelectTrigger style={{ width: 220 }}>
					<SelectValue placeholder="Choose a fruit" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="cherry">Cherry</SelectItem>
				</SelectContent>
			</Select>
		),
	},
	combobox: {
		title: 'Combobox',
		description: 'Combobox selects from a searchable list.',
		Component: () => (
			<Combobox
				items={[
					{ value: 'apple', label: 'Apple' },
					{ value: 'banana', label: 'Banana' },
					{ value: 'cherry', label: 'Cherry' },
					{ value: 'date', label: 'Date' },
				]}
				placeholder="Pick a fruit"
				style={{ maxWidth: 280 }}
			/>
		),
	},
	command: {
		title: 'Command',
		description: 'Command builds searchable command menus.',
		Component: () => (
			<Command>
				<CommandInput placeholder="Type a command..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Suggestions">
						<CommandItem value="calendar">Calendar</CommandItem>
						<CommandItem value="search">Search</CommandItem>
						<CommandItem value="settings">Settings</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		),
	},
	chart: {
		title: 'Chart',
		description: 'ChartContainer renders line, bar, and area charts.',
		Component: () => (
			<ChartContainer
				config={{ desktop: { label: 'Desktop', color: '#3b82f6' }, mobile: { label: 'Mobile', color: '#22c55e' } }}
				data={[
					{ x: 'Jan', desktop: 100, mobile: 80 },
					{ x: 'Feb', desktop: 140, mobile: 90 },
					{ x: 'Mar', desktop: 120, mobile: 130 },
					{ x: 'Apr', desktop: 180, mobile: 150 },
				]}
				xKey="x"
				type="line"
				showLegend
			/>
		),
	},
	calendar: {
		title: 'Calendar',
		description: 'Calendar picks dates in single, multiple, or range modes.',
		Component: () => (
			<Calendar
				mode="single"
				onSelect={(selection) => {
					toast.info(`Selected ${selection instanceof Date ? selection.toDateString() : 'date'}`);
				}}
			/>
		),
	},
	drawer: {
		title: 'Drawer',
		description: 'Drawer slides a panel in from any direction.',
		Component: () => (
			<Drawer direction="right">
				<DrawerTrigger className="component-preview__action">Open drawer</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Title</DrawerTitle>
						<DrawerDescription>Description for the drawer.</DrawerDescription>
					</DrawerHeader>
				</DrawerContent>
			</Drawer>
		),
	},
	form: {
		title: 'Form',
		description: 'Form manages validation, values, and submission.',
		Component: () => (
			<Form>
				<FormField
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="you@example.com" value={String(field.value ?? '')} onChange={(e) => field.onChange(e.target.value)} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</Form>
		),
	},
	sidebar: {
		title: 'Sidebar',
		description: 'Sidebar adds a collapsible application sidebar.',
		Component: () => (
			<SidebarProvider>
				<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
					<Sidebar collapsible="icon" style={{ position: 'static', height: 220 }}>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupLabel>Menu</SidebarGroupLabel>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
					<SidebarTrigger className="component-preview__action">Toggle</SidebarTrigger>
				</div>
			</SidebarProvider>
		),
	},
	carousel: {
		title: 'Carousel',
		description: 'Carousel cycles through a set of items.',
		Component: () => (
			<Carousel>
				<CarouselContent>
					{['Slide one', 'Slide two', 'Slide three'].map((text) => (
						<CarouselItem key={text}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									height: 160,
									borderRadius: '0.5rem',
									background: 'var(--docs-surface-hover)',
								}}>
								<p className="component-preview__text">{text}</p>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		),
	},
	resizable: {
		title: 'Resizable',
		description: 'ResizablePanelGroup creates adjustable split layouts.',
		Component: () => (
			<ResizablePanelGroup direction="horizontal" style={{ height: 140, display: 'flex', width: '100%' }}>
				<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
					<p className="component-preview__text">Left</p>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
					<p className="component-preview__text">Right</p>
				</ResizablePanel>
			</ResizablePanelGroup>
		),
	},
	attachment: {
		title: 'Attachment',
		description: 'Attachment displays files with state and actions.',
		Component: () => (
			<Attachment>
				<AttachmentMedia>
					<AttachmentFileIcon kind="pdf" />
				</AttachmentMedia>
				<AttachmentContent>
					<AttachmentTitle>report.pdf</AttachmentTitle>
					<AttachmentDescription>2.4 MB</AttachmentDescription>
				</AttachmentContent>
				<AttachmentActions>
					<Button size="sm" variant="outline">
						Download
					</Button>
				</AttachmentActions>
			</Attachment>
		),
	},
	bubble: {
		title: 'Bubble',
		description: 'Bubble builds chat message bubbles.',
		Component: () => (
			<BubbleGroup>
				<Bubble align="start">
					<BubbleContent>Hello there</BubbleContent>
				</Bubble>
				<Bubble align="end" variant="tinted">
					<BubbleContent>Hi! How can I help?</BubbleContent>
				</Bubble>
			</BubbleGroup>
		),
	},
	direction: {
		title: 'Direction',
		description: 'DirectionProvider sets the reading direction.',
		Component: () => {
			const [rtl, setRtl] = useState(false);
			return (
				<Stack>
					<DirectionProvider dir={rtl ? 'rtl' : 'ltr'}>
						<div style={{ display: 'flex', gap: 8 }}>
							<span className="component-preview__text">One</span>
							<span className="component-preview__text">Two</span>
							<span className="component-preview__text">Three</span>
						</div>
					</DirectionProvider>
					<div className="button-group">
						<Button variant="outline" onClick={() => setRtl((v) => !v)}>
							{rtl ? 'RTL' : 'LTR'}
						</Button>
					</div>
				</Stack>
			);
		},
	},
	message: {
		title: 'Message',
		description: 'Message composes chat messages with avatar and content.',
		Component: () => (
			<MessageGroup>
				<Message align="end">
					<MessageContent>Hi there</MessageContent>
				</Message>
				<Message align="start">
					<MessageContent>Hey! What can I help with?</MessageContent>
				</Message>
			</MessageGroup>
		),
	},
	'message-scroller': {
		title: 'Message scroller',
		description: 'MessageScroller scrolls a message list with anchoring.',
		Component: () => (
			<MessageScrollerProvider>
				<MessageScroller style={{ maxHeight: 160 }}>
					<MessageScrollerViewport>
						<MessageScrollerContent>
							{Array.from({ length: 8 }, (_, i) => (
								<MessageScrollerItem key={i}>
									<p className="component-preview__text">Message {i + 1}</p>
								</MessageScrollerItem>
							))}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="start">↑</MessageScrollerButton>
					<MessageScrollerButton direction="end">↓</MessageScrollerButton>
				</MessageScroller>
			</MessageScrollerProvider>
		),
	},
	sonner: {
		title: 'Toasts',
		description: 'Toaster and toast show transient notifications.',
		Component: () => (
			<Stack>
				<div className="button-group">
					<Button onClick={() => toast('Default toast')}>Default</Button>
					<Button variant="outline" onClick={() => toast.success('Saved successfully')}>
						Success
					</Button>
					<Button variant="destructive" onClick={() => toast.error('Something went wrong')}>
						Error
					</Button>
				</div>
				<Toaster position="bottom-right" />
			</Stack>
		),
	},
	'input-otp': {
		title: 'Input OTP',
		description: 'InputOTP collects a one-time code across slots.',
		Component: () => (
			<InputOTP maxLength={6}>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
		),
	},
};
