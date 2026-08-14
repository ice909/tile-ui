import type { CalendarDayModifiers, CalendarDisabledMatcher, CalendarMode, CalendarRange, CalendarSelection } from './calendar.types';

/**
 * Calendar 组件样式类名键
 */
export const calendarStyleKeys = {
	root: 'root',
	header: 'header',
	nav: 'nav',
	navButton: 'navButton',
	navPrev: 'navPrev',
	navNext: 'navNext',
	monthCaption: 'monthCaption',
	weekdays: 'weekdays',
	weekday: 'weekday',
	weeks: 'weeks',
	week: 'week',
	day: 'day',
	dayButton: 'dayButton',
	icon: 'icon',
} as const;

/**
 * 在当前日期上增加若干天（纯函数）
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * 在当前日期上增加若干月（自动修正日溢出，如 1/31 加一个月得到 2/28）
 */
export function addMonths(date: Date, count: number): Date {
	const result = new Date(date);
	const targetDay = result.getDate();
	result.setDate(1);
	result.setMonth(result.getMonth() + count);
	const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
	result.setDate(Math.min(targetDay, lastDay));
	return result;
}

/**
 * 返回某日期所在月份的第一天（时间归零）
 */
export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 判断两个日期是否为同一天（仅比较年月日）
 */
export function isSameDay(a: Date, b: Date | undefined): boolean {
	if (!b) {
		return false;
	}
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * 判断两个日期是否在同一月份
 */
export function isSameMonth(a: Date, b: Date | undefined): boolean {
	if (!b) {
		return false;
	}
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * 判断某日期是否是今天
 */
export function isToday(date: Date): boolean {
	return isSameDay(date, new Date());
}

/**
 * 判断日期是否位于 from 与 to 之间（含端点）
 */
export function isDateBetween(date: Date, from: Date, to: Date): boolean {
	const time = date.getTime();
	return time >= from.getTime() && time <= to.getTime();
}

/**
 * 判断日期是否落在范围 {from, to} 内（含端点，from 缺省时返回 false）
 */
export function isDateInRange(date: Date, range: CalendarRange | undefined): boolean {
	if (!range?.from) {
		return false;
	}
	if (!range.to) {
		return isSameDay(date, range.from);
	}
	if (range.from.getTime() > range.to.getTime()) {
		return isDateBetween(date, range.to, range.from);
	}
	return isDateBetween(date, range.from, range.to);
}

/**
 * 生成月份网格：6 行 x 7 列，从周日起排。showOutsideDays 为 false 时相邻月份的天以 null 占位
 */
export function getMonthGrid(month: Date, showOutsideDays: boolean = true): Array<Array<Date | null>> {
	const first = startOfMonth(month);
	const gridStart = addDays(first, -first.getDay());

	return Array.from({ length: 6 }, (_, w) =>
		Array.from({ length: 7 }, (_, d) => {
			const date = addDays(gridStart, w * 7 + d);
			if (!showOutsideDays && !isSameMonth(date, first)) {
				return null;
			}
			return date;
		}),
	);
}

let weekdayFormatter: Intl.DateTimeFormat | null = null;

/**
 * 生成星期表头标签（从周日开始，如 ['Sun', 'Mon', ...]）
 */
export function getWeekdayLabels(locale?: string): string[] {
	if (!weekdayFormatter) {
		weekdayFormatter = new Intl.DateTimeFormat(locale ?? 'default', { weekday: 'short' });
	}
	const sunday = new Date(2024, 0, 7);
	return Array.from({ length: 7 }, (_, i) => weekdayFormatter!.format(addDays(sunday, i)));
}

/**
 * 生成月份标题（如 "August 2026"）
 */
export function getMonthCaption(month: Date, locale?: string): string {
	return new Intl.DateTimeFormat(locale ?? 'default', { month: 'long', year: 'numeric' }).format(month);
}

/**
 * 从选中值中提取一个代表日期（用于初始化展示月份）
 */
export function getCalendarFirstSelectedDate(selection: CalendarSelection): Date | undefined {
	if (!selection) {
		return undefined;
	}
	if (selection instanceof Date) {
		return selection;
	}
	if (Array.isArray(selection)) {
		return selection[0];
	}
	return selection.from ?? selection.to;
}

/**
 * 计算某日期的修饰状态（选中 / 范围 / 禁用 / 今天等）
 */
export function getCalendarDayModifiers(
	day: Date,
	month: Date,
	selection: CalendarSelection,
	showOutsideDays: boolean = true,
	disabled?: CalendarDisabledMatcher,
): CalendarDayModifiers {
	const outside = !isSameMonth(day, month);
	let selected = false;
	let rangeStart = false;
	let rangeEnd = false;
	let rangeMiddle = false;

	if (selection) {
		if (Array.isArray(selection)) {
			selected = selection.some((item) => isSameDay(day, item));
		} else if (selection instanceof Date) {
			selected = isSameDay(day, selection);
		} else {
			const from = selection.from;
			const to = selection.to;
			selected = isDateInRange(day, selection);
			rangeStart = !!from && isSameDay(day, from);
			rangeEnd = !!to && isSameDay(day, to);
			rangeMiddle = !!from && !!to && selected && !rangeStart && !rangeEnd;
		}
	}

	return {
		selected,
		rangeStart,
		rangeEnd,
		rangeMiddle,
		outside,
		disabled: disabled ? disabled(day) : false,
		today: isToday(day),
	};
}

/**
 * 根据模式与当前选中值计算点击某天后新的选中值（纯函数）
 */
export function selectCalendarDay(mode: CalendarMode, selection: CalendarSelection, day: Date): CalendarSelection {
	if (mode === 'single') {
		return day;
	}

	if (mode === 'multiple') {
		const list = Array.isArray(selection) ? selection : [];
		return isSameDay(
			day,
			list.find((item) => isSameDay(day, item)),
		)
			? list.filter((item) => !isSameDay(day, item))
			: [...list, day];
	}

	// range 模式
	const range: CalendarRange = selection && !Array.isArray(selection) && !(selection instanceof Date) ? selection : {};
	if (range.from && range.to) {
		return { from: day };
	}
	if (range.from) {
		if (day.getTime() < range.from.getTime()) {
			return { from: day };
		}
		return { from: range.from, to: day };
	}
	return { from: day };
}
