import type { PackageRegistryItem } from '@tile-ui/buildx/registry/types';

interface SolidUiItemDefinition {
	name: string;
	title: string;
	description: string;
	registryDependencies: string[];
}

const solidUiItemDefinitions: SolidUiItemDefinition[] = [
	{
		name: 'button',
		title: 'Button',
		description: 'Multi-variant SolidJS button component for Tile UI.',
		registryDependencies: ['@tile-ui/core'],
	},
	{
		name: 'input',
		title: 'Input',
		description: 'Accessible SolidJS input component for Tile UI.',
		registryDependencies: ['@tile-ui/core', '@tile-ui/utils'],
	},
	{
		name: 'badge',
		title: 'Badge',
		description: 'Multi-variant SolidJS badge component for Tile UI.',
		registryDependencies: ['@tile-ui/core'],
	},
	{
		name: 'separator',
		title: 'Separator',
		description: 'Horizontal or vertical SolidJS divider component for Tile UI.',
		registryDependencies: ['@tile-ui/core'],
	},
	{
		name: 'toggle',
		title: 'Toggle',
		description: 'Controlled or uncontrolled SolidJS toggle component for Tile UI.',
		registryDependencies: ['@tile-ui/core', '@tile-ui/utils'],
	},
	{
		name: 'card',
		title: 'Card',
		description: 'Composable SolidJS card primitives for Tile UI.',
		registryDependencies: ['@tile-ui/core'],
	},
	{
		name: 'dialog',
		title: 'Dialog',
		description: 'Accessible SolidJS dialog primitives with focus management for Tile UI.',
		registryDependencies: ['@tile-ui/core', '@tile-ui/utils', '@tile-ui/button'],
	},
	{
		name: 'liveline',
		title: 'Liveline',
		description: 'Real-time SolidJS canvas chart with line, multi-series, candlestick, and market-data modes.',
		registryDependencies: ['@tile-ui/liveline-core'],
	},
	...[
		['alert', 'Alert', 'Accessible SolidJS alert primitives.'],
		['aspect-ratio', 'Aspect Ratio', 'SSR-safe SolidJS aspect-ratio container.'],
		['attachment', 'Attachment', 'Composable SolidJS attachment primitives and file card.'],
		['avatar', 'Avatar', 'SolidJS avatar image, fallback, badge, and group primitives.'],
		['breadcrumb', 'Breadcrumb', 'Accessible SolidJS breadcrumb navigation primitives.'],
		['bubble', 'Bubble', 'SolidJS chat bubble and reaction primitives.'],
		['empty', 'Empty', 'SolidJS empty-state composition primitives.'],
		['item', 'Item', 'SolidJS item layout primitives.'],
		['kbd', 'Kbd', 'SolidJS keyboard shortcut primitives.'],
		['label', 'Label', 'Native accessible SolidJS label.'],
		['marker', 'Marker', 'SolidJS marker and divider primitive.'],
		['skeleton', 'Skeleton', 'SolidJS loading placeholder.'],
		['spinner', 'Spinner', 'Accessible SolidJS loading spinner.'],
		['table', 'Table', 'Composable SolidJS table primitives.'],
	].map(([name, title, description]) => ({
		name,
		title,
		description,
		registryDependencies: name === 'attachment' ? ['@tile-ui/core', '@tile-ui/utils', '@tile-ui/button'] : ['@tile-ui/core'],
	})),
	...[
		['button-group', 'Button Group', 'Grouped SolidJS button controls and separators.', []],
		['checkbox', 'Checkbox', 'Accessible tri-state SolidJS checkbox with native form behavior.', ['@tile-ui/utils']],
		['field', 'Field', 'Accessible SolidJS field label, description, and message primitives.', ['@tile-ui/utils']],
		['form', 'Form', 'Reactive SolidJS form state and accessible field primitives.', ['@tile-ui/utils', '@tile-ui/label']],
		['input-group', 'Input Group', 'Composable SolidJS input addons, buttons, and controls.', ['@tile-ui/utils', '@tile-ui/button']],
		['input-otp', 'Input OTP', 'SolidJS one-time password slots with paste and form support.', ['@tile-ui/utils']],
		['native-select', 'Native Select', 'Styled native SolidJS select, option, and optgroup primitives.', ['@tile-ui/utils']],
		['progress', 'Progress', 'Accessible SolidJS determinate and indeterminate progress bar.', []],
		['radio-group', 'Radio Group', 'Accessible SolidJS radio group with native form and roving focus behavior.', ['@tile-ui/utils']],
		['slider', 'Slider', 'SolidJS slider primitives with pointer, keyboard, and native form behavior.', ['@tile-ui/utils']],
		['switch', 'Switch', 'Accessible SolidJS switch with controlled and native form behavior.', ['@tile-ui/utils']],
		['textarea', 'Textarea', 'Accessible SolidJS textarea with helper and validation messaging.', ['@tile-ui/utils']],
		['toggle-group', 'Toggle Group', 'Single or multiple SolidJS toggle group with roving focus.', ['@tile-ui/utils']],
	].map(([name, title, description, dependencies]) => ({
		name: name as string,
		title: title as string,
		description: description as string,
		registryDependencies: ['@tile-ui/core', ...(dependencies as string[])],
	})),
	...[
		['accordion', 'Accordion', 'Keyboard-navigable SolidJS accordion primitives.', ['@tile-ui/utils']],
		['calendar', 'Calendar', 'Deterministic SolidJS date selection grid.', ['@tile-ui/utils']],
		['collapsible', 'Collapsible', 'Accessible SolidJS disclosure primitives.', ['@tile-ui/utils']],
		['direction', 'Direction', 'Reactive SolidJS reading-direction provider.', []],
		['message', 'Message', 'Composable SolidJS message layout primitives.', []],
		['message-scroller', 'Message Scroller', 'Observed SolidJS message viewport with scroll controls.', ['@tile-ui/utils']],
		['pagination', 'Pagination', 'Semantic SolidJS pagination link primitives.', []],
		['scroll-area', 'Scroll Area', 'Native SolidJS scroll viewport with custom scrollbars.', ['@tile-ui/utils']],
		['tabs', 'Tabs', 'Keyboard-navigable SolidJS tab primitives.', ['@tile-ui/utils']],
	].map(([name, title, description, dependencies]) => ({
		name: name as string,
		title: title as string,
		description: description as string,
		registryDependencies: ['@tile-ui/core', ...(dependencies as string[])],
	})),
	...[
		['alert-dialog', 'Alert Dialog', 'Modal SolidJS confirmation primitives with focus containment.', ['@tile-ui/utils', '@tile-ui/button']],
		['combobox', 'Combobox', 'Searchable SolidJS single-select combobox with keyboard navigation.', ['@tile-ui/utils', '@tile-ui/select']],
		['command', 'Command', 'Composable SolidJS command palette with filtering and keyboard navigation.', ['@tile-ui/utils']],
		['context-menu', 'Context Menu', 'Keyboard-ready SolidJS context menu with nested and selectable items.', ['@tile-ui/dropdown-menu']],
		['drawer', 'Drawer', 'Directional SolidJS drawer with modal and non-modal behavior.', ['@tile-ui/utils']],
		['dropdown-menu', 'Dropdown Menu', 'SolidJS dropdown menu with checkbox, radio, and nested items.', ['@tile-ui/utils']],
		['hover-card', 'Hover Card', 'Pointer-intent SolidJS hover preview with crossing-safe delays.', ['@tile-ui/utils']],
		['menubar', 'Menubar', 'Desktop-style SolidJS menubar with keyboard menu switching.', ['@tile-ui/dropdown-menu']],
		['navigation-menu', 'Navigation Menu', 'SolidJS navigation menu with local and shared viewport modes.', ['@tile-ui/utils']],
		['popover', 'Popover', 'Anchored SolidJS popover with dismissable focus-aware content.', ['@tile-ui/utils']],
		['select', 'Select', 'Accessible SolidJS custom select with logical Tab handling.', ['@tile-ui/utils']],
		['sheet', 'Sheet', 'Edge-mounted SolidJS modal sheet with focus containment.', ['@tile-ui/utils']],
		['tooltip', 'Tooltip', 'Delayed SolidJS tooltip for pointer and keyboard focus.', ['@tile-ui/utils']],
	].map(([name, title, description, dependencies]) => ({
		name: name as string,
		title: title as string,
		description: description as string,
		registryDependencies: ['@tile-ui/core', ...(dependencies as string[])],
	})),
	...[
		['carousel', 'Carousel', 'Measured horizontal or vertical SolidJS carousel.', ['@tile-ui/button']],
		['chart', 'Chart', 'Responsive SVG SolidJS chart primitives.', []],
		['resizable', 'Resizable', 'Persistent pointer and keyboard resizable SolidJS panel groups.', []],
		[
			'sidebar',
			'Sidebar',
			'Responsive SolidJS application sidebar primitives.',
			['@tile-ui/button', '@tile-ui/input', '@tile-ui/separator', '@tile-ui/sheet', '@tile-ui/skeleton', '@tile-ui/tooltip', '@tile-ui/utils'],
		],
		['sonner', 'Sonner', 'External-store backed SolidJS toast notifications.', ['@tile-ui/utils']],
	].map(([name, title, description, dependencies]) => ({
		name: name as string,
		title: title as string,
		description: description as string,
		registryDependencies: ['@tile-ui/core', ...(dependencies as string[])],
	})),
];

