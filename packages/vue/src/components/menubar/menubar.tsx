import {
	computed,
	defineComponent,
	h,
	inject,
	onBeforeUnmount,
	onMounted,
	provide,
	ref,
	useId,
	watch,
	Teleport,
	type ComputedRef,
	type InjectionKey,
	type PropType,
	type Ref,
} from 'vue';
import { getMenubarCheckState, getMenubarPosition, getMenubarState, menubarStyleKeys } from '@tile-ui/core';
import type { MenubarAlign, MenubarSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/menubar.module.scss';

interface MenubarContextValue {
	activeValue: string | undefined;
	setActiveValue: (value: string | undefined) => void;
}

type MenubarContext = ComputedRef<MenubarContextValue>;

const MenubarContextKey: InjectionKey<MenubarContext> = Symbol('tile-menubar');

interface MenubarMenuContextValue {
	value: string;
	open: boolean;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

type MenubarMenuContext = ComputedRef<MenubarMenuContextValue>;

const MenubarMenuContextKey: InjectionKey<MenubarMenuContext> = Symbol('tile-menubar-menu');

interface MenubarContentContextValue {
	itemsRef: Ref<HTMLElement[]>;
	close: () => void;
}

type MenubarContentContext = ComputedRef<MenubarContentContextValue>;

const MenubarContentContextKey: InjectionKey<MenubarContentContext> = Symbol('tile-menubar-content');

interface MenubarSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: Ref<HTMLElement | null>;
}

type MenubarSubContext = ComputedRef<MenubarSubContextValue>;

const MenubarSubContextKey: InjectionKey<MenubarSubContext> = Symbol('tile-menubar-sub');

interface MenubarRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

type MenubarRadioGroupContext = ComputedRef<MenubarRadioGroupContextValue>;

const MenubarRadioGroupContextKey: InjectionKey<MenubarRadioGroupContext> = Symbol('tile-menubar-radio-group');

function menubarCheckIcon() {
	return h(
		'svg',
		{
			class: styles[menubarStyleKeys.checkIcon],
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('path', { d: 'M20 6 9 17l-5-5' })],
	);
}

function menubarRadioIcon() {
	return h(
		'svg',
		{
			class: styles[menubarStyleKeys.radioIcon],
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'currentColor',
			'aria-hidden': 'true',
		},
		[h('circle', { cx: '12', cy: '12', r: '6' })],
	);
}

function menubarChevronIcon() {
	return h(
		'svg',
		{
			class: styles[menubarStyleKeys.chevron],
			xmlns: 'http://www.w3.org/2000/svg',
			width: '16',
			height: '16',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('path', { d: 'm9 18 6-6-6-6' })],
	);
}

function useMenubarContext(): MenubarContext {
	const context = inject(MenubarContextKey);
	if (!context) {
		throw new Error('TMenubar 子组件必须位于 <TMenubar> 内部。');
	}
	return context;
}

function useMenubarMenuContext(): MenubarMenuContext {
	const context = inject(MenubarMenuContextKey);
	if (!context) {
		throw new Error('TMenubar 菜单子组件必须位于 <TMenubarMenu> 内部。');
	}
	return context;
}

function useMenubarContentContext(): MenubarContentContext {
	const context = inject(MenubarContentContextKey);
	if (!context) {
		throw new Error('TMenubar 菜单项必须位于 <TMenubarContent> 或 <TMenubarSubContent> 内部。');
	}
	return context;
}

function useMenubarSubContext(): MenubarSubContext {
	const context = inject(MenubarSubContextKey);
	if (!context) {
		throw new Error('TMenubar 子菜单组件必须位于 <TMenubarSub> 内部。');
	}
	return context;
}

function useMenubarRadioGroupContext(): MenubarRadioGroupContext {
	const context = inject(MenubarRadioGroupContextKey);
	if (!context) {
		throw new Error('TMenubarRadioItem 必须位于 <TMenubarRadioGroup> 内部。');
	}
	return context;
}

export const TMenubar = defineComponent({
	name: 'TMenubar',
	props: {
		value: { type: String, default: undefined },
		defaultValue: { type: String, default: undefined },
	},
	emits: ['update:value'],
	setup(props, { emit, slots, attrs }) {
		const internalValue = ref(props.defaultValue);
		const activeValue = computed(() => (props.value !== undefined ? props.value : internalValue.value));

		function setActiveValue(next: string | undefined) {
			if (props.value === undefined) {
				internalValue.value = next;
			}
			emit('update:value', next);
		}

		const context = computed<MenubarContextValue>(() => ({ activeValue: activeValue.value, setActiveValue }));

		provide(MenubarContextKey, context);

		return () => h('div', { ...attrs, class: [styles[menubarStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const TMenubarPortal = defineComponent({
	name: 'TMenubarPortal',
	setup(_props, { slots }) {
		return () => slots.default?.();
	},
});

export const TMenubarMenu = defineComponent({
	name: 'TMenubarMenu',
	props: {
		value: { type: String, required: true },
	},
	setup(props, { slots }) {
		const context = useMenubarContext();
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-menubar-${useId()}`;
		const open = computed(() => context.value.activeValue === props.value);

		function setOpen(next: boolean) {
			context.value.setActiveValue(next ? props.value : undefined);
		}

		const menuContext = computed<MenubarMenuContextValue>(() => ({
			value: props.value,
			open: open.value,
			triggerRef,
			contentId,
			setOpen,
		}));

		provide(MenubarMenuContextKey, menuContext);

		return () => h('div', { class: styles[menubarStyleKeys.menu] }, slots.default?.());
	},
});

export const TMenubarTrigger = defineComponent({
	name: 'TMenubarTrigger',
	inheritAttrs: false,
	props: {
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useMenubarMenuContext();

		function handleClick() {
			if (props.disabled) {
				return;
			}
			context.value.setOpen(!context.value.open);
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || props.disabled) {
				return;
			}
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				context.value.setOpen(true);
			}
		}

		return () =>
			h(
				'button',
				{
					...attrs,
					ref: context.value.triggerRef,
					type: 'button',
					'aria-haspopup': 'menu',
					'aria-expanded': context.value.open,
					'aria-controls': context.value.contentId,
					'data-state': getMenubarState(context.value.open),
					'data-disabled': props.disabled,
					class: [styles[menubarStyleKeys.trigger], attrs.class],
					onClick: handleClick,
					onKeydown: handleKeyDown,
				},
				slots.default?.(),
			);
	},
});

function createMenubarContentBase({ isSub = false }: { isSub?: boolean } = {}) {
	interface ContentContext {
		open: boolean;
		setOpen: (open: boolean) => void;
		triggerRef: Ref<HTMLElement | null>;
		contentId?: string;
	}

	return defineComponent({
		name: isSub ? 'TMenubarSubContent' : 'TMenubarContent',
		inheritAttrs: false,
		props: {
			side: { type: String as PropType<MenubarSide>, default: 'bottom' },
			align: { type: String as PropType<MenubarAlign>, default: 'start' },
			sideOffset: { type: Number, default: 8 },
			alignOffset: { type: Number, default: -4 },
		},
		setup(props, { slots, attrs }) {
			const context = (isSub ? useMenubarSubContext() : useMenubarMenuContext()) as ComputedRef<ContentContext>;
			const contentRef = ref<HTMLElement | null>(null);
			const itemsRef = ref<HTMLElement[]>([]);
			const position = ref<{ top: number; left: number } | null>(null);

			const contentContext = computed<MenubarContentContextValue>(() => ({
				itemsRef,
				close: () => context.value.setOpen(false),
			}));

			provide(MenubarContentContextKey, contentContext);

			let disposeDocListeners: (() => void) | null = null;

			function updatePosition() {
				const trigger = context.value.triggerRef.value;
				const content = contentRef.value;
				if (!trigger || !content) {
					return;
				}
				const triggerRect = trigger.getBoundingClientRect();
				const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
				const viewport = { width: window.innerWidth, height: window.innerHeight };
				position.value = getMenubarPosition({
					triggerRect,
					contentSize,
					side: props.side,
					align: props.align,
					sideOffset: props.sideOffset,
					alignOffset: props.alignOffset,
					viewport,
				});
			}

			function highlightFirst() {
				const items = itemsRef.value;
				if (items.length === 0) {
					return;
				}
				items.forEach((item) => item.removeAttribute('data-highlighted'));
				items[0].setAttribute('data-highlighted', 'true');
			}

			function handleOpen() {
				updatePosition();
				highlightFirst();
				window.addEventListener('resize', updatePosition);
				document.addEventListener('scroll', updatePosition, true);

				function handlePointerDown(event: PointerEvent) {
					const target = event.target as Node | null;
					const content = contentRef.value;
					const trigger = context.value.triggerRef.value;
					if (!target) {
						return;
					}
					if (content && content.contains(target)) {
						return;
					}
					if (trigger && trigger.contains(target)) {
						return;
					}
					context.value.setOpen(false);
				}

				document.addEventListener('pointerdown', handlePointerDown);
				disposeDocListeners = () => document.removeEventListener('pointerdown', handlePointerDown);
			}

			function handleClose() {
				window.removeEventListener('resize', updatePosition);
				document.removeEventListener('scroll', updatePosition, true);
				disposeDocListeners?.();
				disposeDocListeners = null;
			}

			onMounted(() => {
				if (context.value.open) {
					handleOpen();
				}
			});

			watch(
				() => context.value.open,
				(open) => {
					if (open) {
						handleOpen();
					} else {
						handleClose();
					}
				},
			);

			watch(
				() => [props.side, props.align, props.sideOffset, props.alignOffset],
				() => {
					if (context.value.open) {
						updatePosition();
					}
				},
			);

			onBeforeUnmount(handleClose);

			function handleKeyDown(event: KeyboardEvent) {
				const items = itemsRef.value.filter((item) => item.getAttribute('data-disabled') !== 'true');

				if (event.key === 'Escape' || (isSub && event.key === 'ArrowLeft')) {
					event.preventDefault();
					context.value.setOpen(false);
					context.value.triggerRef.value?.focus();
					return;
				}

				if (items.length === 0) {
					return;
				}

				const currentIndex = items.findIndex((item) => item.getAttribute('data-highlighted') === 'true');

				const highlight = (next: number) => {
					items.forEach((item) => item.removeAttribute('data-highlighted'));
					items[next].setAttribute('data-highlighted', 'true');
					items[next].focus();
				};

				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						highlight(currentIndex < 0 ? 0 : (currentIndex + 1) % items.length);
						break;
					case 'ArrowUp':
						event.preventDefault();
						highlight(currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
						break;
					case 'Home':
						event.preventDefault();
						highlight(0);
						break;
					case 'End':
						event.preventDefault();
						highlight(items.length - 1);
						break;
					case 'Enter':
					case ' ':
						event.preventDefault();
						(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
						break;
				}
			}

			return () => {
				const open = context.value.open;
				const userClass = attrs.class;
				const userStyle = attrs.style;
				const restAttrs = { ...attrs };
				delete restAttrs.class;
				delete restAttrs.style;

				return h(Teleport, { to: 'body' }, [
					h(
						'div',
						{
							...restAttrs,
							ref: contentRef,
							id: isSub ? undefined : context.value.contentId,
							role: 'menu',
							tabindex: -1,
							'data-state': getMenubarState(open),
							'data-side': props.side,
							'data-align': props.align,
							class: [styles[isSub ? menubarStyleKeys.subContent : menubarStyleKeys.content], userClass],
							style: position.value ? [userStyle, { top: `${position.value.top}px`, left: `${position.value.left}px` }] : userStyle,
							onKeydown: handleKeyDown,
						},
						slots.default?.(),
					),
				]);
			};
		},
	});
}

export const TMenubarContent = createMenubarContentBase({ isSub: false });
export const TMenubarSubContent = createMenubarContentBase({ isSub: true });

export const TMenubarGroup = defineComponent({
	name: 'TMenubarGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'group', class: [styles[menubarStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const TMenubarLabel = defineComponent({
	name: 'TMenubarLabel',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-inset': props.inset, class: [styles[menubarStyleKeys.label], attrs.class] }, slots.default?.());
	},
});

export const TMenubarSeparator = defineComponent({
	name: 'TMenubarSeparator',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, role: 'separator', class: [styles[menubarStyleKeys.separator], attrs.class] });
	},
});

export const TMenubarShortcut = defineComponent({
	name: 'TMenubarShortcut',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, class: [styles[menubarStyleKeys.shortcut], attrs.class] }, slots.default?.());
	},
});

export const TMenubarItem = defineComponent({
	name: 'TMenubarItem',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		variant: { type: String as PropType<'default' | 'destructive'>, default: 'default' },
		disabled: { type: Boolean, default: false },
	},
	emits: ['select'],
	setup(props, { emit, slots, attrs }) {
		const context = useMenubarContentContext();
		const itemRef = ref<HTMLElement | null>(null);

		onMounted(() => {
			if (itemRef.value) {
				context.value.itemsRef.value.push(itemRef.value);
			}
		});

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
		});

		function handleClick(event: MouseEvent) {
			if (props.disabled) {
				return;
			}
			emit('select', event);
			context.value.close();
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: itemRef,
					role: 'menuitem',
					tabindex: -1,
					'data-inset': props.inset,
					'data-variant': props.variant,
					'data-disabled': props.disabled,
					class: [styles[menubarStyleKeys.item], attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export const TMenubarCheckboxItem = defineComponent({
	name: 'TMenubarCheckboxItem',
	inheritAttrs: false,
	props: {
		checked: { type: Boolean, default: undefined },
		defaultChecked: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:checked'],
	setup(props, { emit, slots, attrs }) {
		const context = useMenubarContentContext();
		const itemRef = ref<HTMLElement | null>(null);
		const internalChecked = ref(props.defaultChecked);
		const isChecked = computed(() => (props.checked !== undefined ? props.checked : internalChecked.value));

		onMounted(() => {
			if (itemRef.value) {
				context.value.itemsRef.value.push(itemRef.value);
			}
		});

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
		});

		function handleClick() {
			if (props.disabled) {
				return;
			}
			const next = !isChecked.value;
			if (props.checked === undefined) {
				internalChecked.value = next;
			}
			emit('update:checked', next);
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: itemRef,
					role: 'menuitemcheckbox',
					tabindex: -1,
					'aria-checked': isChecked.value,
					'data-checked': getMenubarCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[menubarStyleKeys.checkboxItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[menubarStyleKeys.indicator] }, [isChecked.value ? menubarCheckIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const TMenubarRadioGroup = defineComponent({
	name: 'TMenubarRadioGroup',
	inheritAttrs: false,
	props: {
		value: { type: String, default: undefined },
		defaultValue: { type: String, default: undefined },
	},
	emits: ['update:value'],
	setup(props, { emit, slots, attrs }) {
		const internalValue = ref(props.defaultValue);
		const resolvedValue = computed(() => (props.value !== undefined ? props.value : internalValue.value));

		function setValue(next: string) {
			if (props.value === undefined) {
				internalValue.value = next;
			}
			emit('update:value', next);
		}

		const context = computed<MenubarRadioGroupContextValue>(() => ({ value: resolvedValue.value, setValue }));

		provide(MenubarRadioGroupContextKey, context);

		return () => h('div', { ...attrs, role: 'group', class: [styles[menubarStyleKeys.radioGroup], attrs.class] }, slots.default?.());
	},
});

export const TMenubarRadioItem = defineComponent({
	name: 'TMenubarRadioItem',
	inheritAttrs: false,
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useMenubarContentContext();
		const group = useMenubarRadioGroupContext();
		const itemRef = ref<HTMLElement | null>(null);
		const isChecked = computed(() => group.value.value === props.value);

		onMounted(() => {
			if (itemRef.value) {
				context.value.itemsRef.value.push(itemRef.value);
			}
		});

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
		});

		function handleClick() {
			if (props.disabled) {
				return;
			}
			group.value.setValue(props.value);
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: itemRef,
					role: 'menuitemradio',
					tabindex: -1,
					'aria-checked': isChecked.value,
					'data-checked': getMenubarCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[menubarStyleKeys.radioItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[menubarStyleKeys.indicator] }, [isChecked.value ? menubarRadioIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const TMenubarSub = defineComponent({
	name: 'TMenubarSub',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		const context = computed<MenubarSubContextValue>(() => ({ open: isOpen.value, setOpen, triggerRef }));

		provide(MenubarSubContextKey, context);

		return () => slots.default?.();
	},
});

export const TMenubarSubTrigger = defineComponent({
	name: 'TMenubarSubTrigger',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useMenubarContentContext();
		const sub = useMenubarSubContext();
		const itemRef = ref<HTMLElement | null>(null);

		onMounted(() => {
			if (itemRef.value) {
				context.value.itemsRef.value.push(itemRef.value);
			}
		});

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
		});

		function setRef(el: unknown) {
			itemRef.value = (el as HTMLElement | null) ?? null;
			sub.value.triggerRef.value = itemRef.value;
		}

		function handleMouseEnter() {
			if (props.disabled) {
				return;
			}
			sub.value.setOpen(true);
		}

		function handleClick() {
			if (props.disabled) {
				return;
			}
			sub.value.setOpen(!sub.value.open);
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (props.disabled) {
				return;
			}
			if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				sub.value.setOpen(true);
			}
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: setRef,
					role: 'menuitem',
					tabindex: -1,
					'aria-haspopup': 'menu',
					'aria-expanded': sub.value.open,
					'data-state': getMenubarState(sub.value.open),
					'data-inset': props.inset,
					'data-disabled': props.disabled,
					class: [styles[menubarStyleKeys.subTrigger], attrs.class],
					onMouseenter: handleMouseEnter,
					onClick: handleClick,
					onKeydown: handleKeyDown,
				},
				[...(slots.default?.() ?? []), menubarChevronIcon()],
			);
	},
});

export default TMenubar;
