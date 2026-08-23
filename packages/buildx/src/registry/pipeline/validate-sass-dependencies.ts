import path from 'node:path';

import type { BuiltRegistryFile } from './build-item-json';
import type { PackageRegistryItem, PackageRegistryManifest } from '../types';

const SASS_IMPORT_PATTERN = /@(use|forward|import)\s+['"]([^'"]+)['"]/g;

function resolveDependencyName(dependency: string) {
	if (/^https?:\/\//.test(dependency)) return null;
	if (!dependency.startsWith('@')) return dependency;
	const slashIndex = dependency.indexOf('/');
	return slashIndex === -1 ? dependency : dependency.slice(slashIndex + 1);
}

function collectDependencyNames(manifest: PackageRegistryManifest, item: PackageRegistryItem) {
	const itemsByName = new Map(manifest.items.map((candidate) => [candidate.name, candidate]));
	const names = new Set([item.name]);
	const pending = [...(item.registryDependencies ?? [])];

	while (pending.length) {
		const dependency = pending.pop();
		if (!dependency) continue;
		const name = resolveDependencyName(dependency);
		if (!name || names.has(name)) continue;
		names.add(name);
		pending.push(...(itemsByName.get(name)?.registryDependencies ?? []));
	}

	return names;
}

function sassCandidates(fromFile: string, specifier: string) {
	const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
	const extension = path.posix.extname(resolved);
	const directory = path.posix.dirname(resolved);
	const basename = path.posix.basename(resolved, extension);

	if (extension) return [resolved, path.posix.join(directory, `_${basename}${extension}`)];
	return [resolved, `${resolved}.scss`, path.posix.join(directory, `_${basename}.scss`), path.posix.join(resolved, 'index.scss'), path.posix.join(resolved, '_index.scss')];
}

export function validateSassDependencies(manifest: PackageRegistryManifest, builtItems: Map<string, BuiltRegistryFile[]>) {
	for (const item of manifest.items) {
		const dependencyNames = collectDependencyNames(manifest, item);
		const availablePaths = new Set(
			[...dependencyNames].flatMap((name) => (builtItems.get(name) ?? []).map((file) => file.target ?? file.path)).map((target) => path.posix.normalize(target)),
		);

		for (const file of builtItems.get(item.name) ?? []) {
			const target = file.target ?? file.path;
			if (!target.endsWith('.scss')) continue;

			for (const match of file.content.matchAll(SASS_IMPORT_PATTERN)) {
				const specifier = match[2];
				if (specifier.startsWith('sass:') || specifier.startsWith('http:') || specifier.startsWith('https:') || specifier.endsWith('.css')) continue;
				if (sassCandidates(target, specifier).some((candidate) => availablePaths.has(candidate))) continue;

				throw new Error(
					`Registry item '${item.name}' emits Sass file '${target}' with unresolved dependency '${specifier}'. Add the copied file to this item or a registryDependency.`,
				);
			}
		}
	}
}
