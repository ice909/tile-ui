// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Solid Slider/InputOTP SSR hydration lane', () => {
	it('preserves deterministic markup, IDs, hidden values, and hydrated node identity', () => {
		expect(() => execFileSync(process.execPath, ['test/batch2-interaction-ssr.mjs'], { cwd: process.cwd(), stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
	});
});
