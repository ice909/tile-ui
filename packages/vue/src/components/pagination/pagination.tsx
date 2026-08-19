import { defineComponent, h, type PropType } from 'vue';
import { getPaginationSizeKey, paginationStyleKeys } from '@tile-ui/core';
import type { PaginationSize } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/pagination.module.scss';

function renderChevronLeft() {
	return h(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
		},
		[h('path', { d: 'm15 18-6-6 6-6' })],
	);
}

function renderChevronRight() {
	return h(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
		},
		[h('path', { d: 'm9 18 6-6-6-6' })],
	);
}

function renderMoreHorizontal() {
	return h(
		'svg',
		{
			class: styles[paginationStyleKeys.ellipsisIcon],
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 24 24',
			fill: 'currentColor',
		},
		[h('circle', { cx: '12', cy: '12', r: '1' }), h('circle', { cx: '19', cy: '12', r: '1' }), h('circle', { cx: '5', cy: '12', r: '1' })],
	);
}

export const Pagination = defineComponent({
	name: 'Pagination',
	setup(_props, { slots, attrs }) {
		return () => h('nav', { ...attrs, role: 'navigation', 'aria-label': 'pagination', class: [styles[paginationStyleKeys.root], attrs.class] }, slots.default?.());
	},
});

export const PaginationContent = defineComponent({
	name: 'PaginationContent',
	setup(_props, { slots, attrs }) {
		return () => h('ul', { ...attrs, class: [styles[paginationStyleKeys.content], attrs.class] }, slots.default?.());
	},
});

export const PaginationItem = defineComponent({
	name: 'PaginationItem',
	setup(_props, { slots, attrs }) {
		return () => h('li', { ...attrs, class: [styles[paginationStyleKeys.item], attrs.class] }, slots.default?.());
	},
});

export const PaginationLink = defineComponent({
	name: 'PaginationLink',
	props: {
		href: String,
		isActive: { type: Boolean, default: false },
		size: {
			type: String as PropType<PaginationSize>,
			default: 'icon',
		},
	},
	setup(props, { slots, attrs }) {
		return () =>
			h(
				'a',
				{
					...attrs,
					href: props.href,
					'aria-current': props.isActive ? 'page' : undefined,
					'data-active': props.isActive,
					class: [styles[paginationStyleKeys.link], styles[getPaginationSizeKey(props.size)], props.isActive ? styles.isActive : '', attrs.class],
				},
				slots.default?.(),
			);
	},
});

export const PaginationPrevious = defineComponent({
	name: 'PaginationPrevious',
	setup(_props, { slots, attrs }) {
		return () =>
			h(
				'a',
				{
					...attrs,
					'aria-label': 'Go to previous page',
					class: [styles[paginationStyleKeys.link], styles.sizeDefault, styles.gapSm, attrs.class],
				},
				[renderChevronLeft(), h('span', { class: styles.paginationHideSm }, slots.default?.() ?? 'Previous')],
			);
	},
});

export const PaginationNext = defineComponent({
	name: 'PaginationNext',
	setup(_props, { slots, attrs }) {
		return () =>
			h(
				'a',
				{
					...attrs,
					'aria-label': 'Go to next page',
					class: [styles[paginationStyleKeys.link], styles.sizeDefault, styles.gapSm, attrs.class],
				},
				[h('span', { class: styles.paginationHideSm }, slots.default?.() ?? 'Next'), renderChevronRight()],
			);
	},
});

export const PaginationEllipsis = defineComponent({
	name: 'PaginationEllipsis',
	setup(_props, { slots, attrs }) {
		return () =>
			h('span', { ...attrs, 'aria-hidden': 'true', class: [styles[paginationStyleKeys.ellipsis], attrs.class] }, [
				renderMoreHorizontal(),
				h('span', { class: styles[paginationStyleKeys.srOnly] }, slots.default?.() ?? 'More pages'),
			]);
	},
});

export default Pagination;
