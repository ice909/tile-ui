import { defineComponent, h, inject, provide, ref, type InjectionKey, type PropType, type Ref } from 'vue';
import {
	carouselStyleKeys,
	getCarouselCanScrollNext,
	getCarouselCanScrollPrev,
	getCarouselMaxScroll,
	getCarouselScrollPosition,
	getCarouselScrollSize,
	getCarouselSelectedIndex,
} from '@tile-ui/core';
import type { CarouselOrientation } from '@tile-ui/core';
import { TButton } from '../button';
import styles from '@tile-ui/styles/scss/components/carousel.module.scss';

interface CarouselContextValue {
	orientation: CarouselOrientation;
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
		throw new Error('轮播子组件必须在 <TCarousel> 内使用');
	}
	return context;
}

function renderArrowIcon() {
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
		[h('path', { d: 'M5 12h14' }), h('path', { d: 'm12 5 7 7-7 7' })],
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

export const TCarousel = defineComponent({
	name: 'TCarousel',
	props: {
		orientation: { type: String as PropType<CarouselOrientation>, default: 'horizontal' },
	},
	setup(props, { slots, attrs }) {
		const viewportRef = ref<HTMLElement | null>(null);
		const canScrollPrev = ref(false);
		const canScrollNext = ref(false);
		const selectedIndex = ref(0);

		function handleScroll() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const position = getCarouselScrollPosition(viewport, props.orientation);
			const maxScroll = getCarouselMaxScroll(viewport, props.orientation);
			const itemSize = getCarouselScrollSize(viewport, props.orientation);
			canScrollPrev.value = getCarouselCanScrollPrev(position);
			canScrollNext.value = getCarouselCanScrollNext(position, maxScroll);
			selectedIndex.value = getCarouselSelectedIndex(position, itemSize);
		}

		function scrollPrev() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const size = getCarouselScrollSize(viewport, props.orientation);
			if (props.orientation === 'horizontal') {
				viewport.scrollBy({ left: -size, behavior: 'smooth' });
			} else {
				viewport.scrollBy({ top: -size, behavior: 'smooth' });
			}
		}

		function scrollNext() {
			const viewport = viewportRef.value;
			if (!viewport) {
				return;
			}
			const size = getCarouselScrollSize(viewport, props.orientation);
			if (props.orientation === 'horizontal') {
				viewport.scrollBy({ left: size, behavior: 'smooth' });
			} else {
				viewport.scrollBy({ top: size, behavior: 'smooth' });
			}
		}

		provide(CarouselContextKey, {
			orientation: props.orientation,
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
				},
				slots.default?.(),
			);
	},
});

export const TCarouselContent = defineComponent({
	name: 'TCarouselContent',
	setup(_props, { slots, attrs }) {
		const { viewportRef, handleScroll } = useCarousel();

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

export const TCarouselItem = defineComponent({
	name: 'TCarouselItem',
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

export const TCarouselPrevious = defineComponent({
	name: 'TCarouselPrevious',
	setup(_props, { slots, attrs }) {
		const { scrollPrev, canScrollPrev } = useCarousel();

		return () =>
			h(
				TButton,
				{
					...attrs,
					variant: 'outline',
					size: 'icon',
					'data-slot': 'carousel-previous',
					class: [styles[carouselStyleKeys.previous], attrs.class],
					disabled: !canScrollPrev.value,
					onClick: scrollPrev,
				},
				[slots.default?.() ?? [renderArrowIcon(), h('span', { style: srOnlyStyle }, 'Previous slide')]],
			);
	},
});

export const TCarouselNext = defineComponent({
	name: 'TCarouselNext',
	setup(_props, { slots, attrs }) {
		const { scrollNext, canScrollNext } = useCarousel();

		return () =>
			h(
				TButton,
				{
					...attrs,
					variant: 'outline',
					size: 'icon',
					'data-slot': 'carousel-next',
					class: [styles[carouselStyleKeys.next], attrs.class],
					disabled: !canScrollNext.value,
					onClick: scrollNext,
				},
				[slots.default?.() ?? [renderArrowIcon(), h('span', { style: srOnlyStyle }, 'Next slide')]],
			);
	},
});

export default TCarousel;
