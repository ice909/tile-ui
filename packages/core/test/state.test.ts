import { describe, expect, it } from 'vitest';

import {
	getAccordionState,
	getAccordionNextValues,
	getAlertDialogState,
	getCheckboxState,
	getNextCheckboxState,
	getCollapsibleState,
	getNextCollapsibleOpen,
	getContextMenuState,
	getContextMenuCheckState,
	getDialogState,
	getDrawerState,
	getDropdownMenuState,
	getDropdownMenuCheckState,
	getMenubarState,
	getMenubarCheckState,
	getNavigationMenuState,
	getNavigationMenuActiveState,
	getNativeSelectState,
	getRadioState,
	getSelectState,
	getSelectCheckState,
	getSheetState,
	getSwitchState,
	getTabsState,
	getToggleState,
	getToggleGroupItemState,
	getSidebarState,
	getHoverCardState,
	getPopoverState,
	getTooltipState,
	isButtonDisabled,
	shouldShowAvatarFallback,
	normalizeDirection,
	clampProgressValue,
	getProgressOffset,
	clampSliderValue,
	getSliderPercent,
	getSliderOffsetStyle,
	getSpinnerSize,
	toggleValueInList,
} from '../src';

describe('状态标识函数', () => {
	it('getAccordionState', () => {
		expect(getAccordionState(true)).toBe('open');
		expect(getAccordionState(false)).toBe('closed');
	});

	it('getAccordionNextValues 切换值', () => {
		expect(getAccordionNextValues('a', ['a', 'b'])).toEqual(['b']);
		expect(getAccordionNextValues('c', ['a', 'b'])).toEqual(['a', 'b', 'c']);
	});

	it('getDialogState / getAlertDialogState / getSheetState / getDrawerState', () => {
		expect(getDialogState(true)).toBe('open');
		expect(getAlertDialogState(false)).toBe('closed');
		expect(getSheetState(true)).toBe('open');
		expect(getDrawerState(false)).toBe('closed');
	});

	it('getCheckboxState 与三态', () => {
		expect(getCheckboxState(true)).toBe('checked');
		expect(getCheckboxState(false)).toBe('unchecked');
		expect(getCheckboxState('indeterminate')).toBe('mixed');
		expect(getNextCheckboxState(true)).toBe(false);
		expect(getNextCheckboxState(false)).toBe(true);
	});

	it('getCollapsibleState / getNextCollapsibleOpen', () => {
		expect(getCollapsibleState(true)).toBe('open');
		expect(getNextCollapsibleOpen(true)).toBe(false);
		expect(getNextCollapsibleOpen(false)).toBe(true);
	});

	it('菜单类 CheckState 与 State', () => {
		expect(getDropdownMenuCheckState(true)).toBe('checked');
		expect(getContextMenuCheckState(false)).toBe('unchecked');
		expect(getMenubarCheckState(true)).toBe('checked');
		expect(getSelectCheckState(true)).toBe('checked');
		expect(getDropdownMenuState(true)).toBe('open');
		expect(getContextMenuState(false)).toBe('closed');
		expect(getMenubarState(true)).toBe('open');
		expect(getSelectState(false)).toBe('closed');
	});

	it('getNavigationMenuState / getNavigationMenuActiveState', () => {
		expect(getNavigationMenuState(true)).toBe('open');
		expect(getNavigationMenuActiveState(true)).toBe('active');
		expect(getNavigationMenuActiveState(false)).toBe('inactive');
	});

	it('getNativeSelectState', () => {
		expect(getNativeSelectState('x')).toBe('selected');
		expect(getNativeSelectState(undefined)).toBe('empty');
		expect(getNativeSelectState('')).toBe('empty');
	});

	it('getRadioState / getSwitchState / getTabsState', () => {
		expect(getRadioState(true)).toBe('checked');
		expect(getSwitchState(true)).toBe('checked');
		expect(getSwitchState(false)).toBe('unchecked');
		expect(getTabsState(true)).toBe('active');
		expect(getTabsState(false)).toBe('inactive');
	});

	it('getToggleState / getToggleGroupItemState', () => {
		expect(getToggleState(true)).toBe('on');
		expect(getToggleGroupItemState(false)).toBe('off');
	});

	it('getSidebarState', () => {
		expect(getSidebarState(true)).toBe('expanded');
		expect(getSidebarState(false)).toBe('collapsed');
	});

	it('getHoverCardState / getPopoverState / getTooltipState', () => {
		expect(getHoverCardState(true)).toBe('open');
		expect(getPopoverState(false)).toBe('closed');
		expect(getTooltipState(true)).toBe('open');
	});

	it('isButtonDisabled', () => {
		expect(isButtonDisabled()).toBe(false);
		expect(isButtonDisabled(true)).toBe(true);
		expect(isButtonDisabled(false, true)).toBe(true);
	});

	it('shouldShowAvatarFallback', () => {
		expect(shouldShowAvatarFallback('loaded', true)).toBe(false);
		expect(shouldShowAvatarFallback('error', true)).toBe(true);
		expect(shouldShowAvatarFallback(undefined, false)).toBe(true);
	});

	it('normalizeDirection', () => {
		expect(normalizeDirection('rtl')).toBe('rtl');
		expect(normalizeDirection('ltr')).toBe('ltr');
		expect(normalizeDirection(undefined)).toBe('ltr');
	});

	it('toggleValueInList', () => {
		expect(toggleValueInList('x', [])).toEqual(['x']);
		expect(toggleValueInList('x', ['x', 'y'])).toEqual(['y']);
	});
});

describe('数值夹取与百分比', () => {
	it('clampProgressValue', () => {
		expect(clampProgressValue(undefined)).toBe(0);
		expect(clampProgressValue(Number.NaN)).toBe(0);
		expect(clampProgressValue(-10)).toBe(0);
		expect(clampProgressValue(200)).toBe(100);
		expect(clampProgressValue(50)).toBe(50);
	});

	it('getProgressOffset', () => {
		expect(getProgressOffset(50)).toBe(50);
		expect(getProgressOffset(undefined)).toBe(0);
	});

	it('clampSliderValue', () => {
		expect(clampSliderValue(Number.NaN, 0, 100)).toBe(0);
		expect(clampSliderValue(-5, 0, 100)).toBe(0);
		expect(clampSliderValue(150, 0, 100)).toBe(100);
	});

	it('getSliderPercent', () => {
		expect(getSliderPercent(50, 0, 100)).toBe(50);
		expect(getSliderPercent(0, 0, 0)).toBe(0);
	});

	it('getSliderOffsetStyle', () => {
		expect(getSliderOffsetStyle(25, 0, 100)).toEqual({ left: '25%' });
		expect(getSliderOffsetStyle(25, 0, 100, 'vertical')).toEqual({ top: '25%' });
	});

	it('getSpinnerSize', () => {
		expect(getSpinnerSize('default')).toBe('default');
		expect(getSpinnerSize('sm')).toBe('sm');
	});
});
