'use client';

import type { ReactNode } from 'react';
import BadgeDemo from './badge';
import SkeletonDemo from './skeleton';
import KbdDemo from './kbd';
import SeparatorDemo from './separator';
import TableDemo from './table';
import ProgressDemo from './progress';
import AvatarDemo from './avatar';
import SwitchDemo from './switch';
import CheckboxDemo from './checkbox';
import CollapsibleDemo from './collapsible';
import BreadcrumbDemo from './breadcrumb';
import PaginationDemo from './pagination';
import AlertDemo from './alert';
import AspectRatioDemo from './aspect-ratio';
import SpinnerDemo from './spinner';
import EmptyDemo from './empty';
import MarkerDemo from './marker';
import ItemDemo from './item';
import ButtonGroupDemo from './button-group';
import InputGroupDemo from './input-group';
import NativeSelectDemo from './native-select';
import FieldDemo from './field';
import ToggleDemo from './toggle';
import ToggleGroupDemo from './toggle-group';
import TabsDemo from './tabs';
import AccordionDemo from './accordion';
import RadioGroupDemo from './radio-group';
import SliderDemo from './slider';
import ScrollAreaDemo from './scroll-area';
import TooltipDemo from './tooltip';
import PopoverDemo from './popover';
import HoverCardDemo from './hover-card';
import DialogDemo from './dialog';
import AlertDialogDemo from './alert-dialog';
import SheetDemo from './sheet';
import DropdownMenuDemo from './dropdown-menu';
import ContextMenuDemo from './context-menu';
import MenubarDemo from './menubar';
import NavigationMenuDemo from './navigation-menu';
import SelectDemo from './select';
import ComboboxDemo from './combobox';
import CommandDemo from './command';
import ChartDemo from './chart';
import LivelineDemo from './liveline';
import Crypto from './liveline/crypto';
import Multi from './liveline/multi';
import Candle from './liveline/candle';
import Dashboard from './liveline/dashboard';
import Sizes from './liveline/sizes';
import { livelineScenarios } from '../../../common/lib/liveline-scenarios';
import type { PreviewVariant } from '../../../common/lib/preview-variants';
import CalendarDemo from './calendar';
import DrawerDemo from './drawer';
import FormDemo from './form';
import SidebarDemo from './sidebar';
import CarouselDemo from './carousel';
import ResizableDemo from './resizable';
import AttachmentDemo from './attachment';
import BubbleDemo from './bubble';
import DirectionDemo from './direction';
import MessageDemo from './message';
import MessageScrollerDemo from './message-scroller';
import SonnerDemo from './sonner';
import InputOtpDemo from './input-otp';
import ButtonDemo from './button';
import CardDemo from './card';
import InputDemo from './input';
import TextareaDemo from './textarea';
import LabelDemo from './label';
import UseCopyToClipboardDemo from './use-copy-to-clipboard';
import UseMediaQueryDemo from './use-media-query';
import UseLocalStorageDemo from './use-local-storage';
import ContactFormDemo from './contact-form';
import NewsletterCardDemo from './newsletter-card';
import ProfileSettingsDemo from './profile-settings';

export type Demo = {
	title: string;
	description: string;
	Component: () => ReactNode;
	variants?: readonly PreviewVariant<() => ReactNode>[];
};

