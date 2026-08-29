import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRegistry, loadRegistryManifest, watchRegistry } from '@tile-ui/buildx/registry';
import { createSolidRegistryConfig } from '@tile-ui/buildx/registry/presets/solid';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, '../../..');
const outDir = path.resolve(dirname, '../public/r');

const dispose = await watchRegistry({
	run: async (signal) => {
		const solidRegistryManifest = await loadRegistryManifest(path.resolve(workspaceRoot, 'packages/solid/src/registry/manifest.ts'), 'solidRegistryManifest');

		await buildRegistry({
			manifest: solidRegistryManifest,
			signal,
			...createSolidRegistryConfig({ workspaceRoot, outDir }),
		});
	},
	watchPaths: [
		path.resolve(workspaceRoot, 'packages/solid/src/registry'),
		path.resolve(workspaceRoot, 'packages/solid/src/components'),
		path.resolve(workspaceRoot, 'packages/solid/src/utils'),
		path.resolve(workspaceRoot, 'packages/core/src'),
		path.resolve(workspaceRoot, 'packages/styles/scss'),
	],
});

await new Promise((resolve) => {
	process.once('beforeExit', resolve);
});
await dispose();
