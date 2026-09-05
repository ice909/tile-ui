// @vitest-environment node

import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';
import { Liveline } from '../src/components/liveline/liveline';
import { LivelineTransition } from '../src/components/liveline/liveline-transition';

describe('Vue Liveline SSR', () => {
	it('renders stable accessible output without creating the browser engine', async () => {
		const component = defineComponent({
			setup: () => () =>
				h(LivelineTransition, { active: 'chart' }, () => [
					h(Liveline, {
						key: 'chart',
						data: [{ time: 1, value: 42 }],
						value: 42,
						'aria-label': 'Server live price',
						'aria-describedby': 'price-help',
					}),
				]),
		});
		const first = await renderToString(createSSRApp(component));
		const second = await renderToString(createSSRApp(component));

		expect(second).toBe(first);
		expect(first).toContain('data-slot="liveline-transition"');
		expect(first).toContain('data-slot="liveline"');
		expect(first).toContain('role="img"');
		expect(first).toContain('aria-label="Server live price"');
		expect(first).toContain('aria-describedby="price-help"');
	});
});
