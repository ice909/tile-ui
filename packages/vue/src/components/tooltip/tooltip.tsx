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
	useId,
	watch,
	type InjectionKey,
	type PropType,
	type Ref,
	Teleport,
} from 'vue';
import { getTooltipPosition, getTooltipState, tooltipStyleKeys, TOOLTIP_CLOSE_DELAY_MS } from '@tile-ui/core';
import type { TooltipSide } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/tooltip.module.scss';

interface TooltipContextValue {
	open: Ref<boolean>;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	setOpen: (open: boolean) => void;
}

const TooltipContextKey: InjectionKey<TooltipContextValue> = Symbol('tile-tooltip');

const TooltipProviderContextKey: InjectionKey<Ref<number>> = Symbol('tile-tooltip-provider');

export const TooltipProvider = defineComponent({
	name: 'TooltipProvider',
	props: {
		delayDuration: { type: Number, default: 0 },
	},
	setup(props, { slots }) {
		const delayDuration = ref(props.delayDuration);
		provide(TooltipProviderContextKey, delayDuration);

		return () => slots.default?.();
	},
});

export const Tooltip = defineComponent({
	name: 'Tooltip',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-tooltip-${useId()}`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		provide(TooltipContextKey, { open: isOpen, triggerRef, contentId, setOpen });

		return () => h('div', { class: styles[tooltipStyleKeys.root] }, slots.default?.());
	},
});

export const TooltipTrigger = defineComponent({
	name: 'TooltipTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(TooltipContextKey);
		const provider = inject(TooltipProviderContextKey);
		if (!contextValue) {
			throw new Error('TooltipTrigger must be used within <Tooltip>.');
		}
		const context: TooltipContextValue = contextValue;
		const delayDuration = provider?.value ?? 0;

		let openTimer: ReturnType<typeof setTimeout> | null = null;
		let closeTimer: ReturnType<typeof setTimeout> | null = null;

		function clearOpenTimer() {
			if (openTimer) {
				clearTimeout(openTimer);
				openTimer = null;
			}
		}

		function clearCloseTimer() {
			if (closeTimer) {
				clearTimeout(closeTimer);
				closeTimer = null;
			}
		}

		function scheduleOpen() {
			clearOpenTimer();
			openTimer = setTimeout(() => context.setOpen(true), delayDuration);
		}

		function scheduleClose() {
			clearCloseTimer();
			closeTimer = setTimeout(() => context.setOpen(false), TOOLTIP_CLOSE_DELAY_MS);
		}

		function handleMouseenter() {
			clearCloseTimer();
			scheduleOpen();
		}

		function handleMouseleave() {
			clearOpenTimer();
			scheduleClose();
		}

		function handleFocus() {
			clearCloseTimer();
			scheduleOpen();
		}

		function handleBlur() {
			clearOpenTimer();
			clearCloseTimer();
			context.setOpen(false);
		}

		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				clearOpenTimer();
				clearCloseTimer();
				context.setOpen(false);
			}
		}

		onBeforeUnmount(() => {
			clearOpenTimer();
			clearCloseTimer();
		});

		function setRef(el: unknown) {
			context.triggerRef.value = (el as HTMLElement | null) ?? null;
		}

		const triggerProps = computed(() => ({
			ref: setRef,
			'data-state': getTooltipState(context.open.value),
			'aria-describedby': context.open.value ? context.contentId : undefined,
			onMouseenter: handleMouseenter,
			onMouseleave: handleMouseleave,
			onFocus: handleFocus,
			onBlur: handleBlur,
			onKeydown: handleKeydown,
		}));

		return () => {
			const child = slots.default?.()[0];

			if (props.asChild && child) {
				return cloneVNode(child, mergeProps(child.props ?? {}, triggerProps.value));
			}

			return h(
				'button',
				{
					...attrs,
					...triggerProps.value,
					type: 'button',
					class: [styles[tooltipStyleKeys.trigger], attrs.class],
				},
				slots.default?.(),
			);
		};
	},
});

export const TooltipContent = defineComponent({
	name: 'TooltipContent',
	inheritAttrs: false,
	props: {
		side: { type: String as PropType<TooltipSide>, default: 'top' },
		sideOffset: { type: Number, default: 0 },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(TooltipContextKey);
		if (!contextValue) {
			throw new Error('TooltipContent must be used within <Tooltip>.');
		}
		const context: TooltipContextValue = contextValue;

		const contentRef = ref<HTMLElement | null>(null);
		const position = ref<{ top: number; left: number } | null>(null);

		let closeTimer: ReturnType<typeof setTimeout> | null = null;

		function clearCloseTimer() {
			if (closeTimer) {
				clearTimeout(closeTimer);
				closeTimer = null;
			}
		}

		function handlePointerenter() {
			clearCloseTimer();
			context.setOpen(true);
		}

		function handlePointerleave() {
			clearCloseTimer();
			closeTimer = setTimeout(() => context.setOpen(false), TOOLTIP_CLOSE_DELAY_MS);
		}

		function updatePosition() {
			const trigger = context.triggerRef.value;
			const content = contentRef.value;
			if (!trigger || !content) {
				return;
			}

			const triggerRect = trigger.getBoundingClientRect();
			const contentSize = { width: content.offsetWidth, height: content.offsetHeight };
			const viewport = { width: window.innerWidth, height: window.innerHeight };
			position.value = getTooltipPosition({ triggerRect, contentSize, side: props.side, sideOffset: props.sideOffset, viewport });
		}

		function addListeners() {
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);
		}

		function removeListeners() {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		}

		onMounted(() => {
			if (context.open.value) {
				addListeners();
				updatePosition();
			}
		});

		watch(
			() => context.open.value,
			(open) => {
				if (open) {
					addListeners();
					updatePosition();
				} else {
					removeListeners();
				}
			},
		);

		watch(
			() => [props.side, props.sideOffset],
			() => {
				if (context.open.value) {
					updatePosition();
				}
			},
		);

		onBeforeUnmount(() => {
			clearCloseTimer();
			removeListeners();
		});

		return () => {
			const open = context.open.value;
			const userClass = attrs.class;
			const userStyle = attrs.style;
			const restAttrs = { ...attrs };
			delete restAttrs.class;
			delete restAttrs.style;

			const children = [...(slots.default?.() ?? []), h('span', { class: styles[tooltipStyleKeys.arrow], 'aria-hidden': 'true' })];

			return h(Teleport, { to: 'body' }, [
				h(
					'div',
					{
						...restAttrs,
						ref: contentRef,
						id: context.contentId,
						role: 'tooltip',
						'data-state': getTooltipState(open),
						'data-side': props.side,
						class: [styles[tooltipStyleKeys.content], userClass],
						style: position.value ? [userStyle, { top: `${position.value.top}px`, left: `${position.value.left}px` }] : userStyle,
						onPointerenter: handlePointerenter,
						onPointerleave: handlePointerleave,
					},
					children,
				),
			]);
		};
	},
});

export default Tooltip;
