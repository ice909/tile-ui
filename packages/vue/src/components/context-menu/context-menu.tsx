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
import { contextMenuStyleKeys, getContextMenuCheckState, getContextMenuPosition, getContextMenuState } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/context-menu.module.scss';

interface ContextMenuContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	position: { top: number; left: number } | null;
	setPosition: (position: { top: number; left: number }) => void;
	closeAll: () => void;
}

type ContextMenuContext = ComputedRef<ContextMenuContextValue>;

const ContextMenuContextKey: InjectionKey<ContextMenuContext> = Symbol('tile-context-menu');

interface ContextMenuContentContextValue {
	itemsRef: Ref<HTMLElement[]>;
	close: () => void;
}

type ContextMenuContentContext = ComputedRef<ContextMenuContentContextValue>;

const ContextMenuContentContextKey: InjectionKey<ContextMenuContentContext> = Symbol('tile-context-menu-content');

interface ContextMenuSubContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: Ref<HTMLElement | null>;
}

type ContextMenuSubContext = ComputedRef<ContextMenuSubContextValue>;

const ContextMenuSubContextKey: InjectionKey<ContextMenuSubContext> = Symbol('tile-context-menu-sub');

interface ContextMenuRadioGroupContextValue {
	value: string | undefined;
	setValue: (value: string) => void;
}

type ContextMenuRadioGroupContext = ComputedRef<ContextMenuRadioGroupContextValue>;

const ContextMenuRadioGroupContextKey: InjectionKey<ContextMenuRadioGroupContext> = Symbol('tile-context-menu-radio-group');

