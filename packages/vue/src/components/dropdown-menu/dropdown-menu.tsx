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
import { dropdownMenuStyleKeys, getDropdownMenuCheckState, getDropdownMenuPosition, getDropdownMenuState } from '@tile-ui/core';
import type { DropdownMenuAlign, DropdownMenuSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/dropdown-menu.module.scss';

interface DropdownMenuContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	closeAll: () => void;
}

type DropdownMenuContext = ComputedRef<DropdownMenuContextValue>;

const DropdownMenuContextKey: InjectionKey<DropdownMenuContext> = Symbol('tile-dropdown-menu');

interface DropdownMenuContentContextValue {
	itemsRef: Ref<HTMLElement[]>;
	close: () => void;
}

type DropdownMenuContentContext = ComputedRef<DropdownMenuContentContextValue>;

const DropdownMenuContentContextKey: InjectionKey<DropdownMenuContentContext> = Symbol('tile-dropdown-menu-content');

interface DropdownMenuSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: Ref<HTMLElement | null>;
}

type DropdownMenuSubContext = ComputedRef<DropdownMenuSubContextValue>;

const DropdownMenuSubContextKey: InjectionKey<DropdownMenuSubContext> = Symbol('tile-dropdown-menu-sub');

interface DropdownMenuRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

type DropdownMenuRadioGroupContext = ComputedRef<DropdownMenuRadioGroupContextValue>;

const DropdownMenuRadioGroupContextKey: InjectionKey<DropdownMenuRadioGroupContext> = Symbol('tile-dropdown-menu-radio-group');

