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
import { getHoverCardPosition, getHoverCardState, hoverCardStyleKeys } from '@tile-ui/core';
import type { HoverCardAlign, HoverCardSide } from '@tile-ui/core';
import { usePortalContainer, type PortalContainer } from '../portal';
import styles from '@tile-ui/styles/scss/components/hover-card.module.scss';

interface HoverCardContextValue {
	open: Ref<boolean>;
	triggerRef: Ref<HTMLElement | null>;
	contentId: string;
	openDelay: number;
	closeDelay: number;
	setOpen: (open: boolean) => void;
}

const HoverCardContextKey: InjectionKey<HoverCardContextValue> = Symbol('tile-hover-card');

export const HoverCard = defineComponent({
	name: 'HoverCard',
	props: {
		open: { type: Boolean, default: undefined },
		defaultOpen: { type: Boolean, default: false },
		openDelay: { type: Number, default: 200 },
		closeDelay: { type: Number, default: 300 },
	},
	emits: ['update:open'],
	setup(props, { emit, slots }) {
		const internalOpen = ref(props.defaultOpen);
		const isOpen = computed(() => (props.open !== undefined ? props.open : internalOpen.value));
		const triggerRef = ref<HTMLElement | null>(null);
		const contentId = `tile-hover-card-${useId()}`;

		function setOpen(next: boolean) {
			if (props.open === undefined) {
				internalOpen.value = next;
			}
			emit('update:open', next);
		}

		provide(HoverCardContextKey, { open: isOpen, triggerRef, contentId, openDelay: props.openDelay, closeDelay: props.closeDelay, setOpen });

		return () => h('div', { class: styles[hoverCardStyleKeys.root] }, slots.default?.());
	},
});

export const HoverCardTrigger = defineComponent({
	name: 'HoverCardTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const contextValue = inject(HoverCardContextKey);
		if (!contextValue) {
			throw new Error('HoverCardTrigger must be used within <HoverCard>.');
		}
		const context: HoverCardContextValue = contextValue;

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
			openTimer = setTimeout(() => context.setOpen(true), context.openDelay);
		}

		function scheduleClose() {
			clearCloseTimer();
			closeTimer = setTimeout(() => context.setOpen(false), context.closeDelay);
		}

		function handlePointerenter() {
			clearCloseTimer();
			scheduleOpen();
		}

		function handlePointerleave() {
			clearOpenTimer();
			scheduleClose();
		}

		function handleFocus() {
			clearCloseTimer();
			scheduleOpen();
		}

		function handleBlur() {
			clearOpenTimer();
			scheduleClose();
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
			'data-state': getHoverCardState(context.open.value),
			onPointerenter: handlePointerenter,
			onPointerleave: handlePointerleave,
			onFocus: handleFocus,
			onBlur: handleBlur,
			onKeydown: handleKeydown,
		}));

		return () => {
			const child = slots.default?.()[0];

			if (props.asChild && child) {
				return cloneVNode(child, mergeProps(child.props ?? {}, triggerProps.value));
			}

			return h('button', { ...attrs, ...triggerProps.value, type: 'button', class: [styles[hoverCardStyleKeys.trigger], attrs.class] }, slots.default?.());
		};
	},
});

export const HoverCardContent = defineComponent({
	name: 'HoverCardContent',
	inheritAttrs: false,
	props: {
		side: { type: String as PropType<HoverCardSide>, default: 'bottom' },
		align: { type: String as PropType<HoverCardAlign>, default: 'center' },
		sideOffset: { type: Number, default: 4 },
		container: { type: Object as PropType<PortalContainer>, default: null },
	},
	setup(props, { slots, attrs }) {
		const portalContainer = usePortalContainer(() => props.container);
		const contextValue = inject(HoverCardContextKey);
		if (!contextValue) {
			throw new Error('HoverCardContent must be used within <HoverCard>.');
		}
		const context: HoverCardContextValue = contextValue;

		const contentRef = ref<HTMLElement | null>(null);
		const position = ref<{ top: number; left: number } | null>(null);

		let closeTimer: ReturnType<typeof setTimeout> | null = null;
		let disposeDocListeners: (() => void) | null = null;

		function clearCloseTimer() {
			if (closeTimer) {
				clearTimeout(closeTimer);
				closeTimer = null;
			}
		}

		function scheduleClose() {
			clearCloseTimer();
			closeTimer = setTimeout(() => context.setOpen(false), context.closeDelay);
		}

		function handlePointerenter() {
			clearCloseTimer();
		}

		function handlePointerleave() {
			scheduleClose();
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
			position.value = getHoverCardPosition({ triggerRect, contentSize, side: props.side, align: props.align, sideOffset: props.sideOffset, viewport });
		}

		function addListeners() {
			window.addEventListener('resize', updatePosition);
			document.addEventListener('scroll', updatePosition, true);
		}

		function removeListeners() {
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('scroll', updatePosition, true);
		}

		function addDocListeners(): () => void {
			function handleKeyDown(event: KeyboardEvent) {
				if (event.key === 'Escape') {
					clearCloseTimer();
					context.setOpen(false);
				}
			}

			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}

		onMounted(() => {
			if (context.open.value) {
				addListeners();
				updatePosition();
				disposeDocListeners = addDocListeners();
			}
		});

		watch(
			() => context.open.value,
			(open) => {
				if (open) {
					addListeners();
					updatePosition();
					disposeDocListeners = addDocListeners();
				} else {
					removeListeners();
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
			clearCloseTimer();
			removeListeners();
			disposeDocListeners?.();
		});

		return () => {
			const open = context.open.value;
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
						id: context.contentId,
						role: 'dialog',
						'aria-modal': 'false',
						tabindex: -1,
						'data-state': getHoverCardState(open),
						'data-side': props.side,
						'data-align': props.align,
						class: [styles[hoverCardStyleKeys.content], userClass],
						style: position.value ? [userStyle, { top: `${position.value.top}px`, left: `${position.value.left}px` }] : userStyle,
						onPointerenter: handlePointerenter,
						onPointerleave: handlePointerleave,
					},
					slots.default?.(),
				),
			]);
		};
	},
});

export default HoverCard;
