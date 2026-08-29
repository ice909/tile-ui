// @vitest-environment node

import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';
import { Toaster, toast } from '../src/components/sonner/sonner';

describe('Vue Sonner SSR', () => {
	it('keeps toast calls isolated from deterministic empty markup', async () => {
		const component = defineComponent({ setup: () => () => h(Toaster, { class: 'server-owner' }) });
		const first = await renderToString(createSSRApp(component));
		expect(toast('request-secret')).toBe('');
		const second = await renderToString(createSSRApp(component));
		expect(second).toBe(first);
		expect(second).not.toContain('request-secret');
		expect(second).not.toContain('data-slot="toast"');
	});
});
