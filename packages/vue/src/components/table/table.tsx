import { defineComponent, h } from 'vue';
import { tableStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/table.module.scss';

export const Table = defineComponent({
	name: 'Table',
	inheritAttrs: false,
	setup(_props, { slots, attrs }) {
		return () => {
			const tableAttrs = { ...attrs };
			const userClass = tableAttrs.class;
			delete tableAttrs.class;

			return h('div', { class: styles[tableStyleKeys.container] }, h('table', { ...tableAttrs, class: [styles[tableStyleKeys.table], userClass] }, slots.default?.()));
		};
	},
});

export const TableHeader = defineComponent({
	name: 'TableHeader',
	setup(_props, { slots, attrs }) {
		return () => h('thead', { ...attrs, class: [styles[tableStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TableBody = defineComponent({
	name: 'TableBody',
	setup(_props, { slots, attrs }) {
		return () => h('tbody', { ...attrs, class: [styles[tableStyleKeys.body], attrs.class] }, slots.default?.());
	},
});

export const TableFooter = defineComponent({
	name: 'TableFooter',
	setup(_props, { slots, attrs }) {
		return () => h('tfoot', { ...attrs, class: [styles[tableStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const TableRow = defineComponent({
	name: 'TableRow',
	setup(_props, { slots, attrs }) {
		return () => h('tr', { ...attrs, class: [styles[tableStyleKeys.row], attrs.class] }, slots.default?.());
	},
});

export const TableHead = defineComponent({
	name: 'TableHead',
	setup(_props, { slots, attrs }) {
		return () => h('th', { ...attrs, class: [styles[tableStyleKeys.head], attrs.class] }, slots.default?.());
	},
});

export const TableCell = defineComponent({
	name: 'TableCell',
	setup(_props, { slots, attrs }) {
		return () => h('td', { ...attrs, class: [styles[tableStyleKeys.cell], attrs.class] }, slots.default?.());
	},
});

export const TableCaption = defineComponent({
	name: 'TableCaption',
	setup(_props, { slots, attrs }) {
		return () => h('caption', { ...attrs, class: [styles[tableStyleKeys.caption], attrs.class] }, slots.default?.());
	},
});

export default Table;
