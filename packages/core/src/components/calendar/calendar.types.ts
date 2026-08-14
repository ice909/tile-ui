/**
 * Calendar 选择模式：单选 / 多选 / 范围选择
 */
export type CalendarMode = 'single' | 'multiple' | 'range';

/**
 * 范围选择的起止日期
 */
export interface CalendarRange {
	from?: Date;
	to?: Date;
}

/**
 * Calendar 的选中值（随模式不同而不同）
 */
export type CalendarSelection = Date | Date[] | CalendarRange | undefined;

/**
 * 禁用日期匹配函数：返回 true 表示该日期不可选
 */
export type CalendarDisabledMatcher = (date: Date) => boolean;

/**
 * 框架无关的 Calendar 基础 Props (仅包含组件库自定义属性)
 */
export interface CalendarBaseProps {
	/** 选择模式，默认 'single' */
	mode?: CalendarMode;
	/** 受控选中值 */
	selected?: CalendarSelection;
	/** 非受控初始选中值 */
	defaultSelected?: CalendarSelection;
	/** 初始展示的月份（仅控制起始月份，选中后跟随选择变化） */
	defaultMonth?: Date;
	/** 是否展示相邻月份的天数，默认 true */
	showOutsideDays?: boolean;
	/** 禁用日期匹配函数 */
	disabled?: CalendarDisabledMatcher;
	/** 选中变化回调 */
	onSelect?: (selection: CalendarSelection) => void;
}

/**
 * Calendar 单个日期的修饰状态
 */
export interface CalendarDayModifiers {
	/** 是否被选中 */
	selected: boolean;
	/** 是否为范围起点 */
	rangeStart: boolean;
	/** 是否为范围终点 */
	rangeEnd: boolean;
	/** 是否为范围中间 */
	rangeMiddle: boolean;
	/** 是否属于相邻月份 */
	outside: boolean;
	/** 是否被禁用 */
	disabled: boolean;
	/** 是否为今天 */
	today: boolean;
}
