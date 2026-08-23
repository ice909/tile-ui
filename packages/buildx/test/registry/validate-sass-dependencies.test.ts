import { validateSassDependencies } from '../../src/registry/pipeline/validate-sass-dependencies';
import type { BuiltRegistryFile } from '../../src/registry/pipeline/build-item-json';
import type { PackageRegistryManifest } from '../../src/registry/types';

const manifest: PackageRegistryManifest = {
	name: 'test',
	homepage: 'https://example.com',
	items: [
		{
			name: 'styles',
			type: 'registry:style',
			title: 'Styles',
			description: 'Styles',
			files: [{ source: 'colors.scss', type: 'registry:file', transform: 'style', target: 'styles/variables/_colors.scss' }],
		},
		{
			name: 'button',
			type: 'registry:ui',
			title: 'Button',
			description: 'Button',
			registryDependencies: ['@tile-ui/styles'],
			files: [{ source: 'button.scss', type: 'registry:file', transform: 'style', target: 'components/ui/button/button.scss' }],
		},
	],
};

function built(content: string): Map<string, BuiltRegistryFile[]> {
	return new Map([
		[
			'styles',
			[
				{
					path: 'colors.scss',
					type: 'registry:file',
					target: 'styles/variables/_colors.scss',
					content: '$primary: red;',
				},
			],
		],
		[
			'button',
			[
				{
					path: 'button.scss',
					type: 'registry:file',
					target: 'components/ui/button/button.scss',
					content,
				},
			],
		],
	]);
}

describe('validateSassDependencies', () => {
	it('resolves partials copied by a transitive registry dependency', () => {
		expect(() => validateSassDependencies(manifest, built("@use '../../../styles/variables/colors' as *;"))).not.toThrow();
	});

	it('rejects unresolved copied Sass dependencies', () => {
		expect(() => validateSassDependencies(manifest, built("@use '../../../styles/mixins/utils' as *;"))).toThrow(/unresolved dependency/);
	});

	it('ignores built-in Sass modules', () => {
		expect(() => validateSassDependencies(manifest, built("@use 'sass:color';"))).not.toThrow();
	});
});
