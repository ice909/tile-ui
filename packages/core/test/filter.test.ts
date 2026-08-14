import { describe, expect, it } from 'vitest';

import {
	COMBOBOX_DEFAULT_MAX_ITEMS,
	countComboboxMatches,
	filterComboboxItems,
	filterCommandGroups,
	filterCommandItems,
	flattenCommandGroups,
	matchComboboxItem,
	matchCommandItem,
	moveComboboxIndex,
	moveCommandIndex,
	normalizeComboboxQuery,
} from '../src';

describe('Combobox 过滤', () => {
	const items = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry', keywords: ['red'] },
	];

	it('normalizeComboboxQuery', () => {
		expect(normalizeComboboxQuery('  ApPlE  ')).toBe('apple');
	});

	it('matchComboboxItem 标签/值/关键字', () => {
		expect(matchComboboxItem(items[0], 'app')).toBe(true);
		expect(matchComboboxItem(items[1], 'banana')).toBe(true);
		expect(matchComboboxItem(items[2], 'red')).toBe(true);
		expect(matchComboboxItem(items[0], 'zzz')).toBe(false);
		expect(matchComboboxItem(items[0], '')).toBe(true);
	});

	it('filterComboboxItems 与 maxItems', () => {
		expect(filterComboboxItems(items, '')).toHaveLength(3);
		expect(filterComboboxItems(items, 'an')).toHaveLength(1);
		expect(filterComboboxItems(items, '', 2)).toHaveLength(2);
		expect(filterComboboxItems(items, 'x', COMBOBOX_DEFAULT_MAX_ITEMS, (item, q) => item.label.includes(q))).toHaveLength(0);
	});

	it('countComboboxMatches', () => {
		expect(countComboboxMatches(items, '')).toBe(3);
		expect(countComboboxMatches(items, 'an')).toBe(1);
	});

	it('moveComboboxIndex 环绕', () => {
		expect(moveComboboxIndex(-1, 1, 3)).toBe(0);
		expect(moveComboboxIndex(-1, -1, 3)).toBe(2);
		expect(moveComboboxIndex(2, 1, 3)).toBe(0);
		expect(moveComboboxIndex(0, -1, 3)).toBe(2);
		expect(moveComboboxIndex(0, 1, 0)).toBe(-1);
	});
});

describe('Command 过滤', () => {
	const items = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
	];

	it('matchCommandItem', () => {
		expect(matchCommandItem(items[0], 'app')).toBe(true);
		expect(matchCommandItem({ value: 'x', keywords: ['foo'] }, 'foo')).toBe(true);
		expect(matchCommandItem(items[0], '')).toBe(true);
	});

	it('filterCommandItems', () => {
		expect(filterCommandItems(items, 'an')).toHaveLength(1);
		expect(filterCommandItems(items, 'an')[0].value).toBe('banana');
	});

	it('filterCommandGroups', () => {
		const groups = [
			{ value: 'g1', label: 'Fruits', items: [{ value: 'apple', label: 'Apple' }] },
			{ value: 'g2', label: 'Tools', items: [{ value: 'hammer', label: 'Hammer' }] },
		];
		const result = filterCommandGroups(groups, 'app');
		expect(result.groups).toHaveLength(1);
		expect(result.groups[0].value).toBe('g1');
		expect(result.items).toHaveLength(1);
		expect(result.empty).toBe(false);
		expect(filterCommandGroups(groups, 'zzz').empty).toBe(true);
	});

	it('flattenCommandGroups', () => {
		const groups = [{ value: 'g1', label: 'Fruits', items: [{ value: 'apple', label: 'Apple' }] }];
		const flat = flattenCommandGroups(groups, '');
		expect(flat).toHaveLength(2);
		expect(flat[0].type).toBe('group');
		expect(flat[1].type).toBe('item');
	});

	it('moveCommandIndex', () => {
		expect(moveCommandIndex(-1, 1, 3)).toBe(0);
		expect(moveCommandIndex(0, -1, 3)).toBe(2);
		expect(moveCommandIndex(0, -1, 3, false)).toBe(0);
	});
});