function dropdownMenuCheckIcon() {
	return h(
		'svg',
		{
			class: styles[dropdownMenuStyleKeys.checkIcon],
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

function dropdownMenuRadioIcon() {
	return h(
		'svg',
		{
			class: styles[dropdownMenuStyleKeys.radioIcon],
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

function dropdownMenuChevronIcon() {
	return h(
		'svg',
		{
			class: styles[dropdownMenuStyleKeys.chevron],
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

function useDropdownMenuContext(): DropdownMenuContext {
	const context = inject(DropdownMenuContextKey);
	if (!context) {
		throw new Error('TDropdownMenu 子组件必须位于 <TDropdownMenu> 内部。');
	}
	return context;
}

function useDropdownMenuContentContext(): DropdownMenuContentContext {
	const context = inject(DropdownMenuContentContextKey);
	if (!context) {
		throw new Error('TDropdownMenu 菜单项必须位于 <TDropdownMenuContent> 或 <TDropdownMenuSubContent> 内部。');
	}
	return context;
}

function useDropdownMenuSubContext(): DropdownMenuSubContext {
	const context = inject(DropdownMenuSubContextKey);
	if (!context) {
		throw new Error('TDropdownMenu 子菜单组件必须位于 <TDropdownMenuSub> 内部。');
	}
	return context;
}

function useDropdownMenuRadioGroupContext(): DropdownMenuRadioGroupContext {
	const context = inject(DropdownMenuRadioGroupContextKey);
	if (!context) {
		throw new Error('TDropdownMenuRadioItem 必须位于 <TDropdownMenuRadioGroup> 内部。');
	}
	return context;
}

export const TDropdownMenu = defineComponent({
	name: 'TDropdownMenu',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots, attrs }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-dropdown-menu-${useId()}`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		function closeAll() {
			setOpen(false);
		}

		const context = computed<DropdownMenuContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			triggerRef,
			contentId,
			closeAll,
		}));

		provide(DropdownMenuContextKey, context);

		return () => h('div', { ...attrs, class: [styles[dropdownMenuStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const TDropdownMenuPortal = defineComponent({
	name: 'TDropdownMenuPortal',
	setup(_props, { slots }) {
		return () => slots.default?.();
	},
});

export const TDropdownMenuTrigger = defineComponent({
	name: 'TDropdownMenuTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useDropdownMenuContext();

		function handleClick() {
			context.value.setOpen(!context.value.open);
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.defaultPrevented) {
				return;
			}
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				context.value.setOpen(true);
			}
		}

		const triggerProps = {
			ref: context.value.triggerRef,
			'aria-haspopup': 'menu',
			'aria-expanded': context.value.open ? 'true' : 'false',
			'aria-controls': context.value.contentId,
			'data-state': getDropdownMenuState(context.value.open),
			onClick: handleClick,
			onKeydown: handleKeyDown,
		};

		return () => {
			const child = slots.default?.()[0];

			if (props.asChild && child) {
				const childProps = (child.props ?? {}) as Record<string, unknown>;
				return h(child, { ...childProps, ...triggerProps });
			}

			return h(
				'button',
				{
					...attrs,
					...triggerProps,
					type: 'button',
					class: [styles[dropdownMenuStyleKeys.trigger], attrs.class],
				},
				slots.default?.(),
			);
		};
	},
});

function createDropdownMenuContentBase({ isSub = false }: { isSub?: boolean } = {}) {
	interface ContentContext {
		open: boolean;
		setOpen: (open: boolean) => void;
		triggerRef: Ref<HTMLElement | null>;
		contentId?: string;
		closeAll?: () => void;
	}

	return defineComponent({
		name: isSub ? 'TDropdownMenuSubContent' : 'TDropdownMenuContent',
		inheritAttrs: false,
		props: {
			side: { type: String as PropType<DropdownMenuSide>, default: 'bottom' },
			align: { type: String as PropType<DropdownMenuAlign>, default: 'center' },
			sideOffset: { type: Number, default: 4 },
			alignOffset: { type: Number, default: 0 },
		},
		setup(props, { slots, attrs }) {
			const context = (isSub ? useDropdownMenuSubContext() : useDropdownMenuContext()) as ComputedRef<ContentContext>;
			const contentRef = ref<HTMLElement | null>(null);
			const itemsRef = ref<HTMLElement[]>([]);
			const position = ref<{ top: number; left: number } | null>(null);

			const contentContext = computed<DropdownMenuContentContextValue>(() => ({
				itemsRef,
				close: isSub ? () => context.value.setOpen(false) : () => (context.value.closeAll ? context.value.closeAll() : context.value.setOpen(false)),
			}));

			provide(DropdownMenuContentContextKey, contentContext);

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
				position.value = getDropdownMenuPosition({
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
					if (isSub) {
						context.value.setOpen(false);
					} else {
						context.value.closeAll?.();
					}
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
					if (isSub) {
						context.value.setOpen(false);
					} else {
						context.value.closeAll?.();
					}
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
							'data-state': getDropdownMenuState(open),
							'data-side': props.side,
							'data-align': props.align,
							class: [styles[isSub ? dropdownMenuStyleKeys.subContent : dropdownMenuStyleKeys.content], userClass],
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

export const TDropdownMenuContent = createDropdownMenuContentBase({ isSub: false });
export const TDropdownMenuSubContent = createDropdownMenuContentBase({ isSub: true });

export const TDropdownMenuGroup = defineComponent({
	name: 'TDropdownMenuGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'group', class: [styles[dropdownMenuStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const TDropdownMenuLabel = defineComponent({
	name: 'TDropdownMenuLabel',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-inset': props.inset, class: [styles[dropdownMenuStyleKeys.label], attrs.class] }, slots.default?.());
	},
});

export const TDropdownMenuSeparator = defineComponent({
	name: 'TDropdownMenuSeparator',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, role: 'separator', class: [styles[dropdownMenuStyleKeys.separator], attrs.class] });
	},
});

export const TDropdownMenuShortcut = defineComponent({
	name: 'TDropdownMenuShortcut',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, class: [styles[dropdownMenuStyleKeys.shortcut], attrs.class] }, slots.default?.());
	},
});

export const TDropdownMenuItem = defineComponent({
	name: 'TDropdownMenuItem',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		variant: { type: String as PropType<'default' | 'destructive'>, default: 'default' },
		disabled: { type: Boolean, default: false },
	},
	emits: ['select'],
	setup(props, { emit, slots, attrs }) {
		const context = useDropdownMenuContentContext();
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
					class: [styles[dropdownMenuStyleKeys.item], attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export const TDropdownMenuCheckboxItem = defineComponent({
	name: 'TDropdownMenuCheckboxItem',
	inheritAttrs: false,
	props: {
		checked: { type: Boolean, default: undefined },
		defaultChecked: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:checked', 'select'],
	setup(props, { emit, slots, attrs }) {
		const context = useDropdownMenuContentContext();
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

		function handleClick(event: MouseEvent) {
			if (props.disabled) {
				return;
			}
			const next = !isChecked.value;
			if (props.checked === undefined) {
				internalChecked.value = next;
			}
			emit('update:checked', next);
			emit('select', event);
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
					'data-checked': getDropdownMenuCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[dropdownMenuStyleKeys.checkboxItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[dropdownMenuStyleKeys.indicator] }, [isChecked.value ? dropdownMenuCheckIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const TDropdownMenuRadioGroup = defineComponent({
	name: 'TDropdownMenuRadioGroup',
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

		const context = computed<DropdownMenuRadioGroupContextValue>(() => ({ value: resolvedValue.value, setValue }));

		provide(DropdownMenuRadioGroupContextKey, context);

		return () => h('div', { ...attrs, role: 'group', class: [styles[dropdownMenuStyleKeys.radioGroup], attrs.class] }, slots.default?.());
	},
});

export const TDropdownMenuRadioItem = defineComponent({
	name: 'TDropdownMenuRadioItem',
	inheritAttrs: false,
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	emits: ['select'],
	setup(props, { emit, slots, attrs }) {
		const context = useDropdownMenuContentContext();
		const group = useDropdownMenuRadioGroupContext();
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

		function handleClick(event: MouseEvent) {
			if (props.disabled) {
				return;
			}
			group.value.setValue(props.value);
			emit('select', event);
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
					'data-checked': getDropdownMenuCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[dropdownMenuStyleKeys.radioItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[dropdownMenuStyleKeys.indicator] }, [isChecked.value ? dropdownMenuRadioIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const TDropdownMenuSub = defineComponent({
	name: 'TDropdownMenuSub',
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

		const context = computed<DropdownMenuSubContextValue>(() => ({ open: isOpen.value, setOpen, triggerRef }));

		provide(DropdownMenuSubContextKey, context);

		return () => slots.default?.();
	},
});

export const TDropdownMenuSubTrigger = defineComponent({
	name: 'TDropdownMenuSubTrigger',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useDropdownMenuContentContext();
		const sub = useDropdownMenuSubContext();
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
					'data-state': getDropdownMenuState(sub.value.open),
					'data-inset': props.inset,
					'data-disabled': props.disabled,
					class: [styles[dropdownMenuStyleKeys.subTrigger], attrs.class],
					onMouseenter: handleMouseEnter,
					onClick: handleClick,
					onKeydown: handleKeyDown,
				},
				[...(slots.default?.() ?? []), dropdownMenuChevronIcon()],
			);
	},
});

export default TDropdownMenu;
