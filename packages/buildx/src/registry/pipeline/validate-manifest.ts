import type { PackageRegistryManifest } from '../types';

function resolveDependencyName(dependency: string) {
	const namespace = '@tile-ui/';
	return dependency.startsWith(namespace) ? dependency.slice(namespace.length) : null;
}

export function validateManifest(manifest: PackageRegistryManifest) {
	const itemNames = new Set<string>();

	for (const item of manifest.items) {
		if (itemNames.has(item.name)) {
			throw new Error(`Duplicate registry item name: ${item.name}`);
		}
		itemNames.add(item.name);

		if (!item.files.length) {
			throw new Error(`Registry item '${item.name}' must include at least one file.`);
		}

		if (item.type === 'registry:ui' && item.files.some((file) => file.source.endsWith('.scss')) && !(item.registryDependencies ?? []).includes('@tile-ui/styles')) {
			throw new Error(`Registry UI item '${item.name}' includes SCSS but does not depend on '@tile-ui/styles'.`);
		}

		for (const dependency of item.registryDependencies ?? []) {
			const resolvedDependency = resolveDependencyName(dependency);
			if (!resolvedDependency) {
				continue;
			}

			if (!manifest.items.some((candidate) => candidate.name === resolvedDependency)) {
				throw new Error(`Registry item '${item.name}' references unknown registry dependency '${dependency}'.`);
			}
		}
	}
}
