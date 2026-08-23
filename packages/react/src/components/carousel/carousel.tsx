import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/carousel.module.scss';

interface CarouselContextValue {
	orientation: CarouselOrientation;
	setViewportRef: (element: HTMLDivElement | null) => void;
	handleScroll: () => void;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	selectedIndex: number;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel(): CarouselContextValue {
	const context = useContext(CarouselContext);
	if (!context) {
		throw new Error('Carousel sub-components must be used within <Carousel>.');
	}
	return context;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement>, CarouselBaseProps {}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(({ className = '', orientation = 'horizontal', children, ...props }, ref) => {
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const handleScroll = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		const position = getCarouselScrollPosition(viewport, orientation);
		const maxScroll = getCarouselMaxScroll(viewport, orientation);
		const itemSize = getCarouselScrollSize(viewport, orientation);
		setCanScrollPrev(getCarouselCanScrollPrev(position));
		setCanScrollNext(getCarouselCanScrollNext(position, maxScroll));
		setSelectedIndex(getCarouselSelectedIndex(position, itemSize));
	}, [orientation]);

	const setViewportRef = useCallback(
		(element: HTMLDivElement | null) => {
			viewportRef.current = element;
			if (element) {
				handleScroll();
			}
		},
		[handleScroll],
	);

	const scrollPrev = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		const items = Array.from(viewport.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
		if (items.length === 0) {
			return;
		}
		const position = getCarouselScrollPosition(viewport, orientation);
		const currentIndex = getCarouselSelectedIndex(position, getCarouselScrollSize(viewport, orientation));
		const target = items[Math.max(0, currentIndex - 1)];
		const targetPosition = getCarouselItemScrollPosition(items[0], target, orientation);
		if (orientation === 'horizontal') {
			viewport.scrollTo({ left: targetPosition, behavior: 'smooth' });
		} else {
			viewport.scrollTo({ top: targetPosition, behavior: 'smooth' });
		}
	}, [orientation]);

	const scrollNext = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		const items = Array.from(viewport.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
		if (items.length === 0) {
			return;
		}
		const position = getCarouselScrollPosition(viewport, orientation);
		const currentIndex = getCarouselSelectedIndex(position, getCarouselScrollSize(viewport, orientation));
		const target = items[Math.min(items.length - 1, currentIndex + 1)];
		const targetPosition = getCarouselItemScrollPosition(items[0], target, orientation);
		if (orientation === 'horizontal') {
			viewport.scrollTo({ left: targetPosition, behavior: 'smooth' });
		} else {
			viewport.scrollTo({ top: targetPosition, behavior: 'smooth' });
		}
	}, [orientation]);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		handleScroll();
		const observer = new ResizeObserver(() => handleScroll());
		observer.observe(viewport);
		return () => observer.disconnect();
	}, [handleScroll]);

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const isHorizontal = orientation === 'horizontal';
		if (event.key === (isHorizontal ? 'ArrowLeft' : 'ArrowUp')) {
			event.preventDefault();
			scrollPrev();
		} else if (event.key === (isHorizontal ? 'ArrowRight' : 'ArrowDown')) {
			event.preventDefault();
			scrollNext();
		}
	}

	return (
		<CarouselContext.Provider value={{ orientation, setViewportRef, handleScroll, scrollPrev, scrollNext, canScrollPrev, canScrollNext, selectedIndex }}>
			<div
				ref={ref}
				role="region"
				aria-roledescription="carousel"
				data-slot="carousel"
				data-orientation={orientation}
				onKeyDownCapture={handleKeyDown}
				className={`${styles[carouselStyleKeys.root]} ${className}`}
				{...props}>
				{children}
			</div>
		</CarouselContext.Provider>
	);
});
Carousel.displayName = 'Carousel';

export interface CarouselContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(({ className = '', children, ...props }, ref) => {
	const { setViewportRef, handleScroll } = useCarousel();

	function setRef(element: HTMLDivElement | null) {
		setViewportRef(element);
		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}

	return (
		<div ref={setRef} data-slot="carousel-content" onScroll={handleScroll} className={styles[carouselStyleKeys.viewport]}>
			<div className={`${styles[carouselStyleKeys.container]} ${className}`} {...props}>
				{children}
			</div>
		</div>
	);
});
CarouselContent.displayName = 'CarouselContent';

export interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(({ className = '', ...props }, ref) => {
	return <div ref={ref} role="group" aria-roledescription="slide" data-slot="carousel-item" className={`${styles[carouselStyleKeys.item]} ${className}`} {...props} />;
});
CarouselItem.displayName = 'CarouselItem';

export interface CarouselPreviousProps extends React.ComponentProps<typeof Button> {}

const CarouselPrevious = React.forwardRef<HTMLButtonElement, CarouselPreviousProps>(({ className = '', variant = 'outline', size = 'icon', ...props }, ref) => {
	const { scrollPrev, canScrollPrev } = useCarousel();

	return (
		<Button
			ref={ref}
			data-slot="carousel-previous"
			variant={variant}
			size={size}
			className={`${styles[carouselStyleKeys.previous]} ${className}`}
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			{...props}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true">
				<path d="M19 12H5" />
				<path d="m12 19-7-7 7-7" />
			</svg>
			<span
				style={{
					position: 'absolute',
					width: '1px',
					height: '1px',
					padding: 0,
					margin: '-1px',
					overflow: 'hidden',
					clip: 'rect(0,0,0,0)',
					whiteSpace: 'nowrap',
					borderWidth: 0,
				}}>
				Previous slide
			</span>
		</Button>
	);
});
CarouselPrevious.displayName = 'CarouselPrevious';

export interface CarouselNextProps extends React.ComponentProps<typeof Button> {}

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNextProps>(({ className = '', variant = 'outline', size = 'icon', ...props }, ref) => {
	const { scrollNext, canScrollNext } = useCarousel();

	return (
		<Button
			ref={ref}
			data-slot="carousel-next"
			variant={variant}
			size={size}
			className={`${styles[carouselStyleKeys.next]} ${className}`}
			disabled={!canScrollNext}
			onClick={scrollNext}
			{...props}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true">
				<path d="M5 12h14" />
				<path d="m12 5 7 7-7 7" />
			</svg>
			<span
				style={{
					position: 'absolute',
					width: '1px',
					height: '1px',
					padding: 0,
					margin: '-1px',
					overflow: 'hidden',
					clip: 'rect(0,0,0,0)',
					whiteSpace: 'nowrap',
					borderWidth: 0,
				}}>
				Next slide
			</span>
		</Button>
	);
});
CarouselNext.displayName = 'CarouselNext';

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
export default Carousel;
