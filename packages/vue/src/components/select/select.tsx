import {
	computed,
	defineComponent,
	h,
	inject,
	nextTick,
	onBeforeUnmount,
	onMounted,
	onUpdated,
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
import { getSelectCheckState, getSelectPosition, getSelectState, selectStyleKeys } from '@tile-ui/core';
import type { SelectAlign, SelectPosition } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/select.module.scss';

interface SelectContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	value: string | undefined;
	setValue: (value: string) => void;
	triggerRef: Ref<HTMLButtonElement | null>;
	contentId: string;
	itemTexts: Record<string, string>;
	registerItemText: (value: string, text: string) => void;
}

type SelectContext = ComputedRef<SelectContextValue>;

const SelectContextKey: InjectionKey<SelectContext> = Symbol('tile-select');

interface SelectContentContextValue {
	itemsRef: Ref<HTMLElement[]>;
	close: () => void;
}

type SelectContentContext = ComputedRef<SelectContentContextValue>;

const SelectContentContextKey: InjectionKey<SelectContentContext> = Symbol('tile-select-content');

function useSelectContext(): SelectContext {
	const context = inject(SelectContextKey);
	if (!context) {
		throw new Error('Select 子组件必须位于 <Select> 内部。');
	}
	return context;
}

function useSelectContentContext(): SelectContentContext {
	const context = inject(SelectContentContextKey);
	if (!context) {
		throw new Error('SelectItem 必须位于 <SelectContent> 内部。');
	}
	return context;
}

function callEventHandler(handler: unknown, event: Event) {
	const handlers = Array.isArray(handler) ? handler : [handler];
	for (const current of handlers) {
		if (typeof current === 'function') {
			current(event);
		}
	}
}

