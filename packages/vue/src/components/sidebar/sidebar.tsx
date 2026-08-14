import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, provide, ref, type ComputedRef, type InjectionKey, type PropType } from 'vue';
import {
	createMediaQueryWatcher,
	getSidebarMenuButtonStyleKeys,
	getSidebarMenuSubButtonStyleKeys,
	getSidebarState,
	matchesSidebarToggleShortcut,
	SIDEBAR_MEDIA_QUERY,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_WIDTH_MOBILE,
	sidebarStyleKeys,
} from '@tile-ui/core';
import type { SidebarCollapsible, SidebarContextValue, SidebarMenuButtonSize, SidebarMenuButtonVariant, SidebarSide, SidebarSetOpen, SidebarVariant } from '@tile-ui/core';
import { TButton } from '../button';
import { TSeparator } from '../separator';
import { TSheet, TSheetContent, TSheetDescription, TSheetHeader, TSheetTitle } from '../sheet';
import { TSkeleton } from '../skeleton';
import { TTooltip, TTooltipContent, TTooltipTrigger } from '../tooltip';
import styles from '@tile-ui/styles/scss/components/sidebar.module.scss';

type SidebarContext = ComputedRef<SidebarContextValue>;

const SidebarContextKey: InjectionKey<SidebarContext> = Symbol('tile-sidebar');

function useSidebar(): SidebarContext {
	const context = inject(SidebarContextKey);
	if (!context) {
		throw new Error('侧边栏子组件必须在 <TSidebarProvider> 内使用');
	}
	return context;
}

function renderPanelLeftIcon() {
	return h(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			width: '24',
			height: '24',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }), h('path', { d: 'M9 3v18' })],
	);
}

export const TSidebarProvider = defineComponent({
	name: 'TSidebarProvider',
	props: {
		defaultOpen: { type: Boolean, default: true },
		open: Boolean,
	},
	emits: ['update:open'],
	setup(props, { emit, slots, attrs }) {
		const internalOpen = ref(props.defaultOpen);
		const isMobile = ref(false);
		const openMobile = ref(false);

		const open = computed(() => (props.open !== undefined ? props.open : internalOpen.value));

		const setOpen: SidebarSetOpen = (value) => {
			const next = typeof value === 'function' ? value(open.value) : value;
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		};

		function setOpenMobile(value: boolean) {
			openMobile.value = value;
		}

		function toggleSidebar() {
			if (isMobile.value) {
				openMobile.value = !openMobile.value;
			} else {
				setOpen(!open.value);
			}
		}

		onMounted(() => {
			createMediaQueryWatcher(SIDEBAR_MEDIA_QUERY, (matches) => {
				isMobile.value = matches;
			});
		});

		function handleKeyDown(event: KeyboardEvent) {
			if (matchesSidebarToggleShortcut({ key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey })) {
				event.preventDefault();
				toggleSidebar();
			}
		}

		onMounted(() => {
			window.addEventListener('keydown', handleKeyDown);
		});

		onBeforeUnmount(() => {
			window.removeEventListener('keydown', handleKeyDown);
		});

		const context = computed<SidebarContextValue>(() => ({
			state: getSidebarState(open.value),
			open: open.value,
			setOpen,
			isMobile: isMobile.value,
			openMobile: openMobile.value,
			setOpenMobile,
			toggleSidebar,
		}));

		provide(SidebarContextKey, context);

		return () =>
			h(
				'div',
				{
					...attrs,
					'data-slot': 'sidebar-wrapper',
					class: [styles[sidebarStyleKeys.wrapper], attrs.class],
					style: [{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON }, attrs.style],
				},
				slots.default?.(),
			);
	},
});

