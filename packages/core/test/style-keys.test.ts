import { describe, expect, it } from 'vitest';

import {
	getAlertStyleKeys,
	getBadgeStyleKeys,
	getBubbleStyleKeys,
	getButtonGroupStyleKeys,
	getButtonStyleKeys,
	getDrawerStyleKeys,
	getEmptyMediaVariantKey,
	getFieldIds,
	getFieldMessageStyleKeys,
	getInputGroupAddonStyleKeys,
	getInputGroupStyleKeys,
	getInputIds,
	getInputAriaProps,
	getItemVariantKey,
	getLabelClassKeys,
	getMarkerVariantKey,
	getMessageScrollerButtonStyleKeys,
	getMessageStyleKeys,
	getPaginationSizeKey,
	getScrollBarSizeKey,
	getSeparatorStyleKeys,
	getSidebarMenuButtonStyleKeys,
	getSidebarMenuSubButtonStyleKeys,
	getSidebarStyleKeys,
	getSonnerPositionStyleKeys,
	getTextareaIds,
	getTextareaAriaProps,
	getToggleStyleKeys,
} from '../src';

describe('样式类名键生成', () => {
	it('getButtonStyleKeys', () => {
		expect(getButtonStyleKeys()).toEqual({ base: 'button', variant: 'variantDefault', size: 'sizeDefault' });
		expect(getButtonStyleKeys('primary', 'sm')).toEqual({ base: 'button', variant: 'variantPrimary', size: 'sizeSm' });
	});

	it('getBadgeStyleKeys / getAlertStyleKeys', () => {
		expect(getBadgeStyleKeys('destructive').variant).toBe('variantDestructive');
		expect(getAlertStyleKeys('destructive').variant).toBe('variantDestructive');
	});

	it('getButtonGroupStyleKeys', () => {
		expect(getButtonGroupStyleKeys('horizontal')).toEqual({ base: 'buttonGroup', orientation: 'orientationHorizontal' });
		expect(getButtonGroupStyleKeys('vertical')).toEqual({ base: 'buttonGroup', orientation: 'orientationVertical' });
	});

	it('getBubbleStyleKeys / getMessageStyleKeys', () => {
		expect(getBubbleStyleKeys('primary').variant).toBe('variantPrimary');
		expect(getMessageStyleKeys('end').align).toBe('alignEnd');
		expect(getMessageStyleKeys('start').align).toBe('alignStart');
	});

	it('getDrawerStyleKeys / getSidebarStyleKeys', () => {
		expect(getDrawerStyleKeys('right').variant).toBe('directionRight');
		expect(getDrawerStyleKeys('left').variant).toBe('directionLeft');
		expect(getSidebarStyleKeys('floating').variant).toBe('variantFloating');
	});

	it('getEmptyMediaVariantKey / getItemVariantKey / getMarkerVariantKey', () => {
		expect(getEmptyMediaVariantKey('icon')).toBe('variantIcon');
		expect(getItemVariantKey('default')).toBe('variantDefault');
		expect(getMarkerVariantKey('separator')).toBe('variantSeparator');
	});

	it('getFieldIds / getFieldMessageStyleKeys', () => {
		expect(getFieldIds('name').messageId).toBe('name-message');
		expect(getFieldMessageStyleKeys('error').variant).toBe('variantError');
	});

	it('getInputGroupStyleKeys / getInputGroupAddonStyleKeys', () => {
		expect(getInputGroupStyleKeys('default').base).toBe('inputGroup');
		expect(getInputGroupAddonStyleKeys('default').base).toBe('addon');
	});

	it('getInputIds / getInputAriaProps / getTextareaIds / getTextareaAriaProps', () => {
		expect(getInputIds('email')).toEqual({ input: 'email', error: 'email-error', helper: 'email-helper' });
		expect(getInputAriaProps(getInputIds('e'), 'err')).toEqual({ 'aria-invalid': true, 'aria-describedby': 'e-error' });
		expect(getInputAriaProps(getInputIds('e'))).toEqual({ 'aria-invalid': undefined, 'aria-describedby': undefined });
		expect(getInputAriaProps(getInputIds('e'), undefined, 'hint')['aria-describedby']).toBe('e-helper');
		expect(getTextareaIds('x')).toEqual({ textarea: 'x', error: 'x-error', helper: 'x-helper' });
		expect(getTextareaAriaProps(getTextareaIds('x'), 'err')['aria-describedby']).toBe('x-error');
	});

	it('getLabelClassKeys', () => {
		expect(getLabelClassKeys()).toEqual({ base: 'label', required: undefined });
		expect(getLabelClassKeys(true)).toEqual({ base: 'label', required: 'required' });
	});

	it('getMessageScrollerButtonStyleKeys', () => {
		expect(getMessageScrollerButtonStyleKeys('start').direction).toBe('directionStart');
		expect(getMessageScrollerButtonStyleKeys('end').direction).toBe('directionEnd');
	});

	it('getPaginationSizeKey / getScrollBarSizeKey / getSeparatorStyleKeys', () => {
		expect(getPaginationSizeKey('sm')).toBe('sizeSm');
		expect(getScrollBarSizeKey('vertical')).toBe('vertical');
		expect(getSeparatorStyleKeys('vertical').orientation).toBe('orientationVertical');
		expect(getSeparatorStyleKeys('horizontal').orientation).toBe('orientationHorizontal');
	});

	it('getSidebarMenuButtonStyleKeys / getSidebarMenuSubButtonStyleKeys', () => {
		expect(getSidebarMenuButtonStyleKeys('outline', 'sm')).toEqual({ base: 'menuButton', variant: 'variantOutline', size: 'sizeSm' });
		expect(getSidebarMenuSubButtonStyleKeys('sm').size).toBe('sizeSm');
	});

	it('getSonnerPositionStyleKeys', () => {
		expect(getSonnerPositionStyleKeys('bottom-right').position).toBe('positionBottomRight');
		expect(getSonnerPositionStyleKeys('top-center').position).toBe('positionTopCenter');
	});

	it('getToggleStyleKeys', () => {
		expect(getToggleStyleKeys('outline', 'sm')).toEqual({ base: 'toggle', variant: 'variantOutline', size: 'sizeSm' });
	});
});
