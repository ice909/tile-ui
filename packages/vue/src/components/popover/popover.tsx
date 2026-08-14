import {
	cloneVNode,
	computed,
	defineComponent,
	h,
	inject,
	mergeProps,
	onBeforeUnmount,
	onMounted,
	provide,
	ref,
	watch,
	type InjectionKey,
	type PropType,
	type Ref,
	Teleport,
} from 'vue';
import { getPopoverPosition, getPopoverState, popoverStyleKeys } from '@tile-ui/core';
import type { PopoverAlign, PopoverSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/popover.module.scss';

interface PopoverContextValue {
	open: Ref<boolean>;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

const PopoverContextKey: InjectionKey<PopoverContextValue> = Symbol('tile-popover');

let popoverCounter = 0;

export const TPopover = defineComponent({
	name: 'TPopover',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-popover-${++popoverCounter}`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		provide(PopoverContextKey, { open: isOpen, triggerRef, contentId, setOpen });

		return () => h('div', { class: styles[popoverStyleKeys.root] }, slots.default?.());
	},
});

export const TPopoverTrigger = defineComponent({
	name: 'TPopoverTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(PopoverContextKey);
		if (!contextValue) {
			throw new Error('TPopoverTrigger must be used within <TPopover>.');
		}
		const context: PopoverContextValue = contextValue;

		function handleClick() {
			context.setOpen(!context.open.value);
		}

		function setRef(el: unknown) {
			context.triggerRef.value = (el as HTMLElement | null) ?? null;
		}

		const triggerProps = {
			ref: setRef,
			'aria-haspopup': 'dialog',
			'aria-expanded': context.open.value ? 'true' : 'false',
			'aria-controls': context.contentId,
			'data-state': getPopoverState(context.open.value),
			onClick: handleClick,
		};

		return () => {
			const child = slots.default?.()[0];

			if (props.asChild && child) {
				return cloneVNode(child, mergeProps(child.props ?? {}, triggerProps));
			}

			return h('button', { ...attrs, ...triggerProps, type: 'button', class: [styles[popoverStyleKeys.trigger], attrs.class] }, slots.default?.());
		};
	},
});

export const TPopoverContent = defineComponent({
	name: 'TPopoverContent',
	inheritAttrs: false,
	props: {
		side: { type: String as PropType<PopoverSide>, default: 'bottom' },
		align: { type: String as PropType<PopoverAlign>, default: 'center' },
		sideOffset: { type: Number, default: 4 },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(PopoverContextKey);
		if (!contextValue) {
			throw new Error('TPopoverContent must be used within <TPopover>.');
		}
		const context: PopoverContextValue = contextValue;

		const contentRef = ref<HTMLElement | null>(null);
		const position = ref<{ top: number; left: number } | null>(null);

		let disposeDocListeners: (() => void) | null = null;

		function updatePosition() {
			const trigger = context.triggerRef.value;
			const content = contentRef.value;
			if (!trigger || !content) {
				return;
			}

			const triggerRect = trigger.getBoundingClientRect();
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			position.value = getPopoverPosition({ triggerRect, contentSize, side: props.side, align: props.align, sideOffset: props.sideOffset, viewport });
		}

		function handleOpen() {
			updatePosition();

			const content = contentRef.value;
			if (content && !content.contains(document.activeElement)) {
				content.focus();
			}

			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);
		}

		function handleClose() {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		}

		function addDocListeners(): () => void {
			function handlePointerDown(event: PointerEvent) {
				const target = event.target as Node | null;
				const content = contentRef.value;
				const trigger = context.triggerRef.value;
				if (!target) {
					return;
				}
				if (content && content.contains(target)) {
					return;
				}
				if (trigger && trigger.contains(target)) {
					return;
				}
				context.setOpen(false);
			}

			function handleKeyDown(event: KeyboardEvent) {
				if (event.key === 'Escape') {
					context.setOpen(false);
				}
			}

			document.addEventListener('pointerdown', handlePointerDown);
			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.removeEventListener('pointerdown', handlePointerDown);
				document.removeEventListener('keydown', handleKeyDown);
			};
		}

		onMounted(() => {
			if (context.open.value) {
				handleOpen();
				disposeDocListeners = addDocListeners();
			}
		});

		watch(
			() => context.open.value,
			(open) => {
				if (open) {
					handleOpen();
					disposeDocListeners = addDocListeners();
				} else {
					handleClose();
					disposeDocListeners?.();
					disposeDocListeners = null;
				}
			},
		);

		watch(
			() => [props.side, props.align, props.sideOffset],
			() => {
				if (context.open.value) {
					updatePosition();
				}
			},
		);

		onBeforeUnmount(() => {
			disposeDocListeners?.();
			handleClose();
		});

		return () => {
			const open = context.open.value;
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
						id: context.contentId,
						role: 'dialog',
						'aria-modal': 'false',
						tabindex: -1,
						'data-state': getPopoverState(open),
						'data-side': props.side,
						'data-align': props.align,
						class: [styles[popoverStyleKeys.content], userClass],
						style: position.value ? [userStyle, { top: `${position.value.top}px`, left: `${position.value.left}px` }] : userStyle,
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export default TPopover;