export const TSidebar = defineComponent({
	name: 'TSidebar',
	props: {
		side: { type: String as PropType<SidebarSide>, default: 'left' },
		variant: { type: String as PropType<SidebarVariant>, default: 'sidebar' },
		collapsible: { type: String as PropType<SidebarCollapsible>, default: 'offcanvas' },
	},
	setup(props, { slots, attrs }) {
		const context = useSidebar();

		return () => {
			const ctx = context.value;
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			if (props.collapsible === 'none') {
				return h('div', { ...restAttrs, 'data-slot': 'sidebar', 'data-side': props.side, class: [styles[sidebarStyleKeys.sidebar], userClass] }, slots.default?.());
			}

			if (ctx.isMobile) {
				return h(
					TSheet,
					{ open: ctx.openMobile, 'onUpdate:open': (value: boolean) => ctx.setOpenMobile(value) },
					{
						default: () =>
							h(
								TSheetContent,
								{
									...restAttrs,
									'data-slot': 'sidebar',
									'data-mobile': 'true',
									side: props.side,
									showCloseButton: false,
									class: [styles[sidebarStyleKeys.sheetContent], userClass],
									style: { '--sidebar-width': SIDEBAR_WIDTH_MOBILE },
								},
								{
									default: () => [
										h(
											TSheetHeader,
											{ class: styles[sidebarStyleKeys.srOnly] },
											{
												default: () => [
													h(TSheetTitle, null, { default: () => 'Sidebar' }),
													h(TSheetDescription, null, { default: () => 'Displays the mobile sidebar.' }),
												],
											},
										),
										h('div', { class: styles[sidebarStyleKeys.sidebar] }, slots.default?.()),
									],
								},
							),
					},
				);
			}

			return h(
				'div',
				{
					'data-slot': 'sidebar-container',
					'data-state': ctx.state,
					'data-collapsible': ctx.state === 'collapsed' ? props.collapsible : '',
					'data-variant': props.variant,
					'data-side': props.side,
					class: styles[sidebarStyleKeys.container],
				},
				[h('div', { ...restAttrs, 'data-slot': 'sidebar', class: [styles[sidebarStyleKeys.sidebar], userClass] }, slots.default?.())],
			);
		};
	},
});

export const TSidebarTrigger = defineComponent({
	name: 'TSidebarTrigger',
	setup(_props, { slots, attrs }) {
		const context = useSidebar();

		function handleClick() {
			context.value.toggleSidebar();
		}

		return () =>
			h(
				TButton,
				{
					...attrs,
					variant: 'ghost',
					size: 'icon',
					'data-slot': 'sidebar-trigger',
					class: [styles[sidebarStyleKeys.trigger], attrs.class],
					onClick: handleClick,
				},
				{ default: () => [slots.default?.() ?? renderPanelLeftIcon(), h('span', { class: styles[sidebarStyleKeys.srOnly] }, 'Toggle Sidebar')] },
			);
	},
});

export const TSidebarRail = defineComponent({
	name: 'TSidebarRail',
	setup(_props, { attrs }) {
		const context = useSidebar();

		return () =>
			h('button', {
				...attrs,
				'data-slot': 'sidebar-rail',
				'aria-label': 'Toggle Sidebar',
				tabindex: -1,
				title: 'Toggle Sidebar',
				class: attrs.class,
				onClick: () => context.value.toggleSidebar(),
			});
	},
});

export const TSidebarInset = defineComponent({
	name: 'TSidebarInset',
	setup(_props, { slots, attrs }) {
		return () => h('main', { ...attrs, 'data-slot': 'sidebar-inset', class: [styles[sidebarStyleKeys.inset], attrs.class] }, slots.default?.());
	},
});

export const TSidebarInput = defineComponent({
	name: 'TSidebarInput',
	props: {
		modelValue: String,
		type: { type: String, default: 'text' },
		placeholder: String,
	},
	emits: ['update:modelValue'],
	setup(props, { emit, attrs }) {
		return () =>
			h('input', {
				...attrs,
				'data-slot': 'sidebar-input',
				type: props.type,
				value: props.modelValue,
				placeholder: props.placeholder,
				class: [styles[sidebarStyleKeys.input], attrs.class],
				onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
			});
	},
});

export const TSidebarHeader = defineComponent({
	name: 'TSidebarHeader',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-header', class: [styles[sidebarStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TSidebarFooter = defineComponent({
	name: 'TSidebarFooter',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-footer', class: [styles[sidebarStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const TSidebarSeparator = defineComponent({
	name: 'TSidebarSeparator',
	setup(_props, { attrs }) {
		return () => h(TSeparator, { ...attrs, 'data-slot': 'sidebar-separator', class: [styles[sidebarStyleKeys.separator], attrs.class] });
	},
});

