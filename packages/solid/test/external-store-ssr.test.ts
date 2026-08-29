// @vitest-environment node

import { createRoot } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

import { createExternalStoreAccessor } from '../src/utils';

describe('createExternalStoreAccessor SSR', () => {
	it('returns the supplied snapshot without creating, subscribing, or scheduling work', () => {
		const subscribe = vi.fn(() => vi.fn());
		const createStore = vi.fn(() => ({ getSnapshot: () => 'client', subscribe }));
		const setTimeout = vi.spyOn(globalThis, 'setTimeout');

		createRoot((dispose) => {
			const snapshot = createExternalStoreAccessor(createStore, { serverSnapshot: 'server' });
			expect(snapshot()).toBe('server');
			expect(createStore).not.toHaveBeenCalled();
			expect(subscribe).not.toHaveBeenCalled();
			expect(setTimeout).not.toHaveBeenCalled();
			dispose();
		});
	});
});
