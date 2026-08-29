import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRegistry, loadRegistryManifest, watchRegistry } from '@tile-ui/buildx/registry';
import { createVueRegistryConfig } from '@tile-ui/buildx/registry/presets/vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../..');
const outDir = path.resolve(__dirname, '../public/r');

const dispose = await watchRegistry({
	run: async (signal) => {
		await runBuild(signal);
	},
	watchPaths: [
		path.resolve(workspaceRoot, 'packages/vue/src/registry'),
		path.resolve(workspaceRoot, 'packages/vue/src/components'),
		path.resolve(workspaceRoot, 'packages/vue/src/composables'),
		path.resolve(workspaceRoot, 'packages/core/src'),
		path.resolve(workspaceRoot, 'packages/styles/scss'),
	],
});

await new Promise((resolve) => {
	process.once('beforeExit', resolve);
});
await dispose();

async function runBuild(signal) {
	const vueRegistryManifest = await loadRegistryManifest(path.resolve(workspaceRoot, 'packages/vue/src/registry/manifest.ts'), 'vueRegistryManifest');

	await buildRegistry({
		manifest: vueRegistryManifest,
		signal,
		...createVueRegistryConfig({
			workspaceRoot,
			outDir,
		}),
	});
}
