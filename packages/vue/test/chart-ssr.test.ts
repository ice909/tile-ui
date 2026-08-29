// @vitest-environment node

import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';
import { ChartContainer } from '../src/components/chart/chart';

describe('Vue Chart SSR', () => {
	it('renders stable named chart output', async () => {
		const component = defineComponent({
			setup: () => () =>
				h(ChartContainer, {
					title: 'Revenue trend',
					'aria-describedby': 'chart-description',
					config: { value: { label: 'Value', color: '#0f766e' } },
					data: [{ month: 'Jan', value: 2 }],
					xKey: 'month',
					initialDimension: { width: 320, height: 200 },
				}),
		});
		const first = await renderToString(createSSRApp(component));
		const second = await renderToString(createSSRApp(component));

		expect(second).toBe(first);
		expect(first).toContain('role="img"');
		expect(first).toContain('aria-label="Revenue trend"');
		expect(first).toContain('aria-describedby="chart-description"');
		expect(first).toContain('<title>Revenue trend</title>');
	});
});
