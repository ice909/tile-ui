import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLocalStorage, createSessionStorage, type StorageSignal } from '../src/primitives';

function createOwnedStorage<T>(factory: () => StorageSignal<T>) {
	let signal!: StorageSignal<T>;
	let dispose!: () => void;
	createRoot((ownerDispose) => {
		dispose = ownerDispose;
		signal = factory();
	});
	return { signal, dispose };
}

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Solid storage primitives', () => {
	it('evaluates a lazy default once and adopts existing JSON on mount', () => {
		localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));
		const defaultValue = vi.fn(() => ({ theme: 'light' }));
		const { signal, dispose } = createOwnedStorage(() => createLocalStorage('settings', defaultValue));

		expect(defaultValue).toHaveBeenCalledOnce();
		expect(signal[0]()).toEqual({ theme: 'dark' });
		dispose();
	});

	it('keeps local and session storage isolated and implements Solid Setter semantics', () => {
		const local = createOwnedStorage(() => createLocalStorage('counter', 1));
		const session = createOwnedStorage(() => createSessionStorage('counter', 10));

		expect(local.signal[1](2)).toBe(2);
		expect(local.signal[1]((previous) => previous + 3)).toBe(5);
		expect(session.signal[1]((previous) => previous + 1)).toBe(11);
		expect(local.signal[0]()).toBe(5);
		expect(session.signal[0]()).toBe(11);
		expect(JSON.parse(localStorage.getItem('counter')!)).toBe(5);
		expect(JSON.parse(sessionStorage.getItem('counter')!)).toBe(11);
		local.dispose();
		session.dispose();
	});

	it('warns for invalid JSON while retaining the default value', () => {
		localStorage.setItem('broken', '{');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { signal, dispose } = createOwnedStorage(() => createLocalStorage('broken', 'fallback'));

		expect(signal[0]()).toBe('fallback');
		expect(warn).toHaveBeenCalledWith('Error reading localStorage key "broken":', expect.any(SyntaxError));
		dispose();
	});

	it('updates signal state even when persistence fails', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('blocked', 'SecurityError');
		});
		const { signal, dispose } = createOwnedStorage(() => createSessionStorage('blocked', 0));

		expect(signal[1]((previous) => previous + 4)).toBe(4);
		expect(signal[0]()).toBe(4);
		expect(warn).toHaveBeenCalledWith('Error setting sessionStorage key "blocked":', expect.any(DOMException));
		dispose();
	});

	it('removes values that cannot be represented as JSON instead of persisting invalid JSON', () => {
		localStorage.setItem('optional', JSON.stringify('saved'));
		const first = createOwnedStorage(() => createLocalStorage<string | undefined>('optional', 'fallback'));

		expect(first.signal[1](undefined)).toBeUndefined();
		expect(first.signal[0]()).toBeUndefined();
		expect(localStorage.getItem('optional')).toBeNull();
		first.dispose();

		const second = createOwnedStorage(() => createLocalStorage<string | undefined>('optional', 'fallback'));
		expect(second.signal[0]()).toBe('fallback');
		second.dispose();
	});

	it('allows owner cleanup to be disposed repeatedly without extra storage work', () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		const { dispose } = createOwnedStorage(() => createLocalStorage('cleanup', 'value'));

		dispose();
		dispose();
		expect(setItem).not.toHaveBeenCalled();
	});
});
