import { createSignal, type JSX } from 'solid-js';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertTitle,
	AspectRatio,
	AttachmentCard,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	Bubble,
	BubbleContent,
	Button,
	ButtonGroup,
	Calendar,
	Card,
	CardContent,
	CardTitle,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
	DirectionProvider,
	Empty,
	EmptyTitle,
	Field,
	FieldDescription,
	FieldLabel,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	Item,
	ItemContent,
	ItemTitle,
	Kbd,
	Label,
	Marker,
	MarkerContent,
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
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	Progress,
	RadioGroup,
	RadioGroupItem,
	ScrollArea,
	ScrollBar,
	Separator,
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
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	Toggle,
	ToggleGroup,
	ToggleGroupItem,
} from '@tile-ui/solid';

const Slug = (props: { name: string; children: JSX.Element }) => <section data-slug={props.name}>{props.children}</section>;

export function CompleteFoundationFixture(props: { namespace: string }) {
	const [count, setCount] = createSignal(0);
	const formField = `${props.namespace}email`;
	return (
		<main data-stage5-root="foundation">
			<Slug name="button">
				<Button data-control="button" onClick={() => setCount((value) => value + 1)}>
					Button {count()}
				</Button>
			</Slug>
			<Slug name="input">
				<Input data-control="input" id={`${props.namespace}input`} defaultValue="Tile" aria-label="Name" />
			</Slug>
			<Slug name="badge">
				<Badge>Stable badge</Badge>
			</Slug>
			<Slug name="separator">
				<Separator />
			</Slug>
			<Slug name="toggle">
				<Toggle data-control="toggle">Toggle</Toggle>
			</Slug>
			<Slug name="card">
				<Card>
					<CardTitle>Card title</CardTitle>
					<CardContent>Card content</CardContent>
				</Card>
			</Slug>
			<Slug name="dialog">
				<Dialog>
					<DialogTrigger data-control="dialog-trigger">Open dialog</DialogTrigger>
					<DialogContent id={`${props.namespace}dialog`}>
						<DialogTitle>Dialog title</DialogTitle>
					</DialogContent>
				</Dialog>
			</Slug>
			<Slug name="alert">
				<Alert>
					<AlertTitle>Stable alert</AlertTitle>
				</Alert>
			</Slug>
			<Slug name="aspect-ratio">
				<AspectRatio ratio={2}>Ratio</AspectRatio>
			</Slug>
			<Slug name="attachment">
				<AttachmentCard name="stage5.pdf" size={1024} onDownload={() => setCount((value) => value + 1)} />
			</Slug>
			<Slug name="avatar">
				<Avatar>
					<AvatarImage data-control="avatar-image" src="/avatar.png" alt="Avatar" />
					<AvatarFallback>ST</AvatarFallback>
				</Avatar>
			</Slug>
			<Slug name="breadcrumb">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/stage5">Stage 5</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</Slug>
			<Slug name="bubble">
				<Bubble>
					<BubbleContent>Bubble</BubbleContent>
				</Bubble>
			</Slug>
			<Slug name="empty">
				<Empty>
					<EmptyTitle>Nothing here</EmptyTitle>
				</Empty>
			</Slug>
			<Slug name="item">
				<Item>
					<ItemContent>
						<ItemTitle>Item</ItemTitle>
					</ItemContent>
				</Item>
			</Slug>
			<Slug name="kbd">
				<Kbd>Ctrl</Kbd>
			</Slug>
			<Slug name="label">
				<Label for={`${props.namespace}input`}>Input label</Label>
			</Slug>
			<Slug name="marker">
				<Marker>
					<MarkerContent>Marker</MarkerContent>
				</Marker>
			</Slug>
			<Slug name="skeleton">
				<Skeleton aria-label="Loading" />
			</Slug>
			<Slug name="spinner">
				<Spinner aria-label="Loading" />
			</Slug>
			<Slug name="table">
				<Table>
					<TableBody>
						<TableRow>
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Slug>
			<Slug name="button-group">
				<ButtonGroup>
					<Button>One</Button>
					<Button>Two</Button>
				</ButtonGroup>
			</Slug>
			<Slug name="checkbox">
				<Checkbox data-control="checkbox" name="accepted" defaultChecked aria-label="Accepted" />
			</Slug>
			<Slug name="field">
				<Field name={`${props.namespace}field-email`}>
					<FieldLabel>Email</FieldLabel>
					<FieldDescription>Description</FieldDescription>
				</Field>
			</Slug>
			<Slug name="form">
				<Form defaultValues={{ [formField]: 'ssr@example.com' }}>
					<FormField name={formField}>
						{({ field }) => (
							<FormItem id={`${props.namespace}form-email`}>
								<FormLabel>Email</FormLabel>
								<FormControl>{(control) => <input {...control} data-control="form-input" value={String(field.value)} />}</FormControl>
							</FormItem>
						)}
					</FormField>
				</Form>
			</Slug>
			<Slug name="input-group">
				<InputGroup>
					<InputGroupAddon>@</InputGroupAddon>
					<InputGroupInput data-control="input-group" value="tile" />
				</InputGroup>
			</Slug>
			<Slug name="input-otp">
				<InputOTP data-control="otp" name="otp" defaultValue="12" maxLength={2}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
					</InputOTPGroup>
				</InputOTP>
			</Slug>
			<Slug name="native-select">
				<NativeSelect data-control="native-select" defaultValue="solid">
					<NativeSelectOption value="solid">Solid</NativeSelectOption>
					<NativeSelectOption value="vue">Vue</NativeSelectOption>
				</NativeSelect>
			</Slug>
			<Slug name="progress">
				<Progress value={61} />
			</Slug>
			<Slug name="radio-group">
				<RadioGroup defaultValue="one">
					<RadioGroupItem data-control="radio" value="one">
						One
					</RadioGroupItem>
					<RadioGroupItem value="two">Two</RadioGroupItem>
				</RadioGroup>
			</Slug>
			<Slug name="slider">
				<Slider defaultValue={40}>
					<SliderTrack>
						<SliderRange />
					</SliderTrack>
					<SliderThumb data-control="slider" />
				</Slider>
			</Slug>
			<Slug name="switch">
				<Switch data-control="switch" defaultChecked>
					Switch
				</Switch>
			</Slug>
			<Slug name="textarea">
				<Textarea data-control="textarea" defaultValue="Stable text" />
			</Slug>
			<Slug name="toggle-group">
				<ToggleGroup defaultValue="bold">
					<ToggleGroupItem data-control="toggle-group" value="bold">
						Bold
					</ToggleGroupItem>
					<ToggleGroupItem value="italic">Italic</ToggleGroupItem>
				</ToggleGroup>
			</Slug>
			<Slug name="accordion">
				<Accordion defaultValue="one">
					<AccordionItem value="one">
						<AccordionTrigger data-control="accordion-trigger">One</AccordionTrigger>
						<AccordionContent>Panel one</AccordionContent>
					</AccordionItem>
					<AccordionItem value="two">
						<AccordionTrigger data-control="accordion-two">Two</AccordionTrigger>
						<AccordionContent>Panel two</AccordionContent>
					</AccordionItem>
				</Accordion>
			</Slug>
			<Slug name="calendar">
				<Calendar data-control="calendar" defaultMonth={new Date(2026, 7, 1)} today={new Date(2026, 7, 29)} />
			</Slug>
			<Slug name="collapsible">
				<Collapsible>
					<CollapsibleTrigger data-control="collapsible">Details</CollapsibleTrigger>
					<CollapsibleContent>Content</CollapsibleContent>
				</Collapsible>
			</Slug>
			<Slug name="direction">
				<DirectionProvider dir="rtl">RTL</DirectionProvider>
			</Slug>
			<Slug name="message">
				<MessageGroup>
					<Message>
						<MessageContent>Message</MessageContent>
					</Message>
				</MessageGroup>
			</Slug>
			<Slug name="message-scroller">
				<MessageScrollerProvider>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent>
								<MessageScrollerItem>Message one</MessageScrollerItem>
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton />
					</MessageScroller>
				</MessageScrollerProvider>
			</Slug>
			<Slug name="pagination">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationLink href="?page=1" isActive>
								1
							</PaginationLink>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</Slug>
			<Slug name="scroll-area">
				<ScrollArea>
					<div>Scrollable</div>
					<ScrollBar />
				</ScrollArea>
			</Slug>
			<Slug name="tabs">
				<Tabs defaultValue="package">
					<TabsList>
						<TabsTrigger data-control="tabs-package" value="package">
							Package
						</TabsTrigger>
						<TabsTrigger data-control="tabs-registry" value="registry">
							Registry
						</TabsTrigger>
					</TabsList>
					<TabsContent value="package">Package panel</TabsContent>
					<TabsContent value="registry">Registry panel</TabsContent>
				</Tabs>
			</Slug>
		</main>
	);
}
