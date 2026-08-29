import type { PackageRegistryItem } from '@tile-ui/buildx/registry/types';

export const solidLibItems: PackageRegistryItem[] = [
	{
		name: 'core',
		type: 'registry:lib',
		title: 'Core',
		description: 'Registry runtime types and component logic for SolidJS Tile UI items.',
		registryDependencies: ['@tile-ui/utils'],
		files: [
			{
				source: '__virtual__/shared/core.ts',
				type: 'registry:lib',
				transform: 'copy',
				target: 'components/ui/lib/core.ts',
			},
		],
	},
	{
		name: 'utils',
		type: 'registry:lib',
		title: 'Utils',
		description: 'Shared class, core, and SolidJS event utility helpers for Tile UI registries.',
		files: [
			{
				source: '__virtual__/shared/utils.ts',
				type: 'registry:lib',
				transform: 'copy',
				target: 'components/ui/lib/utils.ts',
			},
		],
	},
];
