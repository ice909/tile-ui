import { createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps, useContext, type Accessor, type JSX, type ParentProps } from 'solid-js';
import { getScrollBarSizeKey, scrollAreaStyleKeys } from '@tile-ui/core';
import type { ScrollAreaBaseProps, ScrollBarBaseProps, ScrollBarOrientation } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils/events';
import styles from '@tile-ui/styles/scss/components/scroll-area.module.scss';

interface ScrollAreaContextValue {
	viewport: Accessor<HTMLDivElement | undefined>;
	viewportId: string;
	setViewport: (element: HTMLDivElement | undefined) => void;
}

interface ScrollBarMetrics {
	size: number;
	offset: number;
	visible: boolean;
}

const ScrollAreaContext = createContext<ScrollAreaContextValue>();

function useScrollAreaContext() {
	const context = useContext(ScrollAreaContext);
	if (!context) throw new Error('ScrollBar must be used within <ScrollArea>.');
	return context;
}

function assignRef<T>(ref: unknown, element: T) {
	if (typeof ref === 'function') (ref as (element: T) => void)(element);
}

export interface ScrollAreaProps extends JSX.HTMLAttributes<HTMLDivElement>, ScrollAreaBaseProps {}

/** SolidJS ScrollArea：保留原生滚动视口并提供可选的自定义滚动条。 */
export function ScrollArea(props: ParentProps<ScrollAreaProps>) {
	const [local, rest] = splitProps(props, ['class', 'children', 'ref']);
	const [viewport, setViewport] = createSignal<HTMLDivElement>();
	const viewportId = `tile-solid-scroll-area-${createUniqueId()}-viewport`;

	return (
		<ScrollAreaContext.Provider value={{ viewport, viewportId, setViewport }}>
			<div {...rest} ref={(element) => assignRef(local.ref, element)} data-slot="scroll-area" class={`${styles[scrollAreaStyleKeys.root]} ${local.class ?? ''}`}>
				<div id={viewportId} ref={setViewport} tabIndex={0} data-slot="scroll-area-viewport" class={styles[scrollAreaStyleKeys.viewport]}>
					{local.children}
				</div>
			</div>
		</ScrollAreaContext.Provider>
	);
}

export interface ScrollBarProps extends JSX.HTMLAttributes<HTMLDivElement>, ScrollBarBaseProps {}

