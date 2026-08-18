import { describe, expect, it } from 'vitest';

import {
	getButtonStyleKeys,
	isButtonDisabled,
	getCheckboxState,
	getNextCheckboxState,
	getRadioState,
	getSwitchState,
	getToggleState,
	getToggleStyleKeys,
	getToggleGroupItemState,
	toggleValueInList,
	getSelectState,
	getSelectCheckState,
	getSelectNextIndex,
	getNativeSelectState,
	splitOtpValue,
	joinOtpValue,
	isOtpCharAllowed,
	getNextOtpIndex,
	getPrevOtpIndex,
	getInputIds,
	getInputAriaProps,
	getTextareaIds,
	getTextareaAriaProps,
} from '../../core/src/components/index';

describe('button logic', () => {
	it('getButtonStyleKeys 返回正确的样式键', () => {
		const keys = getButtonStyleKeys('destructive', 'lg');
		expect(keys.base).toBe('button');
		expect(keys.variant).toBe('variantDestructive');
		expect(keys.size).toBe('sizeLg');
	});

	it('isButtonDisabled 在 loading 或 disabled 时返回 true', () => {
		expect(isButtonDisabled(true, false)).toBe(true);
		expect(isButtonDisabled(false, true)).toBe(true);
		expect(isButtonDisabled(true, true)).toBe(true);
		expect(isButtonDisabled(false, false)).toBe(false);
	});
});

describe('checkbox logic', () => {
	it('getCheckboxState 返回正确状态', () => {
		expect(getCheckboxState(true)).toBe('checked');
		expect(getCheckboxState(false)).toBe('unchecked');
		expect(getCheckboxState('indeterminate')).toBe('mixed');
	});

	it('getNextCheckboxState 在 true/false 间切换', () => {
		expect(getNextCheckboxState(true)).toBe(false);
		expect(getNextCheckboxState(false)).toBe(true);
		expect(getNextCheckboxState('indeterminate')).toBe(true);
	});
});

describe('radio-group logic', () => {
	it('getRadioState 返回正确状态', () => {
		expect(getRadioState(true)).toBe('checked');
		expect(getRadioState(false)).toBe('unchecked');
	});
});

describe('switch logic', () => {
	it('getSwitchState 返回正确状态', () => {
		expect(getSwitchState(true)).toBe('checked');
		expect(getSwitchState(false)).toBe('unchecked');
	});
});

describe('toggle logic', () => {
	it('getToggleState 返回正确状态', () => {
		expect(getToggleState(true)).toBe('on');
		expect(getToggleState(false)).toBe('off');
	});

	it('getToggleStyleKeys 返回正确的样式键', () => {
		const keys = getToggleStyleKeys('outline', 'lg');
		expect(keys.base).toBe('toggle');
		expect(keys.variant).toBe('variantOutline');
		expect(keys.size).toBe('sizeLg');
	});
});

describe('toggle-group logic', () => {
	it('getToggleGroupItemState 返回正确状态', () => {
		expect(getToggleGroupItemState(true)).toBe('on');
		expect(getToggleGroupItemState(false)).toBe('off');
	});

	it('toggleValueInList 添加和移除值', () => {
		expect(toggleValueInList('a', ['a', 'b'])).toEqual(['b']);
		expect(toggleValueInList('c', ['a', 'b'])).toEqual(['a', 'b', 'c']);
		expect(toggleValueInList('a', [])).toEqual(['a']);
	});
});

describe('select logic', () => {
	it('getSelectState 返回正确状态', () => {
		expect(getSelectState(true)).toBe('open');
		expect(getSelectState(false)).toBe('closed');
	});

	it('getSelectCheckState 返回正确状态', () => {
		expect(getSelectCheckState(true)).toBe('checked');
		expect(getSelectCheckState(false)).toBe('unchecked');
	});

	it('getSelectNextIndex 支持循环导航', () => {
		expect(getSelectNextIndex(0, 5, 1, true)).toBe(1);
		expect(getSelectNextIndex(4, 5, 1, true)).toBe(0);
		expect(getSelectNextIndex(0, 5, -1, true)).toBe(4);
		expect(getSelectNextIndex(2, 5, -1, true)).toBe(1);
	});

	it('getSelectNextIndex 不循环时边界截断', () => {
		expect(getSelectNextIndex(0, 5, -1, false)).toBe(0);
		expect(getSelectNextIndex(4, 5, 1, false)).toBe(4);
	});

	it('getSelectNextIndex itemCount 为 0 时返回 -1', () => {
		expect(getSelectNextIndex(0, 0, 1)).toBe(-1);
	});
});

