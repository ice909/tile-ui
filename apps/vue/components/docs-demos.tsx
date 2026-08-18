import { defineComponent, ref } from 'vue';

import {
	TAccordion,
	TAccordionContent,
	TAccordionItem,
	TAccordionTrigger,
	TAlert,
	TAlertDescription,
	TAlertDialog,
	TAlertDialogAction,
	TAlertDialogCancel,
	TAlertDialogContent,
	TAlertDialogDescription,
	TAlertDialogFooter,
	TAlertDialogTitle,
	TAlertDialogTrigger,
	TAlertTitle,
	TAspectRatio,
	TAttachment,
	TAttachmentActions,
	TAttachmentContent,
	TAttachmentDescription,
	TAttachmentFileIcon,
	TAttachmentMedia,
	TAttachmentTitle,
	TAvatar,
	TAvatarFallback,
	TAvatarGroup,
	TAvatarGroupCount,
	TBadge,
	TBreadcrumb,
	TBreadcrumbItem,
	TBreadcrumbLink,
	TBreadcrumbList,
	TBreadcrumbPage,
	TBreadcrumbSeparator,
	TBubble,
	TBubbleContent,
	TBubbleGroup,
	TButton,
	TButtonGroup,
	TCalendar,
	TCarousel,
	TCarouselContent,
	TCarouselItem,
	TCarouselNext,
	TCarouselPrevious,
	TChartContainer,
	TCheckbox,
	TCollapsible,
	TCollapsibleContent,
	TCollapsibleTrigger,
	TCombobox,
	TCommand,
	TCommandEmpty,
	TCommandGroup,
	TCommandInput,
	TCommandItem,
	TCommandList,
	TContextMenu,
	TContextMenuContent,
	TContextMenuItem,
	TContextMenuTrigger,
	TDialog,
	TDialogContent,
	TDialogDescription,
	TDialogFooter,
	TDialogHeader,
	TDialogTitle,
	TDialogTrigger,
	TDirectionProvider,
	TDrawer,
	TDrawerContent,
	TDrawerDescription,
	TDrawerHeader,
	TDrawerTitle,
	TDrawerTrigger,
	TDropdownMenu,
	TDropdownMenuContent,
	TDropdownMenuItem,
	TDropdownMenuTrigger,
	TEmpty,
	TEmptyDescription,
	TEmptyMedia,
	TEmptyTitle,
	TField,
	TFieldDescription,
	TFieldLabel,
	TFieldMessage,
	TForm,
	TFormControl,
	TFormField,
	TFormItem,
	TFormLabel,
	TFormMessage,
	THoverCard,
	THoverCardContent,
	THoverCardTrigger,
	TInput,
	TInputGroup,
	TInputGroupAddon,
	TInputGroupInput,
	TInputOTP,
	TInputOTPGroup,
	TInputOTPSlot,
	TItem,
	TItemActions,
	TItemContent,
	TItemDescription,
	TItemMedia,
	TItemTitle,
	TKbd,
	TKbdGroup,
	TMarker,
	TMarkerContent,
	TMarkerIcon,
	TMenubar,
	TMenubarContent,
	TMenubarItem,
	TMenubarMenu,
	TMenubarTrigger,
	TMessage,
	TMessageContent,
	TMessageGroup,
	TMessageScroller,
	TMessageScrollerButton,
	TMessageScrollerContent,
	TMessageScrollerItem,
	TMessageScrollerProvider,
	TMessageScrollerViewport,
	TNativeSelect,
	TNativeSelectOption,
	TNavigationMenu,
	TNavigationMenuContent,
	TNavigationMenuItem,
	TNavigationMenuList,
	TNavigationMenuTrigger,
	TPagination,
	TPaginationContent,
	TPaginationItem,
	TPaginationLink,
	TPaginationNext,
	TPaginationPrevious,
	TPopover,
	TPopoverContent,
	TPopoverTrigger,
	TProgress,
	TRadioGroup,
	TRadioGroupItem,
	TResizableHandle,
	TResizablePanel,
	TResizablePanelGroup,
	TScrollArea,
	TSelect,
	TSelectContent,
	TSelectItem,
	TSelectTrigger,
	TSelectValue,
	TSeparator,
	TSheet,
	TSheetContent,
	TSheetDescription,
	TSheetHeader,
	TSheetTitle,
	TSheetTrigger,
	TSidebar,
	TSidebarContent,
	TSidebarGroup,
	TSidebarGroupLabel,
	TSidebarProvider,
	TSidebarTrigger,
	TSkeleton,
	TSlider,
	TSliderRange,
	TSliderThumb,
	TSliderTrack,
	TSpinner,
	TSwitch,
	TTable,
	TTableBody,
	TTableCell,
	TTableHead,
	TTableHeader,
	TTableRow,
	TTabs,
	TTabsContent,
	TTabsList,
	TTabsTrigger,
	TToggle,
	TToggleGroup,
	TToggleGroupItem,
	TTooltip,
	TTooltipContent,
	TTooltipTrigger,
	TToaster,
	toast,
} from '@tile-ui/vue';

import { DocPreview } from './doc-preview';

type DemoComponent = ReturnType<typeof defineComponent>;