function selectCheckIcon() {
	return h(
		'svg',
		{
			class: styles[selectStyleKeys.checkIcon],
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

function selectChevronIcon() {
	return h(
		'svg',
		{
			class: styles[selectStyleKeys.chevron],
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
		[h('path', { d: 'm6 9 6 6 6-6' })],
	);
}

function selectScrollUpIcon() {
	return h(
		'svg',
		{
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
		[h('path', { d: 'm18 15-6-6-6 6' })],
	);
}

function selectScrollDownIcon() {
	return h(
		'svg',
		{
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
		[h('path', { d: 'm6 9 6 6 6-6' })],
	);
}

export const Select = defineComponent({
	name: 'Select',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
		value: { type: String, default: undefined },
		defaultValue: { type: String, default: undefined },
	},
	emits: ['update:open', 'update:value'],
	setup(props, { emit, slots, attrs }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const internalValue = ref(props.defaultValue);
		const resolvedValue = computed(() => (props.value !== undefined ? props.value : internalValue.value));
		const triggerRef = ref<HTMLButtonElement | null>(null);
		const contentId = `tile-select-${useId()}`;
		const itemTexts = ref<Record<string, string>>({});

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		function setValue(next: string) {
			if (props.value === undefined) {
				internalValue.value = next;
			}
			emit('update:value', next);
		}

		function registerItemText(value: string, text: string) {
			if (itemTexts.value[value] === text) {
				return;
			}
			itemTexts.value = { ...itemTexts.value, [value]: text };
		}

		const context = computed<SelectContextValue>(() => ({
			open: isOpen.value,
			setOpen,
			value: resolvedValue.value,
			setValue,
			triggerRef,
			contentId,
			itemTexts: itemTexts.value,
			registerItemText,
		}));

		provide(SelectContextKey, context);

		return () => h('div', { ...attrs, class: [styles[selectStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const SelectTrigger = defineComponent({
	name: 'SelectTrigger',
	inheritAttrs: false,
	props: {
		size: { type: String as PropType<'sm' | 'default'>, default: 'default' },
	},
	setup(props, { slots, attrs }) {
		const context = useSelectContext();

		function handleClick(event: MouseEvent) {
			callEventHandler(attrs.onClick, event);
			if (event.defaultPrevented) {
				return;
			}
			context.value.setOpen(!context.value.open);
		}

		function handleKeyDown(event: KeyboardEvent) {
			callEventHandler(attrs.onKeydown, event);
			if (event.defaultPrevented) {
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
					role: 'combobox',
					'aria-haspopup': 'listbox',
					'aria-expanded': context.value.open,
					'aria-controls': context.value.contentId,
					'data-state': getSelectState(context.value.open),
					'data-size': props.size,
					class: [styles[selectStyleKeys.trigger], attrs.class],
					onClick: handleClick,
					onKeydown: handleKeyDown,
				},
				[...(slots.default?.() ?? []), selectChevronIcon()],
			);
	},
});

export const SelectValue = defineComponent({
	name: 'SelectValue',
	inheritAttrs: false,
	props: {
		placeholder: { type: String, default: undefined },
	},
	setup(props, { slots, attrs }) {
		const context = useSelectContext();

		return () => {
			const text = context.value.value !== undefined ? context.value.itemTexts[context.value.value] : undefined;
			const showPlaceholder = !text;
			return h('span', { ...attrs, 'data-placeholder': showPlaceholder, class: [styles[selectStyleKeys.value], attrs.class] }, [
				text ?? props.placeholder ?? slots.default?.(),
			]);
		};
	},
});

export const SelectContent = defineComponent({
	name: 'SelectContent',
	inheritAttrs: false,
	props: {
		position: { type: String as PropType<SelectPosition>, default: 'item-aligned' },
		align: { type: String as PropType<SelectAlign>, default: 'center' },
		sideOffset: { type: Number, default: 4 },
		container: { type: Object as PropType<PortalContainer>, default: null },
	},
	setup(props, { slots, attrs }) {
		const context = useSelectContext();
		const portalContainer = usePortalContainer(() => props.container);
		const contentRef = ref<HTMLElement | null>(null);
		const itemsRef = ref<HTMLElement[]>([]);
		const coords = ref<{ top: number; left: number } | null>(null);

		const contentContext = computed<SelectContentContextValue>(() => ({
			itemsRef,
			close: () => context.value.setOpen(false),
		}));

		provide(SelectContentContextKey, contentContext);

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
			coords.value = getSelectPosition({ triggerRect, contentSize, align: props.align, sideOffset: props.sideOffset, viewport });
		}

		function highlightSelected() {
			const items = itemsRef.value;
			items.forEach((item) => item.removeAttribute('data-highlighted'));
			const selected = items.find((item) => item.getAttribute('aria-selected') === 'true');
			const target = selected ?? items[0];
			if (target) {
				target.setAttribute('data-highlighted', 'true');
				target.focus();
			}
		}

		function handleOpen() {
			nextTick(() => {
				updatePosition();
				highlightSelected();
			});
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
			() => [props.align, props.sideOffset],
			() => {
				if (context.value.open) {
					updatePosition();
				}
			},
		);

		onBeforeUnmount(handleClose);

		function handleKeyDown(event: KeyboardEvent) {
			callEventHandler(attrs.onKeydown, event);
			if (event.defaultPrevented) {
				return;
			}

			const items = itemsRef.value.filter((item) => item.getAttribute('data-disabled') !== 'true');

			if (event.key === 'Escape') {
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
			const userClass = attrs.class;
			const userStyle = attrs.style;
			const restAttrs = { ...attrs };
			delete restAttrs.class;
			delete restAttrs.style;

			return h(Teleport, { to: portalContainer.value }, [
				h(
					'div',
					{
						...restAttrs,
						ref: contentRef,
						id: context.value.contentId,
						role: 'listbox',
						tabindex: -1,
						'data-state': getSelectState(context.value.open),
						'data-position': props.position,
						class: [styles[selectStyleKeys.content], userClass],
						style: coords.value ? [userStyle, { top: `${coords.value.top}px`, left: `${coords.value.left}px` }] : userStyle,
						onKeydown: handleKeyDown,
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export const SelectGroup = defineComponent({
	name: 'SelectGroup',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, role: 'group', class: [styles[selectStyleKeys.group], attrs.class] }, slots.default?.());
	},
});

export const SelectLabel = defineComponent({
	name: 'SelectLabel',
	setup(_props, { slots, attrs }) {
		return () => h('div', { ...attrs, class: [styles[selectStyleKeys.label], attrs.class] }, slots.default?.());
	},
});

export const SelectItem = defineComponent({
	name: 'SelectItem',
	inheritAttrs: false,
	props: {
		value: { type: String, required: true },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const context = useSelectContentContext();
		const root = useSelectContext();
		const itemRef = ref<HTMLElement | null>(null);
		const isSelected = computed(() => root.value.value === props.value);

		onMounted(() => {
			const element = itemRef.value;
			if (element) {
				context.value.itemsRef.value.push(element);
				root.value.registerItemText(props.value, element.textContent ?? '');
			}
		});

		onUpdated(() => {
			const element = itemRef.value;
			if (element) {
				root.value.registerItemText(props.value, element.textContent ?? '');
			}
		});

		onBeforeUnmount(() => {
			context.value.itemsRef.value = context.value.itemsRef.value.filter((item) => item !== itemRef.value);
		});

		function handleClick(event: MouseEvent) {
			callEventHandler(attrs.onClick, event);
			if (event.defaultPrevented) {
				return;
			}
			if (props.disabled) {
				return;
			}
			root.value.setValue(props.value);
			context.value.close();
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: itemRef,
					role: 'option',
					tabindex: -1,
					'aria-selected': isSelected.value,
					'data-checked': getSelectCheckState(isSelected.value),
					'data-disabled': props.disabled,
					class: [styles[selectStyleKeys.item], attrs.class],
					onClick: handleClick,
				},
				[h('span', { class: styles[selectStyleKeys.indicator] }, [isSelected.value ? selectCheckIcon() : null]), ...(slots.default?.() ?? [])],
			);
	},
});

export const SelectSeparator = defineComponent({
	name: 'SelectSeparator',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, role: 'separator', class: [styles[selectStyleKeys.separator], attrs.class] });
	},
});

export const SelectScrollUpButton = defineComponent({
	name: 'SelectScrollUpButton',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, class: [styles[selectStyleKeys.scrollButton], attrs.class] }, [selectScrollUpIcon()]);
	},
});

export const SelectScrollDownButton = defineComponent({
	name: 'SelectScrollDownButton',
	setup(_props, { attrs }) {
		return () => h('div', { ...attrs, class: [styles[selectStyleKeys.scrollButton], attrs.class] }, [selectScrollDownIcon()]);
	},
});

export default Select;
