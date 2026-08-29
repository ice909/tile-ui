import { describe, expect, it, vi } from 'vitest';

import {
	addDays,
	addMonths,
	startOfMonth,
	isSameDay,
	isSameMonth,
	isDateBetween,
	isDateInRange,
	getMonthGrid,
	getWeekdayLabels,
	getMonthCaption,
	getCalendarDayLabel,
	getCalendarFirstSelectedDate,
	getCalendarDayModifiers,
	selectCalendarDay,
} from '../src';

describe('日历日期数学', () => {
	it('addDays 跨月/跨年', () => {
		expect(addDays(new Date(2024, 0, 31), 1).getDate()).toBe(1);
		expect(addDays(new Date(2024, 11, 31), 1).getFullYear()).toBe(2025);
	});

	it('addMonths 自动修正日溢出', () => {
		const jan31 = new Date(2024, 0, 31);
		const feb = addMonths(jan31, 1);
		expect(feb.getMonth()).toBe(1);
		expect(feb.getDate()).toBe(29);
		expect(addMonths(jan31, 2).getMonth()).toBe(2);
		expect(addMonths(jan31, -1).getMonth()).toBe(11);
	});

	it('startOfMonth', () => {
		const d = startOfMonth(new Date(2024, 5, 15));
		expect(d.getDate()).toBe(1);
		expect(d.getMonth()).toBe(5);
	});

	it('isSameDay / isSameMonth', () => {
		expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 1))).toBe(true);
		expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(false);
		expect(isSameDay(new Date(2024, 0, 1), undefined)).toBe(false);
		expect(isSameMonth(new Date(2024, 0, 15), new Date(2024, 0, 30))).toBe(true);
		expect(isSameMonth(new Date(2024, 0, 15), new Date(2024, 1, 1))).toBe(false);
	});

	it('isDateBetween 含端点', () => {
		const a = new Date(2024, 0, 1);
		const b = new Date(2024, 0, 10);
		expect(isDateBetween(a, a, b)).toBe(true);
		expect(isDateBetween(b, a, b)).toBe(true);
		expect(isDateBetween(new Date(2024, 0, 5), a, b)).toBe(true);
		expect(isDateBetween(new Date(2024, 0, 11), a, b)).toBe(false);
	});

	it('isDateInRange', () => {
		const range = { from: new Date(2024, 0, 1), to: new Date(2024, 0, 10) };
		expect(isDateInRange(new Date(2024, 0, 5), range)).toBe(true);
		expect(isDateInRange(new Date(2024, 0, 11), range)).toBe(false);
		expect(isDateInRange(new Date(2024, 0, 1), undefined)).toBe(false);
		expect(isDateInRange(new Date(2024, 0, 1), { from: new Date(2024, 0, 1) })).toBe(true);
	});

	it('getMonthGrid 6 行 x 7 列', () => {
		const grid = getMonthGrid(new Date(2024, 0, 1), true);
		expect(grid).toHaveLength(6);
		expect(grid.every((week) => week.length === 7)).toBe(true);
	});

	it('getMonthGrid 隐藏相邻月份时以 null 占位', () => {
		const grid = getMonthGrid(new Date(2024, 0, 1), false);
		const outsideCount = grid.flat().filter((day) => day === null).length;
		expect(outsideCount).toBeGreaterThan(0);
		expect(grid.flat().filter((day) => day !== null && isSameMonth(day as Date, new Date(2024, 0, 1))).length).toBe(31);
	});

	it('getWeekdayLabels 按每次传入的 locale 格式化', () => {
		expect(getWeekdayLabels('en-US')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
		expect(getWeekdayLabels('de-DE')).toEqual(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']);
		expect(getWeekdayLabels('en-US')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});

	it('Calendar 格式化器按 locale 与 options 缓存', () => {
		const formatter = vi.spyOn(Intl, 'DateTimeFormat');
		getWeekdayLabels('en-CA');
		getWeekdayLabels('en-CA');
		getWeekdayLabels('fr-CA');
		getMonthCaption(new Date(2024, 0, 1), 'en-CA');
		getMonthCaption(new Date(2024, 1, 1), 'en-CA');
		expect(formatter).toHaveBeenCalledTimes(3);
		formatter.mockRestore();
	});

	it('Calendar 格式化辅助函数保留本地民用日期且转发 locale', () => {
		expect(getMonthCaption(new Date(2024, 7, 1), 'en-US')).toBe('August 2024');
		expect(getMonthCaption(new Date(2024, 7, 1), 'de-DE')).toBe('August 2024');
		expect(getCalendarDayLabel(new Date(2024, 1, 29), 'en-US')).toBe('Thursday, February 29, 2024');
		expect(getCalendarDayLabel(new Date(2024, 1, 29), 'de-DE')).toBe('Donnerstag, 29. Februar 2024');
	});

	it('getCalendarFirstSelectedDate', () => {
		const d = new Date(2024, 0, 1);
		expect(getCalendarFirstSelectedDate(undefined)).toBeUndefined();
		expect(getCalendarFirstSelectedDate(d)).toBe(d);
		expect(getCalendarFirstSelectedDate([d, new Date(2024, 0, 2)])).toBe(d);
		expect(getCalendarFirstSelectedDate({ from: d, to: new Date(2024, 0, 2) })).toBe(d);
		expect(getCalendarFirstSelectedDate({ to: d })?.getTime()).toBe(d.getTime());
	});

	it('getCalendarDayModifiers 单选', () => {
		const selected = new Date(2024, 0, 5);
		const m = getCalendarDayModifiers(new Date(2024, 0, 5), new Date(2024, 0, 1), selected);
		expect(m.selected).toBe(true);
		expect(m.outside).toBe(false);
	});

	it('getCalendarDayModifiers 范围起止与中间', () => {
		const range = { from: new Date(2024, 0, 3), to: new Date(2024, 0, 7) };
		expect(getCalendarDayModifiers(new Date(2024, 0, 3), new Date(2024, 0, 1), range).rangeStart).toBe(true);
		expect(getCalendarDayModifiers(new Date(2024, 0, 7), new Date(2024, 0, 1), range).rangeEnd).toBe(true);
		expect(getCalendarDayModifiers(new Date(2024, 0, 5), new Date(2024, 0, 1), range).rangeMiddle).toBe(true);
	});

	it('getCalendarDayModifiers 禁用', () => {
		const disabled = (d: Date) => d.getDate() === 13;
		expect(getCalendarDayModifiers(new Date(2024, 0, 13), new Date(2024, 0, 1), undefined, true, disabled).disabled).toBe(true);
	});

	it('getCalendarDayModifiers 使用传入的本地民用 today', () => {
		expect(getCalendarDayModifiers(new Date(2024, 0, 1), new Date(2024, 0, 1), undefined, true, undefined, new Date(2024, 0, 1, 23, 59)).today).toBe(true);
		expect(getCalendarDayModifiers(new Date(2024, 0, 2), new Date(2024, 0, 1), undefined, true, undefined, new Date(2024, 0, 1, 23, 59)).today).toBe(false);
	});

	it('selectCalendarDay 单选', () => {
		const day = new Date(2024, 0, 5);
		expect(selectCalendarDay('single', undefined, day)).toBe(day);
	});

	it('selectCalendarDay 多选切换', () => {
		const a = new Date(2024, 0, 1);
		const b = new Date(2024, 0, 2);
		expect(selectCalendarDay('multiple', undefined, a)).toEqual([a]);
		expect(selectCalendarDay('multiple', [a], b)).toEqual([a, b]);
		expect(selectCalendarDay('multiple', [a, b], a)).toEqual([b]);
	});

	it('selectCalendarDay 范围选择完整流程', () => {
		const a = new Date(2024, 0, 1);
		const b = new Date(2024, 0, 10);
		const start = selectCalendarDay('range', undefined, a) as { from?: Date; to?: Date };
		expect(start.from).toBeDefined();
		expect(start.to).toBeUndefined();
		const done = selectCalendarDay('range', start, b) as { from?: Date; to?: Date };
		expect(done.from).toBeDefined();
		expect(done.to).toBeDefined();
		const restart = selectCalendarDay('range', done, b) as { from?: Date; to?: Date };
		expect(restart.from).toBeDefined();
		expect(restart.to).toBeUndefined();
	});

	it('selectCalendarDay 范围反选重新开始', () => {
		const a = new Date(2024, 0, 1);
		const b = new Date(2024, 0, 10);
		const start = selectCalendarDay('range', undefined, b) as { from?: Date; to?: Date };
		const back = selectCalendarDay('range', start, a) as { from?: Date; to?: Date };
		expect(back.from?.getTime()).toBe(a.getTime());
		expect(back.to).toBeUndefined();
	});
});
