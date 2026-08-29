import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, provide, ref, type InjectionKey, type PropType, type Ref } from 'vue';
import { getScrollBarSizeKey, scrollAreaStyleKeys } from '@tile-ui/core';
import type { ScrollBarOrientation } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/scroll-area.module.scss';

const ScrollAreaContextKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('tile-scroll-area');

export const ScrollArea = defineComponent({
	name: 'ScrollArea',
	setup(_props, { slots, attrs }) {
		const viewportRef = ref<HTMLElement | null>(null);
		provide(ScrollAreaContextKey, viewportRef);

		return () =>
			h('div', { ...attrs, class: [styles[scrollAreaStyleKeys.root], attrs.class] }, [
				h('div', { ref: viewportRef, tabindex: '0', class: styles[scrollAreaStyleKeys.viewport] }, slots.default?.()),
			]);
	},
});

export const ScrollBar = defineComponent({
	name: 'ScrollBar',
	props: {
		orientation: {
			type: String as PropType<ScrollBarOrientation>,
			default: 'vertical',
		},
	},
	setup(props, { attrs }) {
		const viewportValue = inject(ScrollAreaContextKey);
		if (!viewportValue) {
			throw new Error('ScrollBar must be used within <ScrollArea>.');
		}
		const viewport: Ref<HTMLElement | null> = viewportValue;

		const trackRef = ref<HTMLElement | null>(null);
		const metrics = ref({ size: 0, offset: 0, visible: false });
		let dragOffset: number | null = null;
		let observer: ResizeObserver | null = null;
		let onScroll: (() => void) | null = null;
		let onResize: (() => void) | null = null;

		const isVertical = computed(() => props.orientation === 'vertical');

		function update() {
			const track = trackRef.value;
			const vp = viewport.value;
			if (!track || !vp) {
				return;
			}
			const trackSize = isVertical.value ? track.clientHeight : track.clientWidth;
			const scrollable = isVertical.value ? vp.scrollHeight - vp.clientHeight : vp.scrollWidth - vp.clientWidth;
			const visibleSize = isVertical.value ? vp.clientHeight : vp.clientWidth;
			const total = visibleSize + scrollable;
			const size = total > 0 ? Math.max((visibleSize / total) * trackSize, 24) : 0;
			const maxOffset = trackSize - size;
			const scrollPos = isVertical.value ? vp.scrollTop : vp.scrollLeft;
			const offset = scrollable > 0 && maxOffset > 0 ? (scrollPos / scrollable) * maxOffset : 0;
			metrics.value = { size, offset, visible: scrollable > 0 };
		}

		function scrollToOffset(offset: number) {
			const track = trackRef.value;
			const vp = viewport.value;
			if (!track || !vp) {
				return;
			}
			const trackSize = isVertical.value ? track.clientHeight : track.clientWidth;
			const maxOffset = trackSize - metrics.value.size;
			const scrollable = isVertical.value ? vp.scrollHeight - vp.clientHeight : vp.scrollWidth - vp.clientWidth;
			if (maxOffset <= 0 || scrollable <= 0) {
				return;
			}
			const ratio = offset / maxOffset;
			if (isVertical.value) {
				vp.scrollTop = ratio * scrollable;
			} else {
				vp.scrollLeft = ratio * scrollable;
			}
		}

		onMounted(() => {
			const vp = viewport.value;
			const track = trackRef.value;
			if (!vp || !track) {
				return;
			}

			update();
			onScroll = () => update();
			onResize = () => update();
			vp.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('resize', onResize);
			observer = new ResizeObserver(update);
			observer.observe(vp);
			observer.observe(track);
		});

		onBeforeUnmount(() => {
			const vp = viewport.value;
			if (vp && onScroll) {
				vp.removeEventListener('scroll', onScroll);
			}
			if (onResize) {
				window.removeEventListener('resize', onResize);
			}
			observer?.disconnect();
		});

		function handlePointerdown(event: PointerEvent) {
			const track = trackRef.value;
			if (!track) {
				return;
			}
			track.setPointerCapture(event.pointerId);
			const rect = track.getBoundingClientRect();
			const pos = isVertical.value ? event.clientY : event.clientX;
			const trackStart = isVertical.value ? rect.top : rect.left;
			const trackSize = isVertical.value ? rect.height : rect.width;
			const maxOffset = trackSize - metrics.value.size;
			const offset = Math.min(Math.max(0, pos - trackStart - metrics.value.size / 2), maxOffset);
			dragOffset = offset;
			scrollToOffset(offset);
		}

		function handlePointermove(event: PointerEvent) {
			if (dragOffset === null) {
				return;
			}
			const track = trackRef.value;
			if (!track || !track.hasPointerCapture(event.pointerId)) {
				return;
			}
			const rect = track.getBoundingClientRect();
			const pos = isVertical.value ? event.clientY : event.clientX;
			const trackStart = isVertical.value ? rect.top : rect.left;
			const trackSize = isVertical.value ? rect.height : rect.width;
			const maxOffset = trackSize - metrics.value.size;
			const offset = Math.min(Math.max(0, pos - trackStart - metrics.value.size / 2), maxOffset);
			dragOffset = offset;
			scrollToOffset(offset);
		}

		function handlePointerup() {
			dragOffset = null;
		}

		return () =>
			h(
				'div',
				{
					...attrs,
					ref: trackRef,
					class: [styles[scrollAreaStyleKeys.scrollbar], styles[getScrollBarSizeKey(props.orientation)], attrs.class],
					'data-orientation': props.orientation,
					style: { opacity: metrics.value.visible ? 1 : 0 },
					onPointerdown: handlePointerdown,
					onPointermove: handlePointermove,
					onPointerup: handlePointerup,
				},
				[
					h('div', {
						class: styles[scrollAreaStyleKeys.thumb],
						style: isVertical.value
							? { height: `${metrics.value.size}px`, transform: `translateY(${metrics.value.offset}px)` }
							: { width: `${metrics.value.size}px`, transform: `translateX(${metrics.value.offset}px)` },
					}),
				],
			);
	},
});

export default ScrollArea;