export const vueDemoRegistry: Record<string, DemoComponent> = {
	badge: defineComponent({
		name: 'DemoBadge',
		setup() {
			return () => (
				<DocPreview title="Badge variants" description="Badges surface status and short labels with six visual variants.">
					<div class="button-group">
						<TBadge>{{ default: () => 'Default' }}</TBadge>
						<TBadge variant="secondary">{{ default: () => 'Secondary' }}</TBadge>
						<TBadge variant="destructive">{{ default: () => 'Destructive' }}</TBadge>
						<TBadge variant="outline">{{ default: () => 'Outline' }}</TBadge>
						<TBadge variant="ghost">{{ default: () => 'Ghost' }}</TBadge>
						<TBadge variant="link">{{ default: () => 'Link' }}</TBadge>
					</div>
				</DocPreview>
			);
		},
	}),
	skeleton: defineComponent({
		name: 'DemoSkeleton',
		setup() {
			return () => (
				<DocPreview title="Skeleton placeholders" description="Skeletons reserve space while content loads.">
					<div class="component-preview__stack">
						<div style={{ display: 'grid', gap: '8px' }}>
							<TSkeleton style={{ height: '16px', width: '60%' }} />
							<TSkeleton style={{ height: '16px', width: '90%' }} />
							<TSkeleton style={{ height: '16px', width: '40%' }} />
						</div>
					</div>
				</DocPreview>
			);
		},
	}),
	kbd: defineComponent({
		name: 'DemoKbd',
		setup() {
			return () => (
				<DocPreview title="Keyboard keys" description="Kbd renders keys and key combinations.">
					<TKbdGroup>
						<TKbd>{{ default: () => 'Ctrl' }}</TKbd>
						<TKbd>{{ default: () => 'Shift' }}</TKbd>
						<TKbd>{{ default: () => 'K' }}</TKbd>
					</TKbdGroup>
				</DocPreview>
			);
		},
	}),
	separator: defineComponent({
		name: 'DemoSeparator',
		setup() {
			return () => (
				<DocPreview title="Separators" description="Separators divide content horizontally or vertically.">
					<div class="component-preview__stack">
						<div>
							<p class="component-preview__text">Above</p>
							<TSeparator />
							<p class="component-preview__text">Below</p>
						</div>
						<div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '24px' }}>
							<span class="component-preview__text">Left</span>
							<TSeparator orientation="vertical" />
							<span class="component-preview__text">Right</span>
						</div>
					</div>
				</DocPreview>
			);
		},
	}),
	table: defineComponent({
		name: 'DemoTable',
		setup() {
			return () => (
				<DocPreview title="Table" description="Tables lay out tabular data with header, body, and caption.">
					<TTable>
						{{
							default: () => [
								<TTableHeader>
									{{
										default: () => [
											<TTableRow>
												{{
													default: () => [<TTableHead>{{ default: () => 'Name' }}</TTableHead>, <TTableHead>{{ default: () => 'Role' }}</TTableHead>],
												}}
											</TTableRow>,
										],
									}}
								</TTableHeader>,
								<TTableBody>
									{{
										default: () => [
											<TTableRow>
												{{
													default: () => [
														<TTableCell>{{ default: () => 'Tile UI' }}</TTableCell>,
														<TTableCell>{{ default: () => 'Design system' }}</TTableCell>,
													],
												}}
											</TTableRow>,
										],
									}}
								</TTableBody>,
							],
						}}
					</TTable>
				</DocPreview>
			);
		},
	}),
	progress: defineComponent({
		name: 'DemoProgress',
		setup() {
			return () => (
				<DocPreview title="Progress bars" description="Progress shows completion against a range.">
					<div class="component-preview__stack">
						<TProgress value={40} />
						<TProgress value={80} />
					</div>
				</DocPreview>
			);
		},
	}),
	avatar: defineComponent({
		name: 'DemoAvatar',
		setup() {
			return () => (
				<DocPreview title="Avatars" description="Avatars show images with a text fallback and group stacking.">
					<div class="button-group">
						<TAvatar size="sm">{{ default: () => <TAvatarFallback>{{ default: () => 'TU' }}</TAvatarFallback> }}</TAvatar>
						<TAvatar>{{ default: () => <TAvatarFallback>{{ default: () => 'TU' }}</TAvatarFallback> }}</TAvatar>
						<TAvatar size="lg">{{ default: () => <TAvatarFallback>{{ default: () => 'TU' }}</TAvatarFallback> }}</TAvatar>
						<TAvatarGroup>
							{{
								default: () => [
									<TAvatar>{{ default: () => <TAvatarFallback>{{ default: () => 'A' }}</TAvatarFallback> }}</TAvatar>,
									<TAvatar>{{ default: () => <TAvatarFallback>{{ default: () => 'B' }}</TAvatarFallback> }}</TAvatar>,
									<TAvatarGroupCount>{{ default: () => '+3' }}</TAvatarGroupCount>,
								],
							}}
						</TAvatarGroup>
					</div>
				</DocPreview>
			);
		},
	}),
	switch: defineComponent({
		name: 'DemoSwitch',
		setup() {
			const checked = ref(true);
			return () => (
				<DocPreview title="Switches" description="Switches toggle a boolean setting.">
					<div class="button-group">
						<TSwitch
							modelValue={checked.value}
							onUpdate:modelValue={(next: boolean) => {
								checked.value = next;
							}}
						/>
						<TSwitch size="sm" />
					</div>
				</DocPreview>
			);
		},
	}),
	checkbox: defineComponent({
		name: 'DemoCheckbox',
		setup() {
			const checked = ref(true);
			return () => (
				<DocPreview title="Checkboxes" description="Checkboxes support checked and indeterminate states.">
					<div class="button-group">
						<TCheckbox
							modelValue={checked.value}
							onUpdate:modelValue={(next) => {
								checked.value = next === true;
							}}
						/>
						<TCheckbox defaultChecked="indeterminate" />
						<TCheckbox disabled />
					</div>
				</DocPreview>
			);
		},
	}),
	collapsible: defineComponent({
		name: 'DemoCollapsible',
		setup() {
			return () => (
				<DocPreview title="Collapsible" description="Collapsible toggles extra content without a dialog.">
					<TCollapsible>
						{{
							default: () => [
								<TCollapsibleTrigger class="component-preview__action">{{ default: () => 'Toggle details' }}</TCollapsibleTrigger>,
								<TCollapsibleContent>
									{{
										default: () => <p class="component-preview__text">This content is hidden until you expand it.</p>,
									}}
								</TCollapsibleContent>,
							],
						}}
					</TCollapsible>
				</DocPreview>
			);
		},
	}),
	breadcrumb: defineComponent({
		name: 'DemoBreadcrumb',
		setup() {
			return () => (
				<DocPreview title="Breadcrumb" description="Breadcrumbs show the current location in a hierarchy.">
					<TBreadcrumb>
						{{
							default: () => (
								<TBreadcrumbList>
									{{
										default: () => [
											<TBreadcrumbItem>
												{{
													default: () => <TBreadcrumbLink href="/docs">{{ default: () => 'Docs' }}</TBreadcrumbLink>,
												}}
											</TBreadcrumbItem>,
											<TBreadcrumbSeparator />,
											<TBreadcrumbItem>
												{{
													default: () => <TBreadcrumbLink href="/docs/components">{{ default: () => 'Components' }}</TBreadcrumbLink>,
												}}
											</TBreadcrumbItem>,
											<TBreadcrumbSeparator />,
											<TBreadcrumbItem>{{ default: () => <TBreadcrumbPage>{{ default: () => 'Button' }}</TBreadcrumbPage> }}</TBreadcrumbItem>,
										],
									}}
								</TBreadcrumbList>
							),
						}}
					</TBreadcrumb>
				</DocPreview>
			);
		},
	}),
	pagination: defineComponent({
		name: 'DemoPagination',
		setup() {
			return () => (
				<DocPreview title="Pagination" description="Pagination pages through long lists.">
					<TPagination>
						{{
							default: () => (
								<TPaginationContent>
									{{
										default: () => [
											<TPaginationItem>{{ default: () => <TPaginationPrevious /> }}</TPaginationItem>,
											<TPaginationItem>
												{{
													default: () => (
														<TPaginationLink href="#" isActive>
															{{ default: () => '1' }}
														</TPaginationLink>
													),
												}}
											</TPaginationItem>,
											<TPaginationItem>{{ default: () => <TPaginationLink href="#">{{ default: () => '2' }}</TPaginationLink> }}</TPaginationItem>,
											<TPaginationItem>{{ default: () => <TPaginationNext /> }}</TPaginationItem>,
										],
									}}
								</TPaginationContent>
							),
						}}
					</TPagination>
				</DocPreview>
			);
		},
	}),
	alert: defineComponent({
		name: 'DemoAlert',
		setup() {
			return () => (
				<DocPreview title="Alerts" description="Alerts surface important feedback with variants.">
					<div class="component-preview__stack">
						<TAlert>
							{{
								default: () => [
									<TAlertTitle>{{ default: () => 'Heads up' }}</TAlertTitle>,
									<TAlertDescription>{{ default: () => 'A new version of Tile UI is available.' }}</TAlertDescription>,
								],
							}}
						</TAlert>
						<TAlert variant="destructive">
							{{
								default: () => [
									<TAlertTitle>{{ default: () => 'Error' }}</TAlertTitle>,
									<TAlertDescription>{{ default: () => 'Your session could not be restored.' }}</TAlertDescription>,
								],
							}}
						</TAlert>
					</div>
				</DocPreview>
			);
		},
	}),
	'aspect-ratio': defineComponent({
		name: 'DemoAspectRatio',
		setup() {
			return () => (
				<DocPreview title="Aspect ratio" description="AspectRatio keeps content at a fixed width-to-height ratio.">
					<TAspectRatio ratio={16 / 9} style={{ background: 'var(--docs-surface-hover)' }}>
						{{
							default: () => (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
									<span class="component-preview__text">16:9</span>
								</div>
							),
						}}
					</TAspectRatio>
				</DocPreview>
			);
		},
	}),
	spinner: defineComponent({
		name: 'DemoSpinner',
		setup() {
			return () => (
				<DocPreview title="Spinners" description="Spinners indicate in-progress work.">
					<div class="button-group">
						<TSpinner size="sm" />
						<TSpinner />
						<TSpinner size="lg" />
					</div>
				</DocPreview>
			);
		},
	}),
	empty: defineComponent({
		name: 'DemoEmpty',
		setup() {
			return () => (
				<DocPreview title="Empty state" description="Empty guides users when there is nothing to display.">
					<TEmpty>
						{{
							default: () => [
								<TEmptyMedia variant="default">{{ default: () => '+' }}</TEmptyMedia>,
								<TEmptyTitle>{{ default: () => 'No results' }}</TEmptyTitle>,
								<TEmptyDescription>{{ default: () => 'Try adjusting your search or filters.' }}</TEmptyDescription>,
							],
						}}
					</TEmpty>
				</DocPreview>
			);
		},
	}),
	marker: defineComponent({
		name: 'DemoMarker',
		setup() {
			return () => (
				<DocPreview title="Markers" description="Markers annotate content with visual variants.">
					<div class="button-group">
						<TMarker variant="default">
							{{
								default: () => [<TMarkerIcon />, <TMarkerContent>{{ default: () => 'Default' }}</TMarkerContent>],
							}}
						</TMarker>
						<TMarker variant="separator">
							{{
								default: () => [<TMarkerIcon />, <TMarkerContent>{{ default: () => 'Separator' }}</TMarkerContent>],
							}}
						</TMarker>
						<TMarker variant="border">
							{{
								default: () => [<TMarkerIcon />, <TMarkerContent>{{ default: () => 'Border' }}</TMarkerContent>],
							}}
						</TMarker>
					</div>
				</DocPreview>
			);
		},
	}),
	item: defineComponent({
		name: 'DemoItem',
		setup() {
			return () => (
				<DocPreview title="List items" description="Items build consistent rows with media, content, and actions.">
					<div class="component-preview__stack">
						<TItem>
							{{
								default: () => [
									<TItemMedia>{{ default: () => '+' }}</TItemMedia>,
									<TItemContent>
										{{
											default: () => [
												<TItemTitle>{{ default: () => 'Tile UI' }}</TItemTitle>,
												<TItemDescription>{{ default: () => 'A cross-framework component library.' }}</TItemDescription>,
											],
										}}
									</TItemContent>,
									<TItemActions>
										{{
											default: () => (
												<TButton size="sm" variant="outline">
													{{ default: () => 'Open' }}
												</TButton>
											),
										}}
									</TItemActions>,
								],
							}}
						</TItem>
					</div>
				</DocPreview>
			);
		},
	}),
	'button-group': defineComponent({
		name: 'DemoButtonGroup',
		setup() {
			return () => (
				<DocPreview title="Button group" description="ButtonGroup attaches related buttons into a single control.">
					<TButtonGroup>
						{{
							default: () => [
								<TButton variant="outline">{{ default: () => 'One' }}</TButton>,
								<TButton variant="outline">{{ default: () => 'Two' }}</TButton>,
								<TButton variant="outline">{{ default: () => 'Three' }}</TButton>,
							],
						}}
					</TButtonGroup>
				</DocPreview>
			);
		},
	}),
	'input-group': defineComponent({
		name: 'DemoInputGroup',
		setup() {
			return () => (
				<DocPreview title="Input group" description="InputGroup attaches addons and buttons to an input.">
					<TInputGroup>
						{{
							default: () => [<TInputGroupAddon>{{ default: () => 'https://' }}</TInputGroupAddon>, <TInputGroupInput placeholder="example.com" />],
						}}
					</TInputGroup>
				</DocPreview>
			);
		},
	}),
	'native-select': defineComponent({
		name: 'DemoNativeSelect',
		setup() {
			return () => (
				<DocPreview title="Native select" description="NativeSelect is a styled native dropdown.">
					<TNativeSelect defaultValue="a" style={{ maxWidth: '260px' }}>
						{{
							default: () => [
								<TNativeSelectOption value="a">{{ default: () => 'Option A' }}</TNativeSelectOption>,
								<TNativeSelectOption value="b">{{ default: () => 'Option B' }}</TNativeSelectOption>,
							],
						}}
					</TNativeSelect>
				</DocPreview>
			);
		},
	}),
	field: defineComponent({
		name: 'DemoField',
		setup() {
			return () => (
				<DocPreview title="Field" description="Field composes label, description, and message.">
					<TField name="email" required invalid>
						{{
							default: () => [
								<TFieldLabel htmlFor="demo-email">{{ default: () => 'Email' }}</TFieldLabel>,
								<input id="demo-email" class="component-preview__native-field" placeholder="you@example.com" />,
								<TFieldDescription>{{ default: () => 'We never share your email.' }}</TFieldDescription>,
								<TFieldMessage variant="error">{{ default: () => 'An email address is required.' }}</TFieldMessage>,
							],
						}}
					</TField>
				</DocPreview>
			);
		},
	}),
	toggle: defineComponent({
		name: 'DemoToggle',
		setup() {
			return () => (
				<DocPreview title="Toggles" description="Toggle expresses a binary selection as a button.">
					<div class="button-group">
						<TToggle>{{ default: () => 'Bold' }}</TToggle>
						<TToggle variant="outline">{{ default: () => 'Italic' }}</TToggle>
						<TToggle variant="ghost">{{ default: () => 'Underline' }}</TToggle>
					</div>
				</DocPreview>
			);
		},
	}),
	'toggle-group': defineComponent({
		name: 'DemoToggleGroup',
		setup() {
			return () => (
				<DocPreview title="Toggle group" description="ToggleGroup groups single- or multi-select toggles.">
					<TToggleGroup type="single" defaultValue="left">
						{{
							default: () => [
								<TToggleGroupItem value="left">{{ default: () => 'Left' }}</TToggleGroupItem>,
								<TToggleGroupItem value="center">{{ default: () => 'Center' }}</TToggleGroupItem>,
								<TToggleGroupItem value="right">{{ default: () => 'Right' }}</TToggleGroupItem>,
							],
						}}
					</TToggleGroup>
				</DocPreview>
			);
		},
	}),
	tabs: defineComponent({
		name: 'DemoTabs',
		setup() {
			return () => (
				<DocPreview title="Tabs" description="Tabs switch between panes of content.">
					<TTabs defaultValue="account">
						{{
							default: () => [
								<TTabsList>
									{{
										default: () => [
											<TTabsTrigger value="account">{{ default: () => 'Account' }}</TTabsTrigger>,
											<TTabsTrigger value="settings">{{ default: () => 'Settings' }}</TTabsTrigger>,
										],
									}}
								</TTabsList>,
								<TTabsContent value="account">{{ default: () => <p class="component-preview__text">Account preferences live here.</p> }}</TTabsContent>,
								<TTabsContent value="settings">{{ default: () => <p class="component-preview__text">Settings live here.</p> }}</TTabsContent>,
							],
						}}
					</TTabs>
				</DocPreview>
			);
		},
	}),
	accordion: defineComponent({
		name: 'DemoAccordion',
		setup() {
			return () => (
				<DocPreview title="Accordion" description="Accordion presents collapsible sections.">
					<TAccordion type="single" collapsible defaultValue="one">
						{{
							default: () => [
								<TAccordionItem value="one">
									{{
										default: () => [
											<TAccordionTrigger>{{ default: () => 'Section one' }}</TAccordionTrigger>,
											<TAccordionContent>{{ default: () => <p class="component-preview__text">Content one.</p> }}</TAccordionContent>,
										],
									}}
								</TAccordionItem>,
								<TAccordionItem value="two">
									{{
										default: () => [
											<TAccordionTrigger>{{ default: () => 'Section two' }}</TAccordionTrigger>,
											<TAccordionContent>{{ default: () => <p class="component-preview__text">Content two.</p> }}</TAccordionContent>,
										],
									}}
								</TAccordionItem>,
							],
						}}
					</TAccordion>
				</DocPreview>
			);
		},
	}),
	'radio-group': defineComponent({
		name: 'DemoRadioGroup',
		setup() {
			return () => (
				<DocPreview title="Radio group" description="RadioGroup selects one of several options.">
					<TRadioGroup defaultValue="a" orientation="horizontal">
						{{
							default: () => [<TRadioGroupItem value="a" />, <TRadioGroupItem value="b" />, <TRadioGroupItem value="c" />],
						}}
					</TRadioGroup>
				</DocPreview>
			);
		},
	}),
	slider: defineComponent({
		name: 'DemoSlider',
		setup() {
			const value = ref(40);
			return () => (
				<DocPreview title="Slider" description="Slider picks a value from a range.">
					<div class="component-preview__stack">
						<TSlider
							modelValue={value.value}
							onUpdate:modelValue={(next: number) => {
								value.value = next;
							}}
							max={100}
							step={1}>
							{{
								default: () => (
									<TSliderTrack>
										{{
											default: () => [<TSliderRange />, <TSliderThumb />],
										}}
									</TSliderTrack>
								),
							}}
						</TSlider>
						<p class="component-preview__text">
							Value: <strong>{value.value}</strong>
						</p>
					</div>
				</DocPreview>
			);
		},
	}),
	'scroll-area': defineComponent({
		name: 'DemoScrollArea',
		setup() {
			return () => (
				<DocPreview title="Scroll area" description="ScrollArea provides a styled scroll container.">
					<TScrollArea style={{ maxHeight: '140px' }}>
						{{
							default: () => (
								<div style={{ paddingRight: '16px' }}>
									{Array.from({ length: 12 }, (_, i) => (
										<p key={i} class="component-preview__text">
											Line {i + 1} — scrollable content.
										</p>
									))}
								</div>
							),
						}}
					</TScrollArea>
				</DocPreview>
			);
		},
	}),
	tooltip: defineComponent({
		name: 'DemoTooltip',
		setup() {
			return () => (
				<DocPreview title="Tooltip" description="Tooltip shows contextual help on hover or focus.">
					<TTooltip>
						{{
							default: () => [
								<TTooltipTrigger class="component-preview__action">{{ default: () => 'Hover me' }}</TTooltipTrigger>,
								<TTooltipContent>{{ default: () => 'Helpful context here.' }}</TTooltipContent>,
							],
						}}
					</TTooltip>
				</DocPreview>
			);
		},
	}),
	popover: defineComponent({
		name: 'DemoPopover',
		setup() {
			return () => (
				<DocPreview title="Popover" description="Popover shows richer content anchored to a trigger.">
					<TPopover>
						{{
							default: () => [
								<TPopoverTrigger class="component-preview__action">{{ default: () => 'Open popover' }}</TPopoverTrigger>,
								<TPopoverContent>
									{{
										default: () => <p class="component-preview__text">Rich content anchored to the trigger.</p>,
									}}
								</TPopoverContent>,
							],
						}}
					</TPopover>
				</DocPreview>
			);
		},
	}),
	'hover-card': defineComponent({
		name: 'DemoHoverCard',
		setup() {
			return () => (
				<DocPreview title="Hover card" description="HoverCard shows a preview when hovering a trigger.">
					<THoverCard>
						{{
							default: () => [
								<THoverCardTrigger class="component-preview__action">{{ default: () => 'Hover me' }}</THoverCardTrigger>,
								<THoverCardContent>
									{{
										default: () => <p class="component-preview__text">Preview content on hover.</p>,
									}}
								</THoverCardContent>,
							],
						}}
					</THoverCard>
				</DocPreview>
			);
		},
	}),
	dialog: defineComponent({
		name: 'DemoDialog',
		setup() {
			return () => (
				<DocPreview title="Dialog" description="Dialog requires a decision before continuing.">
					<TDialog>
						{{
							default: () => [
								<TDialogTrigger class="component-preview__action">{{ default: () => 'Open dialog' }}</TDialogTrigger>,
								<TDialogContent>
									{{
										default: () => [
											<TDialogHeader>
												{{
													default: () => [
														<TDialogTitle>{{ default: () => 'Edit profile' }}</TDialogTitle>,
														<TDialogDescription>{{ default: () => 'Make changes to your profile here.' }}</TDialogDescription>,
													],
												}}
											</TDialogHeader>,
											<TDialogFooter>
												{{
													default: () => [
														<TButton variant="outline">{{ default: () => 'Cancel' }}</TButton>,
														<TButton>{{ default: () => 'Save' }}</TButton>,
													],
												}}
											</TDialogFooter>,
										],
									}}
								</TDialogContent>,
							],
						}}
					</TDialog>
				</DocPreview>
			);
		},
	}),
	'alert-dialog': defineComponent({
		name: 'DemoAlertDialog',
		setup() {
			return () => (
				<DocPreview title="Alert dialog" description="AlertDialog interrupts for confirmation.">
					<TAlertDialog>
						{{
							default: () => [
								<TAlertDialogTrigger class="component-preview__action">{{ default: () => 'Delete' }}</TAlertDialogTrigger>,
								<TAlertDialogContent>
									{{
										default: () => [
											<TAlertDialogTitle>{{ default: () => 'Are you sure?' }}</TAlertDialogTitle>,
											<TAlertDialogDescription>{{ default: () => 'This action cannot be undone.' }}</TAlertDialogDescription>,
											<TAlertDialogFooter>
												{{
													default: () => [
														<TAlertDialogCancel>{{ default: () => 'Cancel' }}</TAlertDialogCancel>,
														<TAlertDialogAction>{{ default: () => 'Delete' }}</TAlertDialogAction>,
													],
												}}
											</TAlertDialogFooter>,
										],
									}}
								</TAlertDialogContent>,
							],
						}}
					</TAlertDialog>
				</DocPreview>
			);
		},
	}),
	sheet: defineComponent({
		name: 'DemoSheet',
		setup() {
			return () => (
				<DocPreview title="Sheet" description="Sheet slides a panel from the edge.">
					<TSheet>
						{{
							default: () => [
								<TSheetTrigger class="component-preview__action">{{ default: () => 'Open sheet' }}</TSheetTrigger>,
								<TSheetContent side="right">
									{{
										default: () => (
											<TSheetHeader>
												{{
													default: () => [
														<TSheetTitle>{{ default: () => 'Details' }}</TSheetTitle>,
														<TSheetDescription>{{ default: () => 'Supporting details for this panel.' }}</TSheetDescription>,
													],
												}}
											</TSheetHeader>
										),
									}}
								</TSheetContent>,
							],
						}}
					</TSheet>
				</DocPreview>
			);
		},
	}),
	'dropdown-menu': defineComponent({
		name: 'DemoDropdownMenu',
		setup() {
			return () => (
				<DocPreview title="Dropdown menu" description="DropdownMenu offers a list of actions.">
					<TDropdownMenu>
						{{
							default: () => [
								<TDropdownMenuTrigger class="component-preview__action">{{ default: () => 'Open menu' }}</TDropdownMenuTrigger>,
								<TDropdownMenuContent>
									{{
										default: () => [
											<TDropdownMenuItem>{{ default: () => 'Profile' }}</TDropdownMenuItem>,
											<TDropdownMenuItem>{{ default: () => 'Settings' }}</TDropdownMenuItem>,
											<TDropdownMenuItem variant="destructive">{{ default: () => 'Sign out' }}</TDropdownMenuItem>,
										],
									}}
								</TDropdownMenuContent>,
							],
						}}
					</TDropdownMenu>
				</DocPreview>
			);
		},
	}),
	'context-menu': defineComponent({
		name: 'DemoContextMenu',
		setup() {
			return () => (
				<DocPreview title="Context menu" description="ContextMenu shows actions on right-click.">
					<TContextMenu>
						{{
							default: () => [
								<TContextMenuTrigger>
									{{
										default: () => <div class="component-preview__action">Right-click me</div>,
									}}
								</TContextMenuTrigger>,
								<TContextMenuContent>
									{{
										default: () => [
											<TContextMenuItem>{{ default: () => 'Copy' }}</TContextMenuItem>,
											<TContextMenuItem>{{ default: () => 'Paste' }}</TContextMenuItem>,
										],
									}}
								</TContextMenuContent>,
							],
						}}
					</TContextMenu>
				</DocPreview>
			);
		},
	}),
	menubar: defineComponent({
		name: 'DemoMenubar',
		setup() {
			return () => (
				<DocPreview title="Menubar" description="Menubar provides a desktop-style application menu.">
					<TMenubar>
						{{
							default: () => [
								<TMenubarMenu value="file">
									{{
										default: () => [
											<TMenubarTrigger>{{ default: () => 'File' }}</TMenubarTrigger>,
											<TMenubarContent>
												{{
													default: () => [
														<TMenubarItem>{{ default: () => 'New' }}</TMenubarItem>,
														<TMenubarItem>{{ default: () => 'Open' }}</TMenubarItem>,
													],
												}}
											</TMenubarContent>,
										],
									}}
								</TMenubarMenu>,
							],
						}}
					</TMenubar>
				</DocPreview>
			);
		},
	}),
	'navigation-menu': defineComponent({
		name: 'DemoNavigationMenu',
		setup() {
			return () => (
				<DocPreview title="Navigation menu" description="NavigationMenu provides primary navigation.">
					<TNavigationMenu>
						{{
							default: () => (
								<TNavigationMenuList>
									{{
										default: () => [
											<TNavigationMenuItem value="docs">
												{{
													default: () => [
														<TNavigationMenuTrigger>{{ default: () => 'Docs' }}</TNavigationMenuTrigger>,
														<TNavigationMenuContent>
															{{
																default: () => (
																	<div style={{ padding: '12px' }}>
																		<p class="component-preview__text">Documentation links live here.</p>
																	</div>
																),
															}}
														</TNavigationMenuContent>,
													],
												}}
											</TNavigationMenuItem>,
										],
									}}
								</TNavigationMenuList>
							),
						}}
					</TNavigationMenu>
				</DocPreview>
			);
		},
	}),
	select: defineComponent({
		name: 'DemoSelect',
		setup() {
			return () => (
				<DocPreview title="Select" description="Select picks one value from a styled dropdown.">
					<TSelect defaultValue="apple" style={{ width: '220px' }}>
						{{
							default: () => [
								<TSelectTrigger>{{ default: () => <TSelectValue placeholder="Choose a fruit" /> }}</TSelectTrigger>,
								<TSelectContent>
									{{
										default: () => [
											<TSelectItem value="apple">{{ default: () => 'Apple' }}</TSelectItem>,
											<TSelectItem value="banana">{{ default: () => 'Banana' }}</TSelectItem>,
											<TSelectItem value="cherry">{{ default: () => 'Cherry' }}</TSelectItem>,
										],
									}}
								</TSelectContent>,
							],
						}}
					</TSelect>
				</DocPreview>
			);
		},
	}),
	combobox: defineComponent({
		name: 'DemoCombobox',
		setup() {
			return () => (
				<DocPreview title="Combobox" description="Combobox selects from a searchable list.">
					<TCombobox
						items={[
							{ value: 'apple', label: 'Apple' },
							{ value: 'banana', label: 'Banana' },
							{ value: 'cherry', label: 'Cherry' },
							{ value: 'date', label: 'Date' },
						]}
						placeholder="Pick a fruit"
						style={{ maxWidth: '280px' }}
					/>
				</DocPreview>
			);
		},
	}),
	command: defineComponent({
		name: 'DemoCommand',
		setup() {
			return () => (
				<DocPreview title="Command" description="Command builds searchable command menus.">
					<TCommand>
						{{
							default: () => [
								<TCommandInput />,
								<TCommandList>
									{{
										default: () => [
											<TCommandEmpty>{{ default: () => 'No results found.' }}</TCommandEmpty>,
											<TCommandGroup heading="Suggestions">
												{{
													default: () => [
														<TCommandItem value="calendar">{{ default: () => 'Calendar' }}</TCommandItem>,
														<TCommandItem value="search">{{ default: () => 'Search' }}</TCommandItem>,
													],
												}}
											</TCommandGroup>,
										],
									}}
								</TCommandList>,
							],
						}}
					</TCommand>
				</DocPreview>
			);
		},
	}),
	chart: defineComponent({
		name: 'DemoChart',
		setup() {
			return () => (
				<DocPreview title="Chart" description="ChartContainer renders line, bar, and area charts.">
					<TChartContainer
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
				</DocPreview>
			);
		},
	}),
	calendar: defineComponent({
		name: 'DemoCalendar',
		setup() {
			return () => (
				<DocPreview title="Calendar" description="Calendar picks dates in single, multiple, or range modes.">
					<TCalendar
						mode="single"
						onSelect={(selection) => {
							toast.info(`Selected ${selection instanceof Date ? selection.toDateString() : 'date'}`);
						}}
					/>
				</DocPreview>
			);
		},
	}),
	drawer: defineComponent({
		name: 'DemoDrawer',
		setup() {
			return () => (
				<DocPreview title="Drawer" description="Drawer slides a panel in from any direction.">
					<TDrawer direction="right">
						{{
							default: () => [
								<TDrawerTrigger class="component-preview__action">{{ default: () => 'Open drawer' }}</TDrawerTrigger>,
								<TDrawerContent>
									{{
										default: () => (
											<TDrawerHeader>
												{{
													default: () => [
														<TDrawerTitle>{{ default: () => 'Title' }}</TDrawerTitle>,
														<TDrawerDescription>{{ default: () => 'Description for the drawer.' }}</TDrawerDescription>,
													],
												}}
											</TDrawerHeader>
										),
									}}
								</TDrawerContent>,
							],
						}}
					</TDrawer>
				</DocPreview>
			);
		},
	}),
	form: defineComponent({
		name: 'DemoForm',
		setup() {
			return () => (
				<DocPreview title="Form" description="Form manages validation, values, and submission.">
					<TForm>
						{{
							default: () => [
								<TFormField name="email">
									{{
										default: () => [
											<TFormItem>
												{{
													default: () => [
														<TFormLabel>{{ default: () => 'Email' }}</TFormLabel>,
														<TFormControl>{{ default: () => <TInput placeholder="you@example.com" /> }}</TFormControl>,
														<TFormMessage />,
													],
												}}
											</TFormItem>,
										],
									}}
								</TFormField>,
								<TButton type="submit">{{ default: () => 'Submit' }}</TButton>,
							],
						}}
					</TForm>
				</DocPreview>
			);
		},
	}),
	sidebar: defineComponent({
		name: 'DemoSidebar',
		setup() {
			return () => (
				<DocPreview title="Sidebar" description="Sidebar adds a collapsible application sidebar.">
					<TSidebarProvider>
						{{
							default: () => [
								<div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
									<TSidebar collapsible="icon" style={{ position: 'static', height: '220px' }}>
										{{
											default: () => (
												<TSidebarContent>
													{{
														default: () => (
															<TSidebarGroup>{{ default: () => <TSidebarGroupLabel>{{ default: () => 'Menu' }}</TSidebarGroupLabel> }}</TSidebarGroup>
														),
													}}
												</TSidebarContent>
											),
										}}
									</TSidebar>
									,<TSidebarTrigger class="component-preview__action">{{ default: () => 'Toggle' }}</TSidebarTrigger>,
								</div>,
							],
						}}
					</TSidebarProvider>
				</DocPreview>
			);
		},
	}),
	carousel: defineComponent({
		name: 'DemoCarousel',
		setup() {
			return () => (
				<DocPreview title="Carousel" description="Carousel cycles through a set of items.">
					<TCarousel>
						{{
							default: () => [
								<TCarouselContent>
									{{
										default: () => [
											['Slide one', 'Slide two', 'Slide three'].map((text) => (
												<TCarouselItem key={text}>
													{{
														default: () => (
															<div
																style={{
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	height: '160px',
																	borderRadius: '0.5rem',
																	background: 'var(--docs-surface-hover)',
																}}>
																<p class="component-preview__text">{text}</p>
															</div>
														),
													}}
												</TCarouselItem>
											)),
										],
									}}
								</TCarouselContent>,
								<TCarouselPrevious />,
								<TCarouselNext />,
							],
						}}
					</TCarousel>
				</DocPreview>
			);
		},
	}),
	resizable: defineComponent({
		name: 'DemoResizable',
		setup() {
			return () => (
				<DocPreview title="Resizable" description="ResizablePanelGroup creates adjustable split layouts.">
					<TResizablePanelGroup direction="horizontal" style={{ height: '140px', display: 'flex', width: '100%' }}>
						{{
							default: () => [
								<TResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
									{{ default: () => <p class="component-preview__text">Left</p> }}
								</TResizablePanel>,
								<TResizableHandle />,
								<TResizablePanel style={{ background: 'var(--docs-surface-hover)' }}>
									{{ default: () => <p class="component-preview__text">Right</p> }}
								</TResizablePanel>,
							],
						}}
					</TResizablePanelGroup>
				</DocPreview>
			);
		},
	}),
	attachment: defineComponent({
		name: 'DemoAttachment',
		setup() {
			return () => (
				<DocPreview title="Attachment" description="Attachment displays files with state and actions.">
					<TAttachment>
						{{
							default: () => [
								<TAttachmentMedia>{{ default: () => <TAttachmentFileIcon kind="pdf" /> }}</TAttachmentMedia>,
								<TAttachmentContent>
									{{
										default: () => [
											<TAttachmentTitle>{{ default: () => 'report.pdf' }}</TAttachmentTitle>,
											<TAttachmentDescription>{{ default: () => '2.4 MB' }}</TAttachmentDescription>,
										],
									}}
								</TAttachmentContent>,
								<TAttachmentActions>
									{{
										default: () => (
											<TButton size="sm" variant="outline">
												{{ default: () => 'Download' }}
											</TButton>
										),
									}}
								</TAttachmentActions>,
							],
						}}
					</TAttachment>
				</DocPreview>
			);
		},
	}),
	bubble: defineComponent({
		name: 'DemoBubble',
		setup() {
			return () => (
				<DocPreview title="Bubble" description="Bubble builds chat message bubbles.">
					<TBubbleGroup>
						{{
							default: () => [
								<TBubble align="start">{{ default: () => <TBubbleContent>{{ default: () => 'Hello there' }}</TBubbleContent> }}</TBubble>,
								<TBubble align="end" variant="tinted">
									{{ default: () => <TBubbleContent>{{ default: () => 'Hi! How can I help?' }}</TBubbleContent> }}
								</TBubble>,
							],
						}}
					</TBubbleGroup>
				</DocPreview>
			);
		},
	}),
	direction: defineComponent({
		name: 'DemoDirection',
		setup() {
			const rtl = ref(false);
			return () => (
				<DocPreview title="Direction" description="DirectionProvider sets the reading direction.">
					<div class="component-preview__stack">
						<TDirectionProvider dir={rtl.value ? 'rtl' : 'ltr'}>
							{{
								default: () => (
									<div style={{ display: 'flex', gap: '8px' }}>
										<span class="component-preview__text">One</span>
										<span class="component-preview__text">Two</span>
										<span class="component-preview__text">Three</span>
									</div>
								),
							}}
						</TDirectionProvider>
						<div class="button-group">
							<button
								type="button"
								class="component-preview__action"
								onClick={() => {
									rtl.value = !rtl.value;
								}}>
								{rtl.value ? 'RTL' : 'LTR'}
							</button>
						</div>
					</div>
				</DocPreview>
			);
		},
	}),
	message: defineComponent({
		name: 'DemoMessage',
		setup() {
			return () => (
				<DocPreview title="Message" description="Message composes chat messages with avatar and content.">
					<TMessageGroup>
						{{
							default: () => [
								<TMessage align="end">{{ default: () => <TMessageContent>{{ default: () => 'Hi there' }}</TMessageContent> }}</TMessage>,
								<TMessage align="start">{{ default: () => <TMessageContent>{{ default: () => 'Hey! What can I help with?' }}</TMessageContent> }}</TMessage>,
							],
						}}
					</TMessageGroup>
				</DocPreview>
			);
		},
	}),
	'message-scroller': defineComponent({
		name: 'DemoMessageScroller',
		setup() {
			return () => (
				<DocPreview title="Message scroller" description="MessageScroller scrolls a message list with anchoring.">
					<TMessageScrollerProvider>
						{{
							default: () => (
								<TMessageScroller style={{ maxHeight: '160px' }}>
									{{
										default: () => [
											<TMessageScrollerViewport>
												{{
													default: () => (
														<TMessageScrollerContent>
															{{
																default: () =>
																	Array.from({ length: 8 }, (_, i) => (
																		<TMessageScrollerItem key={i}>
																			{{ default: () => <p class="component-preview__text">Message {i + 1}</p> }}
																		</TMessageScrollerItem>
																	)),
															}}
														</TMessageScrollerContent>
													),
												}}
											</TMessageScrollerViewport>,
											<TMessageScrollerButton direction="start">{{ default: () => '↑' }}</TMessageScrollerButton>,
											<TMessageScrollerButton direction="end">{{ default: () => '↓' }}</TMessageScrollerButton>,
										],
									}}
								</TMessageScroller>
							),
						}}
					</TMessageScrollerProvider>
				</DocPreview>
			);
		},
	}),
	sonner: defineComponent({
		name: 'DemoSonner',
		setup() {
			return () => (
				<DocPreview title="Toasts" description="Toaster and toast show transient notifications.">
					<div class="component-preview__stack">
						<div class="button-group">
							<button type="button" class="component-preview__action" onClick={() => toast('Default toast')}>
								Default
							</button>
							<button type="button" class="component-preview__action" onClick={() => toast.success('Saved successfully')}>
								Success
							</button>
							<button type="button" class="component-preview__action" onClick={() => toast.error('Something went wrong')}>
								Error
							</button>
						</div>
						<TToaster position="bottom-right" />
					</div>
				</DocPreview>
			);
		},
	}),
	'input-otp': defineComponent({
		name: 'DemoInputOtp',
		setup() {
			return () => (
				<DocPreview title="Input OTP" description="InputOTP collects a one-time code across slots.">
					<TInputOTP maxLength={6}>
						{{
							default: () => (
								<TInputOTPGroup>
									{{
										default: () => [
											<TInputOTPSlot index={0} />,
											<TInputOTPSlot index={1} />,
											<TInputOTPSlot index={2} />,
											<TInputOTPSlot index={3} />,
											<TInputOTPSlot index={4} />,
											<TInputOTPSlot index={5} />,
										],
									}}
								</TInputOTPGroup>
							),
						}}
					</TInputOTP>
				</DocPreview>
			);
		},
	}),
};
