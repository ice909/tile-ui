import { defineComponent, h, inject, onBeforeUnmount, provide, ref, type InjectionKey, type PropType, type Ref } from 'vue';
import { getMessageScrollerButtonStyleKeys, isScrollerNearBottom, messageScrollerStyleKeys, scrollScrollerToEnd, scrollScrollerToStart } from '@tile-ui/core';
import type { MessageScrollerDirection } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/message-scroller.module.scss';

interface MessageScrollerContext {
	viewportRef: Ref<HTMLElement | null>;
	contentRef: Ref<HTMLElement | null>;
	buttonActive: Ref<boolean>;
	scrollable: Ref<boolean>;
	registerViewport: (element: HTMLElement | null) => void;
	registerContent: (element: HTMLElement | null) => void;
	handleViewportScroll: () => void;
	scrollToEnd: (behavior?: ScrollBehavior) => void;
	scrollToStart: (behavior?: ScrollBehavior) => void;
}

const MessageScrollerContextKey: InjectionKey<MessageScrollerContext> = Symbol('tile-message-scroller');

function useMessageScrollerContext(): MessageScrollerContext {
	const context = inject(MessageScrollerContextKey);
	if (!context) {
		throw new Error('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
	}
	return context;
}

export const MessageScrollerProvider = defineComponent({
	name: 'MessageScrollerProvider',
	setup(_props, { slots }) {
		const viewportRef = ref<HTMLElement | null>(null);
		const contentRef = ref<HTMLElement | null>(null);
		const stickToBottom = ref(true);
		const buttonActive = ref(false);
		const scrollable = ref(false);
		let observer: ResizeObserver | null = null;

		function updateScrollState(viewport: HTMLElement) {
			const isScrollable = viewport.scrollHeight > viewport.clientHeight;
			const nearBottom = isScrollerNearBottom(viewport);
			stickToBottom.value = nearBottom;
			scrollable.value = isScrollable;
			buttonActive.value = isScrollable && !nearBottom;
		}

		function registerViewport(element: HTMLElement | null) {
			viewportRef.value = element;
			if (element) {
				updateScrollState(element);
			}
		}

		function registerContent(element: HTMLElement | null) {
			contentRef.value = element;
			observer?.disconnect();
			observer = null;
			if (element) {
				observer = new ResizeObserver(() => {
					const viewport = viewportRef.value;
					if (!viewport) {
						return;
					}
					updateScrollState(viewport);
					if (stickToBottom.value) {
						scrollScrollerToEnd(viewport, 'auto');
					}
				});
				observer.observe(element);
			}
		}

		function handleViewportScroll() {
			const viewport = viewportRef.value;
			if (viewport) {
				updateScrollState(viewport);
			}
		}

		function scrollToEnd(behavior: ScrollBehavior = 'smooth') {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			stickToBottom.value = true;
			scrollScrollerToEnd(viewport, behavior);
			buttonActive.value = false;
		}

		function scrollToStart(behavior: ScrollBehavior = 'smooth') {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			stickToBottom.value = false;
			scrollScrollerToStart(viewport, behavior);
		}

		provide(MessageScrollerContextKey, {
			viewportRef,
			contentRef,
			buttonActive,
			scrollable,
			registerViewport,
			registerContent,
			handleViewportScroll,
			scrollToEnd,
			scrollToStart,
		});

		onBeforeUnmount(() => {
			observer?.disconnect();
			observer = null;
		});

		return () => slots.default?.();
	},
});

export const MessageScroller = defineComponent({
	name: 'MessageScroller',
	setup(_props, { slots }) {
		return () => h('div', { 'data-slot': 'message-scroller', class: styles[messageScrollerStyleKeys.root] }, slots.default?.());
	},
});

export const MessageScrollerViewport = defineComponent({
	name: 'MessageScrollerViewport',
	setup(_props, { slots, attrs }) {
		const context = useMessageScrollerContext();

		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;
			delete restAttrs.onScroll;

			return h(
				'div',
				{
					...restAttrs,
					ref: (el: unknown) => context.registerViewport(el as HTMLElement | null),
					'data-slot': 'message-scroller-viewport',
					class: [styles[messageScrollerStyleKeys.viewport], userClass],
					onScroll: () => context.handleViewportScroll(),
				},
				slots.default?.(),
			);
		};
	},
});

export const MessageScrollerContent = defineComponent({
	name: 'MessageScrollerContent',
	setup(_props, { slots, attrs }) {
		const context = useMessageScrollerContext();

		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'div',
				{
					...restAttrs,
					ref: (el: unknown) => context.registerContent(el as HTMLElement | null),
					'data-slot': 'message-scroller-content',
					class: [styles[messageScrollerStyleKeys.content], userClass],
				},
				slots.default?.(),
			);
		};
	},
});

export const MessageScrollerItem = defineComponent({
	name: 'MessageScrollerItem',
	props: {
		scrollAnchor: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		return () => {
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'div',
				{
					...restAttrs,
					'data-slot': 'message-scroller-item',
					'data-scroll-anchor': props.scrollAnchor ? 'true' : 'false',
					class: [styles[messageScrollerStyleKeys.item], userClass],
				},
				slots.default?.(),
			);
		};
	},
});

const arrowDownSvg = h(
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
	[h('path', { d: 'M12 5v14' }), h('path', { d: 'm19 12-7 7-7-7' })],
);

export const MessageScrollerButton = defineComponent({
	name: 'MessageScrollerButton',
	inheritAttrs: false,
	props: {
		direction: { type: String as PropType<MessageScrollerDirection>, default: 'end' },
	},
	setup(props, { slots, attrs }) {
		const context = useMessageScrollerContext();

		function handleClick() {
			if (props.direction === 'end') {
				context.scrollToEnd();
			} else {
				context.scrollToStart();
			}
		}

		return () => {
			const styleKeys = getMessageScrollerButtonStyleKeys(props.direction);
			const userClass = attrs.class;
			const restAttrs = { ...attrs };
			delete restAttrs.class;

			return h(
				'button',
				{
					...restAttrs,
					type: 'button',
					'data-slot': 'message-scroller-button',
					'data-direction': props.direction,
					'data-active': context.buttonActive.value ? 'true' : 'false',
					'aria-label': props.direction === 'end' ? 'Scroll to end' : 'Scroll to start',
					class: [styles[styleKeys.base], styles[styleKeys.direction], userClass],
					onClick: handleClick,
				},
				slots.default?.() ?? [arrowDownSvg],
			);
		};
	},
});

export function useMessageScroller() {
	return useMessageScrollerContext();
}

export function useMessageScrollerScrollable() {
	const context = useMessageScrollerContext();
	return { scrollable: context.scrollable, isScrollable: context.scrollable };
}

export function useMessageScrollerVisibility() {
	const context = useMessageScrollerContext();
	return { visible: context.buttonActive };
}

export default MessageScroller;
