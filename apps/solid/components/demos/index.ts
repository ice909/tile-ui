import type { Component } from 'solid-js';

import BadgeDemo from './badge';
import ButtonDemo from './button';
import CardDemo from './card';
import DialogDemo from './dialog';
import InputDemo from './input';
import SeparatorDemo from './separator';
import ToggleDemo from './toggle';
import AlertDemo from './alert';
import AspectRatioDemo from './aspect-ratio';
import AttachmentDemo from './attachment';
import AvatarDemo from './avatar';
import BreadcrumbDemo from './breadcrumb';
import BubbleDemo from './bubble';
import EmptyDemo from './empty';
import ItemDemo from './item';
import KbdDemo from './kbd';
import LabelDemo from './label';
import MarkerDemo from './marker';
import SkeletonDemo from './skeleton';
import SpinnerDemo from './spinner';
import TableDemo from './table';
import ButtonGroupDemo from './button-group';
import CheckboxDemo from './checkbox';
import FieldDemo from './field';
import FormDemo from './form';
import InputGroupDemo from './input-group';
import InputOtpDemo from './input-otp';
import NativeSelectDemo from './native-select';
import ProgressDemo from './progress';
import RadioGroupDemo from './radio-group';
import SliderDemo from './slider';
import SwitchDemo from './switch';
import TextareaDemo from './textarea';
import ToggleGroupDemo from './toggle-group';
import AccordionDemo from './accordion';
import CalendarDemo from './calendar';
import CollapsibleDemo from './collapsible';
import DirectionDemo from './direction';
import MessageDemo from './message';
import MessageScrollerDemo from './message-scroller';
import PaginationDemo from './pagination';
import ScrollAreaDemo from './scroll-area';
import TabsDemo from './tabs';
import AlertDialogDemo from './alert-dialog';
import ComboboxDemo from './combobox';
import CommandDemo from './command';
import ContextMenuDemo from './context-menu';
import DrawerDemo from './drawer';
import DropdownMenuDemo from './dropdown-menu';
import HoverCardDemo from './hover-card';
import MenubarDemo from './menubar';
import NavigationMenuDemo from './navigation-menu';
import PopoverDemo from './popover';
import SelectDemo from './select';
import SheetDemo from './sheet';
import TooltipDemo from './tooltip';
import CarouselDemo from './carousel';
import ChartDemo from './chart';
import LivelineDemo from './liveline';
import Crypto from './liveline/crypto';
import Multi from './liveline/multi';
import Candle from './liveline/candle';
import Dashboard from './liveline/dashboard';
import Sizes from './liveline/sizes';
import { livelineScenarios } from '../../../common/lib/liveline-scenarios';
import type { PreviewVariant } from '../../../common/lib/preview-variants';
import ResizableDemo from './resizable';
import SidebarDemo from './sidebar';
import SonnerDemo from './sonner';

export type SolidDemo = {
	title: string;
	description: string;
	Component: Component;
	variants?: readonly PreviewVariant<Component>[];
};

