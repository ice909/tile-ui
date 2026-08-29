import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildRegistry } from '@tile-ui/buildx/registry';
import { createSolidRegistryConfig } from '@tile-ui/buildx/registry/presets/solid';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, '../../..');
const outDir = path.resolve(dirname, '../public/r');
const { solidRegistryManifest } = await import(pathToFileURL(path.resolve(workspaceRoot, 'packages/solid/src/registry/manifest.ts')).href);

await buildRegistry({
	manifest: solidRegistryManifest,
	...createSolidRegistryConfig({ workspaceRoot, outDir }),
});