export const demoRegistry: Record<string, Demo> = {
	badge: {
		title: 'Badge variants',
		description: 'Badges surface status and short labels with six visual variants.',
		Component: BadgeDemo,
	},
	skeleton: {
		title: 'Skeleton placeholders',
		description: 'Skeletons reserve space while content loads.',
		Component: SkeletonDemo,
	},
	kbd: {
		title: 'Keyboard keys',
		description: 'Kbd renders keys and key combinations.',
		Component: KbdDemo,
	},
	separator: {
		title: 'Separators',
		description: 'Separators divide content horizontally or vertically.',
		Component: SeparatorDemo,
	},
	table: {
		title: 'Table',
		description: 'Tables lay out tabular data with header, body, and caption.',
		Component: TableDemo,
	},
	progress: {
		title: 'Progress bars',
		description: 'Progress shows completion against a range.',
		Component: ProgressDemo,
	},
	avatar: {
		title: 'Avatars',
		description: 'Avatars show images with a text fallback and group stacking.',
		Component: AvatarDemo,
	},
	switch: {
		title: 'Switches',
		description: 'Switches toggle a boolean setting.',
		Component: SwitchDemo,
	},
	checkbox: {
		title: 'Checkboxes',
		description: 'Checkboxes support checked and indeterminate states.',
		Component: CheckboxDemo,
	},
	collapsible: {
		title: 'Collapsible',
		description: 'Collapsible toggles extra content without a dialog.',
		Component: CollapsibleDemo,
	},
	breadcrumb: {
		title: 'Breadcrumb',
		description: 'Breadcrumbs show the current location in a hierarchy.',
		Component: BreadcrumbDemo,
	},
	pagination: {
		title: 'Pagination',
		description: 'Pagination pages through long lists.',
		Component: PaginationDemo,
	},
	alert: {
		title: 'Alerts',
		description: 'Alerts surface important feedback with variants.',
		Component: AlertDemo,
	},
	'aspect-ratio': {
		title: 'Aspect ratio',
		description: 'AspectRatio keeps content at a fixed width-to-height ratio.',
		Component: AspectRatioDemo,
	},
	spinner: {
		title: 'Spinners',
		description: 'Spinners indicate in-progress work.',
		Component: SpinnerDemo,
	},
	empty: {
		title: 'Empty state',
		description: 'Empty guides users when there is nothing to display.',
		Component: EmptyDemo,
	},
	marker: {
		title: 'Markers',
		description: 'Markers annotate content with visual variants.',
		Component: MarkerDemo,
	},
	item: {
		title: 'List items',
		description: 'Items build consistent rows with media, content, and actions.',
		Component: ItemDemo,
	},
	'button-group': {
		title: 'Button group',
		description: 'ButtonGroup attaches related buttons into a single control.',
		Component: ButtonGroupDemo,
	},
	'input-group': {
		title: 'Input group',
		description: 'InputGroup attaches addons and buttons to an input.',
		Component: InputGroupDemo,
	},
	'native-select': {
		title: 'Native select',
		description: 'NativeSelect is a styled native dropdown.',
		Component: NativeSelectDemo,
	},
	field: {
		title: 'Field',
		description: 'Field composes label, description, and message.',
		Component: FieldDemo,
	},
	toggle: {
		title: 'Toggles',
		description: 'Toggle expresses a binary selection as a button.',
		Component: ToggleDemo,
	},
	'toggle-group': {
		title: 'Toggle group',
		description: 'ToggleGroup groups single- or multi-select toggles.',
		Component: ToggleGroupDemo,
	},
	tabs: {
		title: 'Tabs',
		description: 'Tabs switch between panes of content.',
		Component: TabsDemo,
	},
	accordion: {
		title: 'Accordion',
		description: 'Accordion presents collapsible sections.',
		Component: AccordionDemo,
	},
	'radio-group': {
		title: 'Radio group',
		description: 'RadioGroup selects one of several options.',
		Component: RadioGroupDemo,
	},
	slider: {
		title: 'Slider',
		description: 'Slider picks a value from a range.',
		Component: SliderDemo,
	},
	'scroll-area': {
		title: 'Scroll area',
		description: 'ScrollArea provides a styled scroll container.',
		Component: ScrollAreaDemo,
	},
	tooltip: {
		title: 'Tooltip',
		description: 'Tooltip shows contextual help on hover or focus.',
		Component: TooltipDemo,
	},
	popover: {
		title: 'Popover',
		description: 'Popover shows richer content anchored to a trigger.',
		Component: PopoverDemo,
	},
	'hover-card': {
		title: 'Hover card',
		description: 'HoverCard shows a preview when hovering a trigger.',
		Component: HoverCardDemo,
	},
	dialog: {
		title: 'Dialog',
		description: 'Dialog requires a decision before continuing.',
		Component: DialogDemo,
	},
	'alert-dialog': {
		title: 'Alert dialog',
		description: 'AlertDialog interrupts for confirmation.',
		Component: AlertDialogDemo,
	},
	sheet: {
		title: 'Sheet',
		description: 'Sheet slides a panel from the edge.',
		Component: SheetDemo,
	},
	'dropdown-menu': {
		title: 'Dropdown menu',
		description: 'DropdownMenu offers a list of actions.',
		Component: DropdownMenuDemo,
	},
	'context-menu': {
		title: 'Context menu',
		description: 'ContextMenu shows actions on right-click.',
		Component: ContextMenuDemo,
	},
	menubar: {
		title: 'Menubar',
		description: 'Menubar provides a desktop-style application menu.',
		Component: MenubarDemo,
	},
	'navigation-menu': {
		title: 'Navigation menu',
		description: 'NavigationMenu provides primary navigation.',
		Component: NavigationMenuDemo,
	},
	select: {
		title: 'Select',
		description: 'Select picks one value from a styled dropdown.',
		Component: SelectDemo,
	},
	combobox: {
		title: 'Combobox',
		description: 'Combobox selects from a searchable list.',
		Component: ComboboxDemo,
	},
	command: {
		title: 'Command',
		description: 'Command builds searchable command menus.',
		Component: CommandDemo,
	},
	chart: {
		title: 'Chart',
		description: 'ChartContainer renders line, bar, and area charts with keyboard inspection.',
		Component: ChartDemo,
	},
	liveline: {
		title: 'Live market chart',
		description: 'Switch modes, ranges, series, pause, loading, empty data, and deterministic ticks.',
		Component: LivelineDemo,
		variants: livelineScenarios.map((scenario, index) => ({ ...scenario, Component: [LivelineDemo, Crypto, Multi, Candle, Dashboard, Sizes][index] })),
	},
	calendar: {
		title: 'Calendar',
		description: 'Calendar picks dates in single, multiple, or range modes.',
		Component: CalendarDemo,
	},
	drawer: {
		title: 'Drawer',
		description: 'Drawer slides a panel in from any direction.',
		Component: DrawerDemo,
	},
	form: {
		title: 'Form',
		description: 'Form manages validation, values, and submission.',
		Component: FormDemo,
	},
	sidebar: {
		title: 'Sidebar',
		description: 'Sidebar adds a collapsible application sidebar.',
		Component: SidebarDemo,
	},
	carousel: {
		title: 'Carousel',
		description: 'Carousel cycles through a set of items.',
		Component: CarouselDemo,
	},
	resizable: {
		title: 'Resizable',
		description: 'ResizablePanelGroup creates adjustable split layouts.',
		Component: ResizableDemo,
	},
	attachment: {
		title: 'Attachment',
		description: 'Attachment displays files with state and actions.',
		Component: AttachmentDemo,
	},
	bubble: {
		title: 'Bubble',
		description: 'Bubble builds chat message bubbles.',
		Component: BubbleDemo,
	},
	direction: {
		title: 'Direction',
		description: 'DirectionProvider sets the reading direction.',
		Component: DirectionDemo,
	},
	message: {
		title: 'Message',
		description: 'Message composes chat messages with avatar and content.',
		Component: MessageDemo,
	},
	'message-scroller': {
		title: 'Message scroller',
		description: 'MessageScroller scrolls a message list with anchoring.',
		Component: MessageScrollerDemo,
	},
	sonner: {
		title: 'Toasts',
		description: 'Toaster and toast show transient notifications.',
		Component: SonnerDemo,
	},
	'input-otp': {
		title: 'Input OTP',
		description: 'InputOTP collects a one-time code across slots.',
		Component: InputOtpDemo,
	},
	button: {
		title: 'Button variants',
		description: 'The primary button styles cover high-emphasis actions, secondary actions, and quiet inline controls.',
		Component: ButtonDemo,
	},
	card: {
		title: 'Card composition',
		description: 'Card primitives give you a stable surface for headers, content blocks, supporting copy, and action rows.',
		Component: CardDemo,
	},
	input: {
		title: 'Input states',
		description: 'Inputs keep label, helper text, and validation messaging aligned without extra form wrappers.',
		Component: InputDemo,
	},
	textarea: {
		title: 'Textarea states',
		description: 'Textarea follows the same field structure as Input so forms stay visually and behaviorally consistent.',
		Component: TextareaDemo,
	},
	label: {
		title: 'Label usage',
		description: 'Label works as a standalone form primitive and pairs with custom field structures when you do not need the higher-level field components.',
		Component: LabelDemo,
	},
	'use-copy-to-clipboard': {
		title: 'Clipboard interaction',
		description: 'Copies the registry URL while the hook manages the transient "copied" feedback state.',
		Component: UseCopyToClipboardDemo,
	},
	'use-media-query': {
		title: 'Responsive branching',
		description: 'A media-query helper drives whether you render a compact mobile variant or a denser desktop layout.',
		Component: UseMediaQueryDemo,
	},
	'use-local-storage': {
		title: 'Persisted preference example',
		description: 'A local-storage helper often powers simple user preferences like theme, density, or navigation state.',
		Component: UseLocalStorageDemo,
	},
	'contact-form': {
		title: 'Contact form composition',
		description: 'This example combines the registry primitives into a compact, realistic support form surface.',
		Component: ContactFormDemo,
	},
	'newsletter-card': {
		title: 'Newsletter signup',
		description: 'A lightweight marketing capture flow built from the same field and action primitives used elsewhere in the system.',
		Component: NewsletterCardDemo,
	},
	'profile-settings': {
		title: 'Profile settings',
		description: 'A denser account-management surface that still uses the same field, label, and action primitives.',
		Component: ProfileSettingsDemo,
	},
};
