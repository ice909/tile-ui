// @vitest-environment node

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Toaster, toast } from '../src/components/sonner/sonner';

describe('React Sonner SSR', () => {
	it('keeps toast calls isolated from deterministic empty markup', () => {
		const first = renderToString(<Toaster className="server-owner" />);
		expect(toast('request-secret')).toBe('');
		const second = renderToString(<Toaster className="server-owner" />);
		expect(second).toBe(first);
		expect(second).not.toContain('request-secret');
		expect(second).not.toContain('data-slot="toast"');
	});
});
