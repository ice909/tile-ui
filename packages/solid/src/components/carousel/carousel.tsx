import { createContext, createEffect, createSignal, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import {
	carouselStyleKeys,
	getCarouselCanScrollNext,
	getCarouselCanScrollPrev,
	getCarouselItemScrollPosition,
	getCarouselMaxScroll,
	getCarouselScrollPosition,
	getCarouselScrollSize,
	getCarouselSelectedIndex,
} from '@tile-ui/core';
import type { CarouselBaseProps, CarouselOrientation } from '@tile-ui/core';
import { isEffectivelyFocusable, isHTMLElementNode } from '../../utils/dom';
import { invokeEventHandler } from '../../utils/events';
import { Button, type ButtonProps } from '../button';
import styles from '@tile-ui/styles/scss/components/carousel.module.scss';

const SCROLL_TOLERANCE = 1;
const INTERACTIVE_ROLES = new Set([
	'application',
	'button',
	'checkbox',
	'combobox',
	'grid',
	'gridcell',
	'link',
	'listbox',
	'menu',
	'menubar',
	'menuitem',
	'menuitemcheckbox',
	'menuitemradio',
	'option',
	'radio',
	'radiogroup',
	'scrollbar',
	'searchbox',
	'slider',
	'spinbutton',
	'switch',
	'tab',
	'tablist',
	'textbox',
	'toolbar',
	'tree',
	'treegrid',
	'treeitem',
]);

export type CarouselRef<T> = (element: T) => void;

interface CarouselContextValue {
	orientation: Accessor<CarouselOrientation>;
	canScrollPrevious: Accessor<boolean>;
	canScrollNext: Accessor<boolean>;
	selectedIndex: Accessor<number>;
	registerViewport: (viewport: HTMLDivElement | undefined, container?: HTMLDivElement) => void;
	handleScroll: () => void;
	scrollPrevious: () => void;
	scrollNext: () => void;
}

const CarouselContext = createContext<CarouselContextValue>();

function useCarousel() {
	const context = useContext(CarouselContext);
	if (!context) throw new Error('Carousel sub-components must be used within <Carousel>.');
	return context;
}

function isRtl(element: HTMLElement) {
	return getComputedStyle(element).direction === 'rtl';
}

function getLogicalScrollPosition(element: HTMLElement, orientation: CarouselOrientation) {
	const position = getCarouselScrollPosition(element, orientation);
	return orientation === 'horizontal' && isRtl(element) && position < 0 ? -position : position;
}

function getItems(container: HTMLElement | undefined) {
	if (!container) return [];
	return Array.from(container.children).filter((element): element is HTMLElement => isHTMLElementNode(element) && element.dataset.slot === 'carousel-item');
}

function isInteractiveKeyboardTarget(target: EventTarget | null, root: HTMLElement) {
	if (!isHTMLElementNode(target) || target === root) return false;
	for (let current: HTMLElement | null = target; current && current !== root; current = current.parentElement) {
		if (current.dataset.slot === 'carousel' || isEffectivelyFocusable(current, root)) return true;
		const role = current.getAttribute('role');
		if (role && INTERACTIVE_ROLES.has(role)) return true;
		const editable = current.getAttribute('contenteditable');
		if (current.isContentEditable || (editable !== null && editable !== 'false')) return true;
		if ((current.tagName === 'AUDIO' || current.tagName === 'VIDEO') && (current as HTMLMediaElement).controls) return true;
	}
	return false;
}

function setScrollPosition(viewport: HTMLElement, orientation: CarouselOrientation, position: number) {
	if (orientation === 'horizontal') {
		if (typeof viewport.scrollTo === 'function') viewport.scrollTo({ left: position, behavior: 'smooth' });
		else viewport.scrollLeft = position;
	} else if (typeof viewport.scrollTo === 'function') viewport.scrollTo({ top: position, behavior: 'smooth' });
	else viewport.scrollTop = position;
}

function updateSlideLabels(items: HTMLElement[]) {
	const total = items.length;
	for (const [index, item] of items.entries()) {
		const currentLabel = item.getAttribute('aria-label');
		const previousAutoLabel = item.dataset.carouselAutoLabel;
		if (currentLabel && currentLabel !== previousAutoLabel) {
			delete item.dataset.carouselAutoLabel;
			continue;
		}
		const nextLabel = `${index + 1} of ${total}`;
		item.setAttribute('aria-label', nextLabel);
		item.dataset.carouselAutoLabel = nextLabel;
	}
}

export interface CarouselProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'>, CarouselBaseProps {
	ref?: CarouselRef<HTMLDivElement>;
}

