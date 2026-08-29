import { createRenderEffect, createSignal, For, onCleanup, onMount, splitProps, type JSX } from 'solid-js';
import {
	addDays,
	addMonths,
	calendarStyleKeys,
	getCalendarDayLabel,
	getCalendarDayModifiers,
	getCalendarFirstSelectedDate,
	getMonthCaption,
	getMonthGrid,
	getWeekdayLabels,
	isSameMonth,
	selectCalendarDay,
	startOfMonth,
} from '@tile-ui/core';
import type { CalendarBaseProps, CalendarDayModifiers, CalendarSelection } from '@tile-ui/core';
import { invokeEventHandler } from '../../utils';
import styles from '@tile-ui/styles/scss/components/calendar.module.scss';

const DEFAULT_LOCALE = 'en-US';

function dateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth()}`;
}

function firstSelectedDate(selection: CalendarSelection): Date | undefined {
	return getCalendarFirstSelectedDate(selection);
}

export interface CalendarDayButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
	/** 日期。 */
	date: Date;
	/** 日期的选择、范围及可用状态。 */
	modifiers: CalendarDayModifiers;
	/** 日期可访问名称使用的语言区域。 */
	locale?: string;
}

/** SolidJS Calendar 的单个日期按钮，可独立用于自定义日期网格。 */
export function CalendarDayButton(props: CalendarDayButtonProps) {
	const [local, rest] = splitProps(props, ['date', 'modifiers', 'locale', 'class', 'children', 'type', 'aria-label']);
	const selectedSingle = () => local.modifiers.selected && !local.modifiers.rangeStart && !local.modifiers.rangeEnd && !local.modifiers.rangeMiddle;
	const label = () => local['aria-label'] ?? getCalendarDayLabel(local.date, local.locale ?? DEFAULT_LOCALE);

	return (
		<button
			{...rest}
			type={local.type ?? 'button'}
			data-slot="calendar-day-button"
			data-day={dateKey(local.date)}
			data-selected={local.modifiers.selected}
			data-selected-single={selectedSingle()}
			data-range-start={local.modifiers.rangeStart}
			data-range-end={local.modifiers.rangeEnd}
			data-range-middle={local.modifiers.rangeMiddle}
			data-outside={local.modifiers.outside}
			data-disabled={local.modifiers.disabled}
			data-today={local.modifiers.today}
			disabled={local.modifiers.disabled}
			aria-label={label()}
			aria-disabled={local.modifiers.disabled}
			aria-current={local.modifiers.today ? 'date' : undefined}
			class={`${styles[calendarStyleKeys.dayButton]} ${local.class ?? ''}`}>
			{local.children ?? local.date.getDate()}
		</button>
	);
}

export interface CalendarProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onSelect'>, CalendarBaseProps {
	/** 月份、星期及日期可访问名称使用的语言区域，默认 en-US。 */
	locale?: string;
	/** 用于 today 标记及默认初始月份的本地民用日期；SSR 可传入固定值以避免服务端与客户端时钟差异。 */
	today?: Date;
}

/** SolidJS Calendar：支持单选、多选、范围选择及 disabled-aware roving focus。 */
export function Calendar(props: CalendarProps) {
	const controlled = Object.prototype.hasOwnProperty.call(props, 'selected');
	const [local, rest] = splitProps(props, [
		'mode',
		'selected',
		'defaultSelected',
		'defaultMonth',
		'showOutsideDays',
		'disabled',
		'onSelect',
		'locale',
		'today',
		'class',
		'ref',
		'onClick',
		'onKeyDown',
	]);
	const initialSelection = local.defaultSelected;
	const [internalSelection, setInternalSelection] = createSignal<CalendarSelection>(initialSelection);
	const selection = () => (controlled ? local.selected : internalSelection());
	const todayInput = local.today ?? new Date();
	const capturedToday = new Date(todayInput.getFullYear(), todayInput.getMonth(), todayInput.getDate());
	const initialVisibleDate = local.defaultMonth ?? firstSelectedDate(selection()) ?? capturedToday;
	const initialFocusDate = firstSelectedDate(selection()) ?? initialVisibleDate;
	const [month, setMonth] = createSignal(startOfMonth(initialVisibleDate));
	const [focusedDay, setFocusedDay] = createSignal(dateKey(initialFocusDate));
	const buttons = new Map<string, HTMLButtonElement>();
	let root: HTMLDivElement | undefined;
	const mode = () => local.mode ?? 'single';
	const locale = () => local.locale ?? DEFAULT_LOCALE;
	const showOutsideDays = () => local.showOutsideDays ?? true;
	const grid = () => getMonthGrid(month(), showOutsideDays());
	const caption = () => getMonthCaption(month(), locale());
	const modifiers = (day: Date) => getCalendarDayModifiers(day, month(), selection(), showOutsideDays(), local.disabled, capturedToday);
	const isEnabled = (day: Date) => !local.disabled?.(day);
	const visibleDays = () => grid().flatMap((week) => week.flatMap((day) => (day ? [day] : [])));
	const tabStopKey = () => {
		const days = visibleDays();
		const focused = days.find((day) => dateKey(day) === focusedDay() && isEnabled(day));
		if (focused) return dateKey(focused);
		const selected = days.find((day) => modifiers(day).selected && isEnabled(day));
		if (selected) return dateKey(selected);
		const currentMonth = days.find((day) => isSameMonth(day, month()) && isEnabled(day));
		return currentMonth ? dateKey(currentMonth) : days.find(isEnabled) ? dateKey(days.find(isEnabled)!) : '';
	};

	function focusDate(day: Date) {
		setFocusedDay(dateKey(day));
		if (!isSameMonth(day, month())) setMonth(startOfMonth(day));
		queueMicrotask(() => buttons.get(dateKey(day))?.focus());
	}

	function findEnabled(start: Date, step: number, limit: number): Date | undefined {
		let candidate = start;
		for (let index = 0; index < limit; index += 1) {
			if (isEnabled(candidate)) return candidate;
			candidate = addDays(candidate, step);
		}
		return undefined;
	}

	function keyboardTarget(day: Date, key: string): Date | undefined {
		if (key === 'ArrowLeft') return findEnabled(addDays(day, -1), -1, 366);
		if (key === 'ArrowRight') return findEnabled(addDays(day, 1), 1, 366);
		if (key === 'ArrowUp') return findEnabled(addDays(day, -7), -7, 53);
		if (key === 'ArrowDown') return findEnabled(addDays(day, 7), 7, 53);
		if (key === 'Home') return findEnabled(addDays(day, -day.getDay()), 1, day.getDay() + 1);
		if (key === 'End') return findEnabled(addDays(day, 6 - day.getDay()), -1, 7 - day.getDay());
		if (key === 'PageUp') return findEnabled(addMonths(day, -1), -1, 31);
		if (key === 'PageDown') return findEnabled(addMonths(day, 1), 1, 31);
		return undefined;
	}

	function select(day: Date) {
		if (!isEnabled(day)) return;
		setFocusedDay(dateKey(day));
		const next = selectCalendarDay(mode(), selection(), day);
		if (!controlled) setInternalSelection(next);
		local.onSelect?.(next);
		if (!isSameMonth(day, month())) setMonth(startOfMonth(day));
	}

	function moveMonth(count: number) {
		const nextMonth = addMonths(month(), count);
		setMonth(startOfMonth(nextMonth));
		const preferredDay = new Date(
			nextMonth.getFullYear(),
			nextMonth.getMonth(),
			Math.min(initialFocusDate.getDate(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()),
		);
		const nextFocus = findEnabled(preferredDay, count < 0 ? -1 : 1, 31);
		if (nextFocus) setFocusedDay(dateKey(nextFocus));
	}

	let previousControlledDate = controlled ? firstSelectedDate(local.selected) : undefined;
	createRenderEffect(() => {
		if (!controlled) return;
		const nextDate = firstSelectedDate(local.selected);
		const previousMonthKey = previousControlledDate ? monthKey(previousControlledDate) : undefined;
		const nextMonthKey = nextDate ? monthKey(nextDate) : undefined;
		previousControlledDate = nextDate;
		if (!nextDate || nextMonthKey === previousMonthKey) return;
		setMonth(startOfMonth(nextDate));
		setFocusedDay(dateKey(nextDate));
	});

	onMount(() => {
		if (!root) return;
		const handleClick = (event: MouseEvent) => invokeEventHandler(local.onClick, event);
		const handleKeyDown = (event: KeyboardEvent) => invokeEventHandler(local.onKeyDown, event);
		root.addEventListener('click', handleClick, true);
		root.addEventListener('keydown', handleKeyDown, true);
		onCleanup(() => {
			root?.removeEventListener('click', handleClick, true);
			root?.removeEventListener('keydown', handleKeyDown, true);
		});
	});

	return (
		<div
			{...rest}
			ref={(element) => {
				root = element;
				if (typeof local.ref === 'function') local.ref(element);
			}}
			data-slot="calendar"
			data-mode={mode()}
			class={`${styles[calendarStyleKeys.root]} ${local.class ?? ''}`}>
			<div class={styles[calendarStyleKeys.header]}>
				<nav class={styles[calendarStyleKeys.nav]} aria-label="Calendar navigation">
					<button
						type="button"
						aria-label="Previous month"
						class={`${styles[calendarStyleKeys.navButton]} ${styles[calendarStyleKeys.navPrev]}`}
						onClick={(event) => {
							if (!event.defaultPrevented) moveMonth(-1);
						}}>
						<svg
							class={styles[calendarStyleKeys.icon]}
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true">
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
					<button
						type="button"
						aria-label="Next month"
						class={`${styles[calendarStyleKeys.navButton]} ${styles[calendarStyleKeys.navNext]}`}
						onClick={(event) => {
							if (!event.defaultPrevented) moveMonth(1);
						}}>
						<svg
							class={styles[calendarStyleKeys.icon]}
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true">
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
				</nav>
				<div class={styles[calendarStyleKeys.monthCaption]} aria-live="polite">
					{caption()}
				</div>
			</div>
			<div role="grid" aria-label={caption()}>
				<div role="row" class={styles[calendarStyleKeys.weekdays]}>
					<For each={getWeekdayLabels(locale())}>
						{(label) => (
							<div role="columnheader" class={styles[calendarStyleKeys.weekday]}>
								{label}
							</div>
						)}
					</For>
				</div>
				<div class={styles[calendarStyleKeys.weeks]}>
					<For each={grid()}>
						{(week) => (
							<div role="row" class={styles[calendarStyleKeys.week]}>
								<For each={week}>
									{(day) => {
										if (!day) return <div role="gridcell" class={styles[calendarStyleKeys.day]} />;
										const dayModifiers = () => modifiers(day);
										return (
											<div role="gridcell" aria-selected={dayModifiers().selected} class={styles[calendarStyleKeys.day]}>
												<CalendarDayButton
													ref={(element) => buttons.set(dateKey(day), element)}
													date={day}
													modifiers={dayModifiers()}
													locale={locale()}
													tabIndex={dateKey(day) === tabStopKey() ? 0 : -1}
													onFocus={() => setFocusedDay(dateKey(day))}
													onClick={(event) => {
														if (!event.defaultPrevented) select(day);
													}}
													onKeyDown={(event) => {
														if (event.defaultPrevented) return;
														const target = keyboardTarget(day, event.key);
														if (target) {
															event.preventDefault();
															focusDate(target);
														}
													}}
												/>
											</div>
										);
									}}
								</For>
							</div>
						)}
					</For>
				</div>
			</div>
		</div>
	);
}

export default Calendar;
