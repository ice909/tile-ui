import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { getNamedImports, loadTypeScript } from '../../src/registry/presets/core-source';

const workspaceRoot = path.resolve(__dirname, '../../../..');
let tempDir = '';

afterEach(async () => {
	if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
	tempDir = '';
});

describe('core source closure inputs', () => {
	it('collects regular core symbols without flattening mapped core subpaths', async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-core-source-'));
		const source = path.join(tempDir, 'component.ts');
		await fs.writeFile(
			source,
			"import { clamp } from '@tile-ui/core';\nimport { createLiveline } from '@tile-ui/core/liveline';\nimport type { LivelineOptions } from '@tile-ui/core/liveline';\n",
		);

		expect(getNamedImports(loadTypeScript(workspaceRoot), source, '@tile-ui/core')).toEqual(['clamp']);
	});
});
