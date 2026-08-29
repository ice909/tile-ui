import { pathToFileURL } from 'node:url';

import { tsImport } from 'tsx/esm/api';

import type { PackageRegistryManifest } from './types';

/**
 * 在独立模块图中加载 registry manifest，确保 watch 重建不会复用 ESM 缓存。
 */
export async function loadRegistryManifest(modulePath: string, exportName: string): Promise<PackageRegistryManifest> {
	const module = (await tsImport(pathToFileURL(modulePath).href, import.meta.url)) as Record<string, unknown>;
	const manifest = module[exportName];

	if (!manifest) {
		throw new Error(`Module does not export '${exportName}'.`);
	}

	return manifest as PackageRegistryManifest;
}
