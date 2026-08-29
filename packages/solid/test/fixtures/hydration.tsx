import { createSignal, onMount } from 'solid-js';
import {
	Alert,
	AlertTitle,
	AspectRatio,
	AttachmentCard,
	Avatar,
	AvatarFallback,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
	Checkbox,
	Field,
	FieldDescription,
	FieldLabel,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	NativeSelect,
	NativeSelectOption,
	RadioGroup,
	RadioGroupItem,
	Slider,
	SliderRange,
	SliderThumb,
	SliderTrack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Toggle,
	ToggleGroup,
	ToggleGroupItem,
	Textarea,
	useFieldContext,
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Calendar,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	DirectionProvider,
	Message,
	MessageContent,
	MessageGroup,
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	ScrollArea,
	ScrollBar,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@tile-ui/solid';

function FixtureFieldControl() {
	const field = useFieldContext();
	return <input data-id="field-control" id={field.id} aria-describedby={field.descriptionId} />;
}

export function HydrationFixture() {
	const [count, setCount] = createSignal(0);
	const [portalContainer, setPortalContainer] = createSignal<Node>();

	onMount(() => setPortalContainer(document.body));

	return (
		<main>
			<span data-id="server-identity">身份</span>
			<Alert data-id="server-alert">
				<AlertTitle>Solid SSR</AlertTitle>
			</Alert>
			<AspectRatio ratio={2} data-id="server-ratio">
				ratio
			</AspectRatio>
			<Avatar>
				<AvatarFallback>TU</AvatarFallback>
			</Avatar>
			<AttachmentCard name="fixture.pdf" size={1024} onPreview={() => setCount((value) => value + 10)} onDownload={() => setCount((value) => value + 1)} />
			<Table>
				<TableBody>
					<TableRow>
						<TableCell>21</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<Toggle onPressedChange={() => setCount((value) => value + 1)}>切换 {count()}</Toggle>
			<Dialog>
				<DialogTrigger>打开对话框</DialogTrigger>
				<DialogContent container={portalContainer()} showCloseButton={false}>
					<DialogTitle>水合对话框</DialogTitle>
				</DialogContent>
			</Dialog>
			<form data-id="input-form">
				<Input aria-label="名称" defaultValue="Tile" />
			</form>
			<form data-id="batch2-form">
				<Textarea data-id="artifact-textarea" defaultValue="server note" />
				<NativeSelect data-id="artifact-select" defaultValue="solid">
					<NativeSelectOption value="solid">Solid</NativeSelectOption>
					<NativeSelectOption value="react">React</NativeSelectOption>
				</NativeSelect>
				<Checkbox data-id="artifact-checkbox" name="check" defaultChecked />
				<Switch data-id="artifact-switch" name="switch" defaultChecked />
				<RadioGroup name="radio" defaultValue="one">
					<RadioGroupItem data-id="artifact-radio" value="one">
						One
					</RadioGroupItem>
					<RadioGroupItem value="two">Two</RadioGroupItem>
				</RadioGroup>
				<Slider name="level" defaultValue={40}>
					<SliderTrack>
						<SliderRange />
					</SliderTrack>
					<SliderThumb data-id="artifact-slider" />
				</Slider>
				<InputOTP name="code" defaultValue="12" maxLength={2} mode="numeric">
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
					</InputOTPGroup>
				</InputOTP>
			</form>
			<Field name="artifact-field">
				<FieldLabel>Artifact field</FieldLabel>
				<FixtureFieldControl />
				<FieldDescription>Stable description</FieldDescription>
			</Field>
			<Form defaultValues={{ email: 'ssr@example.com' }}>
				<FormField name="email" required>
					{({ field }) => (
						<FormItem descriptionId="artifact-form-description">
							<FormLabel>Form email</FormLabel>
							<FormControl>{(control) => <input {...control} data-id="artifact-form-control" value={String(field.value)} />}</FormControl>
							<FormDescription>Form description</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				</FormField>
			</Form>
			<ToggleGroup defaultValue="bold">
				<ToggleGroupItem data-id="artifact-toggle-group" value="bold">
					Bold
				</ToggleGroupItem>
				<ToggleGroupItem value="italic">Italic</ToggleGroupItem>
			</ToggleGroup>
			<Accordion defaultValue="one">
				<AccordionItem value="one" triggerId="artifact-accordion-trigger" contentId="artifact-accordion-content">
					<AccordionTrigger data-id="artifact-accordion-trigger">Artifact accordion</AccordionTrigger>
					<AccordionContent data-id="artifact-accordion-content">Accordion panel</AccordionContent>
				</AccordionItem>
				<AccordionItem value="two">
					<AccordionTrigger data-id="artifact-accordion-default-trigger">Default accordion</AccordionTrigger>
					<AccordionContent>Default panel</AccordionContent>
				</AccordionItem>
			</Accordion>
			<Collapsible triggerId="artifact-collapsible-trigger" contentId="artifact-collapsible-content">
				<CollapsibleTrigger data-id="artifact-collapsible-trigger">Artifact collapsible</CollapsibleTrigger>
				<CollapsibleContent data-id="artifact-collapsible-content">Collapsible panel</CollapsibleContent>
			</Collapsible>
			<Tabs defaultValue="package">
				<TabsList>
					<TabsTrigger data-id="artifact-tabs-trigger" value="package" id="artifact-tabs-trigger">
						Package
					</TabsTrigger>
					<TabsTrigger data-id="artifact-tabs-default-trigger" value="registry">
						Registry
					</TabsTrigger>
				</TabsList>
				<TabsContent data-id="artifact-tabs-content" value="package" id="artifact-tabs-content">
					Package panel
				</TabsContent>
				<TabsContent value="registry">Registry panel</TabsContent>
			</Tabs>
			<Calendar data-id="artifact-calendar" defaultMonth={new Date(2026, 7, 1)} today={new Date(2026, 7, 28)} />
			<DirectionProvider data-id="artifact-direction" dir="rtl">
				RTL artifact
			</DirectionProvider>
			<ScrollArea data-id="artifact-scroll-area">
				<div>Inert scroll content</div>
				<ScrollBar data-id="artifact-scrollbar" />
			</ScrollArea>
			<MessageScrollerProvider>
				<MessageScroller data-id="artifact-message-scroller">
					<MessageScrollerViewport>
						<MessageScrollerContent>
							<MessageScrollerItem>Inactive SSR message</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton data-id="artifact-message-scroller-button" />
				</MessageScroller>
			</MessageScrollerProvider>
			<Pagination data-id="artifact-pagination">
				<PaginationContent>
					<PaginationItem>
						<PaginationLink href="?page=1" isActive>
							1
						</PaginationLink>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
			<MessageGroup data-id="artifact-message">
				<Message align="end">
					<MessageContent>Static message</MessageContent>
				</Message>
			</MessageGroup>
		</main>
	);
}
