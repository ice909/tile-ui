// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Stage 5 complete Solid SSR and hydration gate', () => {
	it('covers the complete built-package registry in deterministic shards', () => {
		expect(() => execFileSync('corepack', ['pnpm', 'build'], { cwd: process.cwd(), stdio: 'pipe', timeout: 90_000, maxBuffer: 20 * 1024 * 1024 })).not.toThrow();
		for (const shard of ['foundation', 'overlays', 'advanced']) {
			expect(() =>
				execFileSync(process.execPath, ['test/complete-ssr-gate.mjs', shard], { cwd: process.cwd(), stdio: 'pipe', timeout: 90_000, maxBuffer: 20 * 1024 * 1024 }),
			).not.toThrow();
		}
	}, 280_000);
});
