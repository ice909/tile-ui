import { describe, expect, it } from 'vitest';

import {
	appendToFieldArray,
	createFormStore,
	getFormFieldIds,
	getInValue,
	insertIntoFieldArray,
	moveInFieldArray,
	normalizeFormValue,
	prependToFieldArray,
	removeFromFieldArray,
	replaceFieldArray,
	setInValue,
	swapFieldArrayItems,
	updateInFieldArray,
} from '../src';

describe('表单路径读写', () => {
	it('getFormFieldIds', () => {
		expect(getFormFieldIds('email')).toEqual({
			id: 'email',
			formItemId: 'email-form-item',
			formDescriptionId: 'email-form-item-description',
			formMessageId: 'email-form-item-message',
		});
	});

	it('getInValue 嵌套读取', () => {
		expect(getInValue({ user: { name: 'alice' } }, 'user.name')).toBe('alice');
		expect(getInValue({ user: { name: 'alice' } }, 'user.missing')).toBeUndefined();
		expect(getInValue({}, '')).toBeUndefined();
	});

	it('setInValue 嵌套写入', () => {
		expect(setInValue({}, 'user.name', 'alice')).toEqual({ user: { name: 'alice' } });
		expect(setInValue({ a: 1 }, 'a', 2)).toEqual({ a: 2 });
	});

	it('appendToFieldArray / prependToFieldArray', () => {
		expect(appendToFieldArray({}, 'items', 1)).toEqual({ items: [1] });
		expect(appendToFieldArray({ items: [1] }, 'items', 2)).toEqual({ items: [1, 2] });
		expect(prependToFieldArray({ items: [2] }, 'items', 1)).toEqual({ items: [1, 2] });
	});

	it('removeFromFieldArray / insertIntoFieldArray', () => {
		expect(removeFromFieldArray({ items: ['a', 'b', 'c'] }, 'items', 1)).toEqual({ items: ['a', 'c'] });
		expect(insertIntoFieldArray({ items: ['a', 'c'] }, 'items', 1, 'b')).toEqual({ items: ['a', 'b', 'c'] });
	});

	it('swapFieldArrayItems / moveInFieldArray', () => {
		expect(swapFieldArrayItems({ items: ['a', 'b'] }, 'items', 0, 1)).toEqual({ items: ['b', 'a'] });
		expect(moveInFieldArray({ items: ['a', 'b'] }, 'items', 0, 1)).toEqual({ items: ['b', 'a'] });
		expect(swapFieldArrayItems({ items: ['a', 'b'] }, 'items', 5, 1)).toEqual({ items: ['a', 'b'] });
	});

	it('updateInFieldArray / replaceFieldArray', () => {
		expect(updateInFieldArray({ items: ['a', 'b'] }, 'items', 0, 'A')).toEqual({ items: ['A', 'b'] });
		expect(updateInFieldArray({ items: ['a', 'b'] }, 'items', 9, 'x')).toEqual({ items: ['a', 'b'] });
		expect(replaceFieldArray({ items: ['a'] }, 'items', ['x', 'y'])).toEqual({ items: ['x', 'y'] });
	});

	it('normalizeFormValue', () => {
		expect(normalizeFormValue('abc')).toBe('abc');
		expect(normalizeFormValue({ target: { value: 'xyz' } })).toBe('xyz');
		expect(normalizeFormValue('42', true)).toBe(42);
		expect(normalizeFormValue(42, true)).toBe(42);
	});
});

describe('FormStore', () => {
	it('注册字段、读写值与快照', () => {
		const store = createFormStore({ name: '' }, undefined);
		store.registerField('name');
		store.setValue('name', 'alice');
		expect(store.getValue('name')).toBe('alice');
		expect(store.getSnapshot().values.name).toBe('alice');
	});

	it('blurField 标记 touched', () => {
		const store = createFormStore({ name: '' }, undefined);
		store.registerField('name');
		expect(store.getFieldState('name').isTouched).toBe(false);
		store.blurField('name');
		expect(store.getFieldState('name').isTouched).toBe(true);
	});

	it('订阅通知', () => {
		const store = createFormStore({ name: '' }, undefined);
		store.registerField('name');
		let notified = 0;
		const unsubscribe = store.subscribe(() => {
			notified += 1;
		});
		store.setValue('name', 'bob');
		expect(notified).toBeGreaterThan(0);
		unsubscribe();
	});

	it('unregisterField 清除字段状态', () => {
		const store = createFormStore({ name: '' }, undefined);
		store.registerField('name');
		store.blurField('name');
		expect(store.getFieldState('name').isTouched).toBe(true);
		store.unregisterField('name');
		expect(store.getFieldState('name').isTouched).toBe(false);
		expect(store.getFieldState('name').isDirty).toBe(false);
	});
});
