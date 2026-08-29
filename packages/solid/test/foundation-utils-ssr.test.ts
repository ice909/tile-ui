// @vitest-environment node

import { createRoot } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

import {
	activateModalFocusScope,
	createAnchoredPosition,
	createCollectionRegistry,
	createCompositeIdRegistry,
	createHoverIntent,
	createPortalScope,
	registerDismissableLayer,
	resolvePortalContainer,
} from '../src/utils';

describe('Stage 3 shared foundation SSR safety', () => {
	it('creates inert lifecycle handles without browser globals', () => {
		const dismiss = vi.fn();
		const layer = registerDismissableLayer({ element: () => undefined, onDismiss: dismiss });
		expect(layer.update).toBeTypeOf('function');
		expect(layer.destroy).toBeTypeOf('function');
		const focus = activateModalFocusScope({ container: () => undefined });
		expect(focus.update).toBeTypeOf('function');
		expect(focus.destroy).toBeTypeOf('function');
		const position = createAnchoredPosition({ anchor: () => undefined, content: () => undefined, onPosition: vi.fn() });
		expect(position.recompute).toBeTypeOf('function');
		expect(position.destroy).toBeTypeOf('function');
		const scope = createPortalScope();
		expect(resolvePortalContainer(scope)).toBeUndefined();
		const collection = createCollectionRegistry();
		expect(collection.items()).toEqual([]);
		collection.destroy();
		const hover = createHoverIntent({ open: () => false, onOpenChange: vi.fn() });
		hover.destroy();
		createRoot((dispose) => {
			const ids = createCompositeIdRegistry('server');
			expect(ids.id('trigger')()).toBe('server-trigger');
			dispose();
		});
	});
});