/** SolidJS Carousel：复用 core 滚动逻辑与共享样式，并在挂载后测量可滚动状态。 */
export function Carousel(props: ParentProps<CarouselProps>) {
	const [local, rest] = splitProps(props, ['orientation', 'class', 'children', 'ref', 'onKeyDown']);
	const [canScrollPrevious, setCanScrollPrevious] = createSignal(false);
	const [canScrollNext, setCanScrollNext] = createSignal(false);
	const [selectedIndex, setSelectedIndex] = createSignal(0);
	let viewport: HTMLDivElement | undefined;
	let container: HTMLDivElement | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let mutationObserver: MutationObserver | undefined;
	let mounted = false;
	let measureFrame: number | undefined;
	let measureTask: ReturnType<typeof setTimeout> | undefined;
	const orientation = (): CarouselOrientation => local.orientation ?? 'horizontal';

	function cancelMeasurement() {
		if (measureFrame !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(measureFrame);
		if (measureTask !== undefined) clearTimeout(measureTask);
		measureFrame = undefined;
		measureTask = undefined;
	}

	function measure() {
		if (!viewport) {
			setCanScrollPrevious(false);
			setCanScrollNext(false);
			setSelectedIndex(0);
			return;
		}
		const axis = orientation();
		const position = Math.max(0, getLogicalScrollPosition(viewport, axis));
		const maxScroll = Math.max(0, getCarouselMaxScroll(viewport, axis));
		const itemSize = getCarouselScrollSize(viewport, axis);
		setCanScrollPrevious(getCarouselCanScrollPrev(position - SCROLL_TOLERANCE));
		setCanScrollNext(getCarouselCanScrollNext(position + SCROLL_TOLERANCE, maxScroll));
		const items = getItems(container);
		setSelectedIndex(Math.min(Math.max(0, getCarouselSelectedIndex(position, itemSize)), Math.max(0, items.length - 1)));
		updateSlideLabels(items);
	}

	function scheduleMeasurement() {
		if (!mounted) return;
		cancelMeasurement();
		const run = () => {
			measureFrame = undefined;
			measureTask = undefined;
			if (mounted) measure();
		};
		if (typeof requestAnimationFrame === 'function') measureFrame = requestAnimationFrame(run);
		else measureTask = setTimeout(run, 0);
	}

	function bindObservers() {
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
		resizeObserver = undefined;
		mutationObserver = undefined;
		if (!mounted || !viewport) return;
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => scheduleMeasurement());
			resizeObserver.observe(viewport);
			if (container) resizeObserver.observe(container);
			for (const item of getItems(container)) resizeObserver.observe(item);
		}
		if (container && typeof MutationObserver !== 'undefined') {
			mutationObserver = new MutationObserver(() => {
				bindObservers();
				scheduleMeasurement();
			});
			mutationObserver.observe(container, { childList: true });
		}
	}

	function registerViewport(nextViewport: HTMLDivElement | undefined, nextContainer?: HTMLDivElement) {
		viewport = nextViewport;
		container = nextContainer;
		bindObservers();
		scheduleMeasurement();
	}

	function scrollByItem(offset: -1 | 1) {
		if (!viewport) return;
		const items = getItems(container);
		if (items.length === 0) return;
		const axis = orientation();
		const position = Math.max(0, getLogicalScrollPosition(viewport, axis));
		const currentIndex = Math.min(items.length - 1, Math.max(0, getCarouselSelectedIndex(position, getCarouselScrollSize(viewport, axis))));
		const target = items[Math.min(items.length - 1, Math.max(0, currentIndex + offset))];
		setScrollPosition(viewport, axis, getCarouselItemScrollPosition(items[0], target, axis));
	}

	const context: CarouselContextValue = {
		orientation,
		canScrollPrevious,
		canScrollNext,
		selectedIndex,
		registerViewport,
		handleScroll: measure,
		scrollPrevious: () => scrollByItem(-1),
		scrollNext: () => scrollByItem(1),
	};

	createEffect(() => {
		orientation();
		scheduleMeasurement();
	});

	onMount(() => {
		mounted = true;
		bindObservers();
		scheduleMeasurement();
		onCleanup(() => {
			mounted = false;
			cancelMeasurement();
			resizeObserver?.disconnect();
			mutationObserver?.disconnect();
		});
	});

	return (
		<CarouselContext.Provider value={context}>
			<div
				{...rest}
				ref={local.ref}
				role="region"
				aria-roledescription="carousel"
				data-slot="carousel"
				data-orientation={orientation()}
				data-selected-index={selectedIndex()}
				class={`${styles[carouselStyleKeys.root]} ${local.class ?? ''}`}
				onKeyDown={(event) => {
					invokeEventHandler(local.onKeyDown, event);
					if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
					if (isInteractiveKeyboardTarget(event.target, event.currentTarget)) return;
					const previousKey = orientation() === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
					const nextKey = orientation() === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
					if (event.key === previousKey) {
						event.preventDefault();
						context.scrollPrevious();
					} else if (event.key === nextKey) {
						event.preventDefault();
						context.scrollNext();
					}
				}}>
				{local.children}
			</div>
		</CarouselContext.Provider>
	);
}

