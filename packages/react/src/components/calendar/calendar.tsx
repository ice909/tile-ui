import React, { useState } from 'react';
import {
	addMonths,
	calendarStyleKeys,
	getCalendarDayModifiers,
	getCalendarFirstSelectedDate,
	getMonthCaption,
	getMonthGrid,
	getWeekdayLabels,
	selectCalendarDay,
	startOfMonth,
} from '@tile-ui/core';
import type { CalendarBaseProps, CalendarDayModifiers, CalendarSelection } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/calendar.module.scss';

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>, CalendarBaseProps {}

export interface CalendarDayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** 日期 */
	date: Date;
	/** 修饰状态 */
	modifiers: CalendarDayModifiers;
}

/**
 * 单个日期按钮（独立导出，供自定义网格使用）
 */
const CalendarDayButton = React.forwardRef<HTMLButtonElement, CalendarDayButtonProps>(({ date, modifiers, className = '', children, ...props }, ref) => {
	const classes = [styles[calendarStyleKeys.dayButton], className].filter(Boolean).join(' ');

	return (
		<button
			ref={ref}
			type="button"
			data-day={date.toLocaleDateString()}
			data-selected={modifiers.selected}
			data-selected-single={modifiers.selected && !modifiers.rangeStart && !modifiers.rangeEnd && !modifiers.rangeMiddle}
			data-range-start={modifiers.rangeStart}
			data-range-end={modifiers.rangeEnd}
			data-range-middle={modifiers.rangeMiddle}
			data-outside={modifiers.outside}
			data-disabled={modifiers.disabled}
			data-today={modifiers.today}
			disabled={modifiers.disabled}
			aria-selected={modifiers.selected}
			aria-disabled={modifiers.disabled}
			className={classes}
			{...props}>
			{children ?? date.getDate()}
		</button>
	);
});
CalendarDayButton.displayName = 'CalendarDayButton';

/**
 * Calendar 日历组件（单选 / 多选 / 范围选择）
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
	({ className = '', mode = 'single', selected, defaultSelected, defaultMonth, showOutsideDays = true, disabled, onSelect, ...props }, ref) => {
		const [internalSelected, setInternalSelected] = useState<CalendarSelection>(defaultSelected);
		const currentSelected = selected !== undefined ? selected : internalSelected;

		const [month, setMonth] = useState<Date>(() => {
			if (defaultMonth) {
				return startOfMonth(defaultMonth);
			}
			const firstSelected = getCalendarFirstSelectedDate(defaultSelected);
			if (firstSelected) {
				return startOfMonth(firstSelected);
			}
			return startOfMonth(new Date());
		});

		function handleSelect(day: Date) {
			if (disabled?.(day)) {
				return;
			}
			const next = selectCalendarDay(mode, currentSelected, day);
			if (selected === undefined) {
				setInternalSelected(next);
			}
			onSelect?.(next);
		}

		const grid = getMonthGrid(month, showOutsideDays);
		const weekdays = getWeekdayLabels();

		return (
			<div ref={ref} data-slot="calendar" data-mode={mode} className={`${styles[calendarStyleKeys.root]} ${className}`} {...props}>
				<div className={styles[calendarStyleKeys.header]}>
					<nav className={styles[calendarStyleKeys.nav]}>
						<button
							type="button"
							aria-label="上个月"
							className={`${styles[calendarStyleKeys.navButton]} ${styles[calendarStyleKeys.navPrev]}`}
							onClick={() => setMonth((prev) => addMonths(prev, -1))}>
							<svg
								className={styles[calendarStyleKeys.icon]}
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true">
								<path d="m15 18-6-6 6-6" />
							</svg>
						</button>
						<button
							type="button"
							aria-label="下个月"
							className={`${styles[calendarStyleKeys.navButton]} ${styles[calendarStyleKeys.navNext]}`}
							onClick={() => setMonth((prev) => addMonths(prev, 1))}>
							<svg
								className={styles[calendarStyleKeys.icon]}
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true">
								<path d="m9 18 6-6-6-6" />
							</svg>
						</button>
					</nav>
					<div className={styles[calendarStyleKeys.monthCaption]}>{getMonthCaption(month)}</div>
				</div>
				<div className={styles[calendarStyleKeys.weekdays]}>
					{weekdays.map((label) => (
						<div key={label} className={styles[calendarStyleKeys.weekday]}>
							{label}
						</div>
					))}
				</div>
				<div className={styles[calendarStyleKeys.weeks]} role="grid">
					{grid.map((week, weekIndex) => (
						<div key={weekIndex} role="row" className={styles[calendarStyleKeys.week]}>
							{week.map((day, dayIndex) => {
								if (!day) {
									return <div key={dayIndex} className={styles[calendarStyleKeys.day]} />;
								}
								const modifiers = getCalendarDayModifiers(day, month, currentSelected, showOutsideDays, disabled);
								return (
									<div key={dayIndex} role="gridcell" className={styles[calendarStyleKeys.day]}>
										<CalendarDayButton date={day} modifiers={modifiers} onClick={() => handleSelect(day)} />
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		);
	},
);
Calendar.displayName = 'Calendar';

export { Calendar, CalendarDayButton };
export default Calendar;
