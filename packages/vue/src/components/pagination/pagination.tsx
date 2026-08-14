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

export const TPagination = defineComponent({
	name: 'TPagination',
	setup(_props, { slots }) {
		return () => h('nav', { role: 'navigation', 'aria-label': 'pagination', class: styles[paginationStyleKeys.root] }, slots.default?.());
	},
});

export const TPaginationContent = defineComponent({
	name: 'TPaginationContent',
	setup(_props, { slots }) {
		return () => h('ul', { class: styles[paginationStyleKeys.content] }, slots.default?.());
	},
});

export const TPaginationItem = defineComponent({
	name: 'TPaginationItem',
	setup(_props, { slots }) {
		return () => h('li', { class: styles[paginationStyleKeys.item] }, slots.default?.());
	},
});

export const TPaginationLink = defineComponent({
	name: 'TPaginationLink',
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

export const TPaginationPrevious = defineComponent({
	name: 'TPaginationPrevious',
	setup(_props, { slots }) {
		return () =>
			h(
				'a',
				{
					'aria-label': 'Go to previous page',
					class: [styles[paginationStyleKeys.link], styles.sizeDefault, styles.gapSm],
				},
				[renderChevronLeft(), h('span', { class: styles.paginationHideSm }, slots.default?.() ?? 'Previous')],
			);
	},
});

export const TPaginationNext = defineComponent({
	name: 'TPaginationNext',
	setup(_props, { slots }) {
		return () =>
			h(
				'a',
				{
					'aria-label': 'Go to next page',
					class: [styles[paginationStyleKeys.link], styles.sizeDefault, styles.gapSm],
				},
				[h('span', { class: styles.paginationHideSm }, slots.default?.() ?? 'Next'), renderChevronRight()],
			);
	},
});

export const TPaginationEllipsis = defineComponent({
	name: 'TPaginationEllipsis',
	setup(_props) {
		return () =>
			h('span', { 'aria-hidden': 'true', class: styles[paginationStyleKeys.ellipsis] }, [
				renderMoreHorizontal(),
				h('span', { class: styles[paginationStyleKeys.srOnly] }, 'More pages'),
			]);
	},
});

export default TPagination;
