import type { PackageRegistryItem, PackageRegistryManifest, RegistryBuildOptions, RegistryItemType } from '../types';

export interface BuiltRegistryFile {
	path: string;
	type: RegistryItemType;
	target?: string;
	content: string;
}

export function buildItemJson(manifest: PackageRegistryManifest, item: PackageRegistryItem, files: BuiltRegistryFile[]) {
	return {
		$schema: 'https://ui.shadcn.com/schema/registry-item.json',
		name: item.name,
		type: item.type,
		title: item.title,
		description: item.description,
		dependencies: item.dependencies,
		devDependencies: item.devDependencies,
		registryDependencies: item.registryDependencies,
		tailwind: item.tailwind,
		cssVars: item.cssVars,
		css: item.css,
		extends: item.extends,
		style: item.style,
		baseColor: item.baseColor,
		theme: item.theme,
		iconLibrary: item.iconLibrary,
		meta: item.meta,
		files,
	};
}

export function buildRegistryIndex(options: RegistryBuildOptions) {
	return {
		name: options.manifest.name,
		homepage: options.manifest.homepage,
		items: options.manifest.items.map((item) => ({
			name: item.name,
			type: item.type,
			title: item.title,
			description: item.description,
			dependencies: item.dependencies,
			devDependencies: item.devDependencies,
			registryDependencies: item.registryDependencies,
			tailwind: item.tailwind,
			cssVars: item.cssVars,
			css: item.css,
			extends: item.extends,
			style: item.style,
			baseColor: item.baseColor,
			theme: item.theme,
			iconLibrary: item.iconLibrary,
			files: item.files.map((file) => ({
				path: file.source,
				type: file.type,
				target: file.target,
			})),
		})),
	};
}