/** SolidJS ScrollBar：根据原生视口几何同步滚动拇指并支持指针拖动。 */
export function ScrollBar(props: ScrollBarProps) {
	const context = useScrollAreaContext();
	const [local, rest] = splitProps(props, [
		'class',
		'style',
		'ref',
		'orientation',
		'tabIndex',
		'onKeyDown',
		'onPointerDown',
		'onPointerMove',
		'onPointerUp',
		'onPointerCancel',
		'onLostPointerCapture',
	]);
	const orientation = (): ScrollBarOrientation => local.orientation ?? 'vertical';
	const [metrics, setMetrics] = createSignal<ScrollBarMetrics>({ size: 0, offset: 0, visible: false });
	let track: HTMLDivElement | undefined;
	let activePointer: number | undefined;
	let pointerToThumbOffset = 0;
	let fallbackListening = false;

	function geometry() {
		const viewport = context.viewport();
		if (!track || !viewport) return;
		const vertical = orientation() === 'vertical';
		const trackSize = vertical ? track.clientHeight : track.clientWidth;
		const visibleSize = vertical ? viewport.clientHeight : viewport.clientWidth;
		const totalSize = vertical ? viewport.scrollHeight : viewport.scrollWidth;
		const scrollable = Math.max(0, totalSize - visibleSize);
		const size = trackSize > 0 && totalSize > 0 ? Math.min(trackSize, Math.max(24, (visibleSize / totalSize) * trackSize)) : 0;
		const maxOffset = Math.max(0, trackSize - size);
		const scrollPosition = vertical ? viewport.scrollTop : viewport.scrollLeft;
		const offset = scrollable > 0 && maxOffset > 0 ? Math.min(maxOffset, Math.max(0, (scrollPosition / scrollable) * maxOffset)) : 0;
		setMetrics({ size, offset, visible: scrollable > 0 && trackSize > 0 });
	}

	function hasCapture(pointerId: number) {
		if (!track?.hasPointerCapture) return false;
		try {
			return track.hasPointerCapture(pointerId);
		} catch {
			return false;
		}
	}

	function releaseCapture(pointerId: number) {
		if (!track?.releasePointerCapture || !hasCapture(pointerId)) return;
		try {
			track.releasePointerCapture(pointerId);
		} catch {
			// Pointer capture can disappear when a node is detached.
		}
	}

	function removeFallbackListeners() {
		if (!fallbackListening || typeof document === 'undefined') return;
		fallbackListening = false;
		document.removeEventListener('pointermove', handleFallbackPointerMove);
		document.removeEventListener('pointerup', handleFallbackPointerUp);
		document.removeEventListener('pointercancel', handleFallbackPointerCancel);
	}

	function finishDrag(pointerId: number, release: boolean) {
		if (activePointer !== pointerId) return;
		activePointer = undefined;
		pointerToThumbOffset = 0;
		removeFallbackListeners();
		if (release) releaseCapture(pointerId);
	}

	function isTrackTarget(event: PointerEvent) {
		return event.target instanceof Node && !!track?.contains(event.target);
	}

	function handleFallbackPointerMove(event: PointerEvent) {
		if (isTrackTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerMove, event);
		if (!event.defaultPrevented) setScrollFromPointer(event);
	}

	function handleFallbackPointerUp(event: PointerEvent) {
		if (isTrackTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerUp, event);
		finishDrag(event.pointerId, false);
	}

	function handleFallbackPointerCancel(event: PointerEvent) {
		if (isTrackTarget(event) || activePointer !== event.pointerId) return;
		invokeEventHandler(local.onPointerCancel, event);
		finishDrag(event.pointerId, false);
	}

	function addFallbackListeners() {
		if (fallbackListening || typeof document === 'undefined') return;
		fallbackListening = true;
		document.addEventListener('pointermove', handleFallbackPointerMove);
		document.addEventListener('pointerup', handleFallbackPointerUp);
		document.addEventListener('pointercancel', handleFallbackPointerCancel);
	}

	function setScrollFromPointer(event: PointerEvent) {
		const viewport = context.viewport();
		if (!track || !viewport) return;
		const vertical = orientation() === 'vertical';
		const rect = track.getBoundingClientRect();
		const trackStart = vertical ? rect.top : rect.left;
		const trackSize = vertical ? rect.height : rect.width;
		const current = metrics();
		const maxOffset = Math.max(0, trackSize - current.size);
		const pointerPosition = vertical ? event.clientY : event.clientX;
		const offset = Math.min(maxOffset, Math.max(0, pointerPosition - trackStart - pointerToThumbOffset));
		const scrollable = vertical ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
		if (maxOffset <= 0 || scrollable <= 0) return;
		if (vertical) viewport.scrollTop = (offset / maxOffset) * scrollable;
		else viewport.scrollLeft = (offset / maxOffset) * scrollable;
		geometry();
	}

	onMount(() => {
		const viewport = context.viewport();
		if (!track || !viewport) return;
		const update = () => geometry();
		viewport.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		let observer: ResizeObserver | undefined;
		let mutationObserver: MutationObserver | undefined;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(update);
			observer.observe(viewport);
			observer.observe(track);
			for (const child of viewport.children) observer.observe(child);
			if (typeof MutationObserver !== 'undefined') {
				mutationObserver = new MutationObserver(() => {
					observer?.disconnect();
					observer?.observe(viewport);
					if (track) observer?.observe(track);
					for (const child of viewport.children) observer?.observe(child);
					update();
				});
				mutationObserver.observe(viewport, { childList: true, subtree: true });
			}
		}
		geometry();
		onCleanup(() => {
			viewport.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			observer?.disconnect();
			mutationObserver?.disconnect();
			if (activePointer !== undefined) finishDrag(activePointer, true);
			removeFallbackListeners();
		});
	});

	createEffect(() => {
		orientation();
		geometry();
	});

	function setScrollPosition(position: number) {
		const viewport = context.viewport();
		if (!viewport) return;
		const vertical = orientation() === 'vertical';
		const maximum = Math.max(0, vertical ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth);
		const next = Math.min(maximum, Math.max(0, position));
		if (vertical) viewport.scrollTop = next;
		else viewport.scrollLeft = next;
		geometry();
	}

	function scrollPosition() {
		metrics();
		const viewport = context.viewport();
		if (!viewport) return 0;
		return orientation() === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;
	}

	function scrollMaximum() {
		metrics();
		const viewport = context.viewport();
		if (!viewport) return 0;
		return Math.max(0, orientation() === 'vertical' ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth);
	}

	function pageSize() {
		const viewport = context.viewport();
		if (!viewport) return 0;
		return orientation() === 'vertical' ? viewport.clientHeight : viewport.clientWidth;
	}

	const available = () => metrics().visible;
	const internalStyle = (): JSX.CSSProperties => ({
		opacity: available() ? 1 : 0,
		visibility: available() ? 'visible' : 'hidden',
		'pointer-events': available() ? 'auto' : 'none',
	});
	const internalStyleText = () => `opacity:${available() ? 1 : 0};visibility:${available() ? 'visible' : 'hidden'};pointer-events:${available() ? 'auto' : 'none'}`;
	const mergedStyle = (): JSX.CSSProperties => Object.assign({}, typeof local.style === 'object' ? local.style : undefined, internalStyle());
	const thumbStyle = () =>
		orientation() === 'vertical'
			? { height: `${metrics().size}px`, transform: `translateY(${metrics().offset}px)` }
			: { width: `${metrics().size}px`, transform: `translateX(${metrics().offset}px)` };

	return (
		<div
			{...rest}
			ref={(element) => {
				track = element;
				assignRef(local.ref, element);
			}}
			data-slot="scroll-area-scrollbar"
			data-orientation={orientation()}
			data-visible={available()}
			role={available() ? 'scrollbar' : undefined}
			tabIndex={available() ? (local.tabIndex ?? 0) : -1}
			aria-hidden={available() ? undefined : true}
			aria-controls={available() ? context.viewportId : undefined}
			aria-orientation={available() ? orientation() : undefined}
			aria-valuemin={available() ? 0 : undefined}
			aria-valuemax={available() ? scrollMaximum() : undefined}
			aria-valuenow={available() ? scrollPosition() : undefined}
			class={`${styles[scrollAreaStyleKeys.scrollbar]} ${styles[getScrollBarSizeKey(orientation())]} ${local.class ?? ''}`}
			style={typeof local.style === 'string' ? `${local.style};${internalStyleText()}` : mergedStyle()}
			onKeyDown={(event) => {
				invokeEventHandler(local.onKeyDown, event);
				if (event.defaultPrevented || !available()) return;
				const current = scrollPosition();
				const page = pageSize();
				const vertical = orientation() === 'vertical';
				let next: number | undefined;
				switch (event.key) {
					case 'Home':
						next = 0;
						break;
					case 'End':
						next = scrollMaximum();
						break;
					case 'PageUp':
						next = current - page;
						break;
					case 'PageDown':
						next = current + page;
						break;
					case 'ArrowUp':
						next = vertical ? current - 40 : undefined;
						break;
					case 'ArrowDown':
						next = vertical ? current + 40 : undefined;
						break;
					case 'ArrowLeft':
						next = vertical ? undefined : current - 40;
						break;
					case 'ArrowRight':
						next = vertical ? undefined : current + 40;
						break;
				}
				if (next !== undefined) {
					event.preventDefault();
					setScrollPosition(next);
				}
			}}
			onPointerDown={(event) => {
				invokeEventHandler(local.onPointerDown, event);
				if (event.defaultPrevented || event.button !== 0 || !event.isPrimary || !track || !metrics().visible) return;
				const vertical = orientation() === 'vertical';
				const rect = track.getBoundingClientRect();
				const pointerPosition = vertical ? event.clientY - rect.top : event.clientX - rect.left;
				const thumb = (event.target as Element | null)?.closest?.('[data-slot="scroll-area-thumb"]');
				pointerToThumbOffset = thumb ? pointerPosition - metrics().offset : metrics().size / 2;
				activePointer = event.pointerId;
				try {
					track.setPointerCapture?.(event.pointerId);
				} catch {
					// Drag still performs its initial update when capture is unavailable.
				}
				if (!hasCapture(event.pointerId)) addFallbackListeners();
				setScrollFromPointer(event);
			}}
			onPointerMove={(event) => {
				invokeEventHandler(local.onPointerMove, event);
				if (!event.defaultPrevented && activePointer === event.pointerId && (hasCapture(event.pointerId) || fallbackListening)) setScrollFromPointer(event);
			}}
			onPointerUp={(event) => {
				invokeEventHandler(local.onPointerUp, event);
				finishDrag(event.pointerId, true);
			}}
			onPointerCancel={(event) => {
				invokeEventHandler(local.onPointerCancel, event);
				finishDrag(event.pointerId, true);
			}}
			onLostPointerCapture={(event) => {
				invokeEventHandler(local.onLostPointerCapture, event);
				finishDrag(event.pointerId, false);
			}}>
			<div data-slot="scroll-area-thumb" class={styles[scrollAreaStyleKeys.thumb]} style={thumbStyle()} />
		</div>
	);
}

export default ScrollArea;
