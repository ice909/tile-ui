import { defineComponent, h } from 'vue';
import { breadcrumbStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/breadcrumb.module.scss';

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
			class: styles[breadcrumbStyleKeys.ellipsisIcon],
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 24 24',
			fill: 'currentColor',
		},
		[h('circle', { cx: '12', cy: '12', r: '1' }), h('circle', { cx: '19', cy: '12', r: '1' }), h('circle', { cx: '5', cy: '12', r: '1' })],
	);
}

export const Breadcrumb = defineComponent({
	name: 'Breadcrumb',
	setup(_props, { slots }) {
		return () => h('nav', { 'aria-label': 'breadcrumb', class: styles[breadcrumbStyleKeys.root] }, slots.default?.());
	},
});

export const BreadcrumbList = defineComponent({
	name: 'BreadcrumbList',
	setup(_props, { slots }) {
		return () => h('ol', { class: styles[breadcrumbStyleKeys.list] }, slots.default?.());
	},
});

export const BreadcrumbItem = defineComponent({
	name: 'BreadcrumbItem',
	setup(_props, { slots }) {
		return () => h('li', { class: styles[breadcrumbStyleKeys.item] }, slots.default?.());
	},
});

export const BreadcrumbLink = defineComponent({
	name: 'BreadcrumbLink',
	props: {
		href: String,
	},
	setup(props, { slots, attrs }) {
		return () => h('a', { ...attrs, href: props.href, class: [styles[breadcrumbStyleKeys.link], attrs.class] }, slots.default?.());
	},
});

export const BreadcrumbPage = defineComponent({
	name: 'BreadcrumbPage',
	setup(_props, { slots }) {
		return () => h('span', { role: 'link', 'aria-disabled': 'true', 'aria-current': 'page', class: styles[breadcrumbStyleKeys.page] }, slots.default?.());
	},
});

export const BreadcrumbSeparator = defineComponent({
	name: 'BreadcrumbSeparator',
	setup(_props, { slots }) {
		return () =>
			h('li', { role: 'presentation', 'aria-hidden': 'true', class: styles[breadcrumbStyleKeys.separator] }, slots.default ? slots.default() : [renderChevronRight()]);
	},
});

export const BreadcrumbEllipsis = defineComponent({
	name: 'BreadcrumbEllipsis',
	setup(_props) {
		return () =>
			h('span', { role: 'presentation', 'aria-hidden': 'true', class: styles[breadcrumbStyleKeys.ellipsis] }, [
				renderMoreHorizontal(),
				h('span', { class: styles[breadcrumbStyleKeys.srOnly] }, 'More'),
			]);
	},
});

export default Breadcrumb;
