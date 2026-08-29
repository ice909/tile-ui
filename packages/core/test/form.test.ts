import { describe, expect, it, vi } from 'vitest';

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

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

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

	it('setInValue 在每个数字路径层级保留数组并保持不可变更新', () => {
		const original = { groups: [{ members: [{ name: 'first' }, { name: 'second' }] }], untouched: { stable: true } };
		const next = setInValue(original, 'groups.0.members.1.name', 'updated') as typeof original;
		expect(next).toEqual({ groups: [{ members: [{ name: 'first' }, { name: 'updated' }] }], untouched: { stable: true } });
		expect(Array.isArray(next.groups)).toBe(true);
		expect(Array.isArray(next.groups[0].members)).toBe(true);
		expect(next).not.toBe(original);
		expect(next.groups).not.toBe(original.groups);
		expect(next.groups[0]).not.toBe(original.groups[0]);
		expect(next.groups[0].members).not.toBe(original.groups[0].members);
		expect(next.groups[0].members[0]).toBe(original.groups[0].members[0]);
		expect(next.untouched).toBe(original.untouched);
		expect(setInValue({}, 'groups.0.members.1.name', 'created')).toEqual({ groups: [{ members: [undefined, { name: 'created' }] }] });
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
		expect(swapFieldArrayItems({ items: ['a', 'b', 'c'] }, 'items', 0, 2)).toEqual({ items: ['c', 'b', 'a'] });
		expect(moveInFieldArray({ items: ['a', 'b', 'c'] }, 'items', 0, 2)).toEqual({ items: ['b', 'c', 'a'] });
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

	it('自定义校验 false 失败且 true 通过', async () => {
		const falseStore = createFormStore({ name: 'value' });
		falseStore.registerField('name', { validate: () => false });
		expect(await falseStore.trigger('name')).toBe(false);
		expect(falseStore.getFieldState('name').error).toEqual({ type: 'validate', message: 'Validation failed' });
		const invalid = vi.fn();
		await falseStore.createSubmitHandler(vi.fn(), invalid)();
		expect(invalid).toHaveBeenCalledWith({ name: { type: 'validate', message: 'Validation failed' } }, undefined);

		const trueStore = createFormStore({ name: 'value' });
		trueStore.registerField('name', { validate: { custom: () => true } });
		expect(await trueStore.trigger('name')).toBe(true);
		const valid = vi.fn();
		await trueStore.createSubmitHandler(valid)();
		expect(valid).toHaveBeenCalledWith({ name: 'value' }, undefined);
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

	it('reset 无参数恢复深克隆的原始默认值', () => {
		const defaults = { profile: { name: 'Tile' }, tags: ['solid'] };
		const store = createFormStore(defaults);
		(defaults.profile as { name: string }).name = 'mutated outside';
		store.setValue('profile.name', 'edited', { shouldDirty: true });
		store.setValue('tags.0', 'changed');
		store.reset();
		expect(store.getValues()).toEqual({ profile: { name: 'Tile' }, tags: ['solid'] });
		(store.getValue('profile') as { name: string }).name = 'mutated snapshot';
		store.reset();
		expect(store.getValue('profile.name')).toBe('Tile');
	});

	it('同名字段按注册顺序合并规则，并精确注销当前注册', async () => {
		const store = createFormStore({ name: '' });
		const firstOptions = { required: 'required', minLength: { value: 2, message: 'short' }, deps: ['first'] };
		const first = store.registerField('name', firstOptions);
		const second = store.registerField('name', { required: false, maxLength: { value: 4, message: 'long' }, deps: ['second'] });
		firstOptions.required = 'mutated';
		store.setValue('name', 'ok');
		expect(await store.trigger('name')).toBe(true);
		store.setValue('name', '12345');
		expect(await store.trigger('name')).toBe(false);
		expect(store.getFieldState('name').error?.message).toBe('long');

		second.unregister();
		store.setValue('name', '');
		expect(await store.trigger('name')).toBe(false);
		expect(store.getFieldState('name').error?.message).toBe('required');
		first.unregister();
		expect(store.getFieldState('name').error).toBeUndefined();
	});

	it('最终注销清除 dirty、touched、error 并重算 isDirty', () => {
		const store = createFormStore({ first: '', second: '' });
		const first = store.registerField('first');
		const second = store.registerField('second');
		store.setValue('first', 'a', { shouldDirty: true, shouldTouch: true });
		store.setValue('second', 'b', { shouldDirty: true });
		store.setError('first', 'bad');
		first.unregister();
		expect(store.getFieldState('first')).toEqual({ error: undefined, isTouched: false, isDirty: false, value: 'a' });
		expect(store.getFormState().isDirty).toBe(true);
		second.unregister();
		expect(store.getFormState().isDirty).toBe(false);
	});

	it('较旧字段校验不能覆盖较新值、reset 或 unregister', async () => {
		const first = deferred<string | boolean>();
		const second = deferred<string | boolean>();
		const validate = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValue(true);
		const store = createFormStore({ name: 'first' });
		const registration = store.registerField('name', { validate });
		const oldRun = store.validateField('name');
		store.setValue('name', 'second');
		const newRun = store.validateField('name');
		second.resolve(true);
		await newRun;
		first.resolve('stale');
		await oldRun;
		expect(store.getFieldState('name').error).toBeUndefined();

		const resetRun = store.validateField('name');
		store.reset();
		await resetRun;
		expect(store.getFieldState('name').error).toBeUndefined();
		const unregisterRun = store.validateField('name');
		registration.unregister();
		await unregisterRun;
		expect(store.getFieldState('name').error).toBeUndefined();
	});

	it('较旧 whole-form/resolver 校验不能覆盖较新运行或 reset', async () => {
		const first = deferred<Record<string, { message: string }>>();
		const second = deferred<Record<string, { message: string }>>();
		const resolver = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockResolvedValue({});
		const store = createFormStore({ name: 'first' }, resolver);
		store.registerField('name');
		const oldRun = store.validateFields();
		store.setValue('name', 'second');
		const newRun = store.validateFields();
		second.resolve({});
		await newRun;
		first.resolve({ name: { message: 'stale resolver' } });
		await oldRun;
		expect(store.getFormState().errors).toEqual({});

		const resetRun = store.validateFields();
		store.reset();
		await resetRun;
		expect(store.getFormState().errors).toEqual({});
	});

	it('提交从校验开始计数和 submitting，并覆盖 invalid 异步回调', async () => {
		const validation = deferred<string | boolean>();
		const invalid = deferred<void>();
		const store = createFormStore({ name: '' });
		store.registerField('name', { validate: () => validation.promise });
		const onInvalid = vi.fn(() => invalid.promise);
		const submit = store.createSubmitHandler(vi.fn(), onInvalid);
		const pending = submit();
		expect(store.getFormState()).toMatchObject({ submitCount: 1, isSubmitted: true, isSubmitting: true });
		validation.resolve('invalid');
		await vi.waitFor(() => expect(onInvalid).toHaveBeenCalledOnce());
		expect(store.getFormState().isSubmitting).toBe(true);
		invalid.resolve();
		await pending;
		expect(store.getFormState()).toMatchObject({ submitCount: 1, isSubmitting: false });
	});

	it('重叠提交独立计数，并保持 submitting 到全部当前尝试完成', async () => {
		const first = deferred<void>();
		const second = deferred<void>();
		const onValid = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const store = createFormStore({ name: 'valid' });
		store.registerField('name', { required: true });
		const submit = store.createSubmitHandler(onValid);
		const firstAttempt = submit();
		await vi.waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
		const secondAttempt = submit();
		await vi.waitFor(() => expect(onValid).toHaveBeenCalledTimes(2));
		expect(store.getFormState()).toMatchObject({ submitCount: 2, isSubmitting: true });
		second.resolve();
		await secondAttempt;
		expect(store.getFormState().isSubmitting).toBe(true);
		first.resolve();
		await firstAttempt;
		expect(store.getFormState().isSubmitting).toBe(false);
	});

	it('重叠提交在校验阶段也分别完成各自快照回调，只有最新结果写入全局错误', async () => {
		const firstValidation = deferred<Record<string, { message: string }>>();
		const secondValidation = deferred<Record<string, { message: string }>>();
		const resolver = vi.fn().mockReturnValueOnce(firstValidation.promise).mockReturnValueOnce(secondValidation.promise);
		const valid = vi.fn();
		const invalid = vi.fn();
		const store = createFormStore({ name: 'first' }, resolver);
		store.registerField('name');
		const submit = store.createSubmitHandler(valid, invalid);
		const firstAttempt = submit();
		store.setValue('name', 'second');
		const secondAttempt = submit();
		expect(store.getFormState()).toMatchObject({ submitCount: 2, isSubmitting: true });

		secondValidation.resolve({});
		await secondAttempt;
		expect(valid).toHaveBeenCalledWith({ name: 'second' }, undefined);
		expect(store.getFormState().errors).toEqual({});
		expect(store.getFormState().isSubmitting).toBe(true);

		firstValidation.resolve({ name: { message: 'first invalid' } });
		await firstAttempt;
		expect(invalid).toHaveBeenCalledWith({ name: { message: 'first invalid' } }, undefined);
		expect(store.getFormState().errors).toEqual({});
		expect(store.getFormState().isSubmitting).toBe(false);
	});

	it('reset 不静默取消进行中的提交，而是完成其原始快照回调', async () => {
		const validation = deferred<Record<string, { message: string }>>();
		const valid = vi.fn();
		const store = createFormStore({ name: 'initial' }, () => validation.promise);
		store.registerField('name');
		store.setValue('name', 'submitted');
		const pending = store.createSubmitHandler(valid)();
		store.reset();
		expect(store.getFormState()).toMatchObject({ submitCount: 0, isSubmitting: true });
		validation.resolve({});
		await pending;
		expect(valid).toHaveBeenCalledWith({ name: 'submitted' }, undefined);
		expect(store.getValue('name')).toBe('initial');
		expect(store.getFormState().isSubmitting).toBe(false);
	});

	it('字段数组变更使字段和 resolver 的旧校验结果失效', async () => {
		const fieldValidation = deferred<string | boolean>();
		const resolverValidation = deferred<Record<string, { message: string }>>();
		const store = createFormStore({ items: ['first'] }, () => resolverValidation.promise);
		store.registerField('items', { validate: () => fieldValidation.promise });
		const fieldRun = store.validateField('items');
		const wholeRun = store.validateFields();
		store.append('items', 'second');
		fieldValidation.resolve('stale field');
		resolverValidation.resolve({ items: { message: 'stale resolver' } });
		await Promise.all([fieldRun, wholeRun]);
		expect(store.getValues('items')).toEqual(['first', 'second']);
		expect(store.getFieldState('items').error).toBeUndefined();
	});

	it('字段数组操作让稳定 ID 与行执行相同的 keyed identity 语义', () => {
		const store = createFormStore({ items: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] });
		const initial = store.getFieldArray('items');
		const [aId, bId, cId] = initial.map((item) => item.id);

		store.append('items', { value: 'd' });
		let rows = store.getFieldArray('items');
		const dId = rows[3].id;
		expect(rows.map((item) => item.id)).toEqual([aId, bId, cId, dId]);

		store.prepend('items', { value: 'start' });
		rows = store.getFieldArray('items');
		const startId = rows[0].id;
		expect(rows.map((item) => item.id)).toEqual([startId, aId, bId, cId, dId]);

		store.insert('items', 2, { value: 'inserted' });
		rows = store.getFieldArray('items');
		const insertedId = rows[2].id;
		expect(rows.map((item) => item.id)).toEqual([startId, aId, insertedId, bId, cId, dId]);

		store.remove('items', 3);
		expect(store.getFieldArray('items').map((item) => item.id)).toEqual([startId, aId, insertedId, cId, dId]);

		store.swap('items', 0, 4);
		expect(store.getFieldArray('items').map((item) => item.id)).toEqual([dId, aId, insertedId, cId, startId]);

		store.move('items', 4, 1);
		expect(store.getFieldArray('items').map((item) => item.id)).toEqual([dId, startId, aId, insertedId, cId]);

		store.update('items', 2, { value: 'updated' });
		rows = store.getFieldArray('items');
		expect(rows[2].id).not.toBe(aId);
		expect(rows.filter((_item, index) => index !== 2).map((item) => item.id)).toEqual([dId, startId, insertedId, cId]);

		const beforeReplace = rows.map((item) => item.id);
		store.replace('items', [{ value: 'x' }, { value: 'y' }]);
		rows = store.getFieldArray('items');
		expect(rows).toHaveLength(2);
		expect(rows.every((item) => !beforeReplace.includes(item.id))).toBe(true);

		const replacedIds = rows.map((item) => item.id);
		store.reset();
		rows = store.getFieldArray('items');
		expect(rows).toHaveLength(3);
		expect(rows.every((item) => !replacedIds.includes(item.id))).toBe(true);
	});

	it('嵌套字段数组路径保持数组结构和 keyed ID', () => {
		const store = createFormStore({ groups: [{ members: [{ name: 'a' }, { name: 'b' }] }] });
		const initial = store.getFieldArray('groups.0.members');
		store.insert('groups.0.members', 1, { name: 'middle' });
		const next = store.getFieldArray('groups.0.members');
		expect(store.getValues()).toEqual({ groups: [{ members: [{ name: 'a' }, { name: 'middle' }, { name: 'b' }] }] });
		expect(next.map((item) => item.id)).toEqual([initial[0].id, expect.any(String), initial[1].id]);
		expect(next[1].id).not.toBe(initial[0].id);
		expect(next[1].id).not.toBe(initial[1].id);
	});

	it('remove 清除被删行后代并将存活行的 ID、注册和状态下移', async () => {
		const store = createFormStore({ groups: [{ members: [{ name: 'removed' }] }, { members: [{ name: '' }] }] });
		const removedIds = store.getFieldArray('groups.0.members').map((item) => item.id);
		const survivorIds = store.getFieldArray('groups.1.members').map((item) => item.id);
		const removed = store.registerField('groups.0.members.0.name', { required: 'removed rule' });
		const survivor = store.registerField('groups.1.members.0.name', { required: 'survivor rule' });
		const dependentValidation = vi.fn(() => true);
		const dependent = store.registerField('groups.1.members.0.confirm', { deps: ['groups.1.members.0.name'], validate: dependentValidation });
		store.setError('groups.0.members.0.name', 'removed error');
		store.setError('groups.1.members.0.name', 'survivor error');
		store.setValue('groups.1.members.0.name', '', { shouldDirty: true, shouldTouch: true });
		let listenerCalls = 0;
		const unsubscribe = store.subscribeField('groups.1.members.0.name', () => {
			listenerCalls += 1;
		});

		store.remove('groups', 0);
		expect(store.getFieldArray('groups.0.members').map((item) => item.id)).toEqual(survivorIds);
		expect(store.getFieldArray('groups.0.members').map((item) => item.id)).not.toEqual(removedIds);
		expect(store.getFieldState('groups.0.members.0.name')).toMatchObject({ error: { type: 'manual', message: 'survivor error' }, isDirty: true, isTouched: true });
		expect(store.getFieldState('groups.1.members.0.name')).toMatchObject({ error: undefined, isDirty: false, isTouched: false });
		store.clearErrors('groups.0.members.0.name');
		expect(await store.trigger('groups.0.members.0.name')).toBe(false);
		expect(store.getFieldState('groups.0.members.0.name').error?.message).toBe('survivor rule');
		store.setValue('groups.0.members.0.name', 'ok');
		await vi.waitFor(() => expect(dependentValidation).toHaveBeenCalled());
		expect(listenerCalls).toBeGreaterThan(0);
		survivor.onChange('moved handle');
		expect(store.getValue('groups.0.members.0.name')).toBe('moved handle');
		unsubscribe();
		removed.unregister();
		store.setValue('groups.0.members.0.name', '');
		expect(await store.trigger('groups.0.members.0.name')).toBe(false);
		survivor.unregister();
		dependent.unregister();
		expect(await store.trigger()).toBe(true);
	});

	it('insert 不让新行继承后代状态，并将旧行后代向后迁移', async () => {
		const store = createFormStore({ groups: [{ members: [{ name: '' }] }] });
		const memberIds = store.getFieldArray('groups.0.members').map((item) => item.id);
		const registration = store.registerField('groups.0.members.0.name', { required: 'existing rule' });
		store.setError('groups.0.members.0.name', 'existing error');
		store.setValue('groups.0.members.0.name', '', { shouldDirty: true, shouldTouch: true });

		store.insert('groups', 0, { members: [{ name: 'new' }] });
		expect(store.getFieldArray('groups.1.members').map((item) => item.id)).toEqual(memberIds);
		expect(store.getFieldState('groups.0.members.0.name')).toMatchObject({ error: undefined, isDirty: false, isTouched: false });
		expect(store.getFieldState('groups.1.members.0.name')).toMatchObject({ error: { type: 'manual', message: 'existing error' }, isDirty: true, isTouched: true });
		store.clearErrors('groups.1.members.0.name');
		expect(await store.trigger('groups.1.members.0.name')).toBe(false);
		expect(store.getFieldState('groups.1.members.0.name').error?.message).toBe('existing rule');
		registration.unregister();
		expect(await store.trigger()).toBe(true);
	});

	it('swap 和 move 随行迁移嵌套 ID、注册规则和错误状态', async () => {
		const createNestedStore = () => {
			const store = createFormStore({ groups: [{ members: [{ name: 'a' }] }, { members: [{ name: 'b' }] }, { members: [{ name: 'c' }] }] });
			const ids = [0, 1, 2].map((index) => store.getFieldArray(`groups.${index}.members`)[0].id);
			const registrations = [0, 1, 2].map((index) => store.registerField(`groups.${index}.members.0.name`, { validate: () => `rule-${index}` }));
			for (let index = 0; index < 3; index++) store.setError(`groups.${index}.members.0.name`, `error-${index}`);
			return { store, ids, registrations };
		};

		const swapped = createNestedStore();
		swapped.store.swap('groups', 0, 2);
		expect([0, 1, 2].map((index) => swapped.store.getFieldArray(`groups.${index}.members`)[0].id)).toEqual([swapped.ids[2], swapped.ids[1], swapped.ids[0]]);
		expect([0, 1, 2].map((index) => swapped.store.getFieldState(`groups.${index}.members.0.name`).error?.message)).toEqual(['error-2', 'error-1', 'error-0']);
		swapped.store.clearErrors();
		expect((await swapped.store.validateFields())['groups.0.members.0.name']?.message).toBe('rule-2');
		for (const registration of swapped.registrations) registration.unregister();

		const moved = createNestedStore();
		moved.store.move('groups', 0, 2);
		expect([0, 1, 2].map((index) => moved.store.getFieldArray(`groups.${index}.members`)[0].id)).toEqual([moved.ids[1], moved.ids[2], moved.ids[0]]);
		expect([0, 1, 2].map((index) => moved.store.getFieldState(`groups.${index}.members.0.name`).error?.message)).toEqual(['error-1', 'error-2', 'error-0']);
		moved.store.clearErrors();
		expect((await moved.store.validateFields())['groups.2.members.0.name']?.message).toBe('rule-0');
		for (const registration of moved.registrations) registration.unregister();
		expect(await moved.store.trigger()).toBe(true);
	});
});
