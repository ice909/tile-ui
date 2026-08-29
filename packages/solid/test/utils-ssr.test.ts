// @vitest-environment node

import { createRoot } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

import { createControllableSignal, createFormStoreSnapshot, getPointerAxisRatio, listenToFormReset } from '../src/utils';

describe('Solid shared utilities SSR safety', () => {
	it('executes without browser globals and does not subscribe before mount', () => {
		const subscribe = vi.fn(() => vi.fn());
		createRoot((dispose) => {
			const [value, setValue, reset] = createControllableSignal({ defaultValue: () => 'server' });
			const snapshot = createFormStoreSnapshot({ getSnapshot: () => ({ version: 0 }), subscribe });
			expect(value()).toBe('server');
			expect(setValue('next')).toBe('next');
			expect(reset()).toBe('server');
			expect(snapshot().version).toBe(0);
			expect(subscribe).not.toHaveBeenCalled();
			expect(listenToFormReset(undefined, vi.fn())).toBeTypeOf('function');
			expect(getPointerAxisRatio(0, 0, { left: 0, top: 0, width: 0, height: 0 }, 'horizontal')).toBe(0);
			dispose();
		});
	});
});
