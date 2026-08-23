import { validateManifest } from '../../src/registry/pipeline/validate-manifest';
import type { PackageRegistryManifest } from '../../src/registry/types';

const manifest: PackageRegistryManifest = {
	name: 'test',
	homepage: 'https://example.com',
	items: [
		{
			name: 'button',
			type: 'registry:ui',
			title: 'Button',
			description: 'Button',
			files: [{ source: 'button.tsx', type: 'registry:ui', transform: 'react-component' }],
		},
	],
};

describe('validateManifest', () => {
	it('accepts a valid manifest', () => {
		expect(() => validateManifest(manifest)).not.toThrow();
	});

	it('rejects duplicate item names', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [...manifest.items, manifest.items[0]],
			}),
		).toThrow(/Duplicate registry item name/);
	});

	it('accepts URL registry dependencies', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [
					...manifest.items,
					{
						name: 'card',
						type: 'registry:ui',
						title: 'Card',
						description: 'Card',
						registryDependencies: ['https://example.com/r/core.json'],
						files: [{ source: 'card.tsx', type: 'registry:ui', transform: 'react-component' }],
					},
				],
			}),
		).not.toThrow();
	});

	it('accepts namespaced registry dependencies that map to local items', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [
					...manifest.items,
					{
						name: 'card',
						type: 'registry:ui',
						title: 'Card',
						description: 'Card',
						registryDependencies: ['@tile-ui/button'],
						files: [{ source: 'card.tsx', type: 'registry:ui', transform: 'react-component' }],
					},
				],
			}),
		).not.toThrow();
	});

	it('accepts bare dependencies without treating them as local custom items', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [
					...manifest.items,
					{
						name: 'card',
						type: 'registry:ui',
						title: 'Card',
						description: 'Card',
						registryDependencies: ['external-card'],
						files: [{ source: 'card.tsx', type: 'registry:ui', transform: 'react-component' }],
					},
				],
			}),
		).not.toThrow();
	});

	it('rejects namespaced registry dependencies that do not map to local items', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [
					...manifest.items,
					{
						name: 'card',
						type: 'registry:ui',
						title: 'Card',
						description: 'Card',
						registryDependencies: ['@tile-ui/missing'],
						files: [{ source: 'card.tsx', type: 'registry:ui', transform: 'react-component' }],
					},
				],
			}),
		).toThrow(/unknown registry dependency '@tile-ui\/missing'/);
	});

	it('rejects SCSS-bearing UI items without the shared styles dependency', () => {
		expect(() =>
			validateManifest({
				...manifest,
				items: [
					{
						...manifest.items[0],
						files: [...manifest.items[0].files, { source: 'button.scss', type: 'registry:file', transform: 'style', target: 'components/button.scss' }],
					},
				],
			}),
		).toThrow(/does not depend on '@tile-ui\/styles'/);
	});
});