export const solidDemoRegistry: Record<string, SolidDemo> = {
	button: { title: 'Button variants', description: 'Shared variants rendered through Solid-native props.', Component: ButtonDemo },
	input: { title: 'Accessible fields', description: 'Labels, helper text, and error wiring remain consistent through SSR.', Component: InputDemo },
	badge: { title: 'Badge variants', description: 'Compact labels communicate status without changing layout.', Component: BadgeDemo },
	separator: { title: 'Content separator', description: 'A shared divider connects server markup and hydrated content.', Component: SeparatorDemo },
	toggle: { title: 'Hydrated toggle', description: 'Controlled state demonstrates fine-grained Solid hydration.', Component: ToggleDemo },
	card: { title: 'Composed card', description: 'Card primitives frame a complete SolidStart workspace summary.', Component: CardDemo },
	dialog: { title: 'Accessible dialog', description: 'Portal, focus management, Escape handling, and focus restoration.', Component: DialogDemo },
	alert: { title: 'Alert variants', description: 'Semantic status messaging with shared visual variants.', Component: AlertDemo },
	'aspect-ratio': { title: 'Aspect ratio', description: 'Stable proportional layout across SSR and hydration.', Component: AspectRatioDemo },
	attachment: { title: 'Attachment primitives', description: 'File metadata and actions composed with native Solid children.', Component: AttachmentDemo },
	avatar: { title: 'Avatar image lifecycle', description: 'Cached load, broken-image fallback, and restored source transitions.', Component: AvatarDemo },
	breadcrumb: { title: 'Breadcrumb navigation', description: 'Native links and current-page semantics.', Component: BreadcrumbDemo },
	bubble: { title: 'Conversation bubbles', description: 'Aligned messages with reaction metadata.', Component: BubbleDemo },
	empty: { title: 'Empty state', description: 'Composable guidance for missing content.', Component: EmptyDemo },
	item: { title: 'Item layout', description: 'Media, content, and action regions in one row.', Component: ItemDemo },
	kbd: { title: 'Keyboard shortcut', description: 'Compact key and key-group primitives.', Component: KbdDemo },
	label: { title: 'Native label', description: 'Required-state styling with native for/id association.', Component: LabelDemo },
	marker: { title: 'Content markers', description: 'Inline and separator marker variants.', Component: MarkerDemo },
	skeleton: { title: 'Loading skeleton', description: 'Layout-preserving placeholders hidden from assistive technology.', Component: SkeletonDemo },
	spinner: { title: 'Loading spinner', description: 'Accessible status indicators at shared sizes.', Component: SpinnerDemo },
	table: { title: 'Data table', description: 'Native tabular semantics with a responsive container.', Component: TableDemo },
	'button-group': { title: 'Native action group', description: 'Submit and reset buttons remain one concise keyboard-ready control.', Component: ButtonGroupDemo },
	checkbox: { title: 'Checkbox validation', description: 'Controlled state, native required validation, submission, and reset.', Component: CheckboxDemo },
	field: { title: 'Connected field', description: 'Stable IDs connect label, description, message, and validation state.', Component: FieldDemo },
	form: { title: 'Validated form', description: 'Reactive field control demonstrates submit, error messaging, correction, and reset.', Component: FormDemo },
	'input-group': { title: 'Interactive input group', description: 'Addon focus behavior and an embedded action share one control surface.', Component: InputGroupDemo },
	'input-otp': { title: 'One-time code', description: 'Controlled slots support keyboard input, paste, composition, form state, and reset.', Component: InputOtpDemo },
	'native-select': { title: 'Native select reset', description: 'An SSR initial option changes natively and restores through form reset.', Component: NativeSelectDemo },
	progress: { title: 'Reactive progress', description: 'A live action advances accessible determinate progress.', Component: ProgressDemo },
	'radio-group': { title: 'Radio keyboard flow', description: 'Arrow-key selection, controlled state, native form values, and reset.', Component: RadioGroupDemo },
	slider: { title: 'Pointer and keyboard sliders', description: 'Horizontal and vertical sliders expose live values for pointer and key input.', Component: SliderDemo },
	switch: { title: 'Controlled switch', description: 'Keyboard activation, native form state, and reset stay synchronized.', Component: SwitchDemo },
	textarea: { title: 'SSR textarea value', description: 'The initial value survives hydration, editing, and native form reset.', Component: TextareaDemo },
	'toggle-group': { title: 'Multiple toggle group', description: 'Controlled selection and roving keyboard focus update live state.', Component: ToggleGroupDemo },
	accordion: { title: 'Keyboard accordion', description: 'Arrow keys skip disabled sections while stable IDs preserve disclosure relationships.', Component: AccordionDemo },
	calendar: {
		title: 'Deterministic range calendar',
		description: 'A fixed SSR month and today marker support range selection, visible range state, grid navigation, and month controls.',
		Component: CalendarDemo,
	},
	collapsible: { title: 'Collapsible details', description: 'Controlled disclosure state keeps trigger and region semantics synchronized.', Component: CollapsibleDemo },
	direction: { title: 'Reactive direction', description: 'The provider and useDirection hook update together when reading direction changes.', Component: DirectionDemo },
	message: { title: 'Message composition', description: 'Static message primitives preserve native content and alignment semantics.', Component: MessageDemo },
	'message-scroller': {
		title: 'Observed message scroller',
		description: 'Provider-owned controls expose start and end visibility through scrolling and remounts.',
		Component: MessageScrollerDemo,
	},
	pagination: {
		title: 'Semantic pagination',
		description: 'Native links, current-page state, labels, and decorative ellipsis compose into navigation.',
		Component: PaginationDemo,
	},
	'scroll-area': {
		title: 'Interactive scroll area',
		description: 'Native viewport scrolling activates keyboard and pointer-ready custom scrollbars.',
		Component: ScrollAreaDemo,
	},
	tabs: {
		title: 'Nested keyboard tabs',
		description: 'Nested tab lists reuse overlapping values while keeping keyboard focus and selected state independent.',
		Component: TabsDemo,
	},
	'alert-dialog': { title: 'Modal confirmation', description: 'Outside prevention, contained Tab order, decisions, and trigger restoration.', Component: AlertDialogDemo },
	combobox: { title: 'Searchable selection', description: 'Filtering, arrow navigation, selection, and logical Tab exit.', Component: ComboboxDemo },
	command: { title: 'Command filtering', description: 'Grouped filtering, looping keyboard movement, selection, and Tab exit.', Component: CommandDemo },
	'context-menu': { title: 'Keyboard context menu', description: 'Pointer and Shift+F10 opening with selectable and nested branches.', Component: ContextMenuDemo },
	drawer: { title: 'Modal or non-modal drawer', description: 'Directional overlay behavior with focus and outside-interaction policy.', Component: DrawerDemo },
	'dropdown-menu': { title: 'Nested selectable menu', description: 'Checkbox, radio, submenu, keyboard movement, and selection state.', Component: DropdownMenuDemo },
	'hover-card': { title: 'Crossing-safe hover card', description: 'Open and close delays preserve pointer travel between trigger and content.', Component: HoverCardDemo },
	menubar: { title: 'Desktop menubar', description: 'Arrow-key switching across open menus with checkbox, radio, and submenu items.', Component: MenubarDemo },
	'navigation-menu': {
		title: 'Two viewport modes',
		description: 'Shared viewport and local-content navigation menus remain independently keyboardable.',
		Component: NavigationMenuDemo,
	},
	popover: { title: 'Focusable popover', description: 'Tab order, outside dismissal, controlled state, and trigger restoration.', Component: PopoverDemo },
	select: { title: 'Escaped selected label', description: 'Grouped options, keyboard selection, escaped labels, and logical Tab movement.', Component: SelectDemo },
	sheet: { title: 'Focused edge sheet', description: 'Modal focus containment, outside blocking, close control, and restoration.', Component: SheetDemo },
	tooltip: {
		title: 'Delayed pointer and focus tooltips',
		description: 'Provider timing, instant focus behavior, and pointer delay are directly testable.',
		Component: TooltipDemo,
	},
	carousel: {
		title: 'Measured vertical carousel',
		description: 'Switch orientation, use the labeled viewport controls, and navigate with matching arrow keys.',
		Component: CarouselDemo,
	},
	chart: {
		title: 'Mixed accessible charts',
		description: 'Bar, area, and line series share deterministic names, responsive SVG output, and keyboard inspection.',
		Component: ChartDemo,
	},
	liveline: {
		title: 'Live market chart',
		description: 'Switch modes, ranges, series, pause, loading, empty data, and deterministic ticks.',
		Component: LivelineDemo,
		variants: livelineScenarios.map((scenario, index) => ({ ...scenario, Component: [LivelineDemo, Crypto, Multi, Candle, Dashboard, Sizes][index] })),
	},
	resizable: {
		title: 'Pointer and keyboard panels',
		description: 'Horizontal and vertical separators expose live values and persistent panel sizing.',
		Component: ResizableDemo,
	},
	sidebar: {
		title: 'Responsive application sidebar',
		description: 'One provider drives the collapsible desktop rail and focused mobile sheet layout.',
		Component: SidebarDemo,
	},
	sonner: {
		title: 'Toast variants and dismissal',
		description: 'Default, success, error, and loading notifications share one imperative store and dismiss API.',
		Component: SonnerDemo,
	},
};
