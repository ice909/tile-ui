import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect } from 'vitest';

import { cleanupOutput } from '../../src/registry/pipeline/cleanup-output';

let tempDir = '';

beforeEach(async () => {
	tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-ui-cleanup-'));
});

afterEach(async () => {
	await fs.rm(tempDir, { recursive: true, force: true });
});

describe('cleanupOutput', () => {
	it('ignores a missing output directory', async () => {
		await expect(cleanupOutput(path.join(tempDir, 'missing'), [])).resolves.toBeUndefined();
	});

	it('propagates non-ENOENT filesystem errors', async () => {
		const filePath = path.join(tempDir, 'not-a-directory');
		await fs.writeFile(filePath, 'content');
		await expect(cleanupOutput(filePath, [])).rejects.toMatchObject({ code: 'ENOTDIR' });
	});
});
