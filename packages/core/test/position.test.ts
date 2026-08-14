import { describe, expect, it } from 'vitest';

import {
	getContextMenuPosition,
	getDropdownMenuPosition,
	getHoverCardPosition,
	getMenubarPosition,
	getPopoverPosition,
	getSelectPosition,
	getTooltipPosition,
	resolveDropdownMenuSide,
	resolveHoverCardSide,
	resolveMenubarSide,
	resolvePopoverSide,
	resolveTooltipSide,
	getDropdownMenuNextIndex,
	getContextMenuNextIndex,
	getMenubarNextIndex,
	getSelectNextIndex,
	getNavigationMenuNextIndex,
	getNavigationMenuIndicatorStyle,
	getDrawerTranslateStyle,
	getSheetTranslateStyle,
	getResizableDirectionCursor,
} from '../src';

const trigger = { top: 100, right: 200, bottom: 140, left: 100, width: 100, height: 40 };
const viewport = { width: 1000, height: 1000 };

describe('浮层定位', () => {
	it('getDropdownMenuPosition bottom/center', () => {
		const p = getDropdownMenuPosition({ triggerRect: trigger, contentSize: { width: 120, height: 200 }, side: 'bottom', align: 'center', sideOffset: 4, viewport });
		expect(p.top).toBe(144);
		expect(p.left).toBe(90);
	});

	it('getDropdownMenuPosition top/start', () => {
		const p = getDropdownMenuPosition({ triggerRect: trigger, contentSize: { width: 120, height: 200 }, side: 'top', align: 'start', sideOffset: 0, viewport });
		expect(p.left).toBe(100);
		// 溢出视口顶部时被夹取到边距
		expect(p.top).toBe(8);
	});

	it('getDropdownMenuPosition 视口夹取', () => {
		const p = getDropdownMenuPosition({
			triggerRect: { top: 0, right: 0, bottom: 0, left: -1000, width: 0, height: 0 },
			contentSize: { width: 100, height: 100 },
			side: 'bottom',
			sideOffset: 0,
			viewport,
		});
		expect(p.left).toBe(8);
	});

	it('getSelectPosition bottom/center', () => {
		const p = getSelectPosition({ triggerRect: trigger, contentSize: { width: 120, height: 200 }, align: 'center', sideOffset: 4, viewport });
		expect(p.top).toBe(144);
		expect(p.left).toBe(90);
	});

	it('getSelectPosition start 对齐', () => {
		const p = getSelectPosition({ triggerRect: trigger, contentSize: { width: 120, height: 200 }, align: 'start', sideOffset: 0, viewport });
		expect(p.left).toBe(100);
	});

	it('getContextMenuPosition 夹取到视口内', () => {
		const p = getContextMenuPosition({ x: 990, y: 990, contentSize: { width: 100, height: 100 }, viewport });
		expect(p.left).toBe(892);
		expect(p.top).toBe(892);
	});

	it('getMenubarPosition 与 DropdownMenu 同构', () => {
		const p = getMenubarPosition({ triggerRect: trigger, contentSize: { width: 120, height: 200 }, side: 'bottom', align: 'start', sideOffset: 8, alignOffset: -4, viewport });
		expect(p.top).toBe(148);
		expect(p.left).toBe(96);
	});

	it('getPopoverPosition / getHoverCardPosition / getTooltipPosition', () => {
		const pp = getPopoverPosition({ triggerRect: trigger, contentSize: { width: 100, height: 100 }, side: 'right', sideOffset: 4, viewport });
		expect(pp.left).toBe(204);
		expect(pp.top).toBe(70);
		const hc = getHoverCardPosition({ triggerRect: trigger, contentSize: { width: 100, height: 100 }, side: 'bottom', sideOffset: 4, viewport });
		expect(hc.top).toBe(144);
		const tp = getTooltipPosition({ triggerRect: trigger, contentSize: { width: 100, height: 100 }, side: 'top', sideOffset: 4, viewport });
		// 溢出视口顶部时被夹取到 TOOLTIP_VIEWPORT_MARGIN
		expect(tp.top).toBe(4);
	});

	it('resolveXxxSide RTL 互换', () => {
		expect(resolveDropdownMenuSide('left', true)).toBe('right');
		expect(resolveDropdownMenuSide('right', true)).toBe('left');
		expect(resolveDropdownMenuSide('top', true)).toBe('top');
		expect(resolveMenubarSide('left', true)).toBe('right');
		expect(resolvePopoverSide('right', true)).toBe('left');
		expect(resolveHoverCardSide('left', false)).toBe('left');
		expect(resolveTooltipSide('right', true)).toBe('left');
	});
});

describe('键盘导航索引', () => {
	it('getDropdownMenuNextIndex 循环', () => {
		expect(getDropdownMenuNextIndex(0, 3, -1)).toBe(2);
		expect(getDropdownMenuNextIndex(2, 3, 1)).toBe(0);
		expect(getDropdownMenuNextIndex(0, 0, 1)).toBe(-1);
	});

	it('getContextMenuNextIndex 非循环', () => {
		expect(getContextMenuNextIndex(0, 3, -1, false)).toBe(0);
		expect(getContextMenuNextIndex(2, 3, 1, false)).toBe(2);
	});

	it('getMenubarNextIndex / getSelectNextIndex / getNavigationMenuNextIndex', () => {
		expect(getMenubarNextIndex(1, 4, 1)).toBe(2);
		expect(getSelectNextIndex(0, 2, -1)).toBe(1);
		expect(getNavigationMenuNextIndex(0, 1, 1)).toBe(0);
	});

	it('getNavigationMenuIndicatorStyle', () => {
		expect(getNavigationMenuIndicatorStyle(null)).toBeNull();
		expect(getNavigationMenuIndicatorStyle({ left: 12, width: 40 })).toEqual({ left: 12, width: 40 });
	});
});

describe('方向动画与光标', () => {
	it('getDrawerTranslateStyle / getSheetTranslateStyle', () => {
		expect(getDrawerTranslateStyle('left')).toBe('translateX(-100%)');
		expect(getDrawerTranslateStyle('right')).toBe('translateX(100%)');
		expect(getDrawerTranslateStyle('top')).toBe('translateY(-100%)');
		expect(getDrawerTranslateStyle('bottom')).toBe('translateY(100%)');
		expect(getSheetTranslateStyle('right')).toBe('translateX(100%)');
	});

	it('getResizableDirectionCursor', () => {
		expect(getResizableDirectionCursor('horizontal')).toBe('col-resize');
		expect(getResizableDirectionCursor('vertical')).toBe('row-resize');
	});
});