export const solidUiItems: PackageRegistryItem[] = solidUiItemDefinitions.map((item) => ({
	...item,
	type: 'registry:ui',
	dependencies: ['solid-js'],
	devDependencies: ['sass'],
	registryDependencies: [...item.registryDependencies, '@tile-ui/styles'],
	files: [
		{
			source: `packages/solid/src/components/${item.name}/${item.name}.tsx`,
			type: 'registry:ui',
			transform: 'solid-component',
		},
		...(item.name === 'dropdown-menu'
			? [
					{
						source: 'packages/solid/src/components/dropdown-menu/menu-internals.tsx',
						type: 'registry:ui' as const,
						transform: 'solid-component' as const,
						target: 'components/ui/dropdown-menu/menu-internals.tsx',
					},
				]
			: []),
		...(item.name === 'select'
			? [
					{
						source: 'packages/solid/src/components/select/logical-tab.ts',
						type: 'registry:ui' as const,
						transform: 'solid-component' as const,
						target: 'components/ui/select/logical-tab.ts',
					},
				]
			: []),
		...(item.name === 'liveline'
			? [
					{
						source: 'packages/solid/src/components/liveline/liveline-transition.tsx',
						type: 'registry:ui' as const,
						transform: 'solid-component' as const,
						target: 'components/ui/liveline/liveline-transition.tsx',
					},
				]
			: []),
		{
			source: `packages/solid/src/components/${item.name}/index.ts`,
			type: 'registry:ui',
			transform: 'solid-barrel',
		},
		...(item.name === 'direction'
			? []
			: [
					{
						source: `packages/styles/scss/components/${item.name}.module.scss`,
						type: 'registry:file' as const,
						transform: 'style' as const,
						target: `components/ui/${item.name}/${item.name}.module.scss`,
					},
				]),
	],
}));
