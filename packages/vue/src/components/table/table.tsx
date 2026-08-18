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
	setup(_props, { slots, attrs }) {
		return () => h('thead', { ...attrs, class: [styles[tableStyleKeys.header], attrs.class] }, slots.default?.());
	},
});

export const TTableBody = defineComponent({
	name: 'TTableBody',
	setup(_props, { slots, attrs }) {
		return () => h('tbody', { ...attrs, class: [styles[tableStyleKeys.body], attrs.class] }, slots.default?.());
	},
});

export const TTableFooter = defineComponent({
	name: 'TTableFooter',
	setup(_props, { slots, attrs }) {
		return () => h('tfoot', { ...attrs, class: [styles[tableStyleKeys.footer], attrs.class] }, slots.default?.());
	},
});

export const TTableRow = defineComponent({
	name: 'TTableRow',
	setup(_props, { slots, attrs }) {
		return () => h('tr', { ...attrs, class: [styles[tableStyleKeys.row], attrs.class] }, slots.default?.());
	},
});

export const TTableHead = defineComponent({
	name: 'TTableHead',
	setup(_props, { slots, attrs }) {
		return () => h('th', { ...attrs, class: [styles[tableStyleKeys.head], attrs.class] }, slots.default?.());
	},
});

export const TTableCell = defineComponent({
	name: 'TTableCell',
	setup(_props, { slots, attrs }) {
		return () => h('td', { ...attrs, class: [styles[tableStyleKeys.cell], attrs.class] }, slots.default?.());
	},
});

export const TTableCaption = defineComponent({
	name: 'TTableCaption',
	setup(_props, { slots, attrs }) {
		return () => h('caption', { ...attrs, class: [styles[tableStyleKeys.caption], attrs.class] }, slots.default?.());
	},
});

export default TTable;