describe('native-select logic', () => {
	it('getNativeSelectState 返回正确状态', () => {
		expect(getNativeSelectState('hello')).toBe('selected');
		expect(getNativeSelectState('')).toBe('empty');
		expect(getNativeSelectState(undefined)).toBe('empty');
	});
});

describe('input-otp logic', () => {
	it('splitOtpValue 将字符串拆分为定长字符数组', () => {
		expect(splitOtpValue('abc', 4)).toEqual(['a', 'b', 'c', '']);
		expect(splitOtpValue('abcdef', 4)).toEqual(['a', 'b', 'c', 'd']);
		expect(splitOtpValue('', 4)).toEqual(['', '', '', '']);
	});

	it('joinOtpValue 将数组拼接为字符串', () => {
		expect(joinOtpValue(['a', 'b', 'c', ''])).toBe('abc');
		expect(joinOtpValue(['1', '2', '3', '4'])).toBe('1234');
		expect(joinOtpValue([], 4)).toBe('');
	});

	it('isOtpCharAllowed 按模式过滤字符', () => {
		expect(isOtpCharAllowed('a', 'alphanumeric')).toBe(true);
		expect(isOtpCharAllowed('1', 'alphanumeric')).toBe(true);
		expect(isOtpCharAllowed('!', 'alphanumeric')).toBe(false);
		expect(isOtpCharAllowed('1', 'numeric')).toBe(true);
		expect(isOtpCharAllowed('a', 'numeric')).toBe(false);
		expect(isOtpCharAllowed('!', 'text')).toBe(true);
		expect(isOtpCharAllowed('ab', 'text')).toBe(false);
	});

	it('getNextOtpIndex 计算下一个槽位', () => {
		expect(getNextOtpIndex(0, 4)).toBe(1);
		expect(getNextOtpIndex(3, 4)).toBeNull();
		expect(getNextOtpIndex(2, 4)).toBe(3);
	});

	it('getPrevOtpIndex 计算上一个槽位', () => {
		expect(getPrevOtpIndex(1)).toBe(0);
		expect(getPrevOtpIndex(0)).toBeNull();
		expect(getPrevOtpIndex(3)).toBe(2);
	});
});

describe('input logic', () => {
	it('getInputIds 生成正确的辅助 ID', () => {
		const ids = getInputIds('my-input');
		expect(ids.input).toBe('my-input');
		expect(ids.error).toBe('my-input-error');
		expect(ids.helper).toBe('my-input-helper');
	});

	it('getInputAriaProps 返回正确的 ARIA 属性', () => {
		const ids = getInputIds('test');
		const withError = getInputAriaProps(ids, '必填', undefined);
		expect(withError['aria-invalid']).toBe(true);
		expect(withError['aria-describedby']).toBe('test-error');

		const withHelper = getInputAriaProps(ids, undefined, '提示文本');
		expect(withHelper['aria-invalid']).toBeUndefined();
		expect(withHelper['aria-describedby']).toBe('test-helper');

		const neither = getInputAriaProps(ids, undefined, undefined);
		expect(neither['aria-invalid']).toBeUndefined();
		expect(neither['aria-describedby']).toBeUndefined();
	});
});

describe('textarea logic', () => {
	it('getTextareaIds 生成正确的辅助 ID', () => {
		const ids = getTextareaIds('my-textarea');
		expect(ids.textarea).toBe('my-textarea');
		expect(ids.error).toBe('my-textarea-error');
		expect(ids.helper).toBe('my-textarea-helper');
	});

	it('getTextareaAriaProps 返回正确的 ARIA 属性', () => {
		const ids = getTextareaIds('test');
		const withError = getTextareaAriaProps(ids, '错误信息', undefined);
		expect(withError['aria-invalid']).toBe(true);
		expect(withError['aria-describedby']).toBe('test-error');
	});
});
