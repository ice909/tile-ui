// @vitest-environment node

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Liveline, LivelineTransition } from '../src/components/liveline';

describe('Liveline SSR', () => {
	it('renders without browser globals', () => {
		const html = renderToString(<Liveline data={[{ time: 1, value: 42 }]} value={42} showValue windows={[{ label: '30s', secs: 30 }]} />);
		expect(html).toContain('data-slot="liveline"');
		expect(html).toContain('data-slot="liveline-canvas"');
		expect(html).toContain('Live chart, current value 42.00');
	});

	it('renders the initially active transition child without reading matchMedia', () => {
		const html = renderToString(
			<LivelineTransition active="line">
				<div key="line">Line</div>
				<div key="candle">Candle</div>
			</LivelineTransition>,
		);
		expect(html).toContain('Line');
		expect(html).not.toContain('Candle');
	});
});