export const TSidebarContent = defineComponent({
	name: 'TSidebarContent',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-content', class: [styles[sidebarStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const TSidebarGroup = defineComponent({
	name: 'TSidebarGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-group', class: [styles[sidebarStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const TSidebarGroupLabel = defineComponent({
	name: 'TSidebarGroupLabel',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-group-label', class: [styles[sidebarStyleKeys.groupLabel], attrs.class] }, slots.default?.());
	},
});

export const TSidebarGroupAction = defineComponent({
	name: 'TSidebarGroupAction',
	setup(_props, { slots, attrs }) {
		return () => h('button', { ...attrs, 'data-slot': 'sidebar-group-action', class: [styles[sidebarStyleKeys.groupAction], attrs.class] }, slots.default?.());
	},
});

export const TSidebarGroupContent = defineComponent({
	name: 'TSidebarGroupContent',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-group-content', class: [styles[sidebarStyleKeys.groupContent], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenu = defineComponent({
	name: 'TSidebarMenu',
	setup(_props, { slots, attrs }) {
		return () => h('ul', { ...attrs, 'data-slot': 'sidebar-menu', class: [styles[sidebarStyleKeys.menu], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenuItem = defineComponent({
	name: 'TSidebarMenuItem',
	setup(_props, { slots, attrs }) {
		return () => h('li', { ...attrs, 'data-slot': 'sidebar-menu-item', class: [styles[sidebarStyleKeys.menuItem], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenuButton = defineComponent({
	name: 'TSidebarMenuButton',
	props: {
		isActive: { type: Boolean, default: false },
		tooltip: String,
		variant: { type: String as PropType<SidebarMenuButtonVariant>, default: 'default' },
		size: { type: String as PropType<SidebarMenuButtonSize>, default: 'default' },
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getSidebarMenuButtonStyleKeys(props.variant, props.size));

		return () => {
			const button = h(
				'button',
				{
					...attrs,
					'data-slot': 'sidebar-menu-button',
					'data-size': props.size,
					'data-active': props.isActive ? 'true' : 'false',
					class: [styles[styleKeys.value.base], styles[styleKeys.value.variant], styles[styleKeys.value.size], attrs.class],
				},
				slots.default?.(),
			);

			if (!props.tooltip) {
				return button;
			}

			return h(TTooltip, null, {
				default: () => [h(TTooltipTrigger, { asChild: true }, { default: () => button }), h(TTooltipContent, { side: 'right' }, { default: () => props.tooltip })],
			});
		};
	},
});

export const TSidebarMenuAction = defineComponent({
	name: 'TSidebarMenuAction',
	props: {
		showOnHover: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () =>
			h(
				'button',
				{
					...attrs,
					'data-slot': 'sidebar-menu-action',
					'data-show-on-hover': props.showOnHover ? 'true' : 'false',
					class: [styles[sidebarStyleKeys.menuAction], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const TSidebarMenuBadge = defineComponent({
	name: 'TSidebarMenuBadge',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-slot': 'sidebar-menu-badge', class: [styles[sidebarStyleKeys.menuBadge], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenuSkeleton = defineComponent({
	name: 'TSidebarMenuSkeleton',
	props: {
		showIcon: { type: Boolean, default: false },
	},
	setup(props, { attrs }) {
		const width = `${Math.floor(Math.random() * 40) + 50}%`;

		return () =>
			h('div', { ...attrs, 'data-slot': 'sidebar-menu-skeleton', class: [styles[sidebarStyleKeys.skeleton], attrs.class] }, [
				props.showIcon ? h(TSkeleton, { class: styles[sidebarStyleKeys.skeletonIcon] }) : null,
				h(TSkeleton, { class: styles[sidebarStyleKeys.skeletonText], style: { '--skeleton-width': width } }),
			]);
	},
});

export const TSidebarMenuSub = defineComponent({
	name: 'TSidebarMenuSub',
	setup(_props, { slots, attrs }) {
		return () => h('ul', { ...attrs, 'data-slot': 'sidebar-menu-sub', class: [styles[sidebarStyleKeys.menuSub], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenuSubItem = defineComponent({
	name: 'TSidebarMenuSubItem',
	setup(_props, { slots, attrs }) {
		return () => h('li', { ...attrs, 'data-slot': 'sidebar-menu-sub-item', class: [styles[sidebarStyleKeys.menuSubItem], attrs.class] }, slots.default?.());
	},
});

export const TSidebarMenuSubButton = defineComponent({
	name: 'TSidebarMenuSubButton',
	props: {
		size: { type: String as PropType<'sm' | 'md'>, default: 'md' },
		isActive: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const styleKeys = computed(() => getSidebarMenuSubButtonStyleKeys(props.size));

		return () =>
			h(
				'a',
				{
					...attrs,
					'data-slot': 'sidebar-menu-sub-button',
					'data-size': props.size,
					'data-active': props.isActive ? 'true' : 'false',
					class: [styles[styleKeys.value.base], styles[styleKeys.value.size], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export default TSidebar;