export interface CarouselContentProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CarouselRef<HTMLDivElement>;
	/** 直接应用到滚动视口，适用于约束垂直轮播高度。 */
	viewportStyle?: JSX.CSSProperties | string;
}

export function CarouselContent(props: ParentProps<CarouselContentProps>) {
	const carousel = useCarousel();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'onScroll', 'viewportStyle']);
	let viewport: HTMLDivElement | undefined;
	let container: HTMLDivElement | undefined;
	onCleanup(() => {
		if (viewport) carousel.registerViewport(undefined);
	});
	return (
		<div
			ref={(element) => {
				viewport = element;
				local.ref?.(element);
				if (container) carousel.registerViewport(element, container);
			}}
			data-slot="carousel-content"
			class={styles[carouselStyleKeys.viewport]}
			style={local.viewportStyle}
			onScroll={(event) => {
				invokeEventHandler(local.onScroll, event);
				carousel.handleScroll();
			}}>
			<div
				{...rest}
				ref={(element) => {
					container = element;
					if (viewport) carousel.registerViewport(viewport, element);
				}}
				data-slot="carousel-container"
				class={`${styles[carouselStyleKeys.container]} ${local.class ?? ''}`}>
				{local.children}
			</div>
		</div>
	);
}

export interface CarouselItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'ref'> {
	ref?: CarouselRef<HTMLDivElement>;
}

export function CarouselItem(props: ParentProps<CarouselItemProps>) {
	useCarousel();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	return (
		<div {...rest} ref={local.ref} role="group" aria-roledescription="slide" data-slot="carousel-item" class={`${styles[carouselStyleKeys.item]} ${local.class ?? ''}`}>
			{local.children}
		</div>
	);
}

function PreviousIcon() {
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
			<path d="M19 12H5" />
			<path d="m12 19-7-7 7-7" />
		</svg>
	);
}

function NextIcon() {
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
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	);
}

const srOnlyStyle: JSX.CSSProperties = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	'white-space': 'nowrap',
	'border-width': '0',
};

export interface CarouselPreviousProps extends Omit<ButtonProps, 'ref'> {
	ref?: CarouselRef<HTMLButtonElement>;
}

export function CarouselPrevious(props: ParentProps<CarouselPreviousProps>) {
	const carousel = useCarousel();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'variant', 'size', 'disabled', 'onClick']);
	return (
		<Button
			{...rest}
			ref={local.ref}
			variant={local.variant ?? 'outline'}
			size={local.size ?? 'icon'}
			data-slot="carousel-previous"
			class={`${styles[carouselStyleKeys.previous]} ${local.class ?? ''}`}
			disabled={(local.disabled ?? false) || !carousel.canScrollPrevious()}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !local.disabled && carousel.canScrollPrevious()) carousel.scrollPrevious();
			}}>
			{local.children ?? (
				<>
					<PreviousIcon />
					<span style={srOnlyStyle}>Previous slide</span>
				</>
			)}
		</Button>
	);
}

export interface CarouselNextProps extends Omit<ButtonProps, 'ref'> {
	ref?: CarouselRef<HTMLButtonElement>;
}

export function CarouselNext(props: ParentProps<CarouselNextProps>) {
	const carousel = useCarousel();
	const [local, rest] = splitProps(props, ['class', 'children', 'ref', 'variant', 'size', 'disabled', 'onClick']);
	return (
		<Button
			{...rest}
			ref={local.ref}
			variant={local.variant ?? 'outline'}
			size={local.size ?? 'icon'}
			data-slot="carousel-next"
			class={`${styles[carouselStyleKeys.next]} ${local.class ?? ''}`}
			disabled={(local.disabled ?? false) || !carousel.canScrollNext()}
			onClick={(event) => {
				invokeEventHandler(local.onClick, event);
				if (!event.defaultPrevented && !local.disabled && carousel.canScrollNext()) carousel.scrollNext();
			}}>
			{local.children ?? (
				<>
					<NextIcon />
					<span style={srOnlyStyle}>Next slide</span>
				</>
			)}
		</Button>
	);
}

export default Carousel;
