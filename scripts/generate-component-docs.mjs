#!/usr/bin/env node
/**
 * 生成组件文档（React + Vue + Solid）
 *
 * 从 packages/core 的类型定义 + registry 依赖自动生成 API reference 与依赖表，
 * 结合手工维护的标题/描述/亮点/用法，输出到 apps/{react,vue}/content/docs/components。
 * Package usage 段的 import 由 usage 代码推导（见 scripts/demo-files.mjs）。
 *
 * 已手工编写预览的组件（button/card/input/label/textarea）不在此生成范围内。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { renderUsageImports } from './demo-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'apps/react/package.json'));
const ts = require('typescript');

const SKIP = new Set([
	'button',
	'card',
	'input',
	'label',
	'textarea',
	'use-copy-to-clipboard',
	'use-media-query',
	'use-local-storage',
	'contact-form',
	'newsletter-card',
	'profile-settings',
]);

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

const frameworkDocOverrides = {
	solid: {
		omitProps: {
			accordion: ['asChild'],
			badge: ['asChild'],
			breadcrumb: ['asChild'],
			bubble: ['asChild'],
			button: ['asChild'],
			item: ['asChild'],
			marker: ['asChild'],
			'button-group': ['asChild'],
			checkbox: ['asChild'],
			field: ['asChild'],
			form: ['asChild'],
			'input-group': ['asChild'],
			'input-otp': ['asChild'],
			'native-select': ['asChild'],
			progress: ['asChild'],
			'radio-group': ['asChild'],
			slider: ['asChild'],
			switch: ['asChild'],
			textarea: ['asChild'],
			'toggle-group': ['asChild'],
			calendar: ['asChild'],
			collapsible: ['asChild'],
			direction: ['asChild'],
			message: ['asChild'],
			'message-scroller': ['asChild'],
			pagination: ['asChild'],
			'scroll-area': ['asChild'],
			tabs: ['asChild'],
			'alert-dialog': ['asChild'],
			combobox: ['asChild'],
			command: ['asChild'],
			'context-menu': ['asChild'],
			drawer: ['asChild'],
			'dropdown-menu': ['asChild'],
			'hover-card': ['asChild'],
			menubar: ['asChild'],
			'navigation-menu': ['asChild'],
			popover: ['asChild'],
			select: ['asChild'],
			sheet: ['asChild'],
			tooltip: ['asChild'],
			carousel: ['asChild'],
			chart: ['asChild'],
			resizable: ['asChild'],
			sidebar: ['asChild'],
			sonner: ['asChild'],
		},
		highlights: {
			accordion: ['Single and multiple disclosure modes', 'Disabled-aware roving focus', 'Stable custom or generated trigger/content IDs'],
			calendar: ['Single, multiple, and range selection', 'Visible range start and end state', 'Explicit `today` and `defaultMonth` for deterministic SSR'],
			collapsible: ['Controlled and uncontrolled state', 'Stable trigger and region IDs', 'Native hidden and disabled semantics'],
			direction: ['Reactive provider value', '`useDirection` accessor hook', 'Normalized LTR and RTL DOM direction'],
			message: ['Start and end alignment', 'Avatar, header, content, and footer primitives', 'Native static message markup'],
			'message-scroller': ['Provider-owned viewport observation', 'Start and end controls', 'Scrollable and visibility hooks'],
			pagination: ['Native anchor navigation', 'Current-page semantics', 'Previous, next, and decorative ellipsis primitives'],
			'scroll-area': ['Native scroll viewport', 'Vertical and horizontal `ScrollBar` primitives', 'Keyboard and pointer scrollbar control'],
			tabs: ['Automatic keyboard activation', 'Nested tab lists keep overlapping values independent', 'Stable custom or generated tab/panel IDs'],
			'alert-dialog': [
				'Modal focus containment and trigger restoration',
				'Outside interaction can be observed or prevented',
				'Action and Cancel are nested native button primitives',
			],
			combobox: [
				'Data-driven filtering with keywords and custom filters',
				'Arrow, Home, End, Enter, Escape, and logical Tab behavior',
				'`value` and `onValueChange` support controlled selection',
			],
			command: [
				'Composable Input, List, Group, Item, Empty, and Dialog primitives',
				'Filtered keyboard navigation with optional looping',
				'Controlled search through `search` and `onSearchChange`',
			],
			'context-menu': [
				'Pointer contextmenu and Shift+F10 keyboard opening',
				'Checkbox, radio, and nested submenu branches',
				'Focus returns through the shared menu Foundation',
			],
			drawer: [
				'Four directions with modal or non-modal policy',
				'Focus containment and outside blocking in modal mode',
				'`open` and `onOpenChange` support controlled state',
			],
			'dropdown-menu': ['Checkbox, radio, group, label, and separator primitives', 'Nested submenu keyboard branches', 'Controlled root and selectable item callbacks'],
			'hover-card': ['Open and close delays', 'Crossing-safe pointer intent between trigger and content', 'Controlled `open` and `onOpenChange` callbacks'],
			menubar: ['Arrow-key switching between menus', 'Checkbox, radio, and nested submenu branches', 'Roving trigger tabstops from the menu Foundation'],
			'navigation-menu': [
				'Shared viewport and `viewport={false}` local modes',
				'Roving trigger tabstops and native links',
				'Controlled `value` and `onValueChange` callbacks',
			],
			popover: ['Anchored positioning and outside dismissal', 'Natural Tab order inside interactive content', 'Controlled `open` and `onOpenChange` callbacks'],
			select: [
				'Grouped options and escaped selected labels',
				'Arrow navigation, typeahead, selection, and logical Tab exit',
				'Controlled `value` and `onValueChange` callbacks',
			],
			sheet: ['Four edge positions with modal focus containment', 'Outside interaction blocking and trigger restoration', 'Controlled `open` and `onOpenChange` callbacks'],
			tooltip: ['Provider-level pointer delay timing', 'Pointer hover and keyboard focus opening', 'Escape dismissal and stable description IDs'],
			badge: ['Six visual variants', 'Native Solid span attributes', 'Pairs with Card and status surfaces'],
			button: ['Six visual variants', 'Loading state support', 'Eight sizes from `xs` through `icon-lg`'],
			card: ['Solid-native primitive composition', 'Header, content, and footer', 'Pairs with Button and Input'],
			breadcrumb: ['Native anchor composition', 'Current-page semantics', 'Custom separator content'],
			bubble: ['Seven visual variants', 'Native div content primitive', 'Aligned reaction metadata'],
			item: ['Media, content, and action regions', 'Native div root', 'Outline and muted variants'],
			marker: ['Default, separator, and border variants', 'Native div root', 'Optional icon primitive'],
			carousel: ['Measured horizontal and vertical viewports', 'Arrow-key navigation follows orientation', 'Accessible region labels describe each carousel'],
			chart: ['Mixed line, bar, and area series', 'Stable named SVG IDs and scoped theme styles', 'Keyboard inspection announces the active datum'],
			resizable: ['Pointer and keyboard separators', 'Equal deterministic server layout', 'Optional localStorage persistence after hydration'],
			sidebar: ['Collapsible desktop rail', 'Mobile sheet selected from the client media query', 'Provider state, trigger, menu, skeleton, and tooltip families'],
			sonner: ['Imperative toast variants and updates', 'Dismiss lifecycle and external-store subscriptions', 'Empty server output with no cross-request store leakage'],
		},
		descriptions: {
			accordion: 'Accessible SolidJS accordion primitives with deterministic IDs and keyboard navigation.',
			calendar: 'A deterministic SolidJS calendar with date selection and grid keyboard behavior.',
			collapsible: 'Accessible SolidJS collapsible trigger and region primitives.',
			direction: 'A reactive SolidJS reading-direction provider and accessor hook.',
			message: 'Composable SolidJS message layout primitives for static conversation content.',
			'message-scroller': 'A provider-backed SolidJS message viewport with observed scroll controls.',
			pagination: 'Semantic SolidJS pagination primitives built from native links.',
			'scroll-area': 'A native SolidJS scroll viewport with optional custom scrollbars.',
			tabs: 'Accessible SolidJS tabs with deterministic relationships and keyboard activation.',
			'alert-dialog': 'Accessible SolidJS alert-dialog primitives with modal focus and outside-interaction policy.',
			combobox: 'A searchable SolidJS combobox with controlled selection and logical keyboard exit.',
			command: 'Composable SolidJS command primitives with filtering and keyboard navigation.',
			'context-menu': 'A SolidJS context menu with keyboard opening, selectable items, and nested branches.',
			drawer: 'A directional SolidJS drawer with modal and non-modal behavior.',
			'dropdown-menu': 'A SolidJS dropdown menu with checkbox, radio, and nested submenu items.',
			'hover-card': 'A delayed SolidJS hover preview with crossing-safe pointer intent.',
			menubar: 'A desktop-style SolidJS menubar with roving focus and menu switching.',
			'navigation-menu': 'A SolidJS navigation menu with shared and local viewport modes.',
			popover: 'An anchored SolidJS popover with focus-aware dismissal and controlled state.',
			select: 'An accessible SolidJS custom select with grouped options and logical Tab behavior.',
			sheet: 'A SolidJS modal sheet that mounts from any viewport edge.',
			tooltip: 'A delayed SolidJS tooltip for pointer hover and keyboard focus.',
			alert: 'Accessible SolidJS alert primitives for important status messages.',
			'aspect-ratio': 'An SSR-safe SolidJS container that preserves a requested width-to-height ratio.',
			attachment: 'Composable SolidJS attachment primitives with file metadata and actions.',
			avatar: 'SolidJS avatar primitives with reactive image fallback and grouping.',
			breadcrumb: 'Accessible SolidJS breadcrumb navigation using native links.',
			bubble: 'SolidJS chat bubble primitives with alignment and reaction regions.',
			empty: 'Composable SolidJS empty-state primitives.',
			item: 'SolidJS item layout primitives for media, content, and actions.',
			kbd: 'SolidJS keyboard key and shortcut-group primitives.',
			label: 'A native SolidJS label with required-state styling.',
			marker: 'SolidJS content marker primitives with divider variants.',
			skeleton: 'A SolidJS loading placeholder hidden from assistive technology by default.',
			spinner: 'An accessible SolidJS loading status icon.',
			table: 'Native SolidJS table primitives in a responsive overflow container.',
			badge: 'A SolidJS status or label indicator with multiple visual variants.',
			button: 'A SolidJS action component with loading state and size variants.',
			card: 'Composable SolidJS card primitives for framed content.',
			dialog: 'Accessible SolidJS dialog primitives with controlled and uncontrolled state.',
			input: 'An accessible SolidJS text input with helper and validation messaging.',
			separator: 'A horizontal or vertical divider for SolidJS layouts.',
			toggle: 'A controlled or uncontrolled SolidJS toggle button.',
			'button-group': 'SolidJS primitives for grouping related native button actions.',
			checkbox: 'An accessible tri-state SolidJS checkbox with controlled and native form state.',
			field: 'SolidJS field primitives with stable label, description, message, and control IDs.',
			form: 'Reactive SolidJS form state and accessible field primitives.',
			'input-group': 'Composable SolidJS input addons, controls, and embedded buttons.',
			'input-otp': 'SolidJS one-time password slots with keyboard, paste, composition, and form support.',
			'native-select': 'A styled native SolidJS select with SSR-safe initial values and reset behavior.',
			progress: 'An accessible reactive SolidJS progress bar.',
			'radio-group': 'A SolidJS native radio group with roving focus, validation, and reset behavior.',
			slider: 'SolidJS slider primitives with horizontal and vertical pointer and keyboard input.',
			switch: 'An accessible SolidJS switch with controlled and native form state.',
			textarea: 'An accessible SolidJS textarea with SSR-safe initial values and messaging.',
			'toggle-group': 'A controlled or uncontrolled SolidJS single or multiple toggle group.',
			carousel: 'A measured SolidJS carousel with accessible horizontal and vertical keyboard navigation.',
			chart: 'Responsive SolidJS SVG chart primitives with mixed series, scoped styles, and keyboard inspection.',
			resizable: 'SolidJS resizable panel groups with pointer, keyboard, and persistent layouts.',
			sidebar: 'A responsive SolidJS application sidebar with desktop rail and mobile sheet behavior.',
			sonner: 'External-store backed SolidJS toast notifications with an imperative API.',
		},
		intros: {
			accordion: 'Use Accordion to organize related disclosure sections with predictable keyboard movement.',
			calendar: 'Use Calendar for single, multiple, or range date selection; pass explicit `today` and `defaultMonth` when SSR output must be deterministic.',
			collapsible: 'Use Collapsible for one disclosure trigger and its associated content region.',
			direction: 'Use DirectionProvider and useDirection when layout behavior must react to LTR or RTL reading direction.',
			message: 'Use Message primitives to compose semantic conversation rows without adding state management.',
			'message-scroller': 'Use MessageScrollerProvider around the viewport, content, items, controls, and hooks that share scroll state.',
			pagination: 'Use Pagination to expose page destinations as native links with current-page semantics.',
			'scroll-area': 'Use ScrollArea with one or more ScrollBar primitives when custom controls should augment native scrolling.',
			tabs: 'Use Tabs to switch related panels with automatic arrow-key activation and stable ARIA relationships.',
			'alert-dialog': 'Use AlertDialog for decisions that require modal focus, explicit Action and Cancel primitives, and observable outside interaction.',
			combobox: 'Use Combobox for one searchable selection with controlled callbacks and logical Tab movement after the popup.',
			command: 'Use Command primitives to compose filtered action collections, groups, empty states, shortcuts, and optional modal palettes.',
			'context-menu': 'Use ContextMenu for pointer or keyboard-invoked actions with checkbox, radio, and submenu branches.',
			drawer: 'Use Drawer for directional modal or non-modal panels while preserving native Solid state callbacks.',
			'dropdown-menu': 'Use DropdownMenu to compose keyboard-ready actions, selectable items, and nested menus from native primitives.',
			'hover-card': 'Use HoverCard for delayed previews that remain open while the pointer crosses from trigger to content.',
			menubar: 'Use Menubar for desktop-style menus whose roving triggers and open panels switch with arrow keys.',
			'navigation-menu': 'Use NavigationMenu for primary links with either a shared viewport or local content panels.',
			popover: 'Use Popover for interactive anchored content that participates in natural Tab order and outside dismissal.',
			select: 'Use Select for a styled single-value picker with escaped labels, grouped items, typeahead, and logical Tab exit.',
			sheet: 'Use Sheet for modal edge panels with focus containment, outside blocking, and trigger restoration.',
			tooltip: 'Use TooltipProvider and nested Tooltip primitives for delayed pointer help and immediate keyboard-focus descriptions.',
			alert: 'Use Alert for important information that should be announced immediately.',
			'aspect-ratio': 'Use AspectRatio to reserve stable media and preview geometry during SSR.',
			attachment: 'Use Attachment primitives or AttachmentCard to present file state and actions.',
			avatar: 'Use Avatar for image identities with a text fallback that reacts to load errors.',
			breadcrumb: 'Use Breadcrumb to expose the current page within a native navigation trail.',
			bubble: 'Use Bubble for aligned conversation content and optional reaction metadata.',
			empty: 'Use Empty to explain missing content and offer a next action.',
			item: 'Use Item for compact media, content, and action rows.',
			kbd: 'Use Kbd and KbdGroup to display keyboard shortcuts.',
			label: 'Use Label with native for/id association for form controls.',
			marker: 'Use Marker to annotate or divide supporting content.',
			skeleton: 'Use Skeleton to reserve layout while content loads.',
			spinner: 'Use Spinner for short indeterminate loading states.',
			table: 'Use Table primitives for semantic tabular data with horizontal overflow support.',
			badge: 'Use Badge in SolidJS status surfaces, counts, or short labels.',
			button: 'Use Button for SolidJS actions, confirmations, and toolbar interactions.',
			card: 'Use Card to compose SolidJS summaries, settings surfaces, and action rows.',
			dialog: 'Use Dialog for accessible SolidJS modal interactions with focus management.',
			input: 'Use Input for SolidJS single-line text entry with aligned messaging.',
			separator: 'Use Separator to divide SolidJS sections without extra structural markup.',
			toggle: 'Use Toggle for controlled or uncontrolled binary state in SolidJS.',
			'button-group': 'Use ButtonGroup to keep related native actions visually and semantically adjacent.',
			checkbox: 'Use Checkbox for tri-state choices that participate in native forms.',
			field: 'Use Field to connect a native control to stable labels, descriptions, and messages.',
			form: 'Use Form primitives to connect reactive field state, validation, and ARIA metadata.',
			'input-group': 'Use InputGroup to combine a control with contextual text and embedded actions.',
			'input-otp': 'Use InputOTP to collect short codes with efficient keyboard, paste, and composition input.',
			'native-select': 'Use NativeSelect when native option behavior and form reset semantics are preferred.',
			progress: 'Use Progress to expose task completion with accessible range semantics.',
			'radio-group': 'Use RadioGroup for one-of-many choices with native validation and arrow-key selection.',
			slider: 'Use Slider for pointer and keyboard selection along horizontal or vertical ranges.',
			switch: 'Use Switch for controlled or uncontrolled boolean settings that submit with a form.',
			textarea: 'Use Textarea for multi-line values that remain stable through SSR, hydration, and reset.',
			'toggle-group': 'Use ToggleGroup for single or multiple toolbar choices with roving focus.',
			carousel: 'Use Carousel with an accessible label so the measured viewport and orientation-specific keyboard controls have a clear name.',
			chart: 'Use ChartContainer with a stable title or accessible name; series keys become scoped SVG and CSS identifiers, so keep them deterministic.',
			resizable: 'Use ResizablePanelGroup for pointer and keyboard split layouts; add an `id` only when the hydrated client should persist panel sizes.',
			sidebar: 'Use SidebarProvider around the full layout. Server output starts in the desktop mode, then the client media query selects the mobile sheet when required.',
			sonner: 'Mount Toaster in a client-visible layout and call the imperative toast API from interactions. Server rendering is an empty no-op and does not retain notifications between requests.',
		},
		usage: {
			'alert-dialog':
				'<AlertDialog onOpenChange={(open) => console.log(open)}>\n\t<AlertDialogTrigger>Delete</AlertDialogTrigger>\n\t<AlertDialogContent>\n\t\t<AlertDialogTitle>Delete workspace?</AlertDialogTitle>\n\t\t<AlertDialogDescription>This cannot be undone.</AlertDialogDescription>\n\t\t<AlertDialogCancel>Cancel</AlertDialogCancel>\n\t\t<AlertDialogAction>Delete</AlertDialogAction>\n\t</AlertDialogContent>\n</AlertDialog>',
			combobox: '<Combobox items={[{ value: "solid", label: "Solid", keywords: ["ssr"] }]} onValueChange={(value) => console.log(value)} />',
			command:
				'<Command loop>\n\t<CommandInput placeholder="Filter actions" />\n\t<CommandList>\n\t\t<CommandEmpty>No match.</CommandEmpty>\n\t\t<CommandGroup heading="Actions"><CommandItem value="open">Open docs</CommandItem></CommandGroup>\n\t</CommandList>\n</Command>',
			'context-menu':
				'<ContextMenu>\n\t<ContextMenuTrigger tabindex="0">Right-click or press Shift+F10</ContextMenuTrigger>\n\t<ContextMenuContent><ContextMenuItem>Open</ContextMenuItem></ContextMenuContent>\n</ContextMenu>',
			drawer: '<Drawer direction="bottom" modal={false} onOpenChange={(open) => console.log(open)}>\n\t<DrawerTrigger>Open</DrawerTrigger>\n\t<DrawerContent><DrawerTitle>Activity</DrawerTitle><DrawerDescription>Recent builds.</DrawerDescription></DrawerContent>\n</Drawer>',
			'dropdown-menu':
				'<DropdownMenu>\n\t<DropdownMenuTrigger>Menu</DropdownMenuTrigger>\n\t<DropdownMenuContent><DropdownMenuCheckboxItem checked>Grid</DropdownMenuCheckboxItem><DropdownMenuSub><DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>Copy link</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub></DropdownMenuContent>\n</DropdownMenu>',
			'hover-card':
				'<HoverCard openDelay={250} closeDelay={350}>\n\t<HoverCardTrigger>@tile-ui/solid</HoverCardTrigger>\n\t<HoverCardContent>Solid registry preview.</HoverCardContent>\n</HoverCard>',
			menubar:
				'<Menubar>\n\t<MenubarMenu value="file"><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New</MenubarItem></MenubarContent></MenubarMenu>\n\t<MenubarMenu value="view"><MenubarTrigger>View</MenubarTrigger><MenubarContent><MenubarCheckboxItem checked>Sidebar</MenubarCheckboxItem></MenubarContent></MenubarMenu>\n</Menubar>',
			'navigation-menu':
				'<NavigationMenu viewport={false}>\n\t<NavigationMenuList><NavigationMenuItem value="docs"><NavigationMenuTrigger>Docs</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/docs">Overview</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem></NavigationMenuList>\n</NavigationMenu>',
			popover:
				'<Popover onOpenChange={(open) => console.log(open)}>\n\t<PopoverTrigger>Edit</PopoverTrigger>\n\t<PopoverContent><input aria-label="Title" /><button type="button">Apply</button></PopoverContent>\n</Popover>',
			select: '<Select defaultValue="solid" selectedText="Solid <SSR>">\n\t<SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>\n\t<SelectContent><SelectItem value="solid">Solid &lt;SSR&gt;</SelectItem></SelectContent>\n</Select>',
			sheet: '<Sheet onOpenChange={(open) => console.log(open)}>\n\t<SheetTrigger>Open</SheetTrigger>\n\t<SheetContent side="right"><SheetTitle>Settings</SheetTitle><SheetDescription>Workspace settings.</SheetDescription></SheetContent>\n</Sheet>',
			tooltip:
				'<TooltipProvider delayDuration={400}>\n\t<Tooltip><TooltipTrigger>Focus or hover</TooltipTrigger><TooltipContent>Keyboard help.</TooltipContent></Tooltip>\n</TooltipProvider>',
			accordion:
				'<Accordion type="single" defaultValue="one" collapsible>\n\t<AccordionItem value="one">\n\t\t<AccordionTrigger>Section one</AccordionTrigger>\n\t\t<AccordionContent>Content one.</AccordionContent>\n\t</AccordionItem>\n</Accordion>',
			calendar: '<Calendar mode="range" defaultMonth={new Date(2026, 7, 1)} today={new Date(2026, 7, 28)} onSelect={(range) => console.log(range)} />',
			collapsible: '<Collapsible>\n\t<CollapsibleTrigger>Details</CollapsibleTrigger>\n\t<CollapsibleContent>Extra content here.</CollapsibleContent>\n</Collapsible>',
			direction: '<DirectionProvider dir="rtl">\n\t<App />\n</DirectionProvider>',
			message:
				'<MessageGroup>\n\t<Message align="end">\n\t\t<MessageContent>Registry complete.</MessageContent>\n\t\t<MessageFooter>Now</MessageFooter>\n\t</Message>\n</MessageGroup>',
			'message-scroller':
				'<MessageScrollerProvider>\n\t<MessageScroller>\n\t\t<MessageScrollerViewport>\n\t\t\t<MessageScrollerContent>\n\t\t\t\t<MessageScrollerItem scrollAnchor>Message one</MessageScrollerItem>\n\t\t\t</MessageScrollerContent>\n\t\t</MessageScrollerViewport>\n\t\t<MessageScrollerButton />\n\t</MessageScroller>\n</MessageScrollerProvider>',
			pagination:
				'<Pagination>\n\t<PaginationContent>\n\t\t<PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>\n\t\t<PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>\n\t\t<PaginationItem><PaginationNext href="?page=3" /></PaginationItem>\n\t</PaginationContent>\n</Pagination>',
			'scroll-area': '<ScrollArea>\n\t<div style={{ height: "20rem" }}>Long content.</div>\n\t<ScrollBar />\n</ScrollArea>',
			tabs: '<Tabs defaultValue="account">\n\t<TabsList>\n\t\t<TabsTrigger value="account">Account</TabsTrigger>\n\t\t<TabsTrigger value="settings">Settings</TabsTrigger>\n\t</TabsList>\n\t<TabsContent value="account">Account content.</TabsContent>\n\t<TabsContent value="settings">Settings content.</TabsContent>\n</Tabs>',
			attachment: '<AttachmentCard name="solid-registry.pdf" size={2516582} onDownload={() => downloadFile()} />',
			avatar: '<Avatar>\n\t<AvatarImage src="/avatar.png" alt="Tile UI" />\n\t<AvatarFallback>TU</AvatarFallback>\n</Avatar>',
			breadcrumb:
				'<Breadcrumb>\n\t<BreadcrumbList>\n\t\t<BreadcrumbItem><BreadcrumbLink href="/docs">Docs</BreadcrumbLink></BreadcrumbItem>\n\t\t<BreadcrumbSeparator />\n\t\t<BreadcrumbItem><BreadcrumbPage>Solid</BreadcrumbPage></BreadcrumbItem>\n\t</BreadcrumbList>\n</Breadcrumb>',
			bubble: '<Bubble align="end">\n\t<BubbleContent>Registry complete.</BubbleContent>\n</Bubble>',
			item: '<Item variant="outline">\n\t<ItemContent><ItemTitle>Solid registry</ItemTitle></ItemContent>\n</Item>',
			label: '<Label for="email" required>Email</Label>\n<Input id="email" type="email" />',
			card: '<Card>\n\t<CardHeader>\n\t\t<CardTitle>SolidStart workspace</CardTitle>\n\t\t<CardDescription>SSR-ready Tile UI components for SolidJS.</CardDescription>\n\t</CardHeader>\n\t<CardContent>\n\t\t<p>The component source and styles remain shared across Tile UI.</p>\n\t</CardContent>\n\t<CardFooter>\n\t\t<Button variant="outline">Preview</Button>\n\t\t<Button>Install</Button>\n\t</CardFooter>\n</Card>',
			field: '<Field name="email" required>\n\t<FieldLabel>Email</FieldLabel>\n\t<FieldDescription>We never share your email.</FieldDescription>\n\t<FieldMessage>Ready.</FieldMessage>\n</Field>',
			form: '<Form defaultValues={{ email: "" }}>\n\t<FormField name="email">{({ field }) => <FormItem descriptionId="email-help" messageId="email-error"><FormLabel>Email</FormLabel><FormControl>{(control) => <Input {...control} value={String(field.value ?? "")} onChangeValue={field.onChange} />}</FormControl><FormDescription id="email-help">Enter a reachable address.</FormDescription><FormMessage id="email-error" /></FormItem>}</FormField>\n</Form>',
			'input-otp':
				'<InputOTP maxLength={4}>\n\t<InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup>\n</InputOTP>',
			slider: '<Slider defaultValue={40}><SliderTrack><SliderRange /></SliderTrack><SliderThumb aria-label="Volume" /></Slider>',
			textarea: '<Textarea label="Summary" defaultValue="SSR-safe initial value" />',
			carousel:
				'<Carousel aria-label="Feature carousel" orientation="vertical"><CarouselContent viewportStyle={{ height: "12rem" }}><CarouselItem>One</CarouselItem><CarouselItem>Two</CarouselItem></CarouselContent><CarouselPrevious /><CarouselNext /></Carousel>',
			chart: '<ChartContainer title="Monthly activity" config={{ visits: { label: "Visits" }, target: { label: "Target" } }} data={[{ month: "Jan", visits: 42, target: 50 }]} xKey="month" series={[{ key: "visits", type: "bar" }, { key: "target", type: "line" }]} initialDimension={{ width: 640, height: 320 }} tabIndex={0} />',
			resizable:
				'<ResizablePanelGroup id="workspace-layout" panelIds={["navigation", "canvas"]}><ResizablePanel id="navigation">Navigation</ResizablePanel><ResizableHandle withHandle /><ResizablePanel id="canvas">Canvas</ResizablePanel></ResizablePanelGroup>',
			sidebar:
				'<SidebarProvider><Sidebar collapsible="icon"><SidebarHeader><SidebarInput aria-label="Search" /></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Overview">Overview</SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent></Sidebar><SidebarInset><SidebarTrigger /></SidebarInset></SidebarProvider>',
			sonner: '<><button type="button" onClick={() => toast.success("Saved")}>Notify</button><Toaster richColors /></>',
		},
	},
};

const solidApiExtras = {
	table: [
		{ name: 'containerClass', optional: true, type: 'string', doc: '响应式外层容器 class' },
		{ name: 'containerProps', optional: true, type: 'JSX.HTMLAttributes<HTMLDivElement>', doc: '响应式外层容器原生属性' },
	],
	input: [
		{ name: 'defaultValue', optional: true, type: 'string', doc: '非受控初始值' },
		{ name: 'onChangeValue', optional: true, type: '(value: string) => void', doc: '值变化回调' },
	],
	toggle: [
		{ name: 'pressed', optional: true, type: 'boolean', doc: '受控按压状态' },
		{ name: 'defaultPressed', optional: true, type: 'boolean', doc: '非受控初始按压状态' },
		{ name: 'onPressedChange', optional: true, type: '(pressed: boolean) => void', doc: '按压状态变化回调' },
	],
	dialog: [
		{ name: 'open', optional: true, type: 'boolean', doc: '受控打开状态' },
		{ name: 'defaultOpen', optional: true, type: 'boolean', doc: '非受控初始打开状态' },
		{ name: 'onOpenChange', optional: true, type: '(open: boolean) => void', doc: '打开状态变化回调' },
	],
	textarea: [
		{ name: 'defaultValue', optional: true, type: 'string', doc: '非受控初始值' },
		{ name: 'onChangeValue', optional: true, type: '(value: string) => void', doc: '值变化回调' },
	],
};

const solidNestedApiExtras = {
	direction: {
		useDirection: [{ name: 'return', optional: false, type: 'Accessor<DirectionValue>', doc: '当前响应式阅读方向' }],
	},
	'message-scroller': {
		useMessageScroller: [{ name: 'return', optional: false, type: 'MessageScrollerContextValue', doc: '完整滚动状态与控制方法' }],
		useMessageScrollerScrollable: [{ name: 'return', optional: false, type: '{ scrollable: Accessor<boolean>; isScrollable: Accessor<boolean> }', doc: '可滚动状态访问器' }],
		useMessageScrollerVisibility: [
			{ name: 'direction', optional: true, type: "'start' | 'end'", doc: '要观察的滚动方向' },
			{ name: 'return', optional: false, type: 'MessageScrollerVisibilityAccessors', doc: '方向按钮可见性访问器' },
		],
	},
	attachment: {
		AttachmentCard: [
			{ name: 'action', optional: true, type: 'JSX.Element', doc: '自定义操作区域' },
			{ name: 'onPreview', optional: true, type: 'JSX.EventHandler<HTMLDivElement, MouseEvent>', doc: '卡片预览事件' },
			{ name: 'onDownload', optional: true, type: 'JSX.EventHandler<HTMLButtonElement, MouseEvent>', doc: '下载事件' },
			{ name: 'onRemove', optional: true, type: 'JSX.EventHandler<HTMLButtonElement, MouseEvent>', doc: '删除事件' },
		],
	},
	dialog: {
		DialogContent: [{ name: 'id', optional: true, type: 'string', doc: '内容元素 ID；默认由 Dialog 自动生成' }],
	},
	sonner: {
		toast: [
			{ name: 'call', optional: false, type: '(title: string, options?: SonnerAddInput) => string', doc: '创建默认提示并返回 ID' },
			{ name: 'success / info / warning / error / loading', optional: false, type: '(title: string, options?: SonnerAddInput) => string', doc: '创建指定类型提示' },
			{ name: 'update', optional: false, type: '(id: string, update: SonnerToastUpdate) => void', doc: '更新现有提示' },
			{ name: 'dismiss', optional: false, type: '(id?: string) => void', doc: '关闭一个或全部提示' },
		],
		useToast: [{ name: 'return', optional: false, type: 'UseToastReturn', doc: '响应式提示列表与 imperative toast API' }],
	},
	sidebar: {
		useSidebar: [{ name: 'return', optional: false, type: 'SidebarContextValue', doc: '响应式桌面、移动端与切换状态' }],
	},
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
		usage: '<Empty>\n\t<EmptyMedia variant="icon">+</EmptyMedia>\n\t<EmptyTitle>No results</EmptyTitle>\n\t<EmptyDescription>Try adjusting your search.</EmptyDescription>\n</Empty>',
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
	{
		name: 'button',
		description: 'A multi-variant action component with loading state and size variants.',
		intro: 'Use Button for primary actions, inline confirmations, and lightweight toolbar interactions.',
		highlights: ['Six visual variants', 'Loading state support', 'Eight sizes from `xs` through `icon-lg`', '`asChild` support for router links and custom wrappers'],
		usage: '<Button>Default</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="outline">Outline</Button>\n<Button variant="ghost">Ghost</Button>\n<Button variant="destructive">Destructive</Button>\n<Button loading>Loading</Button>',
		related: ['card', 'input', 'examples'],
	},
	{
		name: 'card',
		description: 'Composable card primitives for framed content.',
		intro: 'Use Card to frame summaries, settings surfaces, and action rows.',
		highlights: ['Header, content, and footer', 'Title and description', 'Pairs with Button, Input, and Textarea'],
		usage: '<Card>\n\t<CardHeader>\n\t\t<CardTitle>Starter workspace</CardTitle>\n\t\t<CardDescription>Ship a consistent docs and component experience across React and Vue.</CardDescription>\n\t</CardHeader>\n\t<CardContent>\n\t\t<p>Use cards for summaries, settings surfaces, marketing CTAs, and denser information blocks that need a clear frame.</p>\n\t</CardContent>\n\t<CardFooter>\n\t\t<Button variant="outline">Preview</Button>\n\t\t<Button>Install</Button>\n\t</CardFooter>\n</Card>',
		related: ['button', 'input', 'examples'],
	},
	{
		name: 'input',
		description: 'A labeled text input with helper and validation messaging.',
		intro: 'Use Input for single-line text entry with aligned label and messaging.',
		highlights: ['Label and helper text', 'Error state', 'Pairs with Field and Form'],
		usage: '<Input\n\tlabel="Project name"\n\thelperText="Used in your dashboard and generated URLs."\n\tplaceholder="Tile UI Docs"\n/>',
		related: ['textarea', 'label', 'field'],
	},
	{
		name: 'textarea',
		description: 'A labeled multi-line text area.',
		intro: 'Use Textarea for longer free-form input with the same field structure as Input.',
		highlights: ['Label and helper text', 'Error state', 'Resizable by default'],
		usage: '<Textarea\n\tlabel="Summary"\n\thelperText="Keep it short and specific for reviewers."\n\tplaceholder="Describe the release in one paragraph"\n/>',
		related: ['input', 'label', 'field'],
	},
	{
		name: 'label',
		description: 'A form label primitive.',
		intro: 'Use Label to associate accessible labels with form controls.',
		highlights: ['Required indicator', 'Pairs with native and custom fields'],
		usage: '<Label required htmlFor="feedback">Feedback</Label>',
		related: ['input', 'field', 'form'],
	},
	{
		name: 'use-copy-to-clipboard',
		description: 'A hook for clipboard copy with transient feedback.',
		intro: 'Use this hook to copy text while managing the "copied" state in one place.',
		highlights: ['Async clipboard API with fallback', 'Auto-resetting copied state'],
		usage: 'const { copy, copied } = useCopyToClipboard();',
	},
	{
		name: 'use-media-query',
		description: 'A hook that tracks a CSS media query.',
		intro: 'Use this hook to react to viewport or media-query changes.',
		highlights: ['Server-safe initial value', 'Subscribes to matchMedia'],
		usage: "const isMobile = useMediaQuery('(max-width: 768px)');",
	},
	{
		name: 'use-local-storage',
		description: 'A hook for persisted local-storage state.',
		intro: 'Use this hook to read and write local-storage-backed state.',
		highlights: ['JSON serialization', 'SSR safe'],
		usage: "const [value, setValue] = useLocalStorage('theme', 'light');",
	},
	{
		name: 'contact-form',
		description: 'A compact support form using card, label, input, textarea, and button primitives.',
		intro: 'This example combines the registry primitives into a compact, realistic support form surface.',
		highlights: ['Card frames the request', 'Labeled fields', 'Footer actions'],
	},
	{
		name: 'newsletter-card',
		description: 'A lightweight marketing capture flow built from the same field and action primitives.',
		intro: 'This example shows a Card doubling as a marketing capture surface.',
		highlights: ['Single-field capture', 'Full-width footer action'],
	},
	{
		name: 'profile-settings',
		description: 'A denser account-management surface using the same field, label, and action primitives.',
		intro: 'This example shows an account-management surface built from field primitives.',
		highlights: ['Dense settings layout', 'Read-only and editable fields'],
	},
];

const frameworkConfigs = {
	react: { packageName: '@tile-ui/react', demo: true },
	vue: { packageName: '@tile-ui/vue', demo: false },
	solid: { packageName: '@tile-ui/solid', demo: true },
};

function loadRegistryItems(framework) {
	const registryFile = path.join(root, `apps/${framework}/public/r/registry.json`);
	if (!fs.existsSync(registryFile)) {
		throw new Error(`Missing registry output: ${path.relative(root, registryFile)}`);
	}
	const raw = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
	const map = new Map();
	for (const item of raw.items) {
		map.set(item.name, item);
	}
	return map;
}

export { META };

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

function extractSolidApi(name) {
	const sourceFile = path.join(root, 'packages/solid/src/components', name, `${name}.tsx`);
	if (!fs.existsSync(sourceFile)) return [];
	const source = fs.readFileSync(sourceFile, 'utf8');
	const sf = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const result = [];
	for (const statement of sf.statements) {
		if (
			!ts.isInterfaceDeclaration(statement) ||
			!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ||
			!statement.name.text.endsWith('Props')
		)
			continue;
		const props = [];
		for (const member of statement.members) {
			if (!ts.isPropertySignature(member) || !member.name) continue;
			props.push({
				name: member.name.getText(sf),
				optional: Boolean(member.questionToken),
				type: member.type?.getText(sf).replace(/\s+/g, ' ').trim() ?? 'unknown',
				doc: (member.jsDoc ?? [])
					.map((doc) => doc.comment)
					.join(' ')
					.replace(/\s+/g, ' ')
					.trim(),
			});
		}
		result.push({ name: statement.name.text.replace(/Props$/, ''), props });
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
	const deps = [...new Set((item?.registryDependencies ?? []).map((dependency) => dependency.replace('@tile-ui/', '')))];
	const rows = [[`\`${name}\``, 'Component source and module styles']];
	for (const dep of deps) {
		rows.push([`\`${dep}\``, depPurpose[dep] ?? 'Registry component dependency']);
	}
	const body = rows.map(([item, purpose]) => `| ${item} | ${purpose} |`).join('\n');
	return `| Item | Purpose |\n| ---- | ------- |\n${body}`;
}

function buildDoc({ name, meta, item, apis, framework, availableNames }) {
	const config = frameworkConfigs[framework];
	if (!config) {
		throw new Error(`Unknown docs framework: ${framework}`);
	}
	const mainName = mainOverrides[name] ?? pascalCase(name);
	const importName = mainName;
	const pkg = config.packageName;
	const title = pascalCase(name);
	const overrides = frameworkDocOverrides[framework];
	const description = overrides?.descriptions?.[name] ?? meta.description;
	const intro = overrides?.intros?.[name] ?? meta.intro;
	const highlights = overrides?.highlights?.[name] ?? meta.highlights;

	const usage = overrides?.usage?.[name] ?? meta.usage;
	if (framework === 'solid') {
		const result = ts.transpileModule(`function Usage() { return (<>${usage}</>); }`, {
			fileName: `${name}.tsx`,
			reportDiagnostics: true,
			compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2017 },
		});
		const diagnostics = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
		if (diagnostics.length)
			throw new Error(`Invalid Solid usage for ${name}: ${diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('; ')}`);
	}

	// Package usage 段的 import 从 usage 代码实际用到的包导出推导（含 hooks/composables 子路径）。
	const usageImports = renderUsageImports(framework, usage).join('\n') || `import { ${importName} } from '${pkg}';`;

	const relatedLinks = (meta.related ?? [])
		.filter((related) => availableNames.has(related))
		.map((related) => `- [${pascalCase(related)}](/docs/components/${related})`)
		.join('\n');
	const relatedSection = relatedLinks || '- [Components](/docs/components)\n- [Registry](/docs/registry)';
	const omittedProps = new Set(overrides?.omitProps?.[name] ?? []);
	let frameworkApis = apis.map((api, index) => ({
		...api,
		props: [...api.props.filter((prop) => !omittedProps.has(prop.name)), ...(framework === 'solid' && index === 0 ? (solidApiExtras[name] ?? []) : [])],
	}));
	if (framework === 'solid') {
		const byName = new Map(frameworkApis.map((api) => [api.name, api]));
		for (const api of extractSolidApi(name)) {
			const existing = byName.get(api.name);
			if (existing) {
				const propNames = new Set(existing.props.map((prop) => prop.name));
				existing.props.push(...api.props.filter((prop) => !propNames.has(prop.name)));
			} else {
				frameworkApis.push(api);
				byName.set(api.name, api);
			}
		}
		for (const [apiName, props] of Object.entries(solidNestedApiExtras[name] ?? {})) {
			let api = byName.get(apiName);
			if (!api) {
				api = { name: apiName, props: [] };
				frameworkApis.push(api);
				byName.set(apiName, api);
			}
			const propNames = new Set(api.props.map((prop) => prop.name));
			api.props.push(...props.filter((prop) => !propNames.has(prop.name)));
		}
		frameworkApis = frameworkApis.filter((api) => api.name !== `${pascalCase(name)}Base`);
	}

	const blocks = [
		'---',
		`title: ${title}`,
		`description: ${description}`,
		'---',
		'',
		`> ${intro}`,
		...(config.demo ? ['', `<ComponentDemo slug="${name}" />`] : []),
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
		usageImports,
		'',
		usage,
		'```',
		'',
		'## Highlights',
		'',
		...highlights.map((highlight) => `- ${highlight}`),
		...(framework === 'solid' &&
		[
			'alert-dialog',
			'combobox',
			'command',
			'context-menu',
			'drawer',
			'dropdown-menu',
			'hover-card',
			'menubar',
			'navigation-menu',
			'popover',
			'select',
			'sheet',
			'tooltip',
		].includes(name)
			? [
					'',
					'## Foundation behavior',
					'',
					'This Solid implementation uses native nested primitives and does not expose `asChild`. Controlled state uses Solid accessors and explicit callbacks such as `onOpenChange`, `onValueChange`, or `onSearchChange` where the family supports them.',
					'',
					'Portal content is omitted from the server response and mounted during hydration into the resolved document or nested portal scope. Closed and default-open roots keep deterministic trigger IDs and ARIA relationships without a hydration mismatch.',
					'',
					'Keyboard behavior follows the shared Foundation: focus and Tab order, Escape dismissal, arrow-key movement, typeahead, submenu branches, and trigger restoration are applied according to the component role.',
				]
			: []),
		'',
		'## Registry dependencies',
		'',
		renderDepsTable(name, item),
		'',
		'## API reference',
		'',
		renderApiSection(frameworkApis),
		'',
		'## Related docs',
		'',
		relatedSection,
	];

	return `${blocks.join('\n')}\n`;
}

function main() {
	const frameworkFlag = process.argv.indexOf('--framework');
	const requestedFramework = frameworkFlag === -1 ? null : process.argv[frameworkFlag + 1];
	const frameworks = requestedFramework ? [requestedFramework] : ['react', 'vue'];
	for (const framework of frameworks) {
		if (!frameworkConfigs[framework]) {
			throw new Error(`Unknown docs framework: ${framework}`);
		}
	}

	let written = 0;
	const outputDirs = [];
	for (const framework of frameworks) {
		const items = loadRegistryItems(framework);
		const outputDir = path.join(root, `apps/${framework}/content/docs/components`);
		fs.mkdirSync(outputDir, { recursive: true });
		outputDirs.push(outputDir);
		const availableNames = new Set([...items.values()].filter((item) => item.type === 'registry:ui').map((item) => item.name));
		if (framework === 'solid') {
			for (const file of fs.readdirSync(outputDir)) {
				const name = file.replace(/\.mdx$/, '');
				if (file.endsWith('.mdx') && name !== 'index' && !availableNames.has(name)) {
					fs.unlinkSync(path.join(outputDir, file));
				}
			}
		}

		for (const meta of META) {
			const { name } = meta;
			const item = items.get(name);
			if (!item || (framework !== 'solid' && SKIP.has(name))) {
				continue;
			}
			const apis = extractApi(name);
			fs.writeFileSync(path.join(outputDir, `${name}.mdx`), buildDoc({ name, meta, item, apis, framework, availableNames }));
			written += 1;
		}
	}

	console.log(`Generated ${written} component docs for ${frameworks.join(', ')}.`);

	// 生成的 MDX 与预览代码都通过 oxfmt 格式化，保证 fmt:check 通过。
	const oxfmtBin = path.join(root, 'node_modules', '.bin', 'oxfmt');
	if (fs.existsSync(oxfmtBin)) {
		spawnSync(oxfmtBin, outputDirs, { stdio: 'inherit' });
	}

	// 同步重建 React 预览块可展开代码（预览代码同样派生自 META）。
	if (!requestedFramework || requestedFramework === 'react') {
		spawnSync(process.execPath, ['apps/react/scripts/generate-preview-code.mjs'], { cwd: root, stdio: 'inherit' });
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
