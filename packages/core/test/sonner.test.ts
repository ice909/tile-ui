import { afterEach, describe, expect, it, vi } from 'vitest';

import { SONNER_DISMISS_DURATION, createSonnerStore } from '../src';

afterEach(() => {
	vi.useRealTimers();
});

describe('Sonner timer lifecycle', () => {
	it('reschedules an updated duration from the update time', () => {
		vi.useFakeTimers();
		const store = createSonnerStore();
		const id = store.add({ duration: 1000, title: 'Working' });
		vi.advanceTimersByTime(800);
		store.update(id, { duration: 500, title: 'Done' });
		vi.advanceTimersByTime(499);
		expect(store.getToasts()[0].dismissing).not.toBe(true);
		vi.advanceTimersByTime(1);
		expect(store.getToasts()[0].dismissing).toBe(true);
	});

	it('dismisses each toast once and makes repeated dismiss operations safe', () => {
		vi.useFakeTimers();
		const store = createSonnerStore();
		const listener = vi.fn();
		store.subscribe(listener);
		const first = store.add({ duration: 0, title: 'First' });
		store.add({ duration: 0, title: 'Second' });
		listener.mockClear();
		store.dismiss(first);
		store.dismiss(first);
		expect(listener).toHaveBeenCalledOnce();
		store.dismissAll();
		store.dismissAll();
		expect(listener).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(SONNER_DISMISS_DURATION);
		expect(store.getToasts()).toEqual([]);
	});

	it('revives an ID without a stale dismiss timer removing the replacement', () => {
		vi.useFakeTimers();
		const store = createSonnerStore();
		store.add({ id: 'shared', duration: 0, title: 'First' });
		store.dismiss('shared');
		store.add({ id: 'shared', duration: 0, title: 'Replacement' });
		vi.advanceTimersByTime(SONNER_DISMISS_DURATION);
		expect(store.getToasts()).toEqual([expect.objectContaining({ id: 'shared', title: 'Replacement', dismissing: false })]);
	});

	it('keeps identity and lifecycle state stable when an untyped caller includes managed fields', () => {
		vi.useFakeTimers();
		const store = createSonnerStore();
		store.add({ id: 'stable', duration: 100, title: 'Before' });
		store.update('stable', { id: 'unsafe', dismissing: true, duration: 200, title: 'After' } as never);
		expect(store.getToasts()).toEqual([expect.objectContaining({ id: 'stable', title: 'After' })]);
		expect(store.getToasts()[0]).not.toHaveProperty('dismissing');
		vi.advanceTimersByTime(199);
		expect(store.getToasts()[0].dismissing).not.toBe(true);
		vi.advanceTimersByTime(1);
		expect(store.getToasts()[0].dismissing).toBe(true);
	});

	it('excludes store-managed fields from the public update patch type', () => {
		const store = createSonnerStore();
		// @ts-expect-error 提示条 ID 创建后不可更新。
		store.update('stable', { id: 'unsafe' });
		// @ts-expect-error 消失状态由存储生命周期管理。
		store.update('stable', { dismissing: true });
		expect(store.getToasts()).toEqual([]);
	});
});
