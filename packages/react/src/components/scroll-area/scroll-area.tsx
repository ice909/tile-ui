import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getScrollBarSizeKey, scrollAreaStyleKeys } from '@tile-ui/core';
import type { ScrollAreaBaseProps, ScrollBarBaseProps } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/scroll-area.module.scss';

interface ScrollAreaContextValue {
	viewportRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

function useScrollAreaContext(): ScrollAreaContextValue {
	const context = useContext(ScrollAreaContext);
	if (!context) {
		throw new Error('ScrollArea sub-components must be used within <ScrollArea>.');
	}
	return context;
}

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement>, ScrollAreaBaseProps {}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(({ className = '', children, ...props }, ref) => {
	const viewportRef = useRef<HTMLDivElement | null>(null);

	return (
		<ScrollAreaContext.Provider value={{ viewportRef }}>
			<div ref={ref} className={`${styles[scrollAreaStyleKeys.root]} ${className}`} {...props}>
				<div ref={viewportRef} tabIndex={0} className={styles[scrollAreaStyleKeys.viewport]}>
					{children}
				</div>
			</div>
		</ScrollAreaContext.Provider>
	);
});
ScrollArea.displayName = 'ScrollArea';

interface ScrollBarMetrics {
	size: number;
	offset: number;
	visible: boolean;
}

export interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement>, ScrollBarBaseProps {}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(({ className = '', orientation = 'vertical', ...props }, ref) => {
	const context = useScrollAreaContext();
	const trackRef = useRef<HTMLDivElement | null>(null);
	const dragRef = useRef<number | null>(null);
	const [metrics, setMetrics] = useState<ScrollBarMetrics>({ size: 0, offset: 0, visible: false });
	const isVertical = orientation === 'vertical';

	useEffect(() => {
		const viewport = context.viewportRef.current;
		const track = trackRef.current;
		if (!viewport || !track) {
			return;
		}

		function update() {
			const track = trackRef.current;
			const viewport = context.viewportRef.current;
			if (!track || !viewport) {
				return;
			}
			const trackSize = isVertical ? track.clientHeight : track.clientWidth;
			const scrollable = isVertical ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
			const visibleSize = isVertical ? viewport.clientHeight : viewport.clientWidth;
			const total = visibleSize + scrollable;
			const size = total > 0 ? Math.max((visibleSize / total) * trackSize, 24) : 0;
			const maxOffset = trackSize - size;
			const scrollPos = isVertical ? viewport.scrollTop : viewport.scrollLeft;
			const offset = scrollable > 0 && maxOffset > 0 ? (scrollPos / scrollable) * maxOffset : 0;
			setMetrics({ size, offset, visible: scrollable > 0 });
		}

		update();
		viewport.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		const observer = new ResizeObserver(update);
		observer.observe(viewport);
		observer.observe(track);

		return () => {
			viewport.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			observer.disconnect();
		};
	}, [context.viewportRef, isVertical]);

	function scrollToOffset(offset: number) {
		const track = trackRef.current;
		const viewport = context.viewportRef.current;
		if (!track || !viewport) {
			return;
		}
		const trackSize = isVertical ? track.clientHeight : track.clientWidth;
		const maxOffset = trackSize - metrics.size;
		const scrollable = isVertical ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
		if (maxOffset <= 0 || scrollable <= 0) {
			return;
		}
		const ratio = offset / maxOffset;
		if (isVertical) {
			viewport.scrollTop = ratio * scrollable;
		} else {
			viewport.scrollLeft = ratio * scrollable;
		}
	}

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		const track = trackRef.current;
		if (!track) {
			return;
		}
		track.setPointerCapture(event.pointerId);
		const rect = track.getBoundingClientRect();
		const pos = isVertical ? event.clientY : event.clientX;
		const trackStart = isVertical ? rect.top : rect.left;
		const trackSize = isVertical ? rect.height : rect.width;
		const maxOffset = trackSize - metrics.size;
		const offset = Math.min(Math.max(0, pos - trackStart - metrics.size / 2), maxOffset);
		dragRef.current = offset;
		scrollToOffset(offset);
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const dragOffset = dragRef.current;
		const track = trackRef.current;
		if (dragOffset === null || !track || !track.hasPointerCapture(event.pointerId)) {
			return;
		}
		const rect = track.getBoundingClientRect();
		const pos = isVertical ? event.clientY : event.clientX;
		const trackStart = isVertical ? rect.top : rect.left;
		const trackSize = isVertical ? rect.height : rect.width;
		const maxOffset = trackSize - metrics.size;
		const offset = Math.min(Math.max(0, pos - trackStart - metrics.size / 2), maxOffset);
		dragRef.current = offset;
		scrollToOffset(offset);
	}

	function handlePointerUp() {
		dragRef.current = null;
	}

	function setTrackRef(element: HTMLDivElement | null) {
		trackRef.current = element;

		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	return (
		<div
			{...props}
			ref={setTrackRef}
			data-orientation={orientation}
			className={`${styles[scrollAreaStyleKeys.scrollbar]} ${styles[getScrollBarSizeKey(orientation)]} ${className}`}
			style={{ opacity: metrics.visible ? 1 : 0 }}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}>
			<div
				className={styles[scrollAreaStyleKeys.thumb]}
				style={
					isVertical
						? { height: `${metrics.size}px`, transform: `translateY(${metrics.offset}px)` }
						: { width: `${metrics.size}px`, transform: `translateX(${metrics.offset}px)` }
				}
			/>
		</div>
	);
});
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea, ScrollBar };
export default ScrollArea;
