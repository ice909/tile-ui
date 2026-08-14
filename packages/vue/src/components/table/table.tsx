import { defineComponent, h } from 'vue';
import { tableStyleKeys } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/table.module.scss';

export const TTable = defineComponent({
	name: 'TTable',
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

export const TTableHeader = defineComponent({
	name: 'TTableHeader',
	setup(_props, { slots }) {
		return () => h('thead', { class: styles[tableStyleKeys.header] }, slots.default?.());
	},
});

export const TTableBody = defineComponent({
	name: 'TTableBody',
	setup(_props, { slots }) {
		return () => h('tbody', { class: styles[tableStyleKeys.body] }, slots.default?.());
	},
});

export const TTableFooter = defineComponent({
	name: 'TTableFooter',
	setup(_props, { slots }) {
		return () => h('tfoot', { class: styles[tableStyleKeys.footer] }, slots.default?.());
	},
});

export const TTableRow = defineComponent({
	name: 'TTableRow',
	setup(_props, { slots }) {
		return () => h('tr', { class: styles[tableStyleKeys.row] }, slots.default?.());
	},
});

export const TTableHead = defineComponent({
	name: 'TTableHead',
	setup(_props, { slots }) {
		return () => h('th', { class: styles[tableStyleKeys.head] }, slots.default?.());
	},
});

export const TTableCell = defineComponent({
	name: 'TTableCell',
	setup(_props, { slots }) {
		return () => h('td', { class: styles[tableStyleKeys.cell] }, slots.default?.());
	},
});

export const TTableCaption = defineComponent({
	name: 'TTableCaption',
	setup(_props, { slots }) {
		return () => h('caption', { class: styles[tableStyleKeys.caption] }, slots.default?.());
	},
});

export default TTable;
