// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

describe('Solid primitives SSR safety', () => {
	it('imports without browser globals or import-time subscriptions', async () => {
		const descriptors = new Map(['window', 'document', 'navigator'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
		for (const key of descriptors.keys()) Reflect.deleteProperty(globalThis, key);
		vi.resetModules();

		try {
			const primitives = await import('../src/primitives');
			expect(Object.keys(primitives).sort()).toEqual([
				'createClickOutside',
				'createCopyToClipboard',
				'createIsMobile',
				'createKeyPress',
				'createLocalStorage',
				'createMediaQuery',
				'createMousePosition',
				'createOnlineStatus',
				'createScrollPosition',
				'createSessionStorage',
				'createWindowSize',
			]);
		} finally {
			for (const [key, descriptor] of descriptors) {
				if (descriptor === undefined) Reflect.deleteProperty(globalThis, key);
				else Object.defineProperty(globalThis, key, descriptor);
			}
		}
	});
});
