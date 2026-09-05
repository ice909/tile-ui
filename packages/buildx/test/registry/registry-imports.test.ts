import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildRegistry } from '../../src/registry/build-registry';
import { transformReactFile } from '../../src/registry/transforms/react';
import { transformSolidFile } from '../../src/registry/transforms/solid';
import { transformVueFile } from '../../src/registry/transforms/vue';
import type { PackageRegistryManifest, TransformFileInput } from '../../src/registry/types';

const transforms = {
	react: { kind: 'react-component', run: transformReactFile },
	vue: { kind: 'vue-component', run: transformVueFile },
	solid: { kind: 'solid-component', run: transformSolidFile },
} as const;

const livelineFiles = [
	{
		source: 'core/liveline/index.ts',
		type: 'registry:lib' as const,
		transform: 'copy' as const,
		target: 'components/ui/lib/liveline/index.ts',
		registryImport: '@tile-ui/core/liveline',
	},
	{
		source: 'core/liveline/geometry/point.ts',
		type: 'registry:lib' as const,
		transform: 'copy' as const,
		target: 'components/ui/lib/liveline/geometry/point.ts',
	},
];

const manifest: PackageRegistryManifest = {
	name: 'liveline-fixture',
	homepage: 'https://example.com',
	items: [
		{
			name: 'liveline',
			type: 'registry:lib',
			title: 'Liveline',
			description: 'Liveline',
			files: livelineFiles,
		},
	],
};

let tempDir = '';

afterEach(async () => {
	if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
	tempDir = '';
});

describe('registry package import mappings', () => {
	it.each(Object.entries(transforms))('rewrites liveline and regular core imports for %s', async (framework, transform) => {
		const input = {
			framework,
			workspaceRoot: '/workspace',
			manifest,
			item: { name: 'chart', type: 'registry:ui', title: 'Chart', description: 'Chart', files: [] },
			file: {
				source: 'chart.tsx',
				type: 'registry:ui',
				transform: transform.kind,
				target: 'components/ui/charts/chart/chart.tsx',
			},
			content: "import { createLiveline } from '@tile-ui/core/liveline';\nimport type { Point } from '@tile-ui/core/liveline';\nimport { clamp } from '@tile-ui/core';\n",
		} as TransformFileInput;
		const output = await transform.run(input);

		expect(output.content).toContain("from '../../lib/liveline'");
		expect(output.content).toContain("from '../../lib/core'");
		expect(output.content).not.toContain('@tile-ui/');
	});

	it('preserves a copied multi-file tree and its relative imports through a registry build', async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tile-registry-imports-'));
		await fs.mkdir(path.join(tempDir, 'core/liveline/geometry'), { recursive: true });
		await fs.mkdir(path.join(tempDir, 'framework/chart'), { recursive: true });
		await fs.writeFile(path.join(tempDir, 'core/liveline/index.ts'), "export { point } from './geometry/point';\n");
		await fs.writeFile(path.join(tempDir, 'core/liveline/geometry/point.ts'), 'export const point = { x: 0, y: 0 };\n');
		await fs.writeFile(path.join(tempDir, 'framework/chart/chart.tsx'), "import { point } from '@tile-ui/core/liveline';\nexport const chart = point;\n");
		const outDir = path.join(tempDir, 'out');
		const buildManifest: PackageRegistryManifest = {
			...manifest,
			items: [
				manifest.items[0]!,
				{
					name: 'chart',
					type: 'registry:ui',
					title: 'Chart',
					description: 'Chart',
					registryDependencies: ['@tile-ui/liveline'],
					files: [
						{
							source: 'framework/chart/chart.tsx',
							type: 'registry:ui',
							transform: 'react-component',
							target: 'components/ui/chart/chart.tsx',
						},
					],
				},
			],
		};

		await buildRegistry({
			framework: 'react',
			workspaceRoot: tempDir,
			outDir,
			manifest: buildManifest,
			transforms: { file: transformReactFile },
			validate: { forbidWorkspaceImports: ['@tile-ui/'] },
		});

		const liveline = JSON.parse(await fs.readFile(path.join(outDir, 'liveline.json'), 'utf-8')) as {
			files: Array<{ target: string; content: string }>;
		};
		const chart = JSON.parse(await fs.readFile(path.join(outDir, 'chart.json'), 'utf-8')) as {
			files: Array<{ content: string }>;
		};
		expect(liveline.files.map((file) => file.target)).toEqual(['components/ui/lib/liveline/index.ts', 'components/ui/lib/liveline/geometry/point.ts']);
		expect(liveline.files[0]?.content).toContain("from './geometry/point'");
		expect(chart.files[0]?.content).toContain("from '../lib/liveline'");
		expect([...liveline.files, ...chart.files].every((file) => !file.content.includes('@tile-ui/'))).toBe(true);
	});
});
