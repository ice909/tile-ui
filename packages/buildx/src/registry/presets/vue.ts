import fs from 'node:fs';
import path from 'node:path';

import type { RegistryBuildOptions, VirtualRegistryFile } from '../types';
import { transformVueFile } from '../transforms/vue';
import { buildCoreClosureSource } from './core-source';

function read(workspaceRoot: string, relativePath: string) {
	return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf-8');
}

export function createVueRegistryConfig(input: { workspaceRoot: string; outDir: string }): Omit<RegistryBuildOptions, 'manifest'> {
	return {
		framework: 'vue',
		workspaceRoot: input.workspaceRoot,
		outDir: input.outDir,
		transforms: {
			file: transformVueFile,
			buildVirtualFiles: async ({ workspaceRoot, manifest }): Promise<VirtualRegistryFile[]> => {
				const helpers = read(workspaceRoot, 'packages/core/src/utils/helpers.ts');
				const cn = read(workspaceRoot, 'packages/core/src/utils/cn.ts');
				const componentFiles = manifest.items
					.filter((item) => item.type === 'registry:ui')
					.flatMap((item) => item.files.filter((file) => file.transform === 'vue-component').map((file) => path.resolve(workspaceRoot, file.source)));
				const core = buildCoreClosureSource(workspaceRoot, componentFiles);

				return [
					...componentFiles.map((filePath) => ({
						source: `__virtual__/${path.basename(path.dirname(filePath))}/core.ts`,
						content: core,
					})),
					{
						source: '__virtual__/shared/utils.ts',
						content: `${cn}\n${helpers}`,
					},
				];
			},
		},
		validate: {
			forbidWorkspaceImports: ['@tile-ui/'],
		},
	};
}
