import { computed, defineComponent, h, ref, type PropType } from 'vue';
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
import type { CalendarDayModifiers, CalendarDisabledMatcher, CalendarMode, CalendarSelection } from '@tile-ui/core';
import styles from '@tile-ui/styles/scss/components/calendar.module.scss';

/**
 * 渲染左 / 右方向箭头图标
 */
function renderChevron(flipRight: boolean) {
	return h(
		'svg',
		{
			class: styles[calendarStyleKeys.icon],
			xmlns: 'http://www.w3.org/2000/svg',
			width: '24',
			height: '24',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		[h('path', { d: flipRight ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6' })],
	);
}

/**
 * 单个日期按钮（独立导出，供自定义网格使用）
 */
export const CalendarDayButton = defineComponent({
	name: 'CalendarDayButton',
	props: {
		date: { type: Date, required: true },
		modifiers: { type: Object as PropType<CalendarDayModifiers>, required: true },
	},
	emits: ['click'],
	setup(props, { attrs, emit, slots }) {
		return () => {
			const modifiers = props.modifiers;
			const data: Record<string, string> = {
				'data-day': props.date.toLocaleDateString(),
				'data-selected': String(modifiers.selected),
				'data-selected-single': String(modifiers.selected && !modifiers.rangeStart && !modifiers.rangeEnd && !modifiers.rangeMiddle),
				'data-range-start': String(modifiers.rangeStart),
				'data-range-end': String(modifiers.rangeEnd),
				'data-range-middle': String(modifiers.rangeMiddle),
				'data-outside': String(modifiers.outside),
				'data-disabled': String(modifiers.disabled),
				'data-today': String(modifiers.today),
				'aria-disabled': String(modifiers.disabled),
			};

			return h(
				'button',
				{
					...attrs,
					...data,
					type: 'button',
					disabled: modifiers.disabled,
					class: [styles[calendarStyleKeys.dayButton], attrs.class],
					onClick: () => emit('click'),
				},
				slots.default?.() ?? [props.date.getDate()],
			);
		};
	},
});

/**
 * Calendar 日历组件（单选 / 多选 / 范围选择）
 */
export const Calendar = defineComponent({
	name: 'Calendar',
	props: {
		mode: {
			type: String as PropType<CalendarMode>,
			default: 'single',
		},
		selected: { type: [Date, Array, Object] as PropType<CalendarSelection>, default: undefined },
		defaultSelected: { type: [Date, Array, Object] as PropType<CalendarSelection>, default: undefined },
		defaultMonth: { type: Date, default: undefined },
		showOutsideDays: { type: Boolean, default: true },
		disabled: { type: Function as PropType<CalendarDisabledMatcher>, default: undefined },
	},
	emits: ['select', 'update:selected'],
	setup(props, { emit, attrs }) {
		const internalSelected = ref<CalendarSelection>(props.defaultSelected);
		const currentSelected = computed<CalendarSelection>(() => (props.selected !== undefined ? props.selected : internalSelected.value));

		function resolveInitialMonth(): Date {
			if (props.defaultMonth) {
				return startOfMonth(props.defaultMonth);
			}
			const firstSelected = getCalendarFirstSelectedDate(props.defaultSelected);
			return firstSelected ? startOfMonth(firstSelected) : startOfMonth(new Date());
		}

		const month = ref<Date>(resolveInitialMonth());

		function handleSelect(day: Date) {
			if (props.disabled?.(day)) {
				return;
			}
			const next = selectCalendarDay(props.mode, currentSelected.value, day);
			if (props.selected === undefined) {
				internalSelected.value = next;
			}
			emit('select', next);
			emit('update:selected', next);
		}

		return () => {
			const grid = getMonthGrid(month.value, props.showOutsideDays);
			const weekdays = getWeekdayLabels();
			const classes = [styles[calendarStyleKeys.root], attrs.class];

			return h('div', { ...attrs, class: classes, 'data-slot': 'calendar', 'data-mode': props.mode }, [
				h('div', { class: styles[calendarStyleKeys.header] }, [
					h('nav', { class: styles[calendarStyleKeys.nav] }, [
						h(
							'button',
							{
								type: 'button',
								'aria-label': '上个月',
								class: [styles[calendarStyleKeys.navButton], styles[calendarStyleKeys.navPrev]],
								onClick: () => (month.value = addMonths(month.value, -1)),
							},
							renderChevron(false),
						),
						h(
							'button',
							{
								type: 'button',
								'aria-label': '下个月',
								class: [styles[calendarStyleKeys.navButton], styles[calendarStyleKeys.navNext]],
								onClick: () => (month.value = addMonths(month.value, 1)),
							},
							renderChevron(true),
						),
					]),
					h('div', { class: styles[calendarStyleKeys.monthCaption] }, getMonthCaption(month.value)),
				]),
				h(
					'div',
					{ class: styles[calendarStyleKeys.weekdays] },
					weekdays.map((label) => h('div', { class: styles[calendarStyleKeys.weekday] }, label)),
				),
				h('div', { class: styles[calendarStyleKeys.weeks], role: 'grid' }, [
					grid.map((week, weekIndex) =>
						h('div', { role: 'row', class: styles[calendarStyleKeys.week] }, [
							week.map((day, dayIndex) => {
								if (!day) {
									return h('div', { key: `${weekIndex}-${dayIndex}`, class: styles[calendarStyleKeys.day] });
								}
								const modifiers = getCalendarDayModifiers(day, month.value, currentSelected.value, props.showOutsideDays, props.disabled);
								return h(
									'div',
									{ key: `${weekIndex}-${dayIndex}`, role: 'gridcell', 'aria-selected': String(modifiers.selected), class: styles[calendarStyleKeys.day] },
									[
										h(CalendarDayButton, {
											date: day,
											modifiers,
											onClick: () => handleSelect(day),
										}),
									],
								);
							}),
						]),
					),
				]),
			]);
		};
	},
});

export default Calendar;
