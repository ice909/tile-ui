import { createContext, createEffect, createSignal, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { getMessageScrollerButtonStyleKeys, isScrollerNearBottom, messageScrollerStyleKeys, scrollScrollerToEnd, scrollScrollerToStart } from '@tile-ui/core';
import type { MessageScrollerButtonBaseProps, MessageScrollerDirection, MessageScrollerItemBaseProps } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/message-scroller.module.scss';

export interface MessageScrollerContextValue {
	viewport: Accessor<HTMLElement | undefined>;
	content: Accessor<HTMLElement | undefined>;
	anchor: Accessor<HTMLElement | undefined>;
	scrollable: Accessor<boolean>;
	canScrollStart: Accessor<boolean>;
	canScrollEnd: Accessor<boolean>;
	autoscrolling: Accessor<boolean>;
	registerViewport: (element: HTMLElement | undefined) => void;
	registerContent: (element: HTMLElement | undefined) => void;
	registerAnchor: (element: HTMLElement | undefined) => void;
	notifyItemLayout: () => void;
	handleViewportScroll: () => void;
	scrollToStart: (behavior?: ScrollBehavior) => void;
	scrollToEnd: (behavior?: ScrollBehavior) => void;
}

const MessageScrollerContext = createContext<MessageScrollerContextValue>();

function scrollElementToStart(element: HTMLElement, behavior: ScrollBehavior) {
	if (typeof element.scrollTo === 'function') scrollScrollerToStart(element, behavior);
	else element.scrollTop = 0;
}

function scrollElementToEnd(element: HTMLElement, behavior: ScrollBehavior) {
	if (typeof element.scrollTo === 'function') scrollScrollerToEnd(element, behavior);
	else element.scrollTop = element.scrollHeight;
}

function useMessageScrollerContext() {
	const context = useContext(MessageScrollerContext);
	if (!context) throw new Error('MessageScroller sub-components must be used within <MessageScrollerProvider>.');
	return context;
}

function assignRef<T>(ref: unknown, element: T) {
	if (typeof ref === 'function') (ref as (element: T) => void)(element);
}

export interface MessageScrollerProviderProps extends ParentProps {}

/** SolidJS MessageScroller 状态提供器。 */
export function MessageScrollerProvider(props: MessageScrollerProviderProps) {
	const [viewport, setViewport] = createSignal<HTMLElement>();
	const [content, setContent] = createSignal<HTMLElement>();
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [scrollable, setScrollable] = createSignal(false);
	const [canScrollStart, setCanScrollStart] = createSignal(false);
	const [canScrollEnd, setCanScrollEnd] = createSignal(false);
	const [autoscrolling, setAutoscrolling] = createSignal(false);
	let stickToEnd = true;
	let mounted = false;
	let observer: ResizeObserver | undefined;
	let mutationObserver: MutationObserver | undefined;
	let layoutFrame: number | undefined;
	let settleFrame: number | undefined;
	let layoutTask: ReturnType<typeof setTimeout> | undefined;
	let layoutGeneration = 0;
	let fontSettleScheduled = false;
	let anchorOffset: number | undefined;
	let lastScrollTop = 0;

	function updateScrollState(element = viewport(), updateStick = true, updateAnchor = true) {
		if (!element) {
			setScrollable(false);
			setCanScrollStart(false);
			setCanScrollEnd(false);
			return;
		}
		const isScrollable = element.scrollHeight > element.clientHeight;
		const nearEnd = isScrollerNearBottom(element);
		if (updateStick) stickToEnd = nearEnd;
		setScrollable(isScrollable);
		setCanScrollStart(isScrollable && element.scrollTop > 0);
		setCanScrollEnd(isScrollable && !nearEnd);
		const currentAnchor = anchor();
		if (updateAnchor && currentAnchor) anchorOffset = currentAnchor.getBoundingClientRect().top - element.getBoundingClientRect().top;
		lastScrollTop = element.scrollTop;
	}

	function cancelScheduledLayout() {
		layoutGeneration += 1;
		if (layoutFrame !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(layoutFrame);
		if (settleFrame !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(settleFrame);
		if (layoutTask !== undefined) clearTimeout(layoutTask);
		layoutFrame = undefined;
		settleFrame = undefined;
		layoutTask = undefined;
	}

	function measureLayout() {
		const element = viewport();
		if (!element) {
			updateScrollState(undefined, false);
			return;
		}
		const currentAnchor = anchor();
		if (stickToEnd && element.scrollHeight > element.clientHeight) {
			scrollElementToEnd(element, 'auto');
		} else if (currentAnchor && anchorOffset !== undefined) {
			const nextOffset = currentAnchor.getBoundingClientRect().top - element.getBoundingClientRect().top;
			const delta = nextOffset - anchorOffset;
			if (delta) element.scrollTop += delta;
		}
		updateScrollState(element, false);
	}

	function scheduleLayoutMeasurement() {
		if (!mounted) return;
		cancelScheduledLayout();
		const generation = layoutGeneration;
		const run = () => {
			if (!mounted || generation !== layoutGeneration) return;
			layoutFrame = undefined;
			layoutTask = undefined;
			measureLayout();
			if (typeof requestAnimationFrame === 'function') {
				settleFrame = requestAnimationFrame(() => {
					settleFrame = undefined;
					if (mounted && generation === layoutGeneration) measureLayout();
				});
			}
		};
		if (typeof requestAnimationFrame === 'function') layoutFrame = requestAnimationFrame(run);
		else layoutTask = setTimeout(run, 0);

		if (!fontSettleScheduled && typeof document !== 'undefined' && document.fonts?.ready) {
			fontSettleScheduled = true;
			void document.fonts.ready.then(() => {
				if (mounted && generation === layoutGeneration) scheduleLayoutMeasurement();
			});
		}
	}

	function bindObserver() {
		observer?.disconnect();
		observer = undefined;
		mutationObserver?.disconnect();
		mutationObserver = undefined;
		const currentViewport = viewport();
		const currentContent = content();
		if (!mounted || (!currentViewport && !currentContent)) return;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(() => {
				scheduleLayoutMeasurement();
			});
			if (currentViewport) observer.observe(currentViewport);
			if (currentContent && currentContent !== currentViewport) observer.observe(currentContent);
		}
		if (currentContent && typeof MutationObserver !== 'undefined') {
			mutationObserver = new MutationObserver(() => scheduleLayoutMeasurement());
			mutationObserver.observe(currentContent, { childList: true, subtree: true });
		}
	}

	function registerViewport(element: HTMLElement | undefined) {
		setViewport(element);
		setAutoscrolling(false);
		bindObserver();
		scheduleLayoutMeasurement();
	}

	function registerContent(element: HTMLElement | undefined) {
		setContent(element);
		bindObserver();
		scheduleLayoutMeasurement();
	}

	function registerAnchor(element: HTMLElement | undefined) {
		setAnchor(element);
		anchorOffset = undefined;
		scheduleLayoutMeasurement();
	}

	function notifyItemLayout() {
		scheduleLayoutMeasurement();
	}

	function handleViewportScroll() {
		setAutoscrolling(false);
		const element = viewport();
		updateScrollState(element, true, !!element && element.scrollTop !== lastScrollTop);
	}

	function scrollToEnd(behavior: ScrollBehavior = 'smooth') {
		const element = viewport();
		if (!element) return;
		stickToEnd = true;
		setAutoscrolling(behavior === 'smooth');
		scrollElementToEnd(element, behavior);
		setCanScrollEnd(false);
		setCanScrollStart(element.scrollHeight > element.clientHeight);
	}

	function scrollToStart(behavior: ScrollBehavior = 'smooth') {
		const element = viewport();
		if (!element) return;
		stickToEnd = false;
		setAutoscrolling(behavior === 'smooth');
		scrollElementToStart(element, behavior);
		setCanScrollStart(false);
		setCanScrollEnd(element.scrollHeight > element.clientHeight);
	}

	function disposeProvider() {
		// 幂等清理：多次 dispose、已销毁 owner 再次清理均安全。
		mounted = false;
		fontSettleScheduled = false;
		cancelScheduledLayout();
		observer?.disconnect();
		observer = undefined;
		mutationObserver?.disconnect();
		mutationObserver = undefined;
	}

	onMount(() => {
		mounted = true;
		bindObserver();
		scheduleLayoutMeasurement();
		onCleanup(disposeProvider);
	});

	const value: MessageScrollerContextValue = {
		viewport,
		content,
		anchor,
		scrollable,
		canScrollStart,
		canScrollEnd,
		autoscrolling,
		registerViewport,
		registerContent,
		registerAnchor,
		notifyItemLayout,
		handleViewportScroll,
		scrollToStart,
		scrollToEnd,
	};

	return <MessageScrollerContext.Provider value={value}>{props.children}</MessageScrollerContext.Provider>;
}

export interface MessageScrollerProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function MessageScroller(props: ParentProps<MessageScrollerProps>) {
	const [local, rest] = splitProps(props, ['class', 'children']);
	return (
		<div {...rest} data-slot="message-scroller" class={`${styles[messageScrollerStyleKeys.root]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface MessageScrollerViewportProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function MessageScrollerViewport(props: ParentProps<MessageScrollerViewportProps>) {
	const context = useMessageScrollerContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'onScroll']);
	let viewport: HTMLDivElement | undefined;
	let scrollBound = false;

	function handleViewportScroll(event: Event) {
		context.handleViewportScroll();
		invokeEventHandler(local.onScroll, event);
	}

	function bindViewportScroll(element: HTMLDivElement) {
		// 元素级 scroll 监听由组件自行管理：Solid 对非委托事件在卸载时不会自动移除监听器，
		// 若依赖 JSX onScroll，每次挂载都会残留一个 DIV:scroll 监听器。
		if (scrollBound && viewport && viewport !== element) viewport.removeEventListener('scroll', handleViewportScroll);
		if (!scrollBound) {
			element.addEventListener('scroll', handleViewportScroll, { passive: true });
			scrollBound = true;
		}
	}

	onCleanup(() => {
		// 幂等解绑：清理只执行一次，重复 dispose 不会重复移除。
		if (scrollBound && viewport) viewport.removeEventListener('scroll', handleViewportScroll);
		scrollBound = false;
		if (context.viewport() === viewport) context.registerViewport(undefined);
	});
	return (
		<div
			tabIndex={0}
			{...rest}
			ref={(element) => {
				viewport = element;
				bindViewportScroll(element);
				context.registerViewport(element);
				assignRef(local.ref, element);
			}}
			data-slot="message-scroller-viewport"
			data-autoscrolling={context.autoscrolling()}
			class={`${styles[messageScrollerStyleKeys.viewport]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface MessageScrollerContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function MessageScrollerContent(props: ParentProps<MessageScrollerContentProps>) {
	const context = useMessageScrollerContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	let content: HTMLDivElement | undefined;
	onCleanup(() => {
		if (context.content() === content) context.registerContent(undefined);
	});
	return (
		<div
			{...rest}
			ref={(element) => {
				content = element;
				context.registerContent(element);
				assignRef(local.ref, element);
			}}
			data-slot="message-scroller-content"
			class={`${styles[messageScrollerStyleKeys.content]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

export interface MessageScrollerItemProps extends JSX.HTMLAttributes<HTMLDivElement>, MessageScrollerItemBaseProps {}

export function MessageScrollerItem(props: ParentProps<MessageScrollerItemProps>) {
	const context = useMessageScrollerContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'scrollAnchor']);
	let item: HTMLDivElement | undefined;
	onMount(() => {
		onCleanup(() => context.notifyItemLayout());
	});
	createEffect(() => {
		if (!local.scrollAnchor || !item) return;
		context.registerAnchor(item);
		onCleanup(() => {
			if (context.anchor() === item) context.registerAnchor(undefined);
		});
	});
	return (
		<div
			{...rest}
			ref={(element) => {
				item = element;
				assignRef(local.ref, element);
				context.notifyItemLayout();
			}}
			data-slot="message-scroller-item"
			data-scroll-anchor={local.scrollAnchor ? 'true' : undefined}
			class={`${styles[messageScrollerStyleKeys.item]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

function ArrowDownIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<path d="M12 5v14" />
			<path d="m19 12-7 7-7-7" />
		</svg>
	);
}

export interface MessageScrollerButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement>, MessageScrollerButtonBaseProps {}

export function MessageScrollerButton(props: ParentProps<MessageScrollerButtonProps>) {
	const context = useMessageScrollerContext();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'direction', 'type', 'aria-label', 'aria-hidden', 'disabled', 'hidden', 'tabIndex', 'onClick']);
	const direction = (): MessageScrollerDirection => local.direction ?? 'end';
	const active = () => (direction() === 'start' ? context.canScrollStart() : context.canScrollEnd());
	const styleKeys = () => getMessageScrollerButtonStyleKeys(direction());

	return (
		<button
			{...rest}
			ref={(element) => assignRef(local.ref, element)}
			type={local.type ?? 'button'}
			data-slot="message-scroller-button"
			data-direction={direction()}
			data-active={active()}
			hidden={local.hidden || !active()}
			disabled={local.disabled || !active()}
			aria-hidden={!active() ? true : local['aria-hidden']}
			tabIndex={!active() ? -1 : local.tabIndex}
			aria-label={local['aria-label'] ?? (direction() === 'end' ? 'Scroll to end' : 'Scroll to start')}
			class={`${styles[styleKeys().base]} ${styles[styleKeys().direction]} ${local.class ?? ''}`}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (event.defaultPrevented || !active() || local.disabled) return;
				if (direction() === 'end') context.scrollToEnd();
				else context.scrollToStart();
			}}>
			{local.children ?? <ArrowDownIcon />}
		</button>
	);
}

export function useMessageScroller() {
	return useMessageScrollerContext();
}

export function useMessageScrollerScrollable() {
	const context = useMessageScrollerContext();
	return { scrollable: context.scrollable, isScrollable: context.scrollable };
}

export function useMessageScrollerVisibility(direction: MessageScrollerDirection = 'end') {
	const context = useMessageScrollerContext();
	return {
		visible: direction === 'start' ? context.canScrollStart : context.canScrollEnd,
		startVisible: context.canScrollStart,
		endVisible: context.canScrollEnd,
	};
}

export default MessageScroller;
