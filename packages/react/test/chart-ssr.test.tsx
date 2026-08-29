// @vitest-environment node

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChartContainer } from '../src/components/chart/chart';

describe('React Chart SSR', () => {
	it('renders stable named chart output', () => {
		const chart = (
			<ChartContainer
				title="Revenue trend"
				aria-describedby="chart-description"
				config={{ value: { label: 'Value', color: '#0f766e' } }}
				data={[{ month: 'Jan', value: 2 }]}
				xKey="month"
				initialDimension={{ width: 320, height: 200 }}
			/>
		);
		const first = renderToString(chart);
		const second = renderToString(chart);

		expect(second).toBe(first);
		expect(first).toContain('role="img"');
		expect(first).toContain('aria-label="Revenue trend"');
		expect(first).toContain('aria-describedby="chart-description"');
		expect(first).toContain('<title>Revenue trend</title>');
	});
});
