import { defineComponent, h, inject, onMounted, provide, ref, computed, type InjectionKey, type PropType, type Ref } from 'vue';
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
import type { CarouselOrientation } from '@tile-ui/core';
import { Button } from '../button';
import styles from '@tile-ui/styles/scss/components/carousel.module.scss';

interface CarouselContextValue {
	orientation: Ref<CarouselOrientation>;
	viewportRef: Ref<HTMLElement | null>;
	handleScroll: () => void;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: Ref<boolean>;
	canScrollNext: Ref<boolean>;
	selectedIndex: Ref<number>;
}

const CarouselContextKey: InjectionKey<CarouselContextValue> = Symbol('tile-carousel');

function useCarousel(): CarouselContextValue {
	const context = inject(CarouselContextKey);
	if (!context) {
		throw new Error('轮播子组件必须在 <Carousel> 内使用');
	}
	return context;
}

function renderArrowIcon(left: boolean) {
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
		left ? [h('path', { d: 'M19 12H5' }), h('path', { d: 'm12 19-7-7 7-7' })] : [h('path', { d: 'M5 12h14' }), h('path', { d: 'm12 5 7 7-7 7' })],
	);
}

const srOnlyStyle = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	borderWidth: 0,
};

export const Carousel = defineComponent({
	name: 'Carousel',
	props: {
		orientation: { type: String as PropType<CarouselOrientation>, default: 'horizontal' },
	},
	setup(props, { slots, attrs }) {
		const viewportRef = ref<HTMLElement | null>(null);
		const canScrollPrev = ref(false);
		const canScrollNext = ref(false);
		const selectedIndex = ref(0);
		const orientation = computed(() => props.orientation);

		function handleScroll() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const pos = orientation.value;
			const position = getCarouselScrollPosition(viewport, pos);
			const maxScroll = getCarouselMaxScroll(viewport, pos);
			const itemSize = getCarouselScrollSize(viewport, pos);
			canScrollPrev.value = getCarouselCanScrollPrev(position);
			canScrollNext.value = getCarouselCanScrollNext(position, maxScroll);
			selectedIndex.value = getCarouselSelectedIndex(position, itemSize);
		}

		function scrollPrev() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const pos = orientation.value;
			const items = Array.from(viewport.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
			if (items.length === 0) {
				return;
			}
			const position = getCarouselScrollPosition(viewport, pos);
			const currentIndex = getCarouselSelectedIndex(position, getCarouselScrollSize(viewport, pos));
			const target = items[Math.max(0, currentIndex - 1)];
			const targetPosition = getCarouselItemScrollPosition(items[0], target, pos);
			if (pos === 'horizontal') {
				viewport.scrollTo({ left: targetPosition, behavior: 'smooth' });
			} else {
				viewport.scrollTo({ top: targetPosition, behavior: 'smooth' });
			}
		}

		function scrollNext() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const pos = orientation.value;
			const items = Array.from(viewport.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
			if (items.length === 0) {
				return;
			}
			const position = getCarouselScrollPosition(viewport, pos);
			const currentIndex = getCarouselSelectedIndex(position, getCarouselScrollSize(viewport, pos));
			const target = items[Math.min(items.length - 1, currentIndex + 1)];
			const targetPosition = getCarouselItemScrollPosition(items[0], target, pos);
			if (pos === 'horizontal') {
				viewport.scrollTo({ left: targetPosition, behavior: 'smooth' });
			} else {
				viewport.scrollTo({ top: targetPosition, behavior: 'smooth' });
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			const isHorizontal = orientation.value === 'horizontal';
			if (event.key === (isHorizontal ? 'ArrowLeft' : 'ArrowUp')) {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === (isHorizontal ? 'ArrowRight' : 'ArrowDown')) {
				event.preventDefault();
				scrollNext();
			}
		}

		provide(CarouselContextKey, {
			orientation,
			viewportRef,
			handleScroll,
			scrollPrev,
			scrollNext,
			canScrollPrev,
			canScrollNext,
			selectedIndex,
		});

		return () =>
			h(
				'div',
				{
					...attrs,
					role: 'region',
					'aria-roledescription': 'carousel',
					'data-slot': 'carousel',
					'data-orientation': props.orientation,
					class: [styles[carouselStyleKeys.root], attrs.class],
					onKeydown: handleKeyDown,
				},
				slots.default?.(),
			);
	},
});

export const CarouselContent = defineComponent({
	name: 'CarouselContent',
	setup(_props, { slots, attrs }) {
		const { viewportRef, handleScroll } = useCarousel();

		onMounted(() => {
			handleScroll();
		});

		return () =>
			h(
				'div',
				{
					ref: viewportRef,
					'data-slot': 'carousel-content',
					onScroll: handleScroll,
					class: styles[carouselStyleKeys.viewport],
				},
				[h('div', { ...attrs, class: [styles[carouselStyleKeys.container], attrs.class] }, slots.default?.())],
			);
	},
});

export const CarouselItem = defineComponent({
	name: 'CarouselItem',
	setup(_props, { slots, attrs }) {
		return () =>
			h(
				'div',
				{
					...attrs,
					role: 'group',
					'aria-roledescription': 'slide',
					'data-slot': 'carousel-item',
					class: [styles[carouselStyleKeys.item], attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const CarouselPrevious = defineComponent({
	name: 'CarouselPrevious',
	setup(_props, { slots, attrs }) {
		const { scrollPrev, canScrollPrev } = useCarousel();

		return () =>
			h(
				Button,
				{
					...attrs,
					variant: 'outline',
					size: 'icon',
					'data-slot': 'carousel-previous',
					class: [styles[carouselStyleKeys.previous], attrs.class],
					disabled: !canScrollPrev.value,
					onClick: scrollPrev,
				},
				[slots.default?.() ?? [renderArrowIcon(true), h('span', { style: srOnlyStyle }, 'Previous slide')]],
			);
	},
});

export const CarouselNext = defineComponent({
	name: 'CarouselNext',
	setup(_props, { slots, attrs }) {
		const { scrollNext, canScrollNext } = useCarousel();

		return () =>
			h(
				Button,
				{
					...attrs,
					variant: 'outline',
					size: 'icon',
					'data-slot': 'carousel-next',
					class: [styles[carouselStyleKeys.next], attrs.class],
					disabled: !canScrollNext.value,
					onClick: scrollNext,
				},
				[slots.default?.() ?? [renderArrowIcon(false), h('span', { style: srOnlyStyle }, 'Next slide')]],
			);
	},
});

export default Carousel;
