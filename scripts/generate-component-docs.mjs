#!/usr/bin/env node
/**
 * 生成组件文档（React + Vue）
 *
 * 从 packages/core 的类型定义 + registry 依赖自动生成 API reference 与依赖表，
 * 结合手工维护的标题/描述/亮点/用法，输出到 apps/{react,vue}/content/docs/components。
 *
 * 已手工编写预览的组件（button/card/input/label/textarea）不在此生成范围内。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SKIP = new Set(['button', 'card', 'input', 'label', 'textarea']);

const mainOverrides = {
	direction: 'DirectionProvider',
	sonner: 'Toaster',
	resizable: 'ResizablePanelGroup',
	chart: 'ChartContainer',
};

const apiNameOverrides = {
	Direction: 'DirectionProvider',
	SonnerToaster: 'Toaster',
};

const depPurpose = {
	core: 'Framework-agnostic logic helpers',
	utils: 'Shared utility helpers',
	styles: 'Shared SCSS tokens and globals',
};

function pascalCase(slug) {
	return slug
		.split('-')
		.filter(Boolean)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join('');
}

const META = [
	{
		name: 'badge',
		description: 'A small status or label indicator with multiple visual variants.',
		intro: 'Use Badge to surface status, counts, or short labels next to content.',
		highlights: ['Six visual variants', '`asChild` support for composition', 'Pairs with Avatar, Item, and Table'],
		usage: '<Badge variant="secondary">New</Badge>',
		related: ['card', 'avatar', 'alert'],
	},
	{
		name: 'skeleton',
		description: 'A loading placeholder that mirrors the shape of the content it replaces.',
		intro: 'Use Skeleton to reserve layout space while content loads.',
		highlights: ['Pulse animation', 'Sizes to its container', 'Composes inside Card and Table'],
		usage: '<Skeleton />',
		related: ['card', 'progress', 'spinner'],
	},
	{
		name: 'kbd',
		description: 'Keyboard key and key-combination display primitives.',
		intro: 'Use Kbd to render keyboard shortcuts in docs, toolbars, and menus.',
		highlights: ['Single keys and key groups', 'Pairs with Command and Menubar shortcuts'],
		usage: '<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>',
		related: ['command', 'tooltip', 'badge'],
	},
	{
		name: 'separator',
		description: 'A horizontal or vertical divider.',
		intro: 'Use Separator to divide sections or items without extra markup.',
		highlights: ['Horizontal and vertical orientation', 'Decorative mode for accessibility'],
		usage: '<Separator />',
		related: ['dropdown-menu', 'menubar', 'sidebar'],
	},
	{
		name: 'table',
		description: 'Composable table primitives for data display.',
		intro: 'Use Table to lay out tabular data with consistent header, body, and footer sections.',
		highlights: ['Header, body, footer, and caption', 'Row, head, and cell primitives', 'Pairs with Pagination'],
		usage: '<Table>\n\t<TableHeader>\n\t\t<TableRow>\n\t\t\t<TableHead>Name</TableHead>\n\t\t</TableRow>\n\t</TableHeader>\n\t<TableBody>\n\t\t<TableRow>\n\t\t\t<TableCell>Tile UI</TableCell>\n\t\t</TableRow>\n\t</TableBody>\n</Table>',
		related: ['pagination', 'card', 'badge'],
	},
	{
		name: 'progress',
		description: 'A progress bar for task or step completion.',
		intro: 'Use Progress to show completion or indeterminate loading.',
		highlights: ['Value, min, and max props', 'Accessible progress role', 'Composes in forms and cards'],
		usage: '<Progress value={40} />',
		related: ['spinner', 'skeleton', 'form'],
	},
	{
		name: 'avatar',
		description: 'User avatar primitives with image fallback.',
		intro: 'Use Avatar to show user or entity images with a text fallback.',
		highlights: ['Image, fallback, and badge', 'Group stacking', 'Three sizes'],
		usage: '<Avatar>\n\t<AvatarImage alt="Tile UI" src="https://example.com/avatar.png" />\n\t<AvatarFallback>TU</AvatarFallback>\n</Avatar>',
		related: ['badge', 'item', 'message'],
	},
	{
		name: 'switch',
		description: 'An accessible toggle switch.',
		intro: 'Use Switch to toggle a boolean setting on or off.',
		highlights: ['Two sizes', 'Accessible switch role', 'Pairs with Field and Form'],
		usage: '<Switch />',
		related: ['checkbox', 'toggle', 'form'],
	},
	{
		name: 'checkbox',
		description: 'An accessible checkbox with indeterminate state.',
		intro: 'Use Checkbox for multi-select choices.',
		highlights: ['Indeterminate state support', 'Accessible checkbox role', 'Pairs with Field and Form'],
		usage: '<Checkbox />',
		related: ['switch', 'radio-group', 'form'],
	},
	{
		name: 'collapsible',
		description: 'An accessible collapsible content container.',
		intro: 'Use Collapsible to toggle extra content without a dialog.',
		highlights: ['Open and defaultOpen states', 'Trigger and content', 'Disabled state'],
		usage: '<Collapsible>\n\t<CollapsibleTrigger>Details</CollapsibleTrigger>\n\t<CollapsibleContent>Extra content here.</CollapsibleContent>\n</Collapsible>',
		related: ['accordion', 'dialog', 'sheet'],
	},
	{
		name: 'breadcrumb',
		description: 'Navigation breadcrumb primitives.',
		intro: 'Use Breadcrumb to show the current location in a hierarchy.',
		highlights: ['List, item, link, and page', 'Separator and ellipsis', '`asChild` on links'],
		usage: '<Breadcrumb>\n\t<BreadcrumbList>\n\t\t<BreadcrumbItem>\n\t\t\t<BreadcrumbLink href="/docs">Docs</BreadcrumbLink>\n\t\t</BreadcrumbItem>\n\t\t<BreadcrumbSeparator />\n\t\t<BreadcrumbItem>\n\t\t\t<BreadcrumbPage>Button</BreadcrumbPage>\n\t\t</BreadcrumbItem>\n\t</BreadcrumbList>\n</Breadcrumb>',
		related: ['pagination', 'navigation-menu', 'sidebar'],
	},
	{
		name: 'pagination',
		description: 'Navigation pagination primitives.',
		intro: 'Use Pagination to page through long lists.',
		highlights: ['Link, previous, next, and ellipsis', 'Active state', 'Four sizes'],
		usage: '<Pagination>\n\t<PaginationContent>\n\t\t<PaginationItem>\n\t\t\t<PaginationPrevious href="#" />\n\t\t</PaginationItem>\n\t\t<PaginationItem>\n\t\t\t<PaginationLink href="#" isActive>1</PaginationLink>\n\t\t</PaginationItem>\n\t\t<PaginationItem>\n\t\t\t<PaginationNext href="#" />\n\t\t</PaginationItem>\n\t</PaginationContent>\n</Pagination>',
		related: ['table', 'breadcrumb', 'select'],
	},
	{
		name: 'alert',
		description: 'Alert banner primitives.',
		intro: 'Use Alert to surface important, time-sensitive feedback.',
		highlights: ['Default and destructive variants', 'Title and description', 'Pairs with Card and Form'],
		usage: '<Alert variant="destructive">\n\t<AlertTitle>Heads up</AlertTitle>\n\t<AlertDescription>Your session expires in 5 minutes.</AlertDescription>\n</Alert>',
		related: ['badge', 'card', 'form'],
	},
	{
		name: 'aspect-ratio',
		description: 'A fixed-ratio content container.',
		intro: 'Use AspectRatio to keep media or content at a fixed width-to-height ratio.',
		highlights: ['Ratio prop', 'Fills its container'],
		usage: '<AspectRatio ratio={16 / 9}>\n\t<img src="https://example.com/poster.png" alt="Poster" />\n</AspectRatio>',
		related: ['card', 'carousel', 'avatar'],
	},
	{
		name: 'spinner',
		description: 'A loading spinner.',
		intro: 'Use Spinner to indicate in-progress work.',
		highlights: ['Three sizes', 'Pulse animation'],
		usage: '<Spinner />',
		related: ['progress', 'skeleton', 'button'],
	},
	{
		name: 'empty',
		description: 'Empty state primitives.',
		intro: 'Use Empty to guide users when there is nothing to display.',
		highlights: ['Header, media, title, and description', 'Default and icon media variants'],
		usage: '<Empty>\n\t<EmptyMedia variant="muted">+</EmptyMedia>\n\t<EmptyTitle>No results</EmptyTitle>\n\t<EmptyDescription>Try adjusting your search.</EmptyDescription>\n</Empty>',
		related: ['alert', 'item', 'card'],
	},
	{
		name: 'marker',
		description: 'A status marker component.',
		intro: 'Use Marker to annotate content with visual variants.',
		highlights: ['Default, separator, and border variants', 'Icon and content', '`asChild` support'],
		usage: '<Marker variant="separator">\n\t<MarkerIcon />\n\t<MarkerContent>Status</MarkerContent>\n</Marker>',
		related: ['badge', 'item', 'empty'],
	},
	{
		name: 'item',
		description: 'Composable list item primitives.',
		intro: 'Use Item to build consistent list rows with media, content, and actions.',
		highlights: ['Media, content, and actions', 'Group and separator', 'Default, outline, and muted variants'],
		usage: '<Item>\n\t<ItemMedia>+</ItemMedia>\n\t<ItemContent>\n\t\t<ItemTitle>Tile UI</ItemTitle>\n\t\t<ItemDescription>A cross-framework component library.</ItemDescription>\n\t</ItemContent>\n\t<ItemActions>\n\t\t<Button size="sm">Open</Button>\n\t</ItemActions>\n</Item>',
		related: ['avatar', 'badge', 'message'],
	},
	{
		name: 'button-group',
		description: 'Grouped button container.',
		intro: 'Use ButtonGroup to attach related buttons into a single control.',
		highlights: ['Horizontal and vertical orientation', 'Text and separator'],
		usage: '<ButtonGroup>\n\t<Button>One</Button>\n\t<Button>Two</Button>\n\t<Button>Three</Button>\n</ButtonGroup>',
		related: ['button', 'toggle-group', 'input-group'],
	},
	{
		name: 'input-group',
		description: 'Composable input group primitives.',
		intro: 'Use InputGroup to attach addons, buttons, and text to an input.',
		highlights: ['Addon, button, and text', 'Input and textarea', 'Addon alignment'],
		usage: '<InputGroup>\n\t<InputGroupAddon>https://</InputGroupAddon>\n\t<InputGroupInput placeholder="example.com" />\n</InputGroup>',
		related: ['input', 'button', 'native-select'],
	},
	{
		name: 'native-select',
		description: 'A native select with custom chevron.',
		intro: 'Use NativeSelect for a styled native dropdown.',
		highlights: ['Two sizes', 'Option and optgroup', 'Custom chevron'],
		usage: '<NativeSelect defaultValue="a">\n\t<NativeSelectOption value="a">Option A</NativeSelectOption>\n\t<NativeSelectOption value="b">Option B</NativeSelectOption>\n</NativeSelect>',
		related: ['select', 'combobox', 'input'],
	},
	{
		name: 'field',
		description: 'Field label, description, and message wrapper.',
		intro: 'Use Field to compose accessible form fields with consistent structure.',
		highlights: ['Label, description, and message', 'Invalid and required states', 'Message variants'],
		usage: '<Field name="email" required>\n\t<FieldLabel htmlFor="email">Email</FieldLabel>\n\t<input id="email" />\n\t<FieldDescription>We never share your email.</FieldDescription>\n\t<FieldMessage variant="error">Required.</FieldMessage>\n</Field>',
		related: ['input', 'label', 'form'],
	},
	{
		name: 'toggle',
		description: 'A toggle button with pressed state.',
		intro: 'Use Toggle to express a binary on/off selection as a button.',
		highlights: ['Three variants', 'Three sizes', 'Pressed state'],
		usage: '<Toggle variant="outline">Bold</Toggle>',
		related: ['toggle-group', 'switch', 'checkbox'],
	},
	{
		name: 'toggle-group',
		description: 'Grouped toggle buttons.',
		intro: 'Use ToggleGroup to group mutually exclusive or multiple selectable toggles.',
		highlights: ['Single and multiple modes', 'Item variants and sizes'],
		usage: '<ToggleGroup type="single" defaultValue="a">\n\t<ToggleGroupItem value="a">A</ToggleGroupItem>\n\t<ToggleGroupItem value="b">B</ToggleGroupItem>\n</ToggleGroup>',
		related: ['toggle', 'button-group', 'tabs'],
	},
	{
		name: 'tabs',
		description: 'Tabs navigation primitives.',
		intro: 'Use Tabs to switch between panes of content.',
		highlights: ['List, trigger, and content', 'Controlled and uncontrolled', 'Horizontal and vertical'],
		usage: '<Tabs defaultValue="account">\n\t<TabsList>\n\t\t<TabsTrigger value="account">Account</TabsTrigger>\n\t\t<TabsTrigger value="settings">Settings</TabsTrigger>\n\t</TabsList>\n\t<TabsContent value="account">Account content.</TabsContent>\n\t<TabsContent value="settings">Settings content.</TabsContent>\n</Tabs>',
		related: ['accordion', 'toggle-group', 'command'],
	},
	{
		name: 'accordion',
		description: 'Collapsible accordion.',
		intro: 'Use Accordion to present collapsible sections.',
		highlights: ['Single and multiple modes', 'Collapsible mode', 'Item and content'],
		usage: '<Accordion type="single" collapsible>\n\t<AccordionItem value="one">\n\t\t<AccordionTrigger>Section one</AccordionTrigger>\n\t\t<AccordionContent>Content one.</AccordionContent>\n\t</AccordionItem>\n</Accordion>',
		related: ['collapsible', 'tabs', 'dialog'],
	},
	{
		name: 'radio-group',
		description: 'Radio group selection.',
		intro: 'Use RadioGroup to let users pick one of several options.',
		highlights: ['Controlled and uncontrolled', 'Horizontal and vertical', 'Item disabled'],
		usage: '<RadioGroup defaultValue="a">\n\t<RadioGroupItem value="a" />\n\t<RadioGroupItem value="b" />\n</RadioGroup>',
		related: ['checkbox', 'select', 'form'],
	},
	{
		name: 'slider',
		description: 'Slider control.',
		intro: 'Use Slider to pick a value from a range.',
		highlights: ['Min, max, and step', 'Horizontal and vertical', 'Track, range, and thumb'],
		usage: '<Slider defaultValue={[50]} max={100} step={1} />',
		related: ['progress', 'switch', 'form'],
	},
	{
		name: 'scroll-area',
		description: 'Custom scroll area.',
		intro: 'Use ScrollArea for a styled scroll container with custom bars.',
		highlights: ['Viewport and scrollbar', 'Horizontal and vertical bars'],
		usage: '<ScrollArea>\n\t<div style={{ height: 120 }}>Long content here.</div>\n</ScrollArea>',
		related: ['message-scroller', 'dialog', 'table'],
	},
	{
		name: 'tooltip',
		description: 'Tooltip overlay.',
		intro: 'Use Tooltip to show contextual help on hover or focus.',
		highlights: ['Provider with delay', 'Trigger and content', 'Side and offset'],
		usage: '<Tooltip>\n\t<TooltipTrigger>Hover me</TooltipTrigger>\n\t<TooltipContent>Help text.</TooltipContent>\n</Tooltip>',
		related: ['popover', 'hover-card', 'kbd'],
	},
	{
		name: 'popover',
		description: 'Popover overlay.',
		intro: 'Use Popover to show richer content anchored to a trigger.',
		highlights: ['Trigger and content', 'Side, align, and offset', 'Controlled and uncontrolled'],
		usage: '<Popover>\n\t<PopoverTrigger>Open</PopoverTrigger>\n\t<PopoverContent>Rich content here.</PopoverContent>\n</Popover>',
		related: ['tooltip', 'hover-card', 'dropdown-menu'],
	},
	{
		name: 'hover-card',
		description: 'Hover card overlay.',
		intro: 'Use HoverCard to show a preview when hovering a trigger.',
		highlights: ['Open and close delay', 'Side and align', 'Trigger and content'],
		usage: '<HoverCard>\n\t<HoverCardTrigger>Hover me</HoverCardTrigger>\n\t<HoverCardContent>Preview content.</HoverCardContent>\n</HoverCard>',
		related: ['popover', 'tooltip', 'avatar'],
	},
	{
		name: 'dialog',
		description: 'Modal dialog.',
		intro: 'Use Dialog to require a decision before continuing.',
		highlights: ['Trigger, overlay, and content', 'Header, footer, title, and description', 'Close button'],
		usage: '<Dialog>\n\t<DialogTrigger>Open</DialogTrigger>\n\t<DialogContent>\n\t\t<DialogHeader>\n\t\t\t<DialogTitle>Edit profile</DialogTitle>\n\t\t\t<DialogDescription>Make changes to your profile.</DialogDescription>\n\t\t</DialogHeader>\n\t\t<DialogFooter>\n\t\t\t<Button>Save</Button>\n\t\t</DialogFooter>\n\t</DialogContent>\n</Dialog>',
		related: ['alert-dialog', 'sheet', 'drawer'],
	},
	{
		name: 'alert-dialog',
		description: 'Alert dialog.',
		intro: 'Use AlertDialog to interrupt for confirmation of a destructive or important action.',
		highlights: ['Action and cancel buttons', 'Overlay and content', 'Two sizes'],
		usage: '<AlertDialog>\n\t<AlertDialogTrigger>Delete</AlertDialogTrigger>\n\t<AlertDialogContent>\n\t\t<AlertDialogTitle>Are you sure?</AlertDialogTitle>\n\t\t<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>\n\t\t<AlertDialogCancel>Cancel</AlertDialogCancel>\n\t\t<AlertDialogAction>Delete</AlertDialogAction>\n\t</AlertDialogContent>\n</AlertDialog>',
		related: ['dialog', 'sheet', 'drawer'],
	},
	{
		name: 'sheet',
		description: 'Side sheet overlay.',
		intro: 'Use Sheet to slide a panel from the edge of the screen.',
		highlights: ['Four sides', 'Trigger, overlay, and content', 'Header, footer, title, and description'],
		usage: '<Sheet>\n\t<SheetTrigger>Open</SheetTrigger>\n\t<SheetContent side="right">\n\t\t<SheetTitle>Details</SheetTitle>\n\t\t<SheetDescription>Supporting details.</SheetDescription>\n\t</SheetContent>\n</Sheet>',
		related: ['dialog', 'drawer', 'sidebar'],
	},
	{
		name: 'dropdown-menu',
		description: 'Dropdown menu with checkbox and radio items.',
		intro: 'Use DropdownMenu to offer a list of actions from a trigger.',
		highlights: ['Item, checkbox item, and radio group', 'Sub menus', 'Side, align, and offset'],
		usage: '<DropdownMenu>\n\t<DropdownMenuTrigger>Menu</DropdownMenuTrigger>\n\t<DropdownMenuContent>\n\t\t<DropdownMenuItem>Profile</DropdownMenuItem>\n\t\t<DropdownMenuItem>Settings</DropdownMenuItem>\n\t</DropdownMenuContent>\n</DropdownMenu>',
		related: ['context-menu', 'menubar', 'select'],
	},
	{
		name: 'context-menu',
		description: 'Right-click context menu.',
		intro: 'Use ContextMenu to show actions on right-click.',
		highlights: ['Trigger and content', 'Item, checkbox, and radio', 'Sub menus'],
		usage: '<ContextMenu>\n\t<ContextMenuTrigger>Right-click me</ContextMenuTrigger>\n\t<ContextMenuContent>\n\t\t<ContextMenuItem>Copy</ContextMenuItem>\n\t\t<ContextMenuItem>Paste</ContextMenuItem>\n\t</ContextMenuContent>\n</ContextMenu>',
		related: ['dropdown-menu', 'menubar', 'command'],
	},
	{
		name: 'menubar',
		description: 'Horizontal menu bar.',
		intro: 'Use Menubar for a desktop-style application menu.',
		highlights: ['Multiple menus', 'Trigger and content', 'Checkbox and radio items'],
		usage: '<Menubar>\n\t<MenubarMenu value="file">\n\t\t<MenubarTrigger>File</MenubarTrigger>\n\t\t<MenubarContent>\n\t\t\t<MenubarItem>New</MenubarItem>\n\t\t\t<MenubarItem>Open</MenubarItem>\n\t\t</MenubarContent>\n\t</MenubarMenu>\n</Menubar>',
		related: ['dropdown-menu', 'navigation-menu', 'context-menu'],
	},
	{
		name: 'navigation-menu',
		description: 'Navigation menu with viewport.',
		intro: 'Use NavigationMenu for primary site or app navigation.',
		highlights: ['Viewport mode', 'Item, trigger, and content', 'Link with active state'],
		usage: '<NavigationMenu>\n\t<NavigationMenuList>\n\t\t<NavigationMenuItem value="docs">\n\t\t\t<NavigationMenuTrigger>Docs</NavigationMenuTrigger>\n\t\t\t<NavigationMenuContent>Documentation links.</NavigationMenuContent>\n\t\t</NavigationMenuItem>\n\t</NavigationMenuList>\n</NavigationMenu>',
		related: ['menubar', 'breadcrumb', 'sidebar'],
	},
	{
		name: 'select',
		description: 'Custom select dropdown.',
		intro: 'Use Select to pick one value from a styled dropdown.',
		highlights: ['Trigger, content, and item', 'Group, label, and separator', 'Controlled and uncontrolled'],
		usage: '<Select>\n\t<SelectTrigger>Choose a fruit</SelectTrigger>\n\t<SelectContent>\n\t\t<SelectItem value="apple">Apple</SelectItem>\n\t\t<SelectItem value="banana">Banana</SelectItem>\n\t</SelectContent>\n</Select>',
		related: ['combobox', 'native-select', 'dropdown-menu'],
	},
	{
		name: 'combobox',
		description: 'Searchable combobox.',
		intro: 'Use Combobox to select from a searchable list.',
		highlights: ['Search filter', 'Items with keywords', 'Empty and not-found text'],
		usage: '<Combobox\n\titems={[\n\t\t{ value: "apple", label: "Apple" },\n\t\t{ value: "banana", label: "Banana" },\n\t]}\n\tplaceholder="Pick a fruit"\n/>',
		related: ['select', 'command', 'input'],
	},
	{
		name: 'command',
		description: 'Command palette primitives.',
		intro: 'Use Command to build searchable command menus and palettes.',
		highlights: ['Input, list, group, and item', 'Custom filter', 'Loop navigation'],
		usage: '<Command>\n\t<CommandInput placeholder="Search" />\n\t<CommandList>\n\t\t<CommandGroup>\n\t\t\t<CommandItem>Item one</CommandItem>\n\t\t</CommandGroup>\n\t</CommandList>\n</Command>',
		related: ['combobox', 'dialog', 'kbd'],
	},
	{
		name: 'chart',
		description: 'Chart primitives.',
		intro: 'Use ChartContainer to render line, bar, and area charts from a config.',
		highlights: ['Line, bar, and area', 'Legend and tooltip', 'Light and dark themes'],
		usage: '<ChartContainer\n\tconfig={{ desktop: { label: "Desktop" } }}\n\tdata={[{ x: "Jan", desktop: 100 }]}\n\txKey="x"\n\ttype="line"\n/>',
		related: ['calendar', 'table', 'card'],
	},
	{
		name: 'calendar',
		description: 'Calendar component.',
		intro: 'Use Calendar to pick dates in single, multiple, or range modes.',
		highlights: ['Single, multiple, and range', 'Disabled matcher', 'Outside days'],
		usage: '<Calendar mode="single" onSelect={(date) => console.log(date)} />',
		related: ['chart', 'form', 'popover'],
	},
	{
		name: 'drawer',
		description: 'Drawer overlay.',
		intro: 'Use Drawer to slide a panel in from any direction.',
		highlights: ['Four directions', 'Modal and non-modal', 'Trigger, overlay, and content'],
		usage: '<Drawer direction="right">\n\t<DrawerTrigger>Open</DrawerTrigger>\n\t<DrawerContent>\n\t\t<DrawerTitle>Title</DrawerTitle>\n\t\t<DrawerDescription>Description.</DrawerDescription>\n\t</DrawerContent>\n</Drawer>',
		related: ['sheet', 'dialog', 'sidebar'],
	},
	{
		name: 'form',
		description: 'Form primitives.',
		intro: 'Use Form to manage validation, values, and submission.',
		highlights: ['`useForm` hook', 'Field, label, control, and message', 'Resolver validation'],
		usage: '<Form>\n\t<FormField name="email">\n\t\t<FormLabel>Email</FormLabel>\n\t\t<FormControl>\n\t\t\t<Input />\n\t\t</FormControl>\n\t\t<FormMessage />\n\t</FormField>\n</Form>',
		related: ['field', 'input', 'checkbox'],
	},
	{
		name: 'sidebar',
		description: 'Sidebar layout.',
		intro: 'Use Sidebar to add a collapsible application sidebar.',
		highlights: ['Provider and trigger', 'Variants and sides', 'Collapsible modes'],
		usage: '<SidebarProvider>\n\t<Sidebar>\n\t\t<SidebarContent>\n\t\t\t<SidebarGroup>\n\t\t\t\t<SidebarGroupLabel>Menu</SidebarGroupLabel>\n\t\t\t</SidebarGroup>\n\t\t</SidebarContent>\n\t</Sidebar>\n\t<SidebarTrigger />\n</SidebarProvider>',
		related: ['navigation-menu', 'sheet', 'breadcrumb'],
	},
	{
		name: 'carousel',
		description: 'Carousel component.',
		intro: 'Use Carousel to cycle through a set of items.',
		highlights: ['Horizontal and vertical', 'Content, item, previous, and next'],
		usage: '<Carousel>\n\t<CarouselContent>\n\t\t<CarouselItem>Slide one</CarouselItem>\n\t\t<CarouselItem>Slide two</CarouselItem>\n\t</CarouselContent>\n\t<CarouselPrevious />\n\t<CarouselNext />\n</Carousel>',
		related: ['aspect-ratio', 'tabs', 'sheet'],
	},
	{
		name: 'resizable',
		description: 'Resizable panel group.',
		intro: 'Use ResizablePanelGroup to create adjustable split layouts.',
		highlights: ['Horizontal and vertical', 'Panel and handle', 'Persistent layout id'],
		usage: '<ResizablePanelGroup direction="horizontal">\n\t<ResizablePanel>Left</ResizablePanel>\n\t<ResizableHandle />\n\t<ResizablePanel>Right</ResizablePanel>\n</ResizablePanelGroup>',
		related: ['sidebar', 'sheet', 'table'],
	},
	{
		name: 'attachment',
		description: 'Attachment primitives.',
		intro: 'Use Attachment to display uploaded files with state and actions.',
		highlights: ['States like uploading and error', 'Sizes and orientation', 'Media, content, and actions'],
		usage: '<Attachment>\n\t<AttachmentMedia>+</AttachmentMedia>\n\t<AttachmentContent>\n\t\t<AttachmentTitle>report.pdf</AttachmentTitle>\n\t\t<AttachmentDescription>2.4 MB</AttachmentDescription>\n\t</AttachmentContent>\n\t<AttachmentActions>\n\t\t<Button size="sm">Download</Button>\n\t</AttachmentActions>\n</Attachment>',
		related: ['item', 'badge', 'empty'],
	},
	{
		name: 'bubble',
		description: 'Bubble chat primitives.',
		intro: 'Use Bubble to build chat message bubbles.',
		highlights: ['Seven variants', 'Start and end alignment', 'Reactions'],
		usage: '<BubbleGroup>\n\t<Bubble align="start">\n\t\t<BubbleContent>Hello</BubbleContent>\n\t</Bubble>\n</BubbleGroup>',
		related: ['message', 'message-scroller', 'avatar'],
	},
	{
		name: 'direction',
		description: 'Direction provider for reading direction.',
		intro: 'Use DirectionProvider to set the reading direction for RTL support.',
		highlights: ['LTR and RTL', 'Context-based'],
		usage: '<DirectionProvider dir="rtl">\n\t<App />\n</DirectionProvider>',
		related: ['sidebar', 'form', 'message'],
	},
	{
		name: 'message',
		description: 'Message primitives.',
		intro: 'Use Message to compose chat messages with avatar, content, and header.',
		highlights: ['Start and end alignment', 'Avatar, content, header, and footer', 'Group'],
		usage: '<MessageGroup>\n\t<Message align="end">\n\t\t<MessageContent>Hi there</MessageContent>\n\t</Message>\n</MessageGroup>',
		related: ['bubble', 'message-scroller', 'avatar'],
	},
	{
		name: 'message-scroller',
		description: 'Message scroller.',
		intro: 'Use MessageScroller to scroll a message list with auto-anchoring.',
		highlights: ['Viewport and content', 'Scroll anchor', 'Scroll buttons'],
		usage: '<MessageScroller>\n\t<MessageScrollerViewport>\n\t\t<MessageScrollerContent>\n\t\t\t<MessageScrollerItem>Message one</MessageScrollerItem>\n\t\t</MessageScrollerContent>\n\t</MessageScrollerViewport>\n</MessageScroller>',
		related: ['message', 'bubble', 'scroll-area'],
	},
	{
		name: 'sonner',
		description: 'Toast notifications.',
		intro: 'Use Toaster and the toast helper to show transient notifications.',
		highlights: ['Six types', 'Positions and duration', 'Rich colors and themes'],
		usage: '<Toaster position="bottom-right" />',
		related: ['alert', 'form', 'spinner'],
	},
	{
		name: 'input-otp',
		description: 'One-time password input.',
		intro: 'Use InputOTP to collect a one-time code across multiple slots.',
		highlights: ['Numeric, alphanumeric, and text modes', 'Slots and groups', 'Completion callback'],
		usage: '<InputOTP maxLength={6} onComplete={(code) => console.log(code)} />',
		related: ['input', 'input-group', 'form'],
	},
];

function loadRegistryItems() {
	const raw = JSON.parse(fs.readFileSync(path.join(root, 'apps/react/public/r/registry.json'), 'utf-8'));
	const map = new Map();
	for (const item of raw.items) {
		map.set(item.name, item);
	}
	return map;
}

function extractApi(name) {
	const typeFile = path.join(root, 'packages/core/src/components', name, `${name}.types.ts`);
	if (!fs.existsSync(typeFile)) {
		return [];
	}
	const src = fs.readFileSync(typeFile, 'utf-8');
	const sf = ts.createSourceFile(typeFile, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

	const aliases = new Map();
	for (const stmt of sf.statements) {
		if (ts.isTypeAliasDeclaration(stmt)) {
			aliases.set(stmt.name.text, stmt.type.getText(sf).replace(/\s+/g, ' ').trim());
		}
	}
	const resolve = (text) => {
		let out = text.replace(/\s+/g, ' ').trim();
		const seen = new Set();
		while (aliases.has(out) && !seen.has(out)) {
			seen.add(out);
			out = aliases.get(out);
		}
		return out;
	};

	const result = [];
	for (const stmt of sf.statements) {
		if (!ts.isInterfaceDeclaration(stmt) || !stmt.name.text.endsWith('BaseProps')) {
			continue;
		}
		const rawName = stmt.name.text.replace(/BaseProps$/, '');
		const compName = apiNameOverrides[rawName] ?? rawName;
		const props = [];
		for (const member of stmt.members) {
			if (!ts.isPropertySignature(member) || !member.name) {
				continue;
			}
			const propName = member.name.getText(sf);
			const optional = Boolean(member.questionToken);
			const typeText = member.type ? resolve(member.type.getText(sf)) : 'unknown';
			const doc = (member.jsDoc ?? [])
				.map((d) => d.comment)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim();
			props.push({ name: propName, optional, type: typeText, doc });
		}
		result.push({ name: compName, props });
	}
	return result;
}

function extractDefault(doc) {
	const match = doc.match(/默认\s*(['"][^'"]+['"]|true|false|-?\d+(?:\.\d+)?)/);
	return match ? match[1] : null;
}

function renderApiTable(props) {
	const rows = props.map((p) => {
		const def = extractDefault(p.doc);
		const typeEscaped = p.type.replace(/\|/g, '\\|');
		const defEscaped = (def ?? '—').replace(/\|/g, '\\|');
		return `| \`${p.name}\` | \`${typeEscaped}\` | ${defEscaped} |`;
	});
	return ['| Prop | Type | Default |', '| ---- | ---- | ------- |', ...rows].join('\n');
}

function renderApiSection(apis) {
	if (!apis.length) {
		return 'No custom props.';
	}
	const blocks = apis.map((api) => {
		const heading = `### ${api.name}`;
		const body = api.props.length ? renderApiTable(api.props) : 'No custom props.';
		return `${heading}\n\n${body}`;
	});
	return blocks.join('\n\n');
}

function renderDepsTable(name, item) {
	const deps = (item?.registryDependencies ?? []).map((d) => d.replace('@tile-ui/', '')).filter((d) => depPurpose[d]);
	const rows = [[`\`${name}\``, 'Component source and module styles']];
	for (const dep of deps) {
		rows.push([`\`${dep}\``, depPurpose[dep]]);
	}
	rows.push(['`styles`', depPurpose.styles]);
	const body = rows.map(([item, purpose]) => `| ${item} | ${purpose} |`).join('\n');
	return `| Item | Purpose |\n| ---- | ------- |\n${body}`;
}

function toVueUsage(usage, compNames) {
	let out = usage;
	const names = new Set([...compNames, ...allCompNames]);
	const sorted = [...names].sort((a, b) => b.length - a.length);
	for (const n of sorted) {
		out = out.replace(new RegExp(`<${n}(?=[\\s>/])`, 'g'), `<T${n}`);
		out = out.replace(new RegExp(`</${n}>`, 'g'), `</T${n}>`);
	}
	return out;
}

function buildDoc({ name, meta, item, apis, framework }) {
	const isReact = framework === 'react';
	const mainName = mainOverrides[name] ?? pascalCase(name);
	const importName = isReact ? mainName : `T${mainName}`;
	const pkg = isReact ? '@tile-ui/react' : '@tile-ui/vue';
	const title = pascalCase(name);

	const usage = isReact ? meta.usage : toVueUsage(meta.usage, compNamesFor(name));

	const relatedLinks = (meta.related ?? []).map((r) => `- [${pascalCase(r)}](/docs/components/${r})`).join('\n');

	const blocks = [
		'---',
		`title: ${title}`,
		`description: ${meta.description}`,
		'---',
		'',
		`> ${meta.intro}`,
		...(isReact ? ['', `<ComponentDemo slug="${name}" />`] : []),
		'',
		'## Registry install',
		'',
		'```bash',
		`pnpm dlx shadcn@latest add @tile-ui/${name}`,
		'```',
		'',
		'## Package usage',
		'',
		'```tsx',
		`import { ${importName} } from '${pkg}';`,
		'',
		usage,
		'```',
		'',
		'## Highlights',
		'',
		...meta.highlights.map((h) => `- ${h}`),
		'',
		'## Registry dependencies',
		'',
		renderDepsTable(name, item),
		'',
		'## API reference',
		'',
		renderApiSection(apis),
	];

	if (relatedLinks) {
		blocks.push('', '## Related docs', '', relatedLinks);
	}

	return `${blocks.join('\n')}\n`;
}

function parseReactExports() {
	const indexPath = path.join(root, 'packages/react/src/components/index.ts');
	const src = fs.readFileSync(indexPath, 'utf-8');
	const map = new Map();
	const re = /export\s*\{([^}]*)\}\s*from\s*'\.\/([^']+)'/g;
	let match;
	while ((match = re.exec(src))) {
		const dir = match[2];
		const names = match[1]
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s && !s.startsWith('type ') && /^[A-Z]/.test(s));
		if (names.length) {
			map.set(dir, names);
		}
	}
	return map;
}

const reactExports = parseReactExports();
const allCompNames = new Set([...reactExports.values()].flat());

function compNamesFor(name) {
	return reactExports.get(name) ?? [mainOverrides[name] ?? pascalCase(name)];
}

function main() {
	const items = loadRegistryItems();

	const reactDir = path.join(root, 'apps/react/content/docs/components');
	const vueDir = path.join(root, 'apps/vue/content/docs/components');

	let written = 0;
	for (const meta of META) {
		const { name } = meta;
		if (SKIP.has(name)) {
			continue;
		}
		const item = items.get(name);
		const apis = extractApi(name);

		const reactDoc = buildDoc({ name, meta, item, apis, framework: 'react' });
		const vueDoc = buildDoc({ name, meta, item, apis, framework: 'vue' });

		fs.writeFileSync(path.join(reactDir, `${name}.mdx`), reactDoc);
		fs.writeFileSync(path.join(vueDir, `${name}.mdx`), vueDoc);
		written += 2;
	}

	console.log(`Generated ${written} component docs (${META.length} components).`);
}

main();