function contextMenuCheckIcon() {
	return h(
		'svg',
		{
			class: styles[contextMenuStyleKeys.checkIcon],
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

function contextMenuRadioIcon() {
	return h(
		'svg',
		{
			class: styles[contextMenuStyleKeys.radioIcon],
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

function contextMenuChevronIcon() {
	return h(
		'svg',
		{
			class: styles[contextMenuStyleKeys.chevron],
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

function useContextMenuContext(): ContextMenuContext {
	const context = inject(ContextMenuContextKey);
	if (!context) {
		throw new Error('ContextMenu 子组件必须位于 <ContextMenu> 内部。');
	}
	return context;
}

function useContextMenuContentContext(): ContextMenuContentContext {
	const context = inject(ContextMenuContentContextKey);
	if (!context) {
		throw new Error('ContextMenu 菜单项必须位于 <ContextMenuContent> 或 <ContextMenuSubContent> 内部。');
	}
	return context;
}

function useContextMenuSubContext(): ContextMenuSubContext {
	const context = inject(ContextMenuSubContextKey);
	if (!context) {
		throw new Error('ContextMenu 子菜单组件必须位于 <ContextMenuSub> 内部。');
	}
	return context;
}

function useContextMenuRadioGroupContext(): ContextMenuRadioGroupContext {
	const context = inject(ContextMenuRadioGroupContextKey);
	if (!context) {
		throw new Error('ContextMenuRadioItem 必须位于 <ContextMenuRadioGroup> 内部。');
	}
	return context;
}

export const ContextMenu = defineComponent({
	name: 'ContextMenu',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots, attrs }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-context-menu-${useId()}`;
		const position = ref<{ top: number; left: number } | null>(null);

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		function closeAll() {
			setOpen(false);
		}

		function setPosition(next: { top: number; left: number }) {
			position.value = next;
		}

		const context = computed<ContextMenuContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			triggerRef,
			contentId,
			position: position.value,
			setPosition,
			closeAll,
		}));

		provide(ContextMenuContextKey, context);

		return () => h('div', { ...attrs, class: [styles[contextMenuStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const ContextMenuPortal = defineComponent({
	name: 'ContextMenuPortal',
	setup(_props, { slots }) {
		return () => slots.default?.();
	},
});

export const ContextMenuTrigger = defineComponent({
	name: 'ContextMenuTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useContextMenuContext();

		function handleContextMenu(event: MouseEvent) {
			if (event.defaultPrevented) {
				return;
			}
			event.preventDefault();
			context.value.setPosition({ top: event.clientY, left: event.clientX });
			context.value.setOpen(true);
		}

		const triggerProps = computed(() => ({
			ref: context.value.triggerRef,
			tabindex: -1,
			'data-state': getContextMenuState(context.value.open),
			'aria-haspopup': 'menu',
			'aria-expanded': context.value.open,
			'aria-controls': context.value.contentId,
			onContextmenu: handleContextMenu,
		}));

		return () => {
			const child = slots.default?.()[0];

			if (props.asChild && child) {
				const childProps = (child.props ?? {}) as Record<string, unknown>;
				return h(child, { ...childProps, ...triggerProps.value });
			}

			return h('div', { ...attrs, ...triggerProps.value, class: [styles[contextMenuStyleKeys.trigger], attrs.class] }, slots.default?.());
		};
	},
});

export const ContextMenuContent = defineComponent({
	name: 'ContextMenuContent',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		const context = useContextMenuContext();
		const contentRef = ref<HTMLElement | null>(null);
		const itemsRef = ref<HTMLElement[]>([]);

		const contentContext = computed<ContextMenuContentContextValue>(() => ({
			itemsRef,
			close: () => context.value.closeAll(),
		}));

		provide(ContextMenuContentContextKey, contentContext);

		let disposeDocListeners: (() => void) | null = null;

		function updatePosition() {
			const content = contentRef.value;
			if (!content) {
				return;
			}
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			const base = context.value.position ?? { top: 0, left: 0 };
			context.value.setPosition(getContextMenuPosition({ x: base.left, y: base.top, contentSize, viewport }));
		}

		function highlightFirst() {
			const items = itemsRef.value;
			if (items.length === 0) {
				return;
			}
			items.forEach((item) => item.removeAttribute('data-highlighted'));
			items[0].setAttribute('data-highlighted', 'true');
			items[0].focus();
		}

		// 菜单从 hidden 过渡到 visible 需要几十毫秒，期间元素不可聚焦，
		// 因此轮询到可见后再聚焦首个菜单项，保证键盘导航可用。
		function focusFirstItemWhenVisible() {
			const deadline = Date.now() + 300;
			const tryFocus = () => {
				const item = itemsRef.value[0];
				if (item && getComputedStyle(item).visibility !== 'hidden') {
					highlightFirst();
					return;
				}
				if (Date.now() < deadline) {
					setTimeout(tryFocus, 20);
				}
			};
			tryFocus();
		}

		function handleOpen() {
			updatePosition();
			focusFirstItemWhenVisible();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			function handlePointerDown(event: PointerEvent) {
				const target = event.target as Node | null;
				const content = contentRef.value;
				if (!target) {
					return;
				}
				if (content && content.contains(target)) {
					return;
				}
				context.value.closeAll();
			}

			function handleKeyDown(event: KeyboardEvent) {
				if (event.key === 'Escape') {
					context.value.closeAll();
				}
			}

			document.addEventListener('pointerdown', handlePointerDown);
			document.addEventListener('keydown', handleKeyDown);
			disposeDocListeners = () => {
				document.removeEventListener('pointerdown', handlePointerDown);
				document.removeEventListener('keydown', handleKeyDown);
			};
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
			{ flush: 'post' },
		);

		onBeforeUnmount(handleClose);

		function handleKeyDown(event: KeyboardEvent) {
			const items = itemsRef.value.filter((item) => item.getAttribute('data-disabled') !== 'true');
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
						id: context.value.contentId,
						role: 'menu',
						tabindex: -1,
						'data-state': getContextMenuState(open),
						class: [styles[contextMenuStyleKeys.content], userClass],
						style: context.value.position ? [userStyle, { top: `${context.value.position.top}px`, left: `${context.value.position.left}px` }] : userStyle,
						onKeydown: handleKeyDown,
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export const ContextMenuGroup = defineComponent({
	name: 'ContextMenuGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'group', class: [styles[contextMenuStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const ContextMenuLabel = defineComponent({
	name: 'ContextMenuLabel',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => h('div', { ...attrs, 'data-inset': props.inset, class: [styles[contextMenuStyleKeys.label], attrs.class] }, slots.default?.());
	},
});

export const ContextMenuSeparator = defineComponent({
	name: 'ContextMenuSeparator',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, role: 'separator', class: [styles[contextMenuStyleKeys.separator], attrs.class] });
	},
});

export const ContextMenuShortcut = defineComponent({
	name: 'ContextMenuShortcut',
	setup(_props, { slots, attrs }) {
		return () => h('span', { ...attrs, class: [styles[contextMenuStyleKeys.shortcut], attrs.class] }, slots.default?.());
	},
});

export const ContextMenuItem = defineComponent({
	name: 'ContextMenuItem',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		variant: { type: String as PropType<'default' | 'destructive'>, default: 'default' },
		disabled: { type: Boolean, default: false },
	},
	emits: ['select'],
	setup(props, { emit, slots, attrs }) {
		const context = useContextMenuContentContext();
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
					class: [styles[contextMenuStyleKeys.item], attrs.class],
					onClick: handleClick,
				},
				slots.default?.(),
			);
	},
});

export const ContextMenuCheckboxItem = defineComponent({
	name: 'ContextMenuCheckboxItem',
	inheritAttrs: false,
	props: {
		checked: { type: Boolean, default: undefined },
		defaultChecked: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	emits: ['update:checked'],
	setup(props, { emit, slots, attrs }) {
		const context = useContextMenuContentContext();
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
					'data-checked': getContextMenuCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[contextMenuStyleKeys.checkboxItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[contextMenuStyleKeys.indicator] }, [isChecked.value ? contextMenuCheckIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const ContextMenuRadioGroup = defineComponent({
	name: 'ContextMenuRadioGroup',
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

		const context = computed<ContextMenuRadioGroupContextValue>(() => ({ value: resolvedValue.value, setValue }));

		provide(ContextMenuRadioGroupContextKey, context);

		return () => h('div', { ...attrs, role: 'group', class: [styles[contextMenuStyleKeys.radioGroup], attrs.class] }, slots.default?.());
	},
});

export const ContextMenuRadioItem = defineComponent({
	name: 'ContextMenuRadioItem',
	inheritAttrs: false,
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useContextMenuContentContext();
		const group = useContextMenuRadioGroupContext();
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
					'data-checked': getContextMenuCheckState(isChecked.value),
					'data-disabled': props.disabled,
					class: [styles[contextMenuStyleKeys.radioItem], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[contextMenuStyleKeys.indicator] }, [isChecked.value ? contextMenuRadioIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const ContextMenuSub = defineComponent({
	name: 'ContextMenuSub',
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

		const context = computed<ContextMenuSubContextValue>(() => ({ open: isOpen.value, setOpen, triggerRef }));

		provide(ContextMenuSubContextKey, context);

		return () => slots.default?.();
	},
});

export const ContextMenuSubTrigger = defineComponent({
	name: 'ContextMenuSubTrigger',
	inheritAttrs: false,
	props: {
		inset: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useContextMenuContentContext();
		const sub = useContextMenuSubContext();
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
					'data-state': getContextMenuState(sub.value.open),
					'data-inset': props.inset,
					'data-disabled': props.disabled,
					class: [styles[contextMenuStyleKeys.subTrigger], attrs.class],
					onMouseenter: handleMouseEnter,
					onClick: handleClick,
					onKeydown: handleKeyDown,
				},
				[...(slots.default?.() ?? []), contextMenuChevronIcon()],
			);
	},
});

export const ContextMenuSubContent = defineComponent({
	name: 'ContextMenuSubContent',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		const sub = useContextMenuSubContext();
		const contentRef = ref<HTMLElement | null>(null);
		const itemsRef = ref<HTMLElement[]>([]);
		const position = ref<{ top: number; left: number } | null>(null);

		const contentContext = computed<ContextMenuContentContextValue>(() => ({
			itemsRef,
			close: () => sub.value.setOpen(false),
		}));

		provide(ContextMenuContentContextKey, contentContext);

		let disposeDocListeners: (() => void) | null = null;

		function updatePosition() {
			const trigger = sub.value.triggerRef.value;
			const content = contentRef.value;
			if (!trigger || !content) {
				return;
			}
			const triggerRect = trigger.getBoundingClientRect();
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			position.value = getContextMenuPosition({ x: triggerRect.right, y: triggerRect.top, contentSize, viewport });
		}

		function handleOpen() {
			updatePosition();
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);

			function handlePointerDown(event: PointerEvent) {
				const target = event.target as Node | null;
				const content = contentRef.value;
				const trigger = sub.value.triggerRef.value;
				if (!target) {
					return;
				}
				if (content && content.contains(target)) {
					return;
				}
				if (trigger && trigger.contains(target)) {
					return;
				}
				sub.value.setOpen(false);
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
			if (sub.value.open) {
				handleOpen();
			}
		});

		watch(
			() => sub.value.open,
			(open) => {
				if (open) {
					handleOpen();
				} else {
					handleClose();
				}
			},
		);

		onBeforeUnmount(handleClose);

		function handleKeyDown(event: KeyboardEvent) {
			const items = itemsRef.value.filter((item) => item.getAttribute('data-disabled') !== 'true');

			if (event.key === 'Escape' || event.key === 'ArrowLeft') {
				event.preventDefault();
				sub.value.setOpen(false);
				sub.value.triggerRef.value?.focus();
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
				case 'Enter':
				case ' ':
					event.preventDefault();
					(currentIndex >= 0 ? items[currentIndex] : items[0]).click();
					break;
			}
		}

		return () => {
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
						role: 'menu',
						tabindex: -1,
						'data-state': getContextMenuState(sub.value.open),
						class: [styles[contextMenuStyleKeys.subContent], userClass],
						style: position.value ? [userStyle, { top: `${position.value.top}px`, left: `${position.value.left}px` }] : userStyle,
						onKeydown: handleKeyDown,
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export default ContextMenu;
